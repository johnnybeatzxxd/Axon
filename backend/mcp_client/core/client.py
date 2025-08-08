import os
from contextlib import AsyncExitStack
from typing import Any, Optional 
from fastapi import WebSocket
from fastapi import WebSocketDisconnect 


from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from fastmcp import Client

from dotenv import load_dotenv

from ..llm.openai_provider import OpenAIProvider


class MCPClient:
    def __init__(self):
        load_dotenv()
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()

        # Providers
        self.llm = OpenAIProvider(
            api_key=os.getenv("GOOGLE_API_KEY"),
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        )

        # Websocket state is handled by orchestrator; client only maintains session
        self.websocket: Optional[WebSocket] = None
        self.manager = None

    async def sampling_handler(self, messages, params, context) -> str:  # pragma: no cover - interface hook
        return "ok!"

    async def progress_handler(self, progress: float, total: float | None, message: str | None):
        print(f"Progress: {progress}/{total} - {message}")

    async def connect_to_server(self, server_script_path: Optional[str] = None, server_url: Optional[str] = None, config: Optional[dict[str, Any]] = None):
        """Connect to an MCP server.

        Args:
            server_script_path: Path to the server script (.py or .js)
            server_url: HTTP server URL for Streamable transport
            config: fastmcp Client config dict
        """
        if server_script_path:
            is_python = server_script_path.endswith(".py")
            is_js = server_script_path.endswith(".js")
            if not (is_python or is_js):
                raise ValueError("Server script must be a .py or .js file")

            command = "python" if is_python else "node"
            server_params = StdioServerParameters(command=command, args=[server_script_path], env=None)

            stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
            self.stdio, self.write = stdio_transport
            self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.write))

            await self.session.initialize()
            response = await self.session.list_tools()
            tools = response.tools
            print("\nConnected to server with tools:", [tool.name for tool in tools])

        elif config:
            self.session = await self.exit_stack.enter_async_context(
                Client(
                    config,
                    progress_handler=self.progress_handler,
                    sampling_handler=self.sampling_handler,
                )
            )
            print("Connected!")

        elif server_url:
            print("Connecting via Streamable Http Transport...")
            client = Client(
                server_url,
                progress_handler=self.progress_handler,
                sampling_handler=self.sampling_handler,
            )
            try:
                self.session = await self.exit_stack.enter_async_context(client)
                print("Connected!")
            except Exception:
                print("client isnt there")


    async def cleanup(self):
        """Clean up resources."""
        await self.exit_stack.aclose()


