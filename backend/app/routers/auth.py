from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from sqlmodel import select
from app.db import SessionDep
from app.models import User
from app.auth import verify_password, get_password_hash, create_access_token, decode_access_token
from app.settings import get_settings
from typing import Optional

settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    username: str
    password: str


def get_current_user(authorization: Optional[str] = Header(None), session: SessionDep = None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


@router.post("/register", response_model=LoginResponse)
def register(request: RegisterRequest, session: SessionDep):
    existing_user = session.exec(select(User)).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail="Admin user already exists. Only one admin user is allowed in local auth mode."
        )
    
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    password_hash = get_password_hash(request.password)
    
    user = User(
        username=request.username,
        password_hash=password_hash,
        is_admin=True
    )
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    access_token = create_access_token(data={"sub": user.username})
    
    return LoginResponse(access_token=access_token)


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, session: SessionDep):
    user = session.exec(select(User).where(User.username == request.username)).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    access_token = create_access_token(data={"sub": user.username})
    
    return LoginResponse(access_token=access_token)


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {"username": user.username, "is_admin": user.is_admin}
