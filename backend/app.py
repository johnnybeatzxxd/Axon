import json
import asyncio
import time
from typing import List
import uuid
import random
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


async def stream_part(part_index: int, text_content: str, content_type: str = "text"):
    """
    A helper generator that streams text to a specific content part.
    Can be used for both 'text' and 'reasoning' types.
    """
    time.sleep(3)
    yield {
        "type": "content_part_start",
        "payload": {
            "partIndex": part_index,
            "part": {content_type: ""},
            "status": "Thinking ..."
        },
    }
    
    # Stream text in random chunks for a more realistic effect
    current_pos = 0
    while current_pos < len(text_content):
        chunk_size = random.randint(3, 15)
        chunk = text_content[current_pos : current_pos + chunk_size]
        current_pos += chunk_size
        yield {
            "type": "text_chunk",
            "payload": {"partIndex": part_index, "text": chunk,"status": "Generating response ..."}
        }
        await asyncio.sleep(random.uniform(0.01, 0.02))


# --- The Main, Comprehensive Stream Function ---
async def get_comprehensive_ai_stream(prompt: str):
    """
    This stream provides a large, comprehensive response with rich Markdown formatting,
    simulating an AI teaching a technical topic.
    """
    part_index = 0

    # --- Step 1: Initial Reasoning ---
    reasoning_1 = """The user wants a detailed explanation with extensive Markdown and code. 
A great topic for this is a mini-tutorial on creating a React component. 
My plan is:
1.  Start with a friendly introduction.
2.  Provide the complete code block for the component.
3.  Use a 'code_linter' tool to simulate code validation.
4.  Break down the code with a detailed, formatted explanation.
5.  Conclude with a summary.
This will cover all the requested Markdown features."""
    async for event in stream_part(part_index, reasoning_1, "reasoning"):
        yield event
    part_index += 1
    await asyncio.sleep(0.5)

    # --- Step 2: Main Code Block ---
    # This is a large chunk of text formatted as a Markdown code block
    code_block_text = """Of course! Here is a complete example of a simple, interactive button component in React using function components and the `useState` hook.

```jsx
import React, { useState } from 'react';

// A simple counter button component
function CounterButton() {
  // 'count' is our state variable. 'setCount' is the function to update it.
  // We initialize the count to 0.
  const [count, setCount] = useState(0);

  // This function is called when the button is clicked
  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <button onClick={handleClick}>
      Clicked {count} times
    </button>
  );
}

export default CounterButton;
```
"""
    async for event in stream_part(part_index, code_block_text, "text"):
        yield event
    part_index += 1
    await asyncio.sleep(0.5)

    # --- Step 3: Tool Use (Code Linter) ---
    tool_index = part_index
    yield {
        "type": "content_part_start",
        "payload": {
            "partIndex": tool_index,
            "part": {"tool": {"name": "code_linter", "input": "CounterButton.jsx", "state": "input-available"}},
            "status": "Calling tool ..."
        }
    }
    await asyncio.sleep(2) # Simulate linting time
    yield {
        "type": "content_part_start",
        "payload": {
            "partIndex": tool_index,
            "part": {
                "tool": {
                    "name": "code_linter", 
                    "input": "CounterButton.jsx", 
                    "state": "output-available",
                    "output": "Linting complete. Code is clean and follows best practices."
                }
            }
        }
    }
    part_index += 1
    await asyncio.sleep(0.5)

    # --- Step 4: Detailed Breakdown with Rich Markdown ---
    breakdown_text = """
The code is validated! Now, let's break down the key concepts from that example.

### Key Concepts Explained

1.  **`import React, { useState } from 'react';`**
    *   This line imports the main `React` library and the `useState` hook.
    *   The `useState` hook is essential for adding *state* to function components.

2.  **`const [count, setCount] = useState(0);`**
    *   This is the core of the component's interactivity.
    *   `useState(0)` declares a state variable named `count` and initializes it with `0`.
    *   It returns an array with two elements: the current state value (`count`) and a function to update it (`setCount`). This is called **array destructuring**.

3.  **The `handleClick` Function**
    *   We define a simple function that calls `setCount(count + 1)`.
    *   **Important:** You should never modify state directly (e.g., `count++`). Always use the setter function (`setCount`) provided by `useState`. React uses this function call to know when to re-render the component.

---

> By using the `setCount` function, you are telling React that the component's state has changed, and it needs to re-run the component function to update what's shown on the screen.

### Tying it all together

The `<button>` element in the `return` statement has an `onClick` prop. We pass our `handleClick` function to it. Now, every time the button is clicked, our function runs, updates the state, and React re-renders the button with the new count.

For more details, you can always check out the [Official React Documentation](https://react.dev/).
"""
    async for event in stream_part(part_index, breakdown_text, "text"):
        yield event
    part_index += 1

    intro_text_2 = "I can also generate and render simple web pages on the fly. Here is a basic example:"
    async for event in stream_part(part_index, intro_text_2, "text"):
        yield event
    part_index += 1

