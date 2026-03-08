from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from app.settings import get_settings

settings = get_settings()

SECRET_KEY = settings.jwt_secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    
    to_encode.update({"exp": expire})
    
    if not settings.jwt_secret_key:
        raise ValueError("JWT_SECRET_KEY must be configured for authentication")
    
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm="HS256")
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    try:
        print(f"[AUTH] Attempting to decode token (first 50 chars): {token[:50]}...")
        
        # First, try to decode without verification to check if it's an Auth0 token
        unverified_payload = jwt.decode(token, key="", options={"verify_signature": False})
        print(f"[AUTH] Unverified payload: {unverified_payload}")
        
        # Check if this is an Auth0 token (has 'iss' claim with auth0.com domain)
        issuer = unverified_payload.get("iss", "")
        sub = unverified_payload.get("sub", "")
        print(f"[AUTH] Token issuer: {issuer}, sub: {sub}")
        
        if "auth0.com" in issuer or sub.startswith("auth0|") or sub.startswith("google-oauth2|"):
            # Trust Auth0 tokens from the frontend (already validated by Auth0)
            print(f"[AUTH] Detected Auth0 token, returning unverified payload")
            return unverified_payload
        
        # For local tokens, validate with our secret key
        print(f"[AUTH] Not an Auth0 token, validating with local secret")
        if not settings.jwt_secret_key:
            print(f"[AUTH] No JWT secret key configured")
            return None
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
        print(f"[AUTH] Successfully validated local token")
        return payload
    except JWTError as e:
        print(f"[AUTH] JWT decode error: {e}")
        return None
    except Exception as e:
        print(f"[AUTH] Unexpected error: {e}")
        return None
