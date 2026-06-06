from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    jwt_secret: str
    openai_api_key: str = ""

    llm_provider: str = "openai"

    groq_api_key: str = ""
    deepseek_api_key: str = ""
    openrouter_api_key: str = ""
    anthropic_api_key: str = ""

    openai_model: str = "gpt-4o"
    groq_model: str = "llama-3.3-70b-versatile"
    deepseek_model: str = "deepseek-chat"
    openrouter_model: str = "google/gemma-4-26b-a4b-it:free"
    anthropic_model: str = "claude-3-haiku-20240307"

    google_client_id: str | None = None
    google_client_secret: str | None = None
    embedding_provider: str = "api"

    resend_api_key: str = ""
    smtp_from_email: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
