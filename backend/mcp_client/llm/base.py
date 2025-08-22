from typing import Any
from pydantic_ai.models.fallback import FallbackModel
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.providers.anthropic import AnthropicProvider

class LLMProvider:
    def generate(self, system: str, messages: list[dict[str, Any]], tools: list[dict], **kwargs) -> Any:
        raise NotImplementedError

    def get_model(self, provider: str, model: str, creds: dict[str, Any]):
        models = {
                "GOOGLE":GoogleModel(model,provider=GoogleProvider(api_key=creds.get("api_key"))),
                "OPENAI":OpenAIModel(model,provider=OpenAIProvider(api_key=creds.get("api_key"))),
                "ANTHROPIC":AnthropicModel(model,provider=AnthropicProvider(api_key=creds.get("api_key")))
                }
        return models.get(provider)

