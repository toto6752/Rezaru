import json
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    agents: Mapped[list["Agent"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    subscription: Mapped["Subscription | None"] = relationship(back_populates="user", uselist=False)


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    business_type: Mapped[str] = mapped_column(String(255))
    superprompt: Mapped[str] = mapped_column(Text)
    knowledge: Mapped[str] = mapped_column(Text)
    system_prompt: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="agents")
    commands: Mapped[list["Command"]] = relationship(
        back_populates="agent", cascade="all, delete-orphan", order_by="Command.id"
    )
    telegram_bot: Mapped["TelegramBot | None"] = relationship(
        back_populates="agent", cascade="all, delete-orphan", uselist=False
    )
    usage_counters: Mapped[list["UsageCounter"]] = relationship(back_populates="agent")
    conversation_states: Mapped[list["ConversationState"]] = relationship(back_populates="agent")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="agent")
    support_sessions: Mapped[list["SupportSession"]] = relationship(back_populates="agent")
    ai_configs: Mapped[list["AIProviderConfig"]] = relationship(back_populates="agent")
    channel_configs: Mapped[list["ChannelConfig"]] = relationship(back_populates="agent")


class Command(Base):
    __tablename__ = "commands"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    triggers: Mapped[str] = mapped_column(Text)  # JSON array
    action: Mapped[str] = mapped_column(String(64))

    agent: Mapped["Agent"] = relationship(back_populates="commands")

    def get_triggers(self) -> list[str]:
        try:
            return json.loads(self.triggers)
        except json.JSONDecodeError:
            return [t.strip() for t in self.triggers.split(",") if t.strip()]

    def set_triggers(self, values: list[str]) -> None:
        self.triggers = json.dumps(values, ensure_ascii=False)


class TelegramBot(Base):
    __tablename__ = "telegram_bots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"), unique=True, index=True)
    token: Mapped[str] = mapped_column(String(255), default="")
    whatsapp_token: Mapped[str | None] = mapped_column(String(512), nullable=True, default=None)
    instagram_token: Mapped[str | None] = mapped_column(String(512), nullable=True, default=None)
    status: Mapped[str] = mapped_column(String(32), default="stopped")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    agent: Mapped["Agent"] = relationship(back_populates="telegram_bot")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    plan: Mapped[str] = mapped_column(String(20))  # start/pro/custom
    status: Mapped[str] = mapped_column(String(20))  # trial/active/expired/cancelled
    starts_at: Mapped[datetime] = mapped_column(DateTime)
    ends_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="subscription")


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code_hash: Mapped[str] = mapped_column(String(255))  # Hashed promo code
    plan: Mapped[str] = mapped_column(String(20))
    duration_days: Mapped[int] = mapped_column(Integer, default=30)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    used_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by_admin: Mapped[bool] = mapped_column(Boolean, default=False)


class UsageCounter(Base):
    __tablename__ = "usage_counters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"))
    channel: Mapped[str] = mapped_column(String(20))
    external_chat_id: Mapped[str] = mapped_column(String(255))
    week_start: Mapped[datetime] = mapped_column(DateTime)
    last_message_at: Mapped[datetime] = mapped_column(DateTime)
    message_count: Mapped[int] = mapped_column(Integer, default=1)
    conversation_started: Mapped[bool] = mapped_column(Boolean, default=True)

    agent: Mapped["Agent"] = relationship(back_populates="usage_counters")


class ConversationState(Base):
    __tablename__ = "conversation_states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"))
    channel: Mapped[str] = mapped_column(String(20))
    external_chat_id: Mapped[str] = mapped_column(String(255))
    intent: Mapped[str | None] = mapped_column(String(50), nullable=True)
    state: Mapped[str] = mapped_column(String(50), default="idle")
    service: Mapped[str | None] = mapped_column(String(255), nullable=True)
    date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    time: Mapped[str | None] = mapped_column(String(10), nullable=True)
    client_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    agent: Mapped["Agent"] = relationship(back_populates="conversation_states")


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"))
    channel: Mapped[str] = mapped_column(String(20))
    external_chat_id: Mapped[str] = mapped_column(String(255))
    client_name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(20))
    service: Mapped[str] = mapped_column(String(255))
    date: Mapped[str] = mapped_column(String(20))  # YYYY-MM-DD
    time: Mapped[str] = mapped_column(String(10))  # HH:MM
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Dushanbe")
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending/confirmed/cancelled/completed
    reminder_24h_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    reminder_4h_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    agent: Mapped["Agent"] = relationship(back_populates="bookings")


class SupportSession(Base):
    __tablename__ = "support_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"))
    channel: Mapped[str] = mapped_column(String(20))
    external_chat_id: Mapped[str] = mapped_column(String(255))
    admin_telegram_id: Mapped[str] = mapped_column(String(50))
    takeover_active: Mapped[bool] = mapped_column(Boolean, default=True)
    client_username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    agent: Mapped["Agent"] = relationship(back_populates="support_sessions")


class AIProviderConfig(Base):
    __tablename__ = "ai_provider_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    agent_id: Mapped[int | None] = mapped_column(ForeignKey("agents.id"), nullable=True)
    provider: Mapped[str] = mapped_column(String(50), default="gemini")
    model: Mapped[str] = mapped_column(String(100))
    encrypted_api_key: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    agent: Mapped["Agent"] = relationship(back_populates="ai_configs")


class ChannelConfig(Base):
    __tablename__ = "channel_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"))
    channel: Mapped[str] = mapped_column(String(20))  # telegram/whatsapp/instagram
    status: Mapped[str] = mapped_column(String(20), default="disconnected")  # disconnected/beta/connected/blocked
    provider: Mapped[str] = mapped_column(String(50))
    external_account_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    encrypted_access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    encrypted_username: Mapped[str | None] = mapped_column(String(255), nullable=True)  # For Instagram
    encrypted_password: Mapped[str | None] = mapped_column(String(255), nullable=True)  # For Instagram
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)  # For WhatsApp
    metadata_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    agent: Mapped["Agent"] = relationship(back_populates="channel_configs")
