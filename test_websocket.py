import asyncio
import websockets
import json
import os
import logging

logging.basicConfig(filename='test_websocket.log', level=logging.INFO)

async def test_chat():
    uri = "ws://127.0.0.1:8000/ws/connect"
    logging.info("Connecting to %s", uri)
    try:
        async with websockets.connect(uri) as websocket:
            logging.info("Connected")
            # The server should send a "waiting_message" event first
            response = await websocket.recv()
            logging.info("Received: %s", response)
            print(f"< {response}")

            # Now we send a message
            await websocket.send(json.dumps({
                "request_id": "conversation",
                "payload": {
                    "message": "Hello, who are you?"
                }
            }))
            logging.info("Sent hello message")
            print("> Sent hello message")

            # The server should respond with a series of messages
            # We'll listen for a few messages
            for i in range(3):
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    logging.info("Received message %d: %s", i, response)
                    print(f"< {response}")
                    data = json.loads(response)
                    assert "id" in data
                    assert "role" in data
                    assert "parts" in data
                except asyncio.TimeoutError:
                    logging.warning("Timeout waiting for message")
                    print("Timeout waiting for message")
                    break
    except Exception as e:
        logging.error("An error occurred: %s", e, exc_info=True)

if __name__ == "__main__":
    asyncio.run(test_chat())
