from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import select
from app.db import SessionDep
from app.models import Question

router = APIRouter(prefix="/api/questions", tags=["questions"])


class QuestionResponse(BaseModel):
    id: int
    text: str
    survey_key: str


@router.get("/survey", response_model=list[QuestionResponse])
def get_survey_questions(session: SessionDep):
    """Get all questions that have a survey_key (used in onboarding survey)"""
    questions = session.exec(
        select(Question)
        .where(Question.survey_key.isnot(None))
        .order_by(Question.id)
    ).all()
    
    return [
        QuestionResponse(
            id=q.id,
            text=q.text,
            survey_key=q.survey_key
        )
        for q in questions
    ]
