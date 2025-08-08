from ..rag.retrieve_tools import retrieve_semantic_tools


def retrieve_tools(keywords: str, conversations):
    # Build a robust context from the most recent messages (up to 5)
    recent = conversations[-5:] if isinstance(conversations, list) else []
    try:
        context = " ".join(
            [
                str(msg.get("content", ""))
                for msg in recent
                if isinstance(msg, dict)
            ]
        ).strip()
    except Exception:
        context = ""

    query = f"{keywords} {context}".strip()
    return retrieve_semantic_tools(query, "tools", 0.80)


def call_custom_tool(name: str, args: dict):
    """
    Finds a function in the current file by its string name and calls it.
    """
    try:
        function_to_call = globals()[name]

        if callable(function_to_call) and name != 'call_custom_tool':
            return function_to_call(**args)
        else:
            return f"Error: '{name}' is not a callable function."
            
    except KeyError:
        return f"Error: Function '{name}' not found in this file."
    except TypeError as e:
        return f"Error: Invalid arguments for function '{name}'. Details: {e}"


if __name__ == "__main__":
        ai_function_name = "retrieve_tools"
        ai_arguments = {
            "keywords": "music playback, song search, artist search, Drake music"
        }
        
        print(call_custom_tool(ai_function_name,ai_arguments))
