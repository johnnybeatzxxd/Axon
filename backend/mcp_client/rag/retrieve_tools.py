import os
import chromadb
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    del os.environ["GEMINI_API_KEY"]

if not api_key:
    raise ValueError("GOOGLE_API_KEY not found.")

client = genai.Client(api_key=api_key)
    
def embed_query(query_text: str) -> list[float]:
    """
    generates an embedding for a single query string using googles API.
    """
    embedding_model = "gemini-embedding-001"
    task_type = "RETRIEVAL_QUERY"
    
    result = client.models.embed_content(
        model=embedding_model,
        contents=[query_text],
        config=types.EmbedContentConfig(task_type=task_type)
    )
    return result.embeddings[0].values

def retrieve_semantic_tools(
    query: str,
    collection_name: str,
    distance_threshold: float = 0.6,
    top_k_fallback: int = 0,
) -> list[str]:
    """
    takes a query and retrieves the most semantically similar
    tools from the specified chromaDB collection.
    """
    query_embedding = embed_query(query)
    
    db_path = "./chroma_db"
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"chromaDB path not found at '{db_path}'.")
        
    client = chromadb.PersistentClient(path=db_path)
    
    try:
        collection = client.get_collection(name=collection_name)
    except ValueError:
        raise ValueError(f"collection '{collection_name}' not found.")

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=100,
        include=["metadatas", "distances"]
    )
    retrieved_metadatas = results['metadatas'][0]
    distances = results['distances'][0]
    
    relevant_tool_names: list[str] = []
    all_pairs: list[tuple[str, float]] = []
    for i, metadata in enumerate(retrieved_metadatas):
        distance = distances[i]
        tool_name = metadata.get('tool_name', 'Unknown Tool')
        all_pairs.append((tool_name, distance))

        if distance < distance_threshold:
            print(f"  -> Found relevant tool: '{tool_name}' (Distance: {distance:.4f}) - ACCEPTED")
            relevant_tool_names.append(tool_name)
        else:
            print(f"  -> Found tool: '{tool_name}' (Distance: {distance:.4f}) - REJECTED (Threshold: {distance_threshold})")
            pass

    # Fallback: if none under threshold, return top-k most similar tools by distance
    if not relevant_tool_names and top_k_fallback > 0 and all_pairs:
        all_pairs.sort(key=lambda x: x[1])  # lower distance = more similar
        fallback = [name for name, _ in all_pairs[:top_k_fallback]]
        print(f"No tools under threshold. Using top-{top_k_fallback} fallback: {fallback}")
        return fallback

    return relevant_tool_names



def get_relevant_tools_for_chat(
    chat_history: list[dict],
    collection_name: str,
    distance_threshold: float = 0.784,
    top_k_fallback: int = 3,
) -> list[str]:
    """
    finds relevant tools by embedding the context of the entire chat history.
    """
    recent_history = chat_history[-5:]
    contextual_query = str(recent_history)
    return retrieve_semantic_tools(
        contextual_query,
        collection_name,
        distance_threshold=distance_threshold,
        top_k_fallback=top_k_fallback,
    )

if __name__ == "__main__":
    try:
        tool_collection = "tools"
        chat_history = [
    {'role': 'user', 'content': 'That last task was tough.'},
    {'role': 'assistant', 'content': 'I can imagine! Glad we got through it.'},
    {'role': 'user', 'content': 'Yeah, me too. Anyway, how are we doing this month'}
        ]

        
        contextual_tools = get_relevant_tools_for_chat(chat_history, tool_collection, distance_threshold=0.784)
        # contextual_tools = retrieve_semantic_tools(str(chat_history), tool_collection, distance_threshold=0.76)

        
        for i, tool in enumerate(contextual_tools, 1):
            print(f"{i}. {tool.splitlines()[0]}") 

    except Exception as e:
        print(f"\nAn error occurred: {e}")
