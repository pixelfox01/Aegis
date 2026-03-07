from sqlmodel import Field, SQLModel


class Tolerances(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
