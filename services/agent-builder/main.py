import logging
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Form, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from starlette.middleware.sessions import SessionMiddleware

from agent_logic import process_message
from admin_auth import require_admin
from auth import (
    get_current_user_id,
    get_user_or_none,
    hash_password,
    require_user,
    verify_admin_access_token,
    verify_admin_password,
    verify_admin_session,
    clear_admin_session,
    create_admin_session,
    verify_password,
)
from channel_manager import channel_manager
from database import get_db, init_db
from gemini_client import build_system_prompt, call_gemini
from models import Agent, Command, PromoCode, Subscription, TelegramBot, User
from promo_codes import activate_promo_code, create_promo_code, deactivate_promo_code, get_promo_codes
from reminders import start_scheduler, stop_scheduler
from subscription import create_trial_subscription, get_user_subscription, check_channel_access
from telegram_bot import is_bot_running, restore_running_bots, start_telegram_bot, stop_all_bots

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

SESSION_SECRET = os.getenv("SESSION_SECRET", "rezaru-demo-secret-change-in-production")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    restore_running_bots()
    start_scheduler()
    yield
    stop_all_bots()
    stop_scheduler()


app = FastAPI(title="Rezaru Agent Builder", lifespan=lifespan)
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.exception_handler(HTTPException)
async def _http_exception_handler(request: Request, exc: HTTPException):
    from fastapi.responses import JSONResponse

    if exc.status_code == 401 and request.method == "GET":
        return RedirectResponse("/login", status_code=303)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


class ChatRequest(BaseModel):
    text: str
    session_id: str = "dashboard"


@app.get("/gemini-test")
async def gemini_test():
    try:
        text = call_gemini("Скажи одну фразу, что ты работаешь для Rezaru.")
        return {"ok": True, "reply": text, "model": os.getenv("GEMINI_MODEL", "gemini-3.5-flash")}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.get("/")
async def root(request: Request, db: Session = Depends(get_db)):
    if get_current_user_id(request, db):
        return RedirectResponse("/dashboard", status_code=303)
    return RedirectResponse("/login", status_code=303)


# --- Auth ---


@app.get("/auth/register")
async def register_page(request: Request):
    # Superseded by Better Auth (single account across the whole product).
    return RedirectResponse("/register", status_code=303)


@app.post("/auth/register")
async def register(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    email = email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        return templates.TemplateResponse(
            request, "register.html", {"error": "Этот email уже зарегистрирован"}
        )
    user = User(email=email, password_hash=hash_password(password))
    db.add(user)
    db.flush()
    
    # Create trial subscription for new user
    create_trial_subscription(db, user)
    
    db.commit()
    request.session["user_id"] = user.id
    return RedirectResponse("/dashboard", status_code=303)


@app.get("/auth/login")
async def login_page(request: Request):
    # Superseded by Better Auth (single account across the whole product).
    return RedirectResponse("/login", status_code=303)


@app.post("/auth/login")
async def login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == email.strip().lower()).first()
    if not user or not verify_password(password, user.password_hash):
        return templates.TemplateResponse(request, "login.html", {"error": "Неверный email или пароль"})
    request.session["user_id"] = user.id
    return RedirectResponse("/dashboard", status_code=303)


@app.get("/auth/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/", status_code=303)


@app.post("/dashboard/subscription/activate-promo")
async def activate_promo(
    request: Request,
    promo_code: str = Form(...),
    db: Session = Depends(get_db),
):
    user = require_user(request, db)
    
    success, message = activate_promo_code(db, user.id, promo_code)
    
    if success:
        return templates.TemplateResponse(
            request,
            "dashboard.html",
            {
                "user": user,
                "agents": db.query(Agent).filter(Agent.user_id == user.id).all(),
                "success": message,
            },
        )
    else:
        return templates.TemplateResponse(
            request,
            "dashboard.html",
            {
                "user": user,
                "agents": db.query(Agent).filter(Agent.user_id == user.id).all(),
                "error": message,
            },
        )


# --- Admin Authentication ---


@app.get("/admin/login")
async def admin_login_page(request: Request):
    return templates.TemplateResponse(request, "admin_login.html", {"error": None})


