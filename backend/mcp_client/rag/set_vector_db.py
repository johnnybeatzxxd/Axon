import os
import uuid
import numpy as np
import chromadb
import hashlib
from google import genai 
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    del os.environ["GEMINI_API_KEY"]

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found. Please set it in your .env file.")

client = genai.Client(api_key=api_key)

def generate_stable_id(content: str) -> str:
    """generates a stable unique ID based on the content of the string."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def embed_content(contents: list[str]) -> dict:
    if not contents or not isinstance(contents, list):
        raise ValueError("input must be a non-empty list of strings.")

    ids = [generate_stable_id(doc) for doc in contents]

    embedding_model = "gemini-embedding-001"

    result = client.models.embed_content(
        model=embedding_model,
        contents=contents,
        config=types.EmbedContentConfig(task_type="SEMANTIC_SIMILARITY")
    ).embeddings

    embeddings = [embedding.values for embedding in result]

    return {
        "ids": ids,
        "embeddings": embeddings,
        "documents": contents
    }

def upsert_to_chroma(db_data: dict, collection_name: str, db_path: str = "./chroma_db"):
    """
    upserts data into a chromadb collection.
    """
    client = chromadb.PersistentClient(path=db_path)
    collection = client.get_or_create_collection(name=collection_name)

    collection.upsert(**db_data)
    
    print(f"successfully upserted {len(db_data['ids'])} documents into ChromaDB.")
    return collection

def save_tools_to_vector_db(tools_data: list[str], db_path: str = "./chroma_db"):
    """
    saves tools to two vector database collections:
    'cached_tools': persistent collection of all unique tools ever processed.
    'tools': temporary collection holding only the new tools from the current run.
    """
    try:
        cached_collection_name = "cached_tools"
        session_collection_name = "tools"
        
        chroma_client = chromadb.PersistentClient(path=db_path)
        cached_collection = chroma_client.get_or_create_collection(name=cached_collection_name)
        
        all_documents = [tool['document'] for tool in tools_data]
        all_metadatas = [{'tool_name': tool['name']} for tool in tools_data]
        all_tool_ids = [generate_stable_id(doc) for doc in all_documents]
        
        existing_in_cache_ids = set(cached_collection.get(ids=all_tool_ids)['ids'])
        
        # identify new tools that need to be embedded, keeping their dict structure
        new_tools_to_embed_data = [
            tool for i, tool in enumerate(tools_data) 
            if all_tool_ids[i] not in existing_in_cache_ids
        ]
        
        print(f"Input contains {len(tools_data)} tools: {len(new_tools_to_embed_data)} new, {len(existing_in_cache_ids)} existing in cache.")

        session_tools_data = {"ids": [], "embeddings": [], "documents": [], "metadatas": []}
        
        if new_tools_to_embed_data:
            print(f"Embedding {len(new_tools_to_embed_data)} new tools...")
            new_documents = [tool['document'] for tool in new_tools_to_embed_data]
            newly_embedded_data = embed_content(new_documents)
            
            newly_embedded_data['metadatas'] = [{'tool_name': tool['name']} for tool in new_tools_to_embed_data]
            
            upsert_to_chroma(newly_embedded_data, cached_collection_name, db_path)
            
            for key in session_tools_data.keys():
                session_tools_data[key].extend(newly_embedded_data[key])

        if existing_in_cache_ids:
            print(f"Fetching {len(existing_in_cache_ids)} existing tools from the cache...")
            # fetch the full data including embeddings from the cache
            existing_tools_from_db = cached_collection.get(
                ids=list(existing_in_cache_ids),
                include=["embeddings", "documents","metadatas"]
            )
            
            # add the existing tool data to our session data
            for key in session_tools_data.keys():
                session_tools_data[key].extend(existing_tools_from_db[key])

        print(f"Resetting the '{session_collection_name}' collection...")
        try:
            chroma_client.delete_collection(name=session_collection_name)
        except:
            pass
        session_collection = chroma_client.get_or_create_collection(name=session_collection_name)
        
        if session_tools_data["ids"]:
            upsert_to_chroma(session_tools_data, session_collection_name, db_path)

        final_cache_count = cached_collection.count()
        final_session_count = session_collection.count()
        
        print("-" * 50)
        print("Operation Complete.")
        print(f"The '{cached_collection.name}' collection now has {final_cache_count} total unique tools.")
        print(f"The '{session_collection.name}' collection now has {final_session_count} tools for this session.")
        print("-" * 50)

    except Exception as e:
        print(f"An error occurred: {e}")
if __name__ == "__main__":
    pass
