from typing import Any, Optional, Type, Dict, Tuple

# OpenAI specific classes
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider

# Google specific classes
from pydantic_ai.models.google import GoogleModel, GoogleModelSettings
from pydantic_ai.providers.google import GoogleProvider

# Anthropic specific classes
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.providers.anthropic import AnthropicProvider


class LLMProvider:
    """
    A robust provider class for creating and managing LLM model instances.
    """
    # The tuple contains (ModelClass, ProviderClass).
    MODEL_MAP: Dict[str, Tuple[Type[Any], Type[Any], Type[Any]]] = {
        "GOOGLE": (GoogleModel, GoogleProvider),
        "OPENAI": (OpenAIModel, OpenAIProvider),
        "ANTHROPIC": (AnthropicModel, AnthropicProvider),
    }

    def generate(self, system: str, messages: list[dict[str, Any]], tools: list[dict], **kwargs) -> Any:
        raise NotImplementedError

    def get_model(self, provider: str, model: str, creds: dict[str, Any] = None):
        """
        gets and initializes a specific LLM model instance.

        Args:
            provider (str): The name of the provider (e.g., "OPENAI", "GOOGLE").
            model (str): The specific model name (e.g., "gpt-4-turbo", "gemini-2.5-pro").
            creds (dict[str, Any], optional): A dictionary containing credentials, 
                                              expected to have an "api_key". Defaults to None.

        Returns:
            An instance of the requested model on success, otherwise None.
        """
        if creds is None:
            creds = {}
            
        provider_upper = provider.upper()

        if provider_upper not in self.MODEL_MAP:
            print(f"Unsupported provider: '{provider}'. Supported providers are: {list(self.MODEL_MAP.keys())}")
            return None

        try:
            ModelClass, ProviderClass = self.MODEL_MAP[provider_upper]
            
            api_key = creds.get("api_key")

            provider_instance = ProviderClass(api_key=api_key)
            model_instance = ModelClass(model_name=model, provider=provider_instance, )
            
            print(f"Successfully created model '{model}' for provider '{provider_upper}'.")
            return model_instance

        except (ValueError, ImportError, Exception) as e:
            print(f"Failed to create model for provider '{provider_upper}': {e}")
            return None

