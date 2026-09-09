"""Subscription management and checking logic."""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from config import (
    TRIAL_DURATION_DAYS,
    get_chat_limit,
    get_max_commands,
    has_csv_reports,
    has_reminders,
    is_channel_available,
    SUBSCRIPTION_LIMITS,
)
from models import Subscription, User


def get_user_subscription(db: Session, user_id: int) -> Subscription | None:
    """Get active subscription for a user."""
    return (
        db.query(Subscription)
        .filter(
            Subscription.user_id == user_id,
            Subscription.status.in_(["trial", "active"]),
            Subscription.ends_at > datetime.utcnow(),
        )
        .order_by(Subscription.created_at.desc())
        .first()
    )


def create_trial_subscription(db: Session, user: User) -> Subscription:
    """Create a trial subscription for a new user."""
    now = datetime.utcnow()
    ends_at = now + timedelta(days=TRIAL_DURATION_DAYS)
    
    subscription = Subscription(
        user_id=user.id,
        plan="pro",
        status="trial",
        starts_at=now,
        ends_at=ends_at,
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


def check_subscription_limit(db: Session, user_id: int, limit_type: str) -> tuple[bool, str]:
    """
    Check if user can perform an action based on subscription limits.
    Returns (allowed, error_message).
    """
    subscription = get_user_subscription(db, user_id)
    
    if not subscription:
        return False, "No active subscription"
    
    plan = subscription.plan
    limits = SUBSCRIPTION_LIMITS.get(plan, SUBSCRIPTION_LIMITS["start"])
    
    if limit_type == "csv_reports" and not limits["csv_reports"]:
        return False, f"CSV reports are not available on {plan} plan"
    
    if limit_type == "reminders" and not limits["reminders"]:
        return False, f"Reminders are not available on {plan} plan"
    
    return True, ""


def check_channel_access(db: Session, user_id: int, channel: str) -> tuple[bool, str]:
    """
    Check if user can access a specific channel based on subscription.
    Returns (allowed, error_message).
    """
    subscription = get_user_subscription(db, user_id)
    
    if not subscription:
        return False, "No active subscription"
    
    plan = subscription.plan
    
    if not is_channel_available(plan, channel):
        if channel == "instagram":
            return False, "Instagram is only available on Custom plan"
        if channel == "whatsapp":
            return False, f"WhatsApp is not available on {plan} plan"
        return False, f"Channel {channel} is not available on {plan} plan"
    
    return True, ""


def check_command_limit(db: Session, user_id: int, current_command_count: int) -> tuple[bool, str]:
    """
    Check if user can add more commands based on subscription.
    Returns (allowed, error_message).
    """
    subscription = get_user_subscription(db, user_id)
    
    if not subscription:
        return False, "No active subscription"
    
    plan = subscription.plan
    max_commands = get_max_commands(plan)
    
    if current_command_count >= max_commands:
        return False, f"Command limit reached for {plan} plan (max {max_commands} commands)"
    
    return True, ""


def get_user_plan(db: Session, user_id: int) -> str:
    """Get user's current plan."""
    subscription = get_user_subscription(db, user_id)
    if not subscription:
        return "start"  # Default to start if no subscription
    return subscription.plan


def is_subscription_active(db: Session, user_id: int) -> bool:
    """Check if user has an active subscription."""
    subscription = get_user_subscription(db, user_id)
    return subscription is not None


def extend_subscription(db: Session, user_id: int, plan: str, days: int) -> Subscription:
    """Extend or create subscription for a user."""
    now = datetime.utcnow()
    
    # Check if user has existing active subscription
    existing = get_user_subscription(db, user_id)
    
    if existing:
        # Extend existing subscription
        if existing.ends_at > now:
            new_ends_at = existing.ends_at + timedelta(days=days)
        else:
            new_ends_at = now + timedelta(days=days)
        
        existing.plan = plan
        existing.status = "active"
        existing.ends_at = new_ends_at
        existing.updated_at = now
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new subscription
        ends_at = now + timedelta(days=days)
        subscription = Subscription(
            user_id=user_id,
            plan=plan,
            status="active",
            starts_at=now,
            ends_at=ends_at,
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        return subscription