@app.post("/admin/login")
async def admin_login(
    request: Request,
    password: str = Form(...),
):
    if verify_admin_password(password):
        create_admin_session(request)
        return RedirectResponse("/admin", status_code=303)
    return templates.TemplateResponse(
        request, "admin_login.html", {"error": "Invalid password"}
    )


@app.get("/admin")
async def admin_panel(request: Request, db: Session = Depends(get_db), _admin: bool = Depends(require_admin)):
    # Check for access token in query string
    access_token = request.query_params.get("access_token")
    if access_token and verify_admin_access_token(access_token):
        create_admin_session(request)
        # Redirect to remove token from URL
        response = RedirectResponse("/admin", status_code=303)
        response.headers["Cache-Control"] = "no-store"
        return response
    
    # Get admin stats
    user_count = db.query(User).count()
    agent_count = db.query(Agent).count()
    active_bots = db.query(TelegramBot).filter(TelegramBot.status == "running").count()
    
    return templates.TemplateResponse(
        request,
        "admin_dashboard.html",
        {
            "user_count": user_count,
            "agent_count": agent_count,
            "active_bots": active_bots,
        },
    )


@app.get("/admin/logout")
async def admin_logout(request: Request):
    clear_admin_session(request)
    return RedirectResponse("/admin/login", status_code=303)


# --- Admin Routes (Placeholders - to be implemented) ---


@app.get("/admin/users")
async def admin_users(request: Request, _admin: bool = Depends(require_admin)):
    return templates.TemplateResponse(request, "admin_users.html", {"users": []})


@app.get("/admin/agents")
async def admin_agents(request: Request, _admin: bool = Depends(require_admin)):
    return templates.TemplateResponse(request, "admin_agents.html", {"agents": []})


@app.get("/admin/subscriptions")
async def admin_subscriptions(request: Request, db: Session = Depends(get_db), _admin: bool = Depends(require_admin)):
    subscriptions = db.query(Subscription).order_by(Subscription.created_at.desc()).all()
    return templates.TemplateResponse(request, "admin_subscriptions.html", {"subscriptions": subscriptions})


@app.get("/admin/promocodes")
async def admin_promocodes(request: Request, db: Session = Depends(get_db), _admin: bool = Depends(require_admin)):
    promocodes = get_promo_codes(db, include_used=True)
    return templates.TemplateResponse(request, "admin_promocodes.html", {"promocodes": promocodes})


@app.post("/admin/promocodes/create")
async def admin_create_promocode(
    request: Request,
    plan: str = Form(...),
    db: Session = Depends(get_db),
    _admin: bool = Depends(require_admin),
):
    try:
        plain_code, promo_code = create_promo_code(db, plan)
        return templates.TemplateResponse(
            request,
            "admin_promocodes.html",
            {
                "promocodes": get_promo_codes(db, include_used=True),
                "success": f"Promo code created: {plain_code}",
                "new_code": plain_code,
            },
        )
    except Exception as e:
        return templates.TemplateResponse(
            request,
            "admin_promocodes.html",
            {
                "promocodes": get_promo_codes(db, include_used=True),
                "error": f"Failed to create promo code: {str(e)}",
            },
        )


@app.post("/admin/promocodes/{promo_code_id}/deactivate")
async def admin_deactivate_promocode(
    request: Request,
    promo_code_id: int,
    db: Session = Depends(get_db),
    _admin: bool = Depends(require_admin),
):
    success = deactivate_promo_code(db, promo_code_id)
    if success:
        return templates.TemplateResponse(
            request,
            "admin_promocodes.html",
            {
                "promocodes": get_promo_codes(db, include_used=True),
                "success": "Promo code deactivated",
            },
        )
    else:
        return templates.TemplateResponse(
            request,
            "admin_promocodes.html",
            {
                "promocodes": get_promo_codes(db, include_used=True),
                "error": "Failed to deactivate promo code",
            },
        )


@app.get("/admin/ai-configs")
async def admin_ai_configs(request: Request, _admin: bool = Depends(require_admin)):
    return templates.TemplateResponse(request, "admin_ai_configs.html", {"configs": []})


@app.get("/admin/settings")
async def admin_settings(request: Request, _admin: bool = Depends(require_admin)):
    return templates.TemplateResponse(request, "admin_settings.html", {})


# --- Dashboard ---


