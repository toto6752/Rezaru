import asyncio
import logging
import threading

from sqlalchemy.orm import Session, joinedload
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, MessageHandler, filters

from agent_logic import process_message
from database import SessionLocal
from models import Agent, TelegramBot
from usage_tracking import check_chat_limit, track_chat_usage

logger = logging.getLogger(__name__)

_running_threads: dict[int, threading.Thread] = {}
_stop_flags: dict[int, threading.Event] = {}


def _load_agent(db: Session, agent_id: int) -> Agent | None:
    return (
        db.query(Agent)
        .options(joinedload(Agent.commands))
        .filter(Agent.id == agent_id)
        .first()
    )


def _process_sync(agent_id: int, text: str, session_id: str, chat_id: str = None) -> str:
    """Синхронная обработка — вызывается из thread pool, не блокирует event loop бота."""
    db = SessionLocal()
    try:
        agent = _load_agent(db, agent_id)
        if not agent:
            return "Агент не найден."
        reply = process_message(
            agent, 
            agent.commands, 
            text, 
            session_id,
            channel="telegram",
            external_chat_id=str(chat_id) if chat_id else session_id,
            db=db,
        )
        return reply.text
    finally:
        db.close()


def _mark_stopped(agent_id: int) -> None:
    db = SessionLocal()
    try:
        bot = db.query(TelegramBot).filter(TelegramBot.agent_id == agent_id).first()
        if bot:
            bot.status = "stopped"
            db.commit()
    finally:
        db.close()


async def _on_start(update, context: ContextTypes.DEFAULT_TYPE):
    if update.message:
        await update.message.reply_text(
            "Привет! Я ИИ-агент Rezaru. Задайте вопрос — отвечу по настройкам вашего бизнеса."
        )


async def _on_message(update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return

    agent_id = context.application.bot_data.get("agent_id")
    text = update.message.text.strip()
    chat_id = update.message.chat_id

    if not text:
        return

    try:
        await update.message.chat.send_action("typing")
    except Exception:
        pass

    try:
        # Check usage limit before processing
        db = SessionLocal()
        try:
            limit_exceeded, error_message = check_chat_limit(db, agent_id, "telegram")
            if limit_exceeded:
                await update.message.reply_text(error_message)
                return
            
            # Track usage
            track_chat_usage(db, agent_id, "telegram", str(chat_id))
        finally:
            db.close()
        
        reply_text = await asyncio.to_thread(_process_sync, agent_id, text, str(chat_id), str(chat_id))
        await update.message.reply_text(reply_text[:4096])
    except Exception as exc:
        logger.exception("Telegram handler error agent=%s chat=%s", agent_id, chat_id)
        await update.message.reply_text(f"Ошибка: {exc}")


async def _run_bot(agent_id: int, token: str, stop_event: threading.Event):
    app = (
        ApplicationBuilder()
        .token(token)
        .connect_timeout(30.0)
        .read_timeout(30.0)
        .write_timeout(30.0)
        .pool_timeout(30.0)
        .build()
    )
    app.bot_data["agent_id"] = agent_id

    app.add_handler(CommandHandler("start", _on_start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, _on_message))

    await app.initialize()
    await app.start()
    await app.updater.start_polling(
        drop_pending_updates=True,
        allowed_updates=["message"],
    )
    logger.info("Telegram bot polling STARTED for agent_id=%s", agent_id)

    while not stop_event.is_set():
        await asyncio.sleep(0.5)

    logger.info("Telegram bot stopping for agent_id=%s", agent_id)
    await app.updater.stop()
    await app.stop()
    await app.shutdown()


def _thread_target(agent_id: int, token: str, stop_event: threading.Event):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_run_bot(agent_id, token, stop_event))
    except Exception:
        logger.exception("Telegram bot thread CRASHED for agent_id=%s", agent_id)
    finally:
        _running_threads.pop(agent_id, None)
        _stop_flags.pop(agent_id, None)
        _mark_stopped(agent_id)
        loop.close()


def is_bot_running(agent_id: int) -> bool:
    thread = _running_threads.get(agent_id)
    return thread is not None and thread.is_alive()


def stop_telegram_bot(agent_id: int):
    stop_event = _stop_flags.get(agent_id)
    if stop_event:
        stop_event.set()
    thread = _running_threads.get(agent_id)
    if thread and thread.is_alive():
        thread.join(timeout=5)


def stop_all_bots():
    for agent_id in list(_running_threads.keys()):
        stop_telegram_bot(agent_id)


def start_telegram_bot(agent_id: int, token: str, db: Session):
    token = token.strip()
    if not token:
        raise ValueError("Telegram token is empty")

    stop_telegram_bot(agent_id)

    stop_event = threading.Event()
    _stop_flags[agent_id] = stop_event

    bot_record = db.query(TelegramBot).filter(TelegramBot.agent_id == agent_id).first()
    if bot_record:
        bot_record.token = token
        bot_record.status = "running"
    else:
        bot_record = TelegramBot(agent_id=agent_id, token=token, status="running")
        db.add(bot_record)
    db.commit()

    thread = threading.Thread(
        target=_thread_target,
        args=(agent_id, token, stop_event),
        daemon=True,
        name=f"telegram-bot-{agent_id}",
    )
    _running_threads[agent_id] = thread
    thread.start()
    logger.info("Telegram bot thread launched for agent_id=%s", agent_id)


def restore_running_bots():
    """Поднимает ботов после перезапуска uvicorn (--reload)."""
    db = SessionLocal()
    try:
        bots = (
            db.query(TelegramBot)
            .filter(TelegramBot.status == "running", TelegramBot.token != "")
            .all()
        )
        to_restore = [(b.agent_id, b.token) for b in bots if b.token]
    finally:
        db.close()

    for agent_id, token in to_restore:
        db = SessionLocal()
        try:
            logger.info("Restoring Telegram bot for agent_id=%s", agent_id)
            start_telegram_bot(agent_id, token, db)
        except Exception:
            logger.exception("Failed to restore bot agent_id=%s", agent_id)
        finally:
            db.close()


async def send_telegram_message(bot_token: str, chat_id: str, text: str):
    """Send a message via Telegram Bot API."""
    import httpx
    
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
