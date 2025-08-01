import json
from typing import List
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from mcp_client.main import MCPClient

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
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accepts a new connection and adds it to the list."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"New connection. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Removes a connection from the list."""
        self.active_connections.remove(websocket)
        print(f"Client disconnected. Total clients: {len(self.active_connections)}")

manager =  ConnectionManager()

@app.websocket('/ws/connect')
async def websocket_endpoint(websocket:WebSocket):
    await manager.connect(websocket)
    client = MCPClient() 
    try:
        await client.connect_to_server(server_url="http://127.0.0.1:8001/mcp/")
        await client.chat_loop(websocket) 

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("A client has disconnected.")
    except Exception as e:
        print(f"An error occurred: {e}")
        manager.disconnect(websocket)

    finally:
        await client.cleanup() 

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