# A simple HTML document as a Python multi-line string
    html_source_code = """
<!-- This is the HTML generated by the AI -->
<style>
  body { font-family: sans-serif; background-color: #f0f0f0; padding: 1em; }
  button { padding: 8px 15px; border: none; background-color: #007bff; color: white; cursor: pointer; }
</style>

<h3>Choose Your Favorite Color</h3>
<form id="interactive-form">
  <input type="radio" id="red" name="color" value="red" checked>
  <label for="red">Red</label><br>
  <input type="radio" id="blue" name="color" value="blue">
  <label for="blue">Blue</label><br>
  <input type="radio" id="green" name="color" value="green">
  <label for="green">Green</label><br><br>
  <button type="submit">Submit Choice</button>
</form>

<script>
  const form = document.getElementById('interactive-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault(); // Don't let the form actually submit/reload
    const selectedColor = document.querySelector('input[name="color"]:checked').value;

    // The IMPORTANT part: send the data to the parent window
    const state = {
      action: 'userChoice',
      payload: {
        color: selectedColor
      }
    };

    // parent.postMessage(message, targetOrigin)
    // Use your actual localhost origin for security, not '*' in production!
    parent.postMessage(state,"http://localhost:5173"); 
  });
</script>
    """

    yield {
        "type": "content_part_start",
        "payload": {
            "partIndex": part_index,
            "part": {
                "app": {
                    # Notice we send sourceCode instead of url
                    "sourceCode": html_source_code,
                    "width": "500px",
                    "height": "500px"
                }
            }
        }
    }
    part_index += 1
    await asyncio.sleep(0.5)

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
        client = MCPClient()
        orchestrator = ChatOrchestrator(manager=self,websocket=self.websocket)
        await client.connect_to_server(server_url="http://127.0.0.1:8001/mcp/")
        try:
            while True:
                received_message = await self.websocket.receive_json()
                request_id = received_message.get("request_id")

                print(received_message)
                if request_id and self.pending_requests.get(request_id):
                    future = self.pending_requests.pop(request_id)
                    future.set_result(received_message)

                    # if any other messages came up they should be handled here
                if received_message.get("chatId"):
                    print("its a chat message")
                    # Assuming this is a chat message
                    prompt = received_message.get("content")[0]["text"]
                    message_id = received_message.get("messageId")
                    assistant_message_id = str(uuid.uuid4())


                    await orchestrator.chat_loop(session=client.session,message=received_message)

                    

                    # # Send the START signal
                    # await self.websocket.send_json({
                    #     "type": "start",
                    #     "messageId": assistant_message_id,
                    # })
                    #
                    # # Process the advanced stream
                    # async for event in get_comprehensive_ai_stream(prompt):
                    #         message_to_send = {
                    #             "messageId": assistant_message_id,
                    #             "type": event["type"],
                    #             **event["payload"]
                    #         }
                    #         await self.websocket.send_json(message_to_send)
                    # # Send the END signal
                    # await self.websocket.send_json({
                    #     "type": "end",
                    #     "messageId": assistant_message_id
                    # })
                    print("Finished streaming advanced response.")


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
        # response = await orchestrator.process_query(query, session)
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
    # main_task = asyncio.create_task(chat(manager,websocket))

    done, pending = await asyncio.wait(
        {receiver_task},
        return_when=asyncio.FIRST_COMPLETED,
    )

    # Clean up by cancelling any remaining tasks
    for task in pending:
        task.cancel()

    print("WebSocket connection closed.")


if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
