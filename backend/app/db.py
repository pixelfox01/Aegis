from typing import Annotated
from sqlmodel import Session, SQLModel, create_engine, select
from fastapi import Depends

from app.settings import get_settings

settings = get_settings()

engine = create_engine(settings.database_url)

INITIAL_QUESTIONS = [
    {'text': 'What personal data is collected?', 'survey_key': 'data_collection'},
    {'text': 'How is user data shared with third parties?', 'survey_key': 'third_party_sharing'},
    {'text': 'Can users delete their data?', 'survey_key': 'account_deletion'},
    {'text': 'How long is data retained?', 'survey_key': 'data_retention'},
    {'text': 'Is data encrypted?', 'survey_key': None},
    {'text': "What are users' rights under GDPR?", 'survey_key': None},
    {'text': 'How can users opt out of data collection?', 'survey_key': None},
    {'text': 'Are cookies used?', 'survey_key': 'tracking_cookies'},
]


def migrate_add_survey_key():
    """Add survey_key column to Question table if it doesn't exist"""
    from sqlalchemy import text, inspect
    
    with Session(engine) as session:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('question')]
        
        if 'survey_key' not in columns:
            session.exec(text("ALTER TABLE question ADD COLUMN survey_key VARCHAR"))
            session.commit()


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    migrate_add_survey_key()
    seed_initial_questions()


def seed_initial_questions():
    """Seed the database with initial questions if they don't exist (idempotent)"""
    from app.models import Question
    
    with Session(engine) as session:
        for q_data in INITIAL_QUESTIONS:
            existing = session.exec(
                select(Question).where(Question.text == q_data['text'])
            ).first()
            
            if existing:
                if existing.survey_key != q_data['survey_key']:
                    existing.survey_key = q_data['survey_key']
                    session.add(existing)
            else:
                question = Question(text=q_data['text'], survey_key=q_data['survey_key'])
                session.add(question)
        
        session.commit()


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
