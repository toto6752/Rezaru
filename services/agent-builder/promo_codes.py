"""Promo code generation and validation."""

import hashlib
import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from config import PROMO_CODE_DURATION_DAYS
from models import PromoCode, User


def generate_promo_code() -> str:
    """Generate a cryptographically random promo code."""
    return secrets.token_urlsafe(16).upper()


def hash_promo_code(code: str) -> str:
    """Hash a promo code for secure storage."""
    return hashlib.sha256(code.encode()).hexdigest()


def create_promo_code(
    db: Session,
    plan: str,
    duration_days: int = PROMO_CODE_DURATION_DAYS,
    expires_days: int = 365,
) -> tuple[str, PromoCode]:
    """
    Create a new promo code.
    Returns (plain_code, promo_code_object).
    """
    plain_code = generate_promo_code()
    code_hash = hash_promo_code(plain_code)
    expires_at = datetime.utcnow() + timedelta(days=expires_days)
    
    promo_code = PromoCode(
        code_hash=code_hash,
        plan=plan,
        duration_days=duration_days,
        is_used=False,
        expires_at=expires_at,
        created_by_admin=True,
    )
    
    db.add(promo_code)
    db.commit()
    db.refresh(promo_code)
    
    return plain_code, promo_code


def validate_promo_code(db: Session, code: str) -> tuple[bool, str, PromoCode | None]:
    """
    Validate a promo code.
    Returns (is_valid, error_message, promo_code_object).
    """
    code_hash = hash_promo_code(code)
    
    promo_code = (
        db.query(PromoCode)
        .filter(
            PromoCode.code_hash == code_hash,
            PromoCode.is_used == False,
            PromoCode.expires_at > datetime.utcnow(),
        )
        .first()
    )
    
    if not promo_code:
        return False, "Invalid or expired promo code", None
    
    return True, "", promo_code


def activate_promo_code(
    db: Session,
    user_id: int,
    code: str,
) -> tuple[bool, str]:
    """
    Activate a promo code for a user (atomic transaction).
    Returns (success, error_message).
    """
    # Validate promo code
    is_valid, error_message, promo_code = validate_promo_code(db, code)
    if not is_valid:
        return False, error_message
    
    # Check if already used by this user
    if promo_code.used_by_user_id == user_id:
        return False, "You have already used this promo code"
    
    try:
        # Mark as used in a transaction
        promo_code.is_used = True
        promo_code.used_by_user_id = user_id
        promo_code.used_at = datetime.utcnow()
        
        # Extend user subscription
        from subscription import extend_subscription
        
        subscription = extend_subscription(
            db=db,
            user_id=user_id,
            plan=promo_code.plan,
            days=promo_code.duration_days,
        )
        
        db.commit()
        
        return True, f"Subscription extended to {subscription.plan} plan for {promo_code.duration_days} days"
    
    except Exception as e:
        db.rollback()
        return False, f"Failed to activate promo code: {str(e)}"


def deactivate_promo_code(db: Session, promo_code_id: int) -> bool:
    """Deactivate a promo code by marking it as used."""
    promo_code = db.query(PromoCode).filter(PromoCode.id == promo_code_id).first()
    if not promo_code:
        return False
    
    if promo_code.is_used:
        return False
    
    promo_code.is_used = True
    promo_code.used_at = datetime.utcnow()
    db.commit()
    
    return True


def get_promo_codes(db: Session, include_used: bool = False) -> list[PromoCode]:
    """Get all promo codes, optionally including used ones."""
    query = db.query(PromoCode)
    
    if not include_used:
        query = query.filter(PromoCode.is_used == False)
    
    return query.order_by(PromoCode.created_at.desc()).all()


def get_promo_code_by_id(db: Session, promo_code_id: int) -> PromoCode | None:
    """Get a promo code by ID."""
    return db.query(PromoCode).filter(PromoCode.id == promo_code_id).first()