@app.get("/dashboard")
async def dashboard(request: Request, db: Session = Depends(get_db)):
    user = get_user_or_none(request, db)
    if not user:
        return RedirectResponse("/login", status_code=303)
    agents = (
        db.query(Agent)
        .options(joinedload(Agent.telegram_bot), joinedload(Agent.commands))
        .filter(Agent.user_id == user.id)
        .order_by(Agent.created_at.desc())
        .all()
    )
    subscription = get_user_subscription(db, user.id)
    return templates.TemplateResponse(
        request,
        "dashboard.html",
        {"user": user, "agents": agents, "subscription": subscription},
    )


# --- Agent constructor ---


@app.get("/agent/new")
async def agent_new_page(request: Request, db: Session = Depends(get_db)):
    if not get_user_or_none(request, db):
        return RedirectResponse("/login", status_code=303)
    return templates.TemplateResponse(request, "agent_new.html", {"error": None})


@app.post("/agent/new")
async def agent_create(
    request: Request,
    name: str = Form(...),
    business_type: str = Form(...),
    superprompt: str = Form(...),
    knowledge: str = Form(...),
    command_names: list[str] = Form(default=[]),
    command_triggers: list[str] = Form(default=[]),
    command_actions: list[str] = Form(default=[]),
    db: Session = Depends(get_db),
):
    user = require_user(request, db)

    agent = Agent(
        user_id=user.id,
        name=name.strip(),
        business_type=business_type.strip(),
        superprompt=superprompt.strip(),
        knowledge=knowledge.strip(),
    )
    db.add(agent)
    db.flush()

    commands = []
    for i, cmd_name in enumerate(command_names):
        cmd_name = cmd_name.strip()
        if not cmd_name:
            continue
        triggers_raw = command_triggers[i] if i < len(command_triggers) else ""
        action = command_actions[i] if i < len(command_actions) else "general_answer"
        triggers = [t.strip() for t in triggers_raw.split(",") if t.strip()]
        cmd = Command(agent_id=agent.id, name=cmd_name, action=action)
        cmd.set_triggers(triggers)
        db.add(cmd)
        commands.append(cmd)

    agent.system_prompt = build_system_prompt(agent, commands)
    db.commit()
    db.refresh(agent)

    return RedirectResponse(f"/agent/{agent.id}/telegram", status_code=303)


