import hashlib
import os
import secrets
from datetime import datetime, timedelta

import httpx
from fastapi import HTTPException, Request
from sqlalchemy.orm import Session
from itsdangerous import URLSafeTimedSerializer

from models import User

# --- Single sign-on with the main Rezaru app (Better Auth) ---
#
# This service no longer keeps its own password login for regular users.
# Instead, every request is authenticated against the Next.js app's Better
# Auth session: we forward the incoming Cookie header to Better Auth's
# built-in `/api/auth/get-session` endpoint (reachable inside the same
# container/network) and trust its answer. Local `users` rows are kept only
# as a mirror, keyed by email, so existing Agent/Command/... foreign keys
# keep working unchanged.
BETTER_AUTH_INTERNAL_URL = os.getenv("BETTER_AUTH_INTERNAL_URL", "http://127.0.0.1:3000")


def get_better_auth_session(request: Request) -> dict | None:
    """Ask the Next.js app whether the caller has a valid Better Auth session.

    Returns the parsed `{ session, user }` payload, or None if there is no
    cookie, the session is invalid/expired, or the internal call fails.
    """
    cookie_header = request.headers.get("cookie")
    if not cookie_header:
        return None
    try:
        response = httpx.get(
            f"{BETTER_AUTH_INTERNAL_URL}/api/auth/get-session",
            headers={"cookie": cookie_header},
            timeout=5.0,
        )
    except httpx.HTTPError:
        return None
    if response.status_code != 200:
        return None
    try:
        data = response.json()
    except ValueError:
        return None
    if not data or not data.get("user"):
        return None
    return data


def _get_or_create_local_user(db: Session, email: str) -> User:
    """Mirror a Better Auth user into this service's own `users` table.

    Matched by email (unique on both sides). New rows get an unusable local
    password hash since login never happens here anymore, and a trial
    subscription so the experience matches what registration used to do.
    """
    email = email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user
    user = User(email=email, password_hash=hash_password(secrets.token_urlsafe(32)))
    db.add(user)
    db.flush()
    try:
        from subscription import create_trial_subscription

        create_trial_subscription(db, user)
    except Exception:
        # Trial bootstrap failing should never block sign-in.
        pass
    db.commit()
    db.refresh(user)
    return user


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, stored = password_hash.split("$", 1)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return secrets.compare_digest(digest.hex(), stored)


def get_current_user_id(request: Request, db: Session) -> int | None:
    session_data = get_better_auth_session(request)
    if not session_data:
        return None
    email = session_data.get("user", {}).get("email")
    if not email:
        return None
    user = _get_or_create_local_user(db, email)
    return user.id


def require_user(request: Request, db: Session) -> User:
    user_id = get_current_user_id(request, db)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_user_or_none(request: Request, db: Session) -> User | None:
    user_id = get_current_user_id(request, db)
    if not user_id:
        return None
    return db.get(User, user_id)


# --- Admin Authentication ---
# Unchanged: the internal admin panel keeps its own separate password/token
# login (ADMIN_PASSWORD / ADMIN_ACCESS_TOKEN), independent of customer SSO.

ADMIN_SESSION_KEY = "admin_session"
ADMIN_SESSION_DURATION = timedelta(hours=24)


def get_admin_session(request: Request) -> str | None:
    """Get admin session from cookie."""
    return request.session.get(ADMIN_SESSION_KEY)


def create_admin_session(request: Request) -> str:
    """Create a signed admin session."""
    session_secret = os.getenv("SESSION_SECRET", "rezaru-demo-secret-change-in-production")
    serializer = URLSafeTimedSerializer(session_secret)
    session_id = secrets.token_urlsafe(32)
    signed_session = serializer.dumps(session_id)
    request.session[ADMIN_SESSION_KEY] = signed_session
    return signed_session


def verify_admin_session(request: Request) -> bool:
    """Verify admin session is valid and not expired."""
    signed_session = get_admin_session(request)
    if not signed_session:
        return False

    try:
        session_secret = os.getenv("SESSION_SECRET", "rezaru-demo-secret-change-in-production")
        serializer = URLSafeTimedSerializer(session_secret)
        session_id = serializer.loads(signed_session, max_age=ADMIN_SESSION_DURATION.total_seconds())
        return bool(session_id)
    except Exception:
        return False


def clear_admin_session(request: Request):
    """Clear admin session."""
    request.session.pop(ADMIN_SESSION_KEY, None)


def verify_admin_password(password: str) -> bool:
    """Verify admin password from environment."""
    admin_password = os.getenv("ADMIN_PASSWORD", "")
    if not admin_password:
        return False
    return secrets.compare_digest(password, admin_password)


def verify_admin_access_token(token: str) -> bool:
    """Verify admin access token from environment."""
    access_token = os.getenv("ADMIN_ACCESS_TOKEN", "")
    if not access_token:
        return False
    return secrets.compare_digest(token, access_token)
