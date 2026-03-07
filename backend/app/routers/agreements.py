from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.db import SessionDep
from sqlmodel import select
from app.models import Question, Agreement, Summary

router = APIRouter(prefix="/agreements", tags=["agreements"])


def generate_summaries(agreement_text: str, questions: list[str]):
    answers = []
    for i, question in enumerate(questions):
        answers.append(f"Answer {i}")
    return answers


class SummarizeRequest(BaseModel):
    company_name: str
    agreement_type: str | None = None
    agreement_text: str = Field(..., min_length=1, max_length=500000)


@router.post("/summarize")
def summarize(request: SummarizeRequest, session: SessionDep):
    try:
        questions = session.exec(select(Question).order_by(Question.id)).all()

        if not questions:
            raise HTTPException(
                status_code=400, detail="No questions found in database"
            )

        question_texts = [q.text for q in questions]

        answers = generate_summaries(request.agreement_text, question_texts)

        agreement = Agreement(text=request.agreement_text)
        session.add(agreement)
        session.commit()
        session.refresh(agreement)

        # Create summary records linking each question with its answer
        for question, answer in zip(questions, answers):
            summary = Summary(
                question_id=question.id, agreement_id=agreement.id, summary_text=answer
            )
            session.add(summary)

        session.commit()

        return {"status": "ok"}

    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to process policy: {str(e)}"
        )
