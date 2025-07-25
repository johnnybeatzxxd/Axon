import os
import chromadb
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
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

def retrieve_semantic_tools(query: str, collection_name: str, distance_threshold: float = 0.6) -> list[str]:
    """
    Takes a query and retrieves the most semantically similar
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
        n_results=10
    )
    retrieved_docs = results['documents'][0]
    distances = results['distances'][0]
    
    relevant_tools = []
    for i, doc in enumerate(retrieved_docs):
        distance = distances[i]
        if distance < distance_threshold:
            print(f"  -> Found relevant tool: '{doc.splitlines()[0]}' (Distance: {distance:.4f}) - ACCEPTED")
            relevant_tools.append(doc)
        else:
            # This part is just for clear logging, you can remove it in production
            print(f"  -> Found tool: '{doc.splitlines()[0]}' (Distance: {distance:.4f}) - REJECTED (Threshold: {distance_threshold})")

    return relevant_tools



def get_relevant_tools_for_chat(chat_history: list[dict], collection_name: str, distance_threshold: float = 0.6) -> list[str]:
    """
    finds relevant tools by embedding the context of the entire chat history.
    """
    recent_history = chat_history[-5:]
    contextual_query = str(recent_history)
    return retrieve_semantic_tools(contextual_query, collection_name, distance_threshold)

if __name__ == "__main__":
    try:
        tool_collection = "tools"
        chat_history = [
    {'role': 'user', 'content': 'That last task was tough.'},
    {'role': 'assistant', 'content': 'I can imagine! Glad we got through it.'},
    {'role': 'user', 'content': 'Yeah, me too. Anyway, thanks for your help.'}
        ]

        
        contextual_tools = get_relevant_tools_for_chat(chat_history, tool_collection, distance_threshold=0.73)
        # contextual_tools = retrieve_semantic_tools(str(chat_history), tool_collection, distance_threshold=0.73)

        
        for i, tool in enumerate(contextual_tools, 1):
            print(f"{i}. {tool.splitlines()[0]}") 

    except Exception as e:
        print(f"\nAn error occurred: {e}")
