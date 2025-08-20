import asyncio
import json
import os
from typing import Any, Dict, List, Optional
import uuid
from click import prompt
from openai import chat

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
                "you can also help user with your general knownledge you dont have to always use tools"
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
    async def send_delayed_message(self,message,delay):
        await asyncio.sleep(delay)
        await self.websocket.send_json(message)
        
    async def process_query(self, message: str, session,send_request=None) -> str:
        websocket = self.websocket
        chat_id = message.get("chatId")
        query = message.get("content")[0]["text"]
        assistant_message_id = str(uuid.uuid4())
        log_message = {
            "messageId":assistant_message_id,
            "chatId":chat_id,
            "type":'log',
            "payload":{},
            "status":""
        } 
        self.messages.append({"role": "user", "content": query})
        streaming = True
        current_stream = ""
        await websocket.send_json({
                "type": "start",
                "messageId": assistant_message_id,
            })
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

            if websocket:
                print('sending log')
                log_message["status"] = f"Found {len(relevant_tools)} Relevant Tools."
                await websocket.send_json(log_message)
            response_index = -1
            while not is_response_ready:
                if not streaming:
                    await websocket.send_json({
                            "type": "start",
                            "messageId": assistant_message_id,
                        })
                log_message["status"] = "Generating Response ..."
                asyncio.create_task(self.send_delayed_message(log_message,2))
                print(self.messages)
                try:
                    stream = self.llm.generate(
                            system=self.instruction,
                            messages=self.messages,
                            tools=available_tools,
                            model="gemini-2.5-flash",
                            temperature=0,
                            )

                    llm_full_response = []
                    content_part_start_message = {
                      "type": "content_part_start",
                      "chatId": chat_id,
                      "messageId": assistant_message_id,
                      "partIndex": response_index,
                      "part": { "text": "" } 
                    }

                    async for chunk in stream:
                        print(chunk.choices[0].delta)
                        if chunk and chunk.choices[0].delta.content:
                            content = chunk.choices[0].delta.content

                            if current_stream != "text":
                                response_index += 1
                                current_stream = 'text'
                                llm_full_response.append({"text":content})
                                content_part_start_message["part"] = { "text": "" }
                                content_part_start_message["partIndex"] = response_index
                                await websocket.send_json(content_part_start_message)
                                
                            else:
                                llm_full_response[-1]["text"] += content

                            chunk_message = {
                                "messageId": assistant_message_id,
                                "type": "text_chunk",
                                "partIndex": response_index,
                                "text": content,
                                "status": "Generating resonse ..."
                                }
                            await websocket.send_json(chunk_message)

                        elif chunk and chunk.choices[0].delta.tool_calls:
                            current_stream = 'tool'
                            for tool in chunk.choices[0].delta.tool_calls:
                                response_index += 1
                                tool_name = tool.function.name
                                tool_args = tool.function.arguments
                                tool_id = tool.id
                                tool_state = "input-streaming"
                                tool_output = ""
                                tool_obj = {"id":tool_id,"name":tool_name,"input":tool_args,"output":tool_output,"state":tool_state}
                                content_part_start_message["part"] = { "tool": tool_obj }
                                content_part_start_message["partIndex"] = response_index
                                await websocket.send_json(content_part_start_message)
                                llm_full_response.append({"tool":tool_obj})
                        
                        print("-"*80)
                    print(len(llm_full_response))
                except Exception as e:
                    print(f"LLM generate error: {e}")
                    if self.websocket:
                        await self.websocket.send_json({"log": f"LLM error: {e}"})
                    raise

                restart_while_loop = False
                for response_index, content in enumerate(llm_full_response):
                    if "text" in list(content.keys()):
                        self.messages.append({"role": "assistant", "content": content["text"]})

                    elif "tool" in list(content.keys()):
                        print("LLM called tools")
                        tool = content["tool"]
                        tool_name = tool.get("name")
                        tool_args = tool.get("input")
                        tool_id = tool.get("id")
                        print(f"calling {tool_name} with args {tool_args}")
                        if self.websocket:
                            tool["state"] = "input-available"
                            content_part_start_message["part"] = { "tool": tool}
                            content_part_start_message["partIndex"] = response_index
                            await self.websocket.send_json(content_part_start_message)

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

                        print("tool result:",result)

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
                    continue
                streaming = False
                current_stream = ''

            is_response_ready = True
            await self.websocket.send_json({
                "type": "end",
                "messageId": assistant_message_id
            })
        

            return "\n".join(final_text)
        except Exception as e:
            print(f"process_query error: {e}")
            return ""

    async def chat_loop(self, session,message):
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


