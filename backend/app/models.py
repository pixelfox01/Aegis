from sqlmodel import Field, SQLModel, Relationship


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    is_admin: bool = True


class Question(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    text: str = Field(unique=True, index=True)

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
