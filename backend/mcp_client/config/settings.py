import json
from pathlib import Path
from typing import Any

from pydantic import BaseSettings


class Settings(BaseSettings):
    google_api_key: str | None = None
    anthropic_api_key: str | None = None
    gemini_api_key: str | None = None
    chroma_path: str = "./chroma_db"
    tool_distance_threshold: float = 0.754
    model_name: str = "gemini-2.5-flash"

    class Config:
        env_file = ".env"
        extra = "ignore"


def load_mcp_servers(config_path: str | None = None) -> dict[str, Any]:
    path = Path(config_path or Path(__file__).with_name("mcp_servers.json"))
    return json.loads(path.read_text())



