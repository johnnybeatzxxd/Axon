from logging import StringTemplateStyle
import time
import asyncio
from typing import Any

from openai import AsyncOpenAI, APIConnectionError

from .base import LLMProvider


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, base_url: str | None = None):
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    async def generate(
        self,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict],
        model: str = "gemini-2.5-flash",
        temperature: float = 1,
    ):
        conversations = [{"role": "system", "content": system}] + list(messages)
        try:
            stream = await self.client.chat.completions.create(
                model=model,
                temperature=temperature,
                messages=conversations,
                tools=tools,
                tool_choice="auto",
                reasoning_effort="low",
                stream=True,
                extra_body={
                  'extra_body': {
                    "google": {
                      "thinking_config": {
                        "thinking_budget": 2000,
                        "include_thoughts": True
                      }
                    }
                  }
                }
            )
            async for chunk in stream:
                print(chunk.choices[0].delta.content)
                yield chunk

        except APIConnectionError as e:
            # Surface exception details to caller for logging
            print('llm api failed:',e)
            last_error = e
            await asyncio.sleep(3)


if "__main__" == __name__:
    OpenAIProvider()
