"""Reminder system for bookings using APScheduler."""

import asyncio
import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Booking, Agent, TelegramBot
from subscription import has_reminders, get_user_plan
from telegram_bot import send_telegram_message

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = AsyncIOScheduler()


def get_weekday_name(date_str: str) -> str:
    """Get weekday name from date string (YYYY-MM-DD)."""
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
        return weekdays[date_obj.weekday()]
    except ValueError:
        return ""


async def send_reminder(booking: Booking, message: str):
    """Send reminder message through the appropriate channel."""
    try:
        if booking.channel == "telegram":
            # Get Telegram bot token for the agent
            db = SessionLocal()
            try:
                agent = db.query(Agent).filter(Agent.id == booking.agent_id).first()
                if not agent:
                    logger.error(f"Agent not found for booking {booking.id}")
                    return
                
                telegram_bot = db.query(TelegramBot).filter(
                    TelegramBot.agent_id == booking.agent_id
                ).first()
                
                if not telegram_bot or not telegram_bot.token:
                    logger.error(f"Telegram bot not found for agent {booking.agent_id}")
                    return
                
                # Send message via Telegram
                await send_telegram_message(
                    telegram_bot.token,
                    booking.external_chat_id,
                    message,
                )
                
                logger.info(f"Reminder sent for booking {booking.id} via Telegram")
            finally:
                db.close()
        
        # Other channels (WhatsApp, Instagram) would be implemented here
        # with their respective provider adapters
        
    except Exception as e:
        logger.exception(f"Failed to send reminder for booking {booking.id}: {e}")


async def check_and_send_reminders():
    """Check for upcoming bookings and send reminders if needed."""
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        
        # Check for bookings that need 24h reminder
        booking_24h = (
            db.query(Booking)
            .filter(
                Booking.status.in_(["pending", "confirmed"]),
                Booking.reminder_24h_sent == False,
            )
            .all()
        )
        
        for booking in booking_24h:
            try:
                # Parse booking datetime
                booking_datetime = datetime.strptime(
                    f"{booking.date} {booking.time}", "%Y-%m-%d %H:%M"
                )
                
                # Check if booking is in 24-25 hours from now
                time_until_booking = booking_datetime - now
                if timedelta(hours=23) <= time_until_booking <= timedelta(hours=25):
                    # Check if user has reminders enabled
                    agent = db.query(Agent).filter(Agent.id == booking.agent_id).first()
                    if agent:
                        plan = get_user_plan(db, agent.user_id)
                        if has_reminders(plan):
                            weekday = get_weekday_name(booking.date)
                            message = (
                                f"Напоминание: Вы записаны на {booking.service} "
                                f"{weekday}, {booking.date} в {booking.time}. "
                                f"Ждём вас!"
                            )
                            
                            await send_reminder(booking, message)
                            
                            # Mark as sent
                            booking.reminder_24h_sent = True
                            db.commit()
            except ValueError as e:
                logger.error(f"Invalid datetime for booking {booking.id}: {e}")
        
        # Check for bookings that need 4h reminder
        booking_4h = (
            db.query(Booking)
            .filter(
                Booking.status.in_(["pending", "confirmed"]),
                Booking.reminder_4h_sent == False,
            )
            .all()
        )
        
        for booking in booking_4h:
            try:
                # Parse booking datetime
                booking_datetime = datetime.strptime(
                    f"{booking.date} {booking.time}", "%Y-%m-%d %H:%M"
                )
                
                # Check if booking is in 3.5-4.5 hours from now
                time_until_booking = booking_datetime - now
                if timedelta(hours=3.5) <= time_until_booking <= timedelta(hours=4.5):
                    # Check if user has reminders enabled
                    agent = db.query(Agent).filter(Agent.id == booking.agent_id).first()
                    if agent:
                        plan = get_user_plan(db, agent.user_id)
                        if has_reminders(plan):
                            weekday = get_weekday_name(booking.date)
                            message = (
                                f"Напоминание: Ваша запись на {booking.service} "
                                f"через 4 часа! {weekday}, {booking.date} в {booking.time}."
                            )
                            
                            await send_reminder(booking, message)
                            
                            # Mark as sent
                            booking.reminder_4h_sent = True
                            db.commit()
            except ValueError as e:
                logger.error(f"Invalid datetime for booking {booking.id}: {e}")
        
    finally:
        db.close()


def start_scheduler():
    """Start the reminder scheduler."""
    if not scheduler.running:
        # Check every 5 minutes
        scheduler.add_job(
            check_and_send_reminders,
            'interval',
            minutes=5,
            id='reminder_checker',
            replace_existing=True,
        )
        scheduler.start()
        logger.info("Reminder scheduler started")


def stop_scheduler():
    """Stop the reminder scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Reminder scheduler stopped")