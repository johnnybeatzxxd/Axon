import asyncio
import json
import os
from typing import Any, Dict, List, Optional
import uuid
from click import prompt
import traceback
from openai import chat
from pydantic_ai import Agent, Tool, RunContext
from pydantic_ai.toolsets import FunctionToolset
from pydantic_ai.models.google import GoogleModelSettings

from .tooling import (
    format_mcp_tools_for_db,
    build_available_tools,
    pydantic_tool_from_function_schema,
)
from ..rag.set_vector_db import save_tools_to_vector_db
from ..rag.retrieve_tools import get_relevant_tools_for_chat, retrieve_semantic_tools
from ..tools import registry as tool_registry
from ..llm.base import LLMProvider
from .stream import event_stream_handler, assistant_message_id
from fastapi import WebSocket, websockets


class ChatOrchestrator:
    def __init__(
        self,
        instruction: Optional[str] = None,
        websocket: Optional[WebSocket] = None,
        manager: Any = None,
    ):
        self.instruction: str = instruction or (
            "you are helpful assistant! your job is to help user with everything using the tools you have provided. "
            "if the tools you provided doesnt allow you to accomplish the task or you need to search for more tools immediately "
            "call retrieve_tools function with tags it will give you the right tools to accomplish the task!"
            "you can also help user with your general knownledge you dont have to always use tools"
        )
        self.websocket = websocket
        self.manager = manager
        self.messages: List[Dict[str, Any]] = []

        self.llm_provider = LLMProvider()
        self.model = self.llm_provider.get_model("GOOGLE", "gemini-2.5-flash")
        if not self.model:
            raise "MODEL NOT FOUND!"
        self.model_settings = GoogleModelSettings(
            google_thinking_config={"include_thoughts": True}
        )

        self.agent = Agent(
            model=self.model,
            instructions=self.instruction,
            model_settings=self.model_settings,
        )
        self.response_index = -1

        self.assistant_message_id = str(uuid.uuid4())
        self.custom_tools: List[Dict[str, Any]] = [

            {
                "type": "function",
                "function": {
                    "name": "retrieve_tools",
                    "description": (
                        "Fetches additional tools that can be used to accomplish your task when the current set of available tools is insufficient. "
                        "Dont say i dont have functionality or capability!. Use this function to dynamically expand your capabilities by searching for new tools based on specific keywords."
                    ),
                    "parameters": {
                        "properties": {
                            "keywords": {
                                "title": "keywords",
                                "type": "string",
                                "description": "A list of atleast three keywords (eg. web_search, calculator, get_weather) name of the functions you need!",
                            }
                        },
                        "required": ["keywords"],
                        "type": "object",
                    },
                },
            }
        ]

    async def send_delayed_message(self, message, delay):
        await asyncio.sleep(delay)
        await self.websocket.send_json(message)


    async def process_query(self, message: str, session, send_request=None) -> str:
        websocket = self.websocket
        chat_id = message.get("chatId")
        query = message.get("content")[0]["text"]
        log_message = {
            "messageId": self.assistant_message_id,
            "chatId": chat_id,
            "type": "log",
            "payload": {},
            "status": "",
        }
        await websocket.send_json(
            {
                "type": "start",
                "messageId": self.assistant_message_id,
            }
        )
        try:
            try:
                mcp_tools_list = await session.list_tools()
            except Exception as e:
                print(f"list_tools error: {e}")
                mcp_tools_list = []

            print("QUERY:",query)
            embedding_ready_tools = format_mcp_tools_for_db(mcp_tools_list)
            save_tools_to_vector_db(embedding_ready_tools)
            relevant_tools = retrieve_semantic_tools(
                query, "tools", 0.754, top_k_fallback=3
            )

            print(f"Relevant tool names: {relevant_tools}")
            available_tools = build_available_tools(
                mcp_tools_list, relevant_tools, self.custom_tools
            )

            tools = [
                pydantic_tool_from_function_schema(session, func["function"])
                for func in available_tools
                if func.get("type") == "function"
            ]
            mcp_toolset = FunctionToolset(tools=tools)
            if websocket:
                print("sending log")
                log_message["status"] = f"Found {len(relevant_tools)} Relevant Tools."
                await websocket.send_json(log_message)

                print("CALLING LLM")
                log_message["status"] = "Generating Response ..."
                await asyncio.create_task(self.send_delayed_message(log_message, 2))
                print(self.messages)
                stream_state = {"assistant_message_id":None}
                try:
                    async with self.agent.run_stream(
                        query,
                        message_history=self.messages,
                        event_stream_handler=lambda ctx, event_stream: event_stream_handler(
                            ctx, event_stream, websocket, chat_id, stream_state
                        ),
                        toolsets=[mcp_toolset]) as stream:

                            async for chunk in stream.stream_text(delta=True):
                                chunk_message = {
                                    "messageId":stream_state["assistant_message_id"],
                                    "type": "text_chunk",
                                    "partIndex": stream_state["part_index"],
                                    "text": chunk,
                                    "status": "Generating resonse ...",
                                }
                                await websocket.send_json(chunk_message)
                                print(chunk,end='',flush=True)

                            streaming = False
                            await self.websocket.send_json(
                                {"type": "end", "messageId": self.assistant_message_id}
                            )

                except Exception as e:
                    print(f"LLM generate error: {e}")
                    traceback.print_exc()
                    if self.websocket:
                        await self.websocket.send_json({"log": f"LLM error: {e}"})
                    raise
        except Exception as e:

            traceback.print_exc()
            print(f"process_query error: {e}")
            return ""

    async def chat_loop(self, session, message):
        print("\nMCP Client Started!")
        print("Type your queries or 'quit' to exit.")

        manager = self.manager
        websocket = self.websocket
        try:
            if websocket and manager:
                response = await self.process_query(message, session)
                print("\n" + (response or ""))
                await websocket.send_json({"response": response})
            else:
                print("Doing nothing. Please pass connection manager and websocket")
        except Exception as e:
            print(f"chat_loop error: {e}")
            return


if __name__ == "__main__":
    chat = ChatOrchestrator()
    asyncio.run(chat.chat_loop())
