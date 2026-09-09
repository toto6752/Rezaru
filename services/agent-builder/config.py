"""Subscription configuration and limits."""

SUBSCRIPTION_LIMITS = {
    "start": {
        "price_usd": 20,
        "chats_per_week": 20,
        "max_commands": 2,
        "channels": ["telegram"],
        "csv_reports": False,
        "reminders": False,
    },
    "pro": {
        "price_usd": 50,
        "chats_per_week": 100,
        "max_commands": 10,
        "channels": ["telegram", "whatsapp"],
        "csv_reports": True,
        "reminders": True,
    },
    "custom": {
        "price_usd": None,  # "Обсудить цену"
        "chats_per_week": float('inf'),
        "max_commands": float('inf'),
        "channels": ["telegram", "whatsapp", "instagram"],
        "csv_reports": True,
        "reminders": True,
    }
}

TRIAL_DURATION_DAYS = 30
PROMO_CODE_DURATION_DAYS = 30


def get_subscription_limits(plan: str) -> dict:
    """Get limits for a subscription plan."""
    return SUBSCRIPTION_LIMITS.get(plan, SUBSCRIPTION_LIMITS["start"])


def is_channel_available(plan: str, channel: str) -> bool:
    """Check if a channel is available for a subscription plan."""
    limits = get_subscription_limits(plan)
    return channel in limits["channels"]


def get_max_commands(plan: str) -> int:
    """Get maximum number of commands for a subscription plan."""
    limits = get_subscription_limits(plan)
    return limits["max_commands"]


def get_chat_limit(plan: str) -> int:
    """Get weekly chat limit for a subscription plan."""
    limits = get_subscription_limits(plan)
    return limits["chats_per_week"]


def has_csv_reports(plan: str) -> bool:
    """Check if CSV reports are available for a subscription plan."""
    limits = get_subscription_limits(plan)
    return limits["csv_reports"]


def has_reminders(plan: str) -> bool:
    """Check if reminders are available for a subscription plan."""
    limits = get_subscription_limits(plan)
    return limits["reminders"]
