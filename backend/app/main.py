from dotenv import load_dotenv
from fastapi import FastAPI

from app.db import create_db_and_tables

load_dotenv()

app = FastAPI()


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
def healthcheck():
    return {"message": "We are so back!"}
