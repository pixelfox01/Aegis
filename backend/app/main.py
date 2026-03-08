import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routers.agreements import router as agreement_router
from app.routers.summary import router as summary_router
from app.routers.auth import router as auth_router
from app.db import create_db_and_tables
from app.settings import get_settings

load_dotenv()

settings = get_settings()

app = FastAPI(docs_url=None, redoc_url=None)

origins = [origin.strip() for origin in settings.cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agreement_router)
app.include_router(summary_router)
app.include_router(auth_router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/api")
def api_healthcheck():
    return {"message": "We are so back!"}


static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists() and static_dir.is_dir():
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")
    
    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = static_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(static_dir / "index.html")
else:
    @app.get("/")
    def root_healthcheck():
        return {"message": "Backend API running. Static files not found - backend-only mode."}
