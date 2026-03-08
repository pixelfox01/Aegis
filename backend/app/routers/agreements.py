from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import SessionDep
from sqlmodel import select
from app.models import Question, Agreement, Summary
from app.llm_provider import get_llm_provider
from pathlib import Path
import hashlib
import re

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

router = APIRouter(prefix="/api/agreements", tags=["agreements"])


class SummarizeRequest(BaseModel):
    company_name: str
    agreement_type: str
    agreement_text: str


def sanitize_filename(text: str) -> str:
    """Convert text to a safe filename"""
    return re.sub(r'[^\w\-]', '_', text.lower())


def create_agreement_filename(company_name: str, agreement_type: str, text_hash: str) -> str:
    """Generate a unique filename for the agreement"""
    safe_company = sanitize_filename(company_name)
    safe_type = sanitize_filename(agreement_type)
    return f"{safe_company}_{safe_type}_{text_hash[:8]}.txt"


@router.post("/summarize")
def summarize(request: SummarizeRequest, session: SessionDep):
    try:
        agreement_text = request.agreement_text
        
        if not agreement_text or not agreement_text.strip():
            raise HTTPException(
                status_code=400, detail="agreement_text cannot be empty"
            )
        
        text_hash = hashlib.sha256(agreement_text.encode('utf-8')).hexdigest()
        agreement_filename = create_agreement_filename(
            request.company_name, 
            request.agreement_type, 
            text_hash
        )
        
        file_path = DATA_DIR / agreement_filename
        file_path.write_text(agreement_text, encoding="utf-8")

        questions = session.exec(select(Question).order_by(Question.id)).all()

        if not questions:
            raise HTTPException(
                status_code=400, detail="No questions found in database"
            )

        question_texts = [q.text for q in questions]

        llm_provider = get_llm_provider()

        answers = llm_provider.generate_summaries(agreement_text, question_texts)

        agreement = Agreement(
            company_name=request.company_name,
            agreement_type=request.agreement_type,
            agreement_filename=agreement_filename,
        )
        session.add(agreement)
        session.commit()
        session.refresh(agreement)

        for question, answer in zip(questions, answers):
            summary = Summary(
                question_id=question.id,
                agreement_id=agreement.id,
                summary_text=answer["answer"],
                concern_level=answer["concern_level"],
                quote=answer.get("quote"),
            )
            session.add(summary)

        session.commit()

        return {"status": "ok"}

    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to process policy: {str(e)}"
        )
