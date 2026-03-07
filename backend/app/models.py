from sqlmodel import Field, SQLModel, Relationship


class Question(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    text: str = Field(unique=True, index=True)

    summaries: list["Summary"] = Relationship(back_populates="question")


class Agreement(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    text: str = Field(unique=True, index=True)

    summaries: list["Summary"] = Relationship(back_populates="agreement")


class Summary(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    question_id: int = Field(foreign_key="question.id")
    agreement_id: int = Field(foreign_key="agreement.id")

    summary_text: str

    question: Question = Relationship(back_populates="summaries")
    agreement: Agreement = Relationship(back_populates="summaries")
