from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from sqlmodel import select
from app.db import SessionDep
from app.models import LinkedAccount, Agreement
from app.routers.users import get_current_app_user
from typing import Optional

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


class CreateLinkedAccountRequest(BaseModel):
    agreement_id: int


class LinkedAccountResponse(BaseModel):
    id: int
    agreement_id: int
    company_name: str
    agreement_type: str
    created_at: str


@router.get("", response_model=list[LinkedAccountResponse])
def get_linked_accounts(
    authorization: Optional[str] = Header(None),
    session: SessionDep = None
):
    """Get all linked accounts for the authenticated user"""
    user = get_current_app_user(authorization, session)
    
    linked_accounts = session.exec(
        select(LinkedAccount, Agreement)
        .join(Agreement, LinkedAccount.agreement_id == Agreement.id)
        .where(LinkedAccount.user_id == user.id)
        .order_by(LinkedAccount.created_at.desc())
    ).all()
    
    return [
        LinkedAccountResponse(
            id=account.id,
            agreement_id=account.agreement_id,
            company_name=agreement.company_name,
            agreement_type=agreement.agreement_type,
            created_at=account.created_at.isoformat()
        )
        for account, agreement in linked_accounts
    ]


@router.post("", response_model=LinkedAccountResponse)
def create_linked_account(
    request: CreateLinkedAccountRequest,
    authorization: Optional[str] = Header(None),
    session: SessionDep = None
):
    """Link a new account/service to the authenticated user"""
    user = get_current_app_user(authorization, session)
    
    agreement = session.get(Agreement, request.agreement_id)
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
    
    existing = session.exec(
        select(LinkedAccount)
        .where(LinkedAccount.user_id == user.id)
        .where(LinkedAccount.agreement_id == request.agreement_id)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="This account is already linked"
        )
    
    linked_account = LinkedAccount(
        user_id=user.id,
        agreement_id=request.agreement_id
    )
    
    session.add(linked_account)
    session.commit()
    session.refresh(linked_account)
    
    return LinkedAccountResponse(
        id=linked_account.id,
        agreement_id=linked_account.agreement_id,
        company_name=agreement.company_name,
        agreement_type=agreement.agreement_type,
        created_at=linked_account.created_at.isoformat()
    )
