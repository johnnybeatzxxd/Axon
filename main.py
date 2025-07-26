import asyncio
import os
from typing import Optional
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from fastmcp.client.transports import StreamableHttpTransport
from fastmcp import Client
from fastmcp.client.sampling import (
    SamplingMessage,
    SamplingParams,
    RequestContext,
)

from anthropic import Anthropic
from openai import OpenAI, APIConnectionError
from dotenv import load_dotenv
from typing import List, Dict, Any
import json

from rag.set_vector_db import save_tools_to_vector_db
from rag.retrieve_tools import get_relevant_tools_for_chat

load_dotenv()

class MCPClient:
    def __init__(self):
        # Initialize session and client objects
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.anthropic = Anthropic()
        self.openai = OpenAI(
            api_key = os.getenv("GOOGLE_API_KEY"),
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
        self.messages = []
        self.instruction = "you are helpful!"

    def format_mcp_tools_for_db(self,tools: List[Any]) -> List[Dict[str, str]]:
        """
        Parses a list of mcp tool objects and formats them into a clean
        list of dicts 
        """
        formatted_data = []
        for tool in tools:
            name = tool.name
            description = tool.description or "No description provided for this tool."
            
            parameters_list = []
            input_schema = tool.inputSchema or {}
            properties = input_schema.get('properties', {})
            required_params = set(input_schema.get('required', [])) # Use a set for fast lookups

            for param_name, details in properties.items():
                param_type = details.get('type', 'any')
                is_required = "required" if param_name in required_params else "optional"
                
                param_str = f"{param_name} ({param_type}, {is_required})"
                
                # add default value to the string if it exists
                if 'default' in details:
                    default_val = details['default']
                    if isinstance(default_val, str) and default_val:
                        param_str += f", default='{default_val}'"
                    elif isinstance(default_val, str) and not default_val:
                         param_str += ", default=''" 
                    else:
                        param_str += f", default={default_val}"
                
                parameters_list.append(param_str)

            if parameters_list:
                params_section = "\nParameters: " + ", ".join(parameters_list)
            else:
                params_section = "\nParameters: None"

            document_string = (
                f"Tool: {name}\n"
                f"Description: {description}"
                f"{params_section}"
            )
            
            formatted_data.append({
                "name": name,
                "document": document_string
            })

        return formatted_data

    async def sampling_handler(self,
        messages: list[SamplingMessage],
        params: SamplingParams,
        context: RequestContext
    ) -> str:
        return "ok!"

    async def progress_handler(self,progress: float, total: float | None, message: str | None):
        print(f"Progress: {progress}/{total} - {message}")

    async def connect_to_server(self, server_script_path: str = None,server_url=None,config=None):
        """Connect to an MCP server
        
        Args:
            server_script_path: Path to the server script (.py or .js)
        """
        if server_script_path:
            is_python = server_script_path.endswith('.py')
            is_js = server_script_path.endswith('.js')
            if not (is_python or is_js):
                raise ValueError("Server script must be a .py or .js file")
                
            command = "python" if is_python else "node"
            server_params = StdioServerParameters(
                command=command,
                args=[server_script_path],
                env=None
            )
            
            stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
            self.stdio, self.write = stdio_transport
            self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.write))
            
            await self.session.initialize()
            
            # List available tools
            response = await self.session.list_tools()
            tools = response.tools
            print("\nConnected to server with tools:", [tool.name for tool in tools])

        elif config:
            self.session = await self.exit_stack.enter_async_context(Client(
                config,
                progress_handler=self.progress_handler,
                sampling_handler=self.sampling_handler,
                ))
            print("Connected!")

        elif server_url:
            print("Connecting via Streamable Http Transport...")
            transport = StreamableHttpTransport(url=server_url)
            self.session = await self.exit_stack.enter_async_context(Client(
                server_url,
                progress_handler=self.progress_handler,
                sampling_handler=self.sampling_handler,
                ))
            print("Connected!")
            

    def generate_response(self,ai_client,instruction,conversations,model_name,tools,temperature=1):
        system_message = {"role": "system", "content": self.instruction}
        conversations.insert(0, system_message)
        max_retries = 3
        retry_delay = 3 # seconds
        for attempt in range(max_retries):
            try:
                response = ai_client.chat.completions.create(
                    model=model_name,
                    temperature=temperature,
                    messages=conversations,
                    tools=tools,
                    tool_choice="auto"
                )
                return response # Success, return the response
            except APIConnectionError as e:
                print(f"Attempt {attempt + 1} failed with connection error: {e}")
                if attempt < max_retries - 1:
                    print(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                else:
                    print("Max retries reached. Raising the connection error.")
                    raise # Re-raise the exception after the last attempt
            except Exception as e:
                # Catch any other exceptions
                print(f"Error generating response: {e}")
                raise # Re-raise other exceptions immediately


    async def process_query(self, query: str, session) -> str:
        """Process a query using Claude and available tools"""
        self.messages.append(
            {
                "role": "user",
                "content": query
            }
        )

        mcp_tools_list = await session.list_tools()
        embedding_ready_tools = self.format_mcp_tools_for_db(mcp_tools_list)
        save_tools_to_vector_db(embedding_ready_tools)
        relevant_tools = get_relevant_tools_for_chat(self.messages,'tools',0.76)

        print("Tools Provided:",relevant_tools)

        available_tools = [{ 
            "type":"function",
            "function":{
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.inputSchema
                }
        } for tool in mcp_tools_list if tool.name in relevant_tools]
        
        final_text = []
        is_response_ready = False
        while not is_response_ready:
            response = self.generate_response(self.openai,self.instruction,self.messages,"gemini-2.5-flash",available_tools)
            # Process response and handle tool calls
            for content in response.choices:
                if content.finish_reason == 'stop':
                    final_text.append(content.message.content)
                    self.messages.append({"role":"assistant","content":content.message.content})
                    is_response_ready = True

                elif content.finish_reason == 'tool_calls':
                    tools = content.message.tool_calls
                    for tool in tools:
                        tool_name = tool.function.name
                        tool_args = tool.function.arguments
                        tool_id = tool.id
                    
                        # Execute tool call
                        tool_args = json.loads(tool_args)
                        result = await self.session.call_tool(tool_name, tool_args)
                        final_text.append(f"[Calling tool {tool_name} with args {tool_args}]")

                        # Continue conversation with tool results
                        self.messages.append({
                             "role": "assistant",
                             "tool_calls": [
                                {
                                   "function": {
                                      "arguments": str(tool_args),
                                      "name": tool_name
                                   },
                                   "id": "",
                                   "type": "function"
                                }
                             ]
                          })
                        self.messages.append({
                            "tool_call_id": "",
                             "role": "tool",
                             "name": tool_name,
                             "content": str(result.content)
                        })


        return "\n".join(final_text)

    async def chat_loop(self):
        """Run an interactive chat loop"""
        print("\nMCP Client Started!")
        print("Type your queries or 'quit' to exit.")
        
        while True:
            try:
                query = input("\nQuery: ").strip()
                
                if query.lower() == 'quit':
                    break
                    
                response = await self.process_query(query,self.session)
                print("\n" + response)
                    
            except Exception as e:
                print(f"\nError: {str(e)}")
    
    async def cleanup(self):
        """Clean up resources"""
        await self.exit_stack.aclose()

async def main():
    if len(sys.argv) < 2:
        print("Usage: python client.py <path_to_server_script>")
        # sys.exit(1)
        
    client = MCPClient()
    try:
        with open('config.json') as file:
            config = json.load(file)
        # await client.connect_to_server(config=config)
        await client.connect_to_server(config=config)
        await client.chat_loop()
    finally:
        await client.cleanup()

if __name__ == "__main__":
    import sys
    asyncio.run(main())
