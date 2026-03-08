from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
import uuid


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    is_admin: bool = True


class AppUser(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    auth_provider: str
    auth_sub: str = Field(index=True, unique=True)
    email: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    preferences: list["UserPreference"] = Relationship(back_populates="user")


class UserPreference(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="appuser.id")
    question_id: int = Field(foreign_key="question.id")
    priority: str

    user: AppUser = Relationship(back_populates="preferences")
    question: Question = Relationship()


class Question(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    text: str = Field(unique=True, index=True)
    survey_key: str | None = Field(default=None, index=True)

    summaries: list["Summary"] = Relationship(back_populates="question")


class Agreement(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    company_name: str
    agreement_type: str
    agreement_filename: str = Field(index=True)

    summaries: list["Summary"] = Relationship(back_populates="agreement")


class Summary(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    question_id: int = Field(foreign_key="question.id")
    agreement_id: int = Field(foreign_key="agreement.id")

    summary_text: str
    concern_level: str
    quote: str | None = None

    question: Question = Relationship(back_populates="summaries")
    agreement: Agreement = Relationship(back_populates="summaries")
