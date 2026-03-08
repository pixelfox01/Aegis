from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    
    backboard_api_key: str | None = None
    
    auth_mode: str = "local"
    
    jwt_secret_key: str | None = None
    admin_username: str = "admin"
    admin_password_hash: str | None = None
    
    llm_provider: str = "gemini"
    gemini_api_key: str | None = None
    
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama2"
    
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
