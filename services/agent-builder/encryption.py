import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

from dotenv import load_dotenv

load_dotenv()

FIELD_ENCRYPTION_KEY = os.getenv("FIELD_ENCRYPTION_KEY", "")


def _get_fernet() -> Fernet:
    """Get Fernet instance for encryption/decryption."""
    if not FIELD_ENCRYPTION_KEY:
        raise ValueError("FIELD_ENCRYPTION_KEY is not set in environment")
    
    # Derive a proper Fernet key from the encryption key
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b'rezaru_salt',  # In production, use a random salt per encryption
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(FIELD_ENCRYPTION_KEY.encode()))
    return Fernet(key)


def encrypt_field(plaintext: str) -> str:
    """Encrypt a field value."""
    if not plaintext:
        return ""
    fernet = _get_fernet()
    encrypted = fernet.encrypt(plaintext.encode())
    return base64.urlsafe_b64encode(encrypted).decode()


def decrypt_field(encrypted: str) -> str:
    """Decrypt a field value."""
    if not encrypted:
        return ""
    try:
        fernet = _get_fernet()
        decoded = base64.urlsafe_b64decode(encrypted.encode())
        decrypted = fernet.decrypt(decoded)
        return decrypted.decode()
    except Exception:
        # If decryption fails, return empty string (could be old unencrypted data)
        return ""


def mask_token(token: str, visible_chars: int = 4) -> str:
    """Mask a token, showing only the last few characters."""
    if not token:
        return ""
    if len(token) <= visible_chars:
        return "•" * len(token)
    return "•" * (len(token) - visible_chars) + token[-visible_chars:]


def mask_api_key(api_key: str, visible_chars: int = 4) -> str:
    """Mask an API key, showing only the last few characters."""
    return mask_token(api_key, visible_chars)
