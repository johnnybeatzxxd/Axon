import asyncio
import json
import os
from typing import Any, Dict, List, Optional

from .tooling import format_mcp_tools_for_db, build_available_tools
from ..rag.set_vector_db import save_tools_to_vector_db
from ..rag.retrieve_tools import get_relevant_tools_for_chat
from ..tools import registry as tool_registry
from ..llm.openai_provider import OpenAIProvider

from fastapi import WebSocket


class ChatOrchestrator:
    def __init__(self, instruction: Optional[str] = None, websocket: Optional[WebSocket] = None, manager: Any = None):
        self.instruction: str = (
            instruction
            or (
                "you are helpful assistant! your job is to help user with everything using the tools you have provided. "
                "if the tools you provided doesnt allow you to accomplish the task or you need to search for more tools immediately "
                "call retrieve_tools function with tags it will give you the right tools to accomplish the task!"
            )
        )
        self.websocket = websocket
        self.manager = manager
        self.messages: List[Dict[str, Any]] = []
        self.llm = OpenAIProvider(
            api_key=os.getenv("GOOGLE_API_KEY"),
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        )

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

    async def process_query(self, query: str, session) -> str:
        self.messages.append({"role": "user", "content": query})
        try:
            try:
                mcp_tools_list = await session.list_tools()
            except Exception as e:
                print(f"list_tools error: {e}")
                mcp_tools_list = []

            embedding_ready_tools = format_mcp_tools_for_db(mcp_tools_list)
            save_tools_to_vector_db(embedding_ready_tools)
            relevant_tools = get_relevant_tools_for_chat(self.messages, "tools", 0.754, top_k_fallback=3)

            print(f"Relevant tool names: {relevant_tools}")
            available_tools = build_available_tools(mcp_tools_list, relevant_tools, self.custom_tools)
            final_text: List[str] = []
            is_response_ready = False

            if self.websocket:
                await self.websocket.send_json({"log": f"{len(available_tools)} tool are passed!"})

            while not is_response_ready:
                print("Calling LLM...")
                try:
                    response = self.llm.generate(
                            system=self.instruction,
                            messages=self.messages,
                            tools=available_tools,
                            model="gemini-2.5-flash",
                            temperature=1,
                        )
                except Exception as e:
                    print(f"LLM generate error: {e}")
                    if self.websocket:
                        await self.websocket.send_json({"log": f"LLM error: {e}"})
                    raise

                restart_while_loop = False
                for content in response.choices:
                    if content.finish_reason == "stop":
                        final_text.append(content.message.content or "")
                        self.messages.append({"role": "assistant", "content": content.message.content})
                        is_response_ready = True

                    elif content.finish_reason == "tool_calls":
                        print("LLM called tools")
                        tools_called = content.message.tool_calls
                        for tool in tools_called:
                            tool_name = tool.function.name
                            tool_args = tool.function.arguments
                            tool_id = tool.id
                            print(f"calling {tool_name} with args {tool_args}")
                            if self.websocket:
                                await self.websocket.send_json({"log": f"Calling tool {tool_name} with {tool_args} args"})

                            if tool_registry.has(tool_name):
                                parsed_args = {}
                                try:
                                    parsed_args = json.loads(tool_args) if tool_args else {}
                                except Exception:
                                    parsed_args = {}
                                parsed_args["conversations"] = self.messages
                                custom_result = tool_registry.call(tool_name, **parsed_args)

                                if tool_name in ["retrieve_tools"]:
                                    if custom_result:
                                        available_tools = build_available_tools(
                                            mcp_tools_list, custom_result, self.custom_tools
                                        )
                                        restart_while_loop = True
                                        break
                                    else:
                                        result = "Tool Not Found!"
                                result = custom_result

                            else:
                                try:
                                    parsed_args = json.loads(tool_args) if tool_args else {}
                                except Exception:
                                    parsed_args = {}
                                result = await session.call_tool(tool_name, parsed_args)
                                result = result.content

                            final_text.append(f"[Calling tool {tool_name} with args {parsed_args}]")

                            self.messages.append(
                                {
                                    "role": "assistant",
                                    "tool_calls": [
                                        {
                                            "function": {
                                                "arguments": str(parsed_args),
                                                "name": tool_name,
                                            },
                                            "id": tool_id,
                                            "type": "function",
                                        }
                                    ],
                                }
                            )
                            self.messages.append(
                                {
                                    "tool_call_id": tool_id,
                                    "role": "tool",
                                    "name": tool_name,
                                    "content": str(result),
                                }
                            )

                        if restart_while_loop:
                            break

                if restart_while_loop:
                    continue

            return "\n".join(final_text)
        except Exception as e:
            print(f"process_query error: {e}")
            return ""

    async def chat_loop(self, session, manager, websocket: Optional[WebSocket]):
        print("\nMCP Client Started!")
        print("Type your queries or 'quit' to exit.")

        self.manager = manager
        self.websocket = websocket
        while True:
            try:
                if self.websocket and self.manager:
                    message = await self.manager.send_request(
                        event="waiting_message",
                        payload={"message": "Waiting for a message"},
                        request_id="conversation",
                    )
                    query = message["payload"]["message"]
                else:
                    query = input("User: ")

                if query.lower() == "quit":
                    break

                response = await self.process_query(query, session)
                print("\n" + (response or ""))
                if self.websocket:
                    await self.websocket.send_json({"response": response})

            except Exception as e:
                print(f"chat_loop error: {e}")
                return


