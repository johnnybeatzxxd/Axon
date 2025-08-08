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


