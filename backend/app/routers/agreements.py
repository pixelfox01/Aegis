from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import SessionDep
from sqlmodel import select
from app.models import Question, Agreement, Summary
from app.llm_provider import get_llm_provider
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

router = APIRouter(prefix="/api/agreements", tags=["agreements"])


class SummarizeRequest(BaseModel):
    company_name: str
    agreement_type: str | None = None
    agreement_filename: str


@router.post("/summarize")
def summarize(request: SummarizeRequest, session: SessionDep):
    try:
        file_path = DATA_DIR / request.agreement_filename
        if not file_path.exists():
            raise HTTPException(
                status_code=404, detail=f"File not found: {request.agreement_filename}"
            )

        agreement_text = file_path.read_text(encoding="utf-8")

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
            agreement_filename=request.agreement_filename,
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
