from dotenv import load_dotenv
from fastapi import FastAPI
from app.routers.agreements import router as agreement_router
from app.routers.summary import router as summary_router

from app.db import create_db_and_tables

load_dotenv()

app = FastAPI()
app.include_router(agreement_router)
app.include_router(summary_router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
def healthcheck():
    return {"message": "We are so back!"}
