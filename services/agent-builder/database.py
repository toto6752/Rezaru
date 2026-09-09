import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./rezaru_demo.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    import models  # noqa: F401
    from sqlalchemy import inspect, text

    Base.metadata.create_all(bind=engine)

    # Миграция: новые колонки для WhatsApp / Instagram
    inspector = inspect(engine)
    if "telegram_bots" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("telegram_bots")}
        with engine.begin() as conn:
            if "whatsapp_token" not in cols:
                conn.execute(text("ALTER TABLE telegram_bots ADD COLUMN whatsapp_token VARCHAR(512)"))
            if "instagram_token" not in cols:
                conn.execute(text("ALTER TABLE telegram_bots ADD COLUMN instagram_token VARCHAR(512)"))
    
    # Миграция: новые колонки для channel_configs (Instagram credentials, WhatsApp phone)
    if "channel_configs" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("channel_configs")}
        with engine.begin() as conn:
            if "encrypted_username" not in cols:
                conn.execute(text("ALTER TABLE channel_configs ADD COLUMN encrypted_username VARCHAR(255)"))
            if "encrypted_password" not in cols:
                conn.execute(text("ALTER TABLE channel_configs ADD COLUMN encrypted_password VARCHAR(255)"))
            if "phone_number" not in cols:
                conn.execute(text("ALTER TABLE channel_configs ADD COLUMN phone_number VARCHAR(20)"))
    
    # Миграция: новые таблицы для подписок, промокодов, использования и т.д.
    # Новые таблицы будут созданы автоматически через Base.metadata.create_all()
