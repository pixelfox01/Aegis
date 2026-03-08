from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext
from app.settings import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


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
        if not settings.jwt_secret_key:
            return None
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
        return payload
    except jwt.InvalidTokenError:
        return None
