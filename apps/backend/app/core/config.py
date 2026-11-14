from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parents[1]


class Settings(BaseSettings):
    """Runtime configuration. Values come from environment variables or .env files.

    Lookup order: repository root `.env`, then `apps/backend/.env` (later files win).
    """

    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    port: int = 8000
    frontend_url: str = "http://localhost:5173"
    debug_mode: bool = False
    data_dir: Path = Path("data/processed")

    @property
    def resolved_data_dir(self) -> Path:
        return self.data_dir if self.data_dir.is_absolute() else REPO_ROOT / self.data_dir


@lru_cache
def get_settings() -> Settings:
    return Settings()
