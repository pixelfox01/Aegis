from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from sqlmodel import select
from app.db import SessionDep
from app.models import AppUser, UserPreference, Question, User
from app.auth import decode_access_token
from typing import Optional
import uuid

router = APIRouter(prefix="/api/users", tags=["users"])


class SyncUserRequest(BaseModel):
    email: Optional[str] = None
    sub: Optional[str] = None  # Auth0 sub claim sent from frontend


class UserResponse(BaseModel):
    id: str
    email: Optional[str]
    auth_provider: str


class PreferenceItem(BaseModel):
    question_id: int
    priority: str


class SavePreferencesRequest(BaseModel):
    preferences: dict[str, str]


def get_current_app_user(authorization: Optional[str] = Header(None), session: SessionDep = None) -> AppUser:
    """Extract and validate user from token (Auth0 or local)"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token - no sub claim")
    
    if sub.startswith("auth0|") or sub.startswith("google-oauth2|") or "|" in sub:
        auth_sub = sub
        auth_provider = "auth0"
    else:
        auth_sub = f"local:{sub}"
        auth_provider = "local"
    
    user = session.exec(select(AppUser).where(AppUser.auth_sub == auth_sub)).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Call /api/users/sync first")
    
    return user


@router.post("/sync", response_model=UserResponse)
def sync_user(
    request: SyncUserRequest,
    authorization: Optional[str] = Header(None),
    session: SessionDep = None
):
    """Upsert user from Auth0 or local JWT token"""
    print(f"[SYNC] Received sync request: {request}")
    
    if not authorization or not authorization.startswith("Bearer "):
        print("[SYNC] No authorization header")
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    
    # For Auth0, trust the frontend-provided sub (token is encrypted JWE, can't decode)
    if request.sub and (request.sub.startswith("auth0|") or request.sub.startswith("google-oauth2|") or "|" in request.sub):
        print(f"[SYNC] Using Auth0 sub from request body: {request.sub}")
        auth_sub = request.sub
        auth_provider = "auth0"
        email = request.email
    else:
        # For local auth, decode the JWT token
        payload = decode_access_token(token)
        print(f"[SYNC] Decoded payload: {payload}")
        
        if not payload:
            print("[SYNC] Failed to decode token")
            raise HTTPException(status_code=401, detail="Invalid token")
        
        sub = payload.get("sub")
        if not sub:
            print("[SYNC] No sub claim in token")
            raise HTTPException(status_code=401, detail="Invalid token - no sub claim")
        
        auth_sub = f"local:{sub}"
        auth_provider = "local"
        email = None
    
    print(f"[SYNC] Looking for user with auth_sub={auth_sub}, provider={auth_provider}, email={email}")
    existing_user = session.exec(select(AppUser).where(AppUser.auth_sub == auth_sub)).first()
    
    if existing_user:
        print(f"[SYNC] Found existing user: {existing_user.id}")
        if email and existing_user.email != email:
            existing_user.email = email
            session.add(existing_user)
            session.commit()
            session.refresh(existing_user)
        
        return UserResponse(
            id=str(existing_user.id),
            email=existing_user.email,
            auth_provider=existing_user.auth_provider
        )
    
    print(f"[SYNC] Creating new user with auth_sub={auth_sub}")
    new_user = AppUser(
        auth_provider=auth_provider,
        auth_sub=auth_sub,
        email=email
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    print(f"[SYNC] Created new user: {new_user.id}")
    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        auth_provider=new_user.auth_provider
    )


@router.get("/me", response_model=UserResponse)
def get_me(
    authorization: Optional[str] = Header(None),
    session: SessionDep = None
):
    """Get current user profile"""
    user = get_current_app_user(authorization, session)
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        auth_provider=user.auth_provider
    )


@router.get("/preferences")
def get_preferences(
    authorization: Optional[str] = Header(None),
    session: SessionDep = None
):
    """Get user preferences"""
    user = get_current_app_user(authorization, session)
    
    preferences = session.exec(
        select(UserPreference, Question)
        .join(Question, UserPreference.question_id == Question.id)
        .where(UserPreference.user_id == user.id)
    ).all()
    
    return {
        "preferences": [
            {
                "question_id": pref.id,
                "question_text": question.text,
                "survey_key": question.survey_key,
                "priority": pref.priority
            }
            for pref, question in preferences
        ]
    }


@router.put("/preferences")
def save_preferences(
    request: SavePreferencesRequest,
    authorization: Optional[str] = Header(None),
    session: SessionDep = None
):
    """Save or update user preferences from survey answers"""
    user = get_current_app_user(authorization, session)
    
    existing_prefs = session.exec(
        select(UserPreference).where(UserPreference.user_id == user.id)
    ).all()
    
    for pref in existing_prefs:
        session.delete(pref)
    session.commit()
    
    for survey_key, priority in request.preferences.items():
        question = session.exec(
            select(Question).where(Question.survey_key == survey_key)
        ).first()
        
        if question:
            preference = UserPreference(
                user_id=user.id,
                question_id=question.id,
                priority=priority
            )
            session.add(preference)
    
    session.commit()
    
    return {"status": "ok", "saved": len(request.preferences)}
