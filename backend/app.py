import json
import asyncio
from typing import List
import uuid
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from mcp_client.main import MCPClient
from mcp_client.core.chat_orchestrator import ChatOrchestrator

# Initialize FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.pending_requests: dict[str, asyncio.Future] = {}

    async def connect(self):
        """Accepts a new connection."""
        await self.websocket.accept()

    def disconnect(self):
        """Removes the pending requests and disconnect"""
        for request_id, future in self.pending_requests.items():
            print(f"request {request_id} cancelled!")
            future.cancel()

    async def _receiver_task(self):
        """Recives all WebSocket messages from the client"""
        try:
            while True:
                received_message = await self.websocket.receive_json()
                request_id = received_message.get("request_id")

                if request_id and self.pending_requests.get(request_id):
                    future = self.pending_requests.pop(request_id)
                    future.set_result(received_message)

                # if any other messages came up they should be handled here
        except WebSocketDisconnect:
            self.disconnect()
            print("Receiver: Client disconnected.")

        except Exception as e:
            print(f"An error occurred in the receiver: {e}")
            self.disconnect()

    async def send_request(self, event, payload, timeout=None,request_id=None):
        request_id = str(request_id or uuid.uuid4())

        future = asyncio.get_running_loop().create_future()
        self.pending_requests[request_id] = future

        request = {"request_id": request_id, "event": event, "payload": payload}

        try:
            await self.websocket.send_json(request)
            response = await asyncio.wait_for(future, timeout=timeout)
            return response

        except asyncio.TimeoutError:
            print("request timeout!")
            self.pending_requests.pop(request_id)
            return {"timeout": True}

        except asyncio.CancelledError:
            print("request cancelled due to disconnection")
            return {"cancelled": True}


async def chat(manager,websocket):
    client = MCPClient()
    orchestrator = ChatOrchestrator()
    try:
        await client.connect_to_server(server_url="http://127.0.0.1:8001/mcp/")
        await orchestrator.chat_loop(client.session, manager, websocket)
    except WebSocketDisconnect:
        manager.disconnect()
        print("A client has disconnected.")
    except Exception as e:
        print(f"An error occurred: {e}")
        await manager.disconnect()
    finally:
        await client.cleanup()


@app.get("/")
def read_root():
    return {"Status": "Server is running"}


@app.websocket("/ws/connect")
async def websocket_endpoint(websocket: WebSocket):
    manager = ConnectionManager(websocket)
    await manager.connect()

    receiver_task = asyncio.create_task(manager._receiver_task())
    main_task = asyncio.create_task(chat(manager,websocket))

    done, pending = await asyncio.wait(
        {receiver_task, main_task},
        return_when=asyncio.FIRST_COMPLETED,
    )

    # Clean up by cancelling any remaining tasks
    for task in pending:
        task.cancel()

    print("WebSocket connection closed.")


if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