@app.get("/agent/{agent_id}/telegram")
async def agent_telegram_page(
    request: Request,
    agent_id: int,
    db: Session = Depends(get_db),
):
    user = require_user(request, db)
    agent = (
        db.query(Agent)
        .options(joinedload(Agent.commands), joinedload(Agent.telegram_bot))
        .filter(Agent.id == agent_id, Agent.user_id == user.id)
        .first()
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Check channel access
    whatsapp_access, whatsapp_error = check_channel_access(db, user.id, "whatsapp")
    instagram_access, instagram_error = check_channel_access(db, user.id, "instagram")
    
    bot = agent.telegram_bot
    actually_running = is_bot_running(agent_id)
    
    # Get channel statuses
    whatsapp_status = channel_manager.get_channel_status(db, agent_id, "whatsapp")
    instagram_status = channel_manager.get_channel_status(db, agent_id, "instagram")
    
    return templates.TemplateResponse(
        request,
        "agent_telegram.html",
        {
            "agent": agent,
            "bot_started": actually_running or bool(bot and bot.status == "running"),
            "bot_alive": actually_running,
            "has_telegram_token": bool(bot and bot.token),
            "has_whatsapp_token": bool(bot and bot.whatsapp_token),
            "has_instagram_token": bool(bot and bot.instagram_token),
            "whatsapp_access": whatsapp_access,
            "whatsapp_error": whatsapp_error,
            "instagram_access": instagram_access,
            "instagram_error": instagram_error,
            "whatsapp_status": whatsapp_status,
            "instagram_status": instagram_status,
            "error": None,
        },
    )


@app.get("/api/agent/{agent_id}/channels")
async def get_agent_channels(
    request: Request,
    agent_id: int,
    db: Session = Depends(get_db),
):
    user = require_user(request, db)
    agent = (
        db.query(Agent)
        .options(joinedload(Agent.telegram_bot))
        .filter(Agent.id == agent_id, Agent.user_id == user.id)
        .first()
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    bot = agent.telegram_bot
    return {
        "telegram": bot.token if bot else "",
        "whatsapp": bot.whatsapp_token if bot else "",
        "instagram": bot.instagram_token if bot else "",
    }


@app.post("/agent/{agent_id}/telegram")
async def agent_telegram_start(
    request: Request,
    agent_id: int,
    token: str = Form(""),
    whatsapp_token: str = Form(""),
    instagram_token: str = Form(""),
    db: Session = Depends(get_db),
):
    user = require_user(request, db)
    agent = (
        db.query(Agent)
        .options(joinedload(Agent.commands), joinedload(Agent.telegram_bot))
        .filter(Agent.id == agent_id, Agent.user_id == user.id)
        .first()
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    existing = agent.telegram_bot
    tg_token = token.strip() or (existing.token if existing else "")
    wa_token = whatsapp_token.strip() or (existing.whatsapp_token if existing else "") or None
    ig_token = instagram_token.strip() or (existing.instagram_token if existing else "") or None

    if not tg_token:
        return templates.TemplateResponse(
            request,
            "agent_telegram.html",
            {
                "agent": agent,
                "bot_started": False,
                "has_telegram_token": False,
                "has_whatsapp_token": bool(wa_token),
                "has_instagram_token": bool(ig_token),
                "error": "Введите токен Telegram-бота",
            },
        )

    try:
        if existing:
            existing.token = tg_token
            existing.whatsapp_token = wa_token
            existing.instagram_token = ig_token
        else:
            existing = TelegramBot(
                agent_id=agent.id,
                token=tg_token,
                whatsapp_token=wa_token,
                instagram_token=ig_token,
                status="stopped",
            )
            db.add(existing)
        db.commit()

        start_telegram_bot(agent.id, tg_token, db)
        db.refresh(agent)

        alive = is_bot_running(agent.id)
        return templates.TemplateResponse(
            request,
            "agent_telegram.html",
            {
                "agent": agent,
                "bot_started": alive,
                "bot_alive": alive,
                "has_telegram_token": True,
                "has_whatsapp_token": bool(wa_token),
                "has_instagram_token": bool(ig_token),
                "error": None if alive else "Бот не смог запуститься. Проверьте токен и перезапустите.",
            },
        )
    except Exception as exc:
        return templates.TemplateResponse(
            request,
            "agent_telegram.html",
            {
                "agent": agent,
                "bot_started": False,
                "bot_alive": False,
                "has_telegram_token": bool(existing and existing.token),
                "has_whatsapp_token": bool(wa_token),
                "has_instagram_token": bool(ig_token),
                "error": str(exc),
            },
        )


@app.get("/api/agent/{agent_id}/telegram/status")
async def telegram_bot_status(
    request: Request,
    agent_id: int,
    db: Session = Depends(get_db),
):
    require_user(request, db)
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    bot = db.query(TelegramBot).filter(TelegramBot.agent_id == agent_id).first()
    alive = is_bot_running(agent_id)
    return {
        "agent_id": agent_id,
        "db_status": bot.status if bot else "none",
        "thread_alive": alive,
        "ok": alive,
    }


# --- WhatsApp & Instagram Channel Routes ---


@app.post("/api/agent/{agent_id}/whatsapp/connect")
async def connect_whatsapp(
    request: Request,
    agent_id: int,
    db: Session = Depends(get_db),
):
    user = require_user(request, db)
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Connect using QR code - no config needed
    config = {}  # Empty config for QR code connection
    
    success, message = await channel_manager.connect_channel(db, agent_id, "whatsapp", config)
    
    if success:
        return {"ok": True, "message": message}
    else:
        return JSONResponse(status_code=400, content={"ok": False, "error": message})


@app.post("/api/agent/{agent_id}/whatsapp/qr")
async def generate_whatsapp_qr(
    request: Request,
    agent_id: int,
    db: Session = Depends(get_db),
):
    user = require_user(request, db)
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Generate QR code without phone number
    qr_data = await channel_manager.generate_whatsapp_qr()
    return qr_data


@app.post("/api/agent/{agent_id}/instagram/connect")
async def connect_instagram(
    request: Request,
    agent_id: int,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = require_user(request, db)
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # First validate credentials
    validation = await channel_manager.validate_instagram_credentials(username, password)
    
    if not validation.get("valid"):
        return JSONResponse(
            status_code=400,
            content={"ok": False, "error": validation.get("error", "Invalid credentials")}
        )
    
    config = {
        "username": username,
        "password": password,
    }
    
    success, message = await channel_manager.connect_channel(db, agent_id, "instagram", config)
    
    if success:
        return {"ok": True, "message": message}
    else:
        return JSONResponse(status_code=400, content={"ok": False, "error": message})


@app.post("/api/agent/{agent_id}/instagram/validate")
async def validate_instagram_credentials_api(
    request: Request,
    agent_id: int,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = require_user(request, db)
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    validation = await channel_manager.validate_instagram_credentials(username, password)
    return validation


@app.post("/api/agent/{agent_id}/channel/{channel}/disconnect")
async def disconnect_channel(
    request: Request,
    agent_id: int,
    channel: str,
    db: Session = Depends(get_db),
):
    user = require_user(request, db)
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    success, message = await channel_manager.disconnect_channel(db, agent_id, channel)
    
    if success:
        return {"ok": True, "message": message}
    else:
        return JSONResponse(status_code=400, content={"ok": False, "error": message})


@app.get("/api/agent/{agent_id}/channel/{channel}/status")
async def get_channel_status(
    request: Request,
    agent_id: int,
    channel: str,
    db: Session = Depends(get_db),
):
    user = require_user(request, db)
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    status = channel_manager.get_channel_status(db, agent_id, channel)
    return status


# --- Webhook Routes ---


@app.get("/webhooks/whatsapp")
async def whatsapp_webhook_verify(request: Request):
    """Verify WhatsApp webhook."""
    # WhatsApp webhook verification logic would go here
    return {"ok": True}


@app.post("/webhooks/whatsapp")
async def whatsapp_webhook(request: Request):
    """Handle WhatsApp webhook."""
    data = await request.json()
    message = await channel_manager.handle_webhook("whatsapp", data)
    
    if message:
        # Process the message through the agent
        # This would involve getting the agent and calling process_message
        return {"ok": True, "processed": True}
    
    return {"ok": True, "processed": False}


@app.get("/webhooks/instagram")
async def instagram_webhook_verify(request: Request):
    """Verify Instagram webhook."""
    # Instagram webhook verification logic would go here
    return {"ok": True}


@app.post("/webhooks/instagram")
async def instagram_webhook(request: Request):
    """Handle Instagram webhook."""
    data = await request.json()
    message = await channel_manager.handle_webhook("instagram", data)
    
    if message:
        # Process the message through the agent
        return {"ok": True, "processed": True}
    
    return {"ok": True, "processed": False}


# --- Test chat API (dashboard) ---


@app.post("/api/agent/{agent_id}/chat")
async def agent_chat(
    request: Request,
    agent_id: int,
    body: ChatRequest,
    db: Session = Depends(get_db),
):
    user = require_user(request, db)
    agent = (
        db.query(Agent)
        .options(joinedload(Agent.commands))
        .filter(Agent.id == agent_id, Agent.user_id == user.id)
        .first()
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    try:
        reply = process_message(
            agent, 
            agent.commands, 
            body.text, 
            body.session_id,
            channel="dashboard",
            external_chat_id=body.session_id,
            db=db,
        )
        return {
            "text": reply.text,
            "hand_off": reply.hand_off,
            "booking_confirmed": reply.booking_confirmed,
            "needs_more_info": reply.needs_more_info,
            "conversation_state": reply.conversation_state,
        }
    except Exception as exc:
        return JSONResponse(status_code=500, content={"detail": str(exc)})


# --- Legacy API for compatibility ---


@app.post("/api/agent/{agent_id}/telegram")
async def telegram_api(agent_id: int, body: ChatRequest, db: Session = Depends(get_db)):
    agent = (
        db.query(Agent)
        .options(joinedload(Agent.commands))
        .filter(Agent.id == agent_id)
        .first()
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    try:
        reply = process_message(agent, agent.commands, body.text, body.session_id)
        return {
            "text": reply.text,
            "hand_off": reply.hand_off,
            "booking_confirmed": reply.booking_confirmed,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
