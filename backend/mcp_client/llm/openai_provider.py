import time
from typing import Any

from openai import OpenAI, APIConnectionError

from .base import LLMProvider


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, base_url: str | None = None):
        self.client = OpenAI(api_key=api_key, base_url=base_url)

    def generate(
        self,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict],
        model: str = "gemini-2.5-flash",
        temperature: float = 1,
    ):
        conversations = [{"role": "system", "content": system}] + list(messages)
        for attempt in range(3):
            try:
                return self.client.chat.completions.create(
                    model=model,
                    temperature=temperature,
                    messages=conversations,
                    tools=tools,
                    tool_choice="auto",
                )
            except APIConnectionError as e:
                # Surface exception details to caller for logging
                last_error = e
                if attempt == 2:
                    raise
                time.sleep(3)


