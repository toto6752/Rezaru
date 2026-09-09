"""Usage tracking and limit enforcement."""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from config import get_chat_limit
from models import UsageCounter, Agent
from subscription import get_user_plan


def get_week_start(date: datetime = None) -> datetime:
    """Get the Monday of the current week."""
    if date is None:
        date = datetime.utcnow()
    
    # Monday is weekday 0
    days_since_monday = date.weekday()
    monday = date - timedelta(days=days_since_monday)
    
    # Set time to midnight
    monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)
    
    return monday


def track_chat_usage(
    db: Session,
    agent_id: int,
    channel: str,
    external_chat_id: str,
) -> tuple[bool, str]:
    """
    Track or update chat usage for a specific conversation.
    Returns (limit_exceeded, error_message).
    """
    # Get agent and user subscription
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        return False, "Agent not found"
    
    plan = get_user_plan(db, agent.user_id)
    chat_limit = get_chat_limit(plan)
    
    # Custom plan has no limit
    if chat_limit == float('inf'):
        return False, ""
    
    week_start = get_week_start()
    
    # Check if this conversation already exists for this week
    existing = (
        db.query(UsageCounter)
        .filter(
            UsageCounter.agent_id == agent_id,
            UsageCounter.channel == channel,
            UsageCounter.external_chat_id == external_chat_id,
            UsageCounter.week_start == week_start,
        )
        .first()
    )
    
    if existing:
        # Update existing counter
        existing.last_message_at = datetime.utcnow()
        existing.message_count += 1
        db.commit()
        
        # Check if limit exceeded
        if existing.message_count > chat_limit:
            return True, f"Лимит чатов для этого агента на текущую неделю исчерпан. Обратитесь к владельцу бизнеса."
        
        return False, ""
    else:
        # Count existing unique chats for this week
        unique_chats_count = (
            db.query(UsageCounter)
            .filter(
                UsageCounter.agent_id == agent_id,
                UsageCounter.channel == channel,
                UsageCounter.week_start == week_start,
            )
            .count()
        )
        
        # Check if creating new chat would exceed limit
        if unique_chats_count >= chat_limit:
            return True, f"Лимит чатов для этого агента на текущую неделю исчерпан. Обратитесь к владельцу бизнеса."
        
        # Create new usage counter
        counter = UsageCounter(
            agent_id=agent_id,
            channel=channel,
            external_chat_id=external_chat_id,
            week_start=week_start,
            last_message_at=datetime.utcnow(),
            message_count=1,
            conversation_started=True,
        )
        db.add(counter)
        db.commit()
        
        return False, ""


def check_chat_limit(
    db: Session,
    agent_id: int,
    channel: str,
) -> tuple[bool, str]:
    """
    Check if agent has exceeded chat limit for the current week.
    Returns (limit_exceeded, error_message).
    """
    # Get agent and user subscription
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        return False, "Agent not found"
    
    plan = get_user_plan(db, agent.user_id)
    chat_limit = get_chat_limit(plan)
    
    # Custom plan has no limit
    if chat_limit == float('inf'):
        return False, ""
    
    week_start = get_week_start()
    
    # Count unique chats for this week
    unique_chats_count = (
        db.query(UsageCounter)
        .filter(
            UsageCounter.agent_id == agent_id,
            UsageCounter.channel == channel,
            UsageCounter.week_start == week_start,
        )
        .count()
    )
    
    if unique_chats_count >= chat_limit:
        return True, f"Лимит чатов для этого агента на текущую неделю исчерпан. Обратитесь к владельцу бизнеса."
    
    return False, ""


def get_usage_stats(
    db: Session,
    agent_id: int,
    channel: str | None = None,
) -> dict:
    """
    Get usage statistics for an agent.
    Returns dict with current week stats.
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        return {}
    
    plan = get_user_plan(db, agent.user_id)
    chat_limit = get_chat_limit(plan)
    
    week_start = get_week_start()
    
    # Build query
    query = db.query(UsageCounter).filter(
        UsageCounter.agent_id == agent_id,
        UsageCounter.week_start == week_start,
    )
    
    if channel:
        query = query.filter(UsageCounter.channel == channel)
    
    counters = query.all()
    
    # Calculate stats
    unique_chats = len(counters)
    total_messages = sum(c.message_count for c in counters)
    
    # Group by channel
    by_channel = {}
    for counter in counters:
        if counter.channel not in by_channel:
            by_channel[counter.channel] = {
                "unique_chats": 0,
                "total_messages": 0,
            }
        by_channel[counter.channel]["unique_chats"] += 1
        by_channel[counter.channel]["total_messages"] += counter.message_count
    
    return {
        "plan": plan,
        "chat_limit": chat_limit if chat_limit != float('inf') else "unlimited",
        "week_start": week_start.isoformat(),
        "unique_chats": unique_chats,
        "total_messages": total_messages,
        "by_channel": by_channel,
        "limit_exceeded": unique_chats >= chat_limit if chat_limit != float('inf') else False,
    }


def cleanup_old_usage_counters(db: Session, weeks_to_keep: int = 4):
    """Clean up usage counters older than specified weeks."""
    cutoff_date = get_week_start() - timedelta(weeks=weeks_to_keep)
    
    deleted = (
        db.query(UsageCounter)
        .filter(UsageCounter.week_start < cutoff_date)
        .delete()
    )
    
    db.commit()
    return deleted
