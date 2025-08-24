import uuid
from pydantic_ai import  Tool, RunContext
from pydantic_ai.messages import (
    FinalResultEvent,
    FunctionToolCallEvent,
    FunctionToolResultEvent,
    PartDeltaEvent,
    PartStartEvent,
    TextPartDelta,
    ThinkingPartDelta,
    ToolCallPartDelta,
    ThinkingPart,
    TextPart,
    ToolCallPart,
)

tool_index = {}
assistant_message_id = str(uuid.uuid4())

async def event_stream_handler(ctx: RunContext, event_stream, websocket,chat_id, stream_state):


    tool_args = ''
    global tool_index
    global assistant_message_id


    print("starting")
    async for event in event_stream:
        print(event)
        print()
        print()
        if isinstance(event, PartStartEvent):
            if event.index == 0:
                assistant_message_id = str(uuid.uuid4())
                stream_state["assistant_message_id"] = assistant_message_id
                await websocket.send_json(
                    {
                        "type": "start",
                        "messageId": assistant_message_id,
                    }
                )
            if isinstance(event.part, ThinkingPart):
                part = {"reasoning": event.part.content}

            if isinstance(event.part, TextPart):
                stream_state["part_index"] = event.index
                part = {"text": ""}

            if isinstance(event.part, ToolCallPart):
                tool = event.part
                tool_args = tool.args
                tool_index[tool.tool_call_id] = event.index
                part = {
                    "tool": {
                        "id": tool.tool_call_id,
                        "name": tool.tool_name,
                        "input": tool.args,
                        "output": "",
                        "state": "input-streaming",
                    }
                }
            content_part_start_message = {
                "type": "content_part_start",
                "chatId": chat_id,
                "messageId": assistant_message_id,
                "partIndex": event.index,
                "part": part,
            }
            await websocket.send_json(content_part_start_message)
        elif isinstance(event, PartDeltaEvent):
            chunk_message = {
                "messageId": assistant_message_id,
                "type": "text_chunk",
                "partIndex": event.index,
                "text": '',
                "status": "Generating resonse ...",
            }
            if isinstance(event.delta, TextPartDelta):
                chunk_message["status"] = ""
                chunk_message['text'] = event.delta.content_delta
                await websocket.send_json(chunk_message)
            elif isinstance(event.delta, ThinkingPartDelta):
                chunk_message["partIndex"] = event.index
                chunk_message['text'] = event.delta.content_delta
                await websocket.send_json(chunk_message)
            elif isinstance(event.delta, ToolCallPartDelta):
                chunk_message["partIndex"] = event.index
                chunk_message["inputDelta"] = event.delta.args_delta
                await websocket.send_json(chunk_message)


        elif isinstance(event, FunctionToolCallEvent):
            tool = event.part
            part_index = tool_index[tool.tool_call_id]
            text_chunk = {
                "type": "text_chunk",
                "chatId": chat_id,
                "messageId": assistant_message_id,
                "partIndex": part_index,
                "toolState":"input-available"
            }
            await websocket.send_json(text_chunk)

        elif isinstance(event, FunctionToolResultEvent):
            tool = event.result
            part_index = tool_index[tool.tool_call_id]
            text_chunk = {
                "type": "text_chunk",
                "chatId": chat_id,
                "messageId": assistant_message_id,
                "partIndex": part_index,
                "output": str(event.result.content),
                "toolState":"output-available"
            }
            await websocket.send_json(text_chunk)
        elif isinstance(event, FinalResultEvent):
            print(f"[Result] The model starting producing a final result {event}")
