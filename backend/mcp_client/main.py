import asyncio
import json
from .core.client import MCPClient  # re-export to keep import paths stable

__all__ = ["MCPClient"]


async def _cli_main():
    client = MCPClient()
    try:
        try:
            with open("config.json") as file:
                config = json.load(file)
        except Exception:
            config = None
        await client.connect_to_server(config=config)
        await client.chat_loop(manager=None, websocket=None)
    finally:
        await client.cleanup()


if __name__ == "__main__":
    asyncio.run(_cli_main())
