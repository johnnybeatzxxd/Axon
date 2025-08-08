from typing import Any


class LLMProvider:
    def generate(self, system: str, messages: list[dict[str, Any]], tools: list[dict], **kwargs) -> Any:
        raise NotImplementedError



