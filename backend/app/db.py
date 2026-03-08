from typing import Annotated
from sqlmodel import Session, SQLModel, create_engine, select
from fastapi import Depends

from app.settings import get_settings

settings = get_settings()

engine = create_engine(settings.database_url)

INITIAL_QUESTIONS = [
    'What personal data is collected?',
    'How is user data shared with third parties?',
    'Can users delete their data?',
    'How long is data retained?',
    'Is data encrypted?',
    "What are users' rights under GDPR?",
    'How can users opt out of data collection?',
    'Are cookies used?',
]


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    seed_initial_questions()


def seed_initial_questions():
    """Seed the database with initial questions if they don't exist (idempotent)"""
    from app.models import Question
    
    with Session(engine) as session:
        for question_text in INITIAL_QUESTIONS:
            existing = session.exec(
                select(Question).where(Question.text == question_text)
            ).first()
            
            if not existing:
                question = Question(text=question_text)
                session.add(question)
        
        session.commit()


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
