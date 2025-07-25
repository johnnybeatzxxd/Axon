import os
import uuid
import numpy as np
import chromadb
import hashlib
from google import genai 
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError("GOOGLE_API_KEY not found. Please set it in your .env file.")

client = genai.Client(api_key=api_key)

def generate_stable_id(content: str) -> str:
    """generates a stable unique ID based on the content of the string."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def embed_content(contents: list[str]) -> dict:
    if not contents or not isinstance(contents, list):
        raise ValueError("Input must be a non-empty list of strings.")

    ids = [generate_stable_id(doc) for doc in contents]

    embedding_model = "gemini-embedding-001"

    result = client.models.embed_content(
        model=embedding_model,
        contents=contents,
        config=types.EmbedContentConfig(task_type="SEMANTIC_SIMILARITY")
    ).embeddings

    print(result)
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

def save_tools_to_vector_db(tools:list):
    try:
        collection_name = "tools"
        
        print("Step 1: Checking for existing tools in the database...")
        chroma_client = chromadb.PersistentClient(path="./chroma_db")
        collection = chroma_client.get_or_create_collection(name=collection_name)

        all_ids = [generate_stable_id(doc) for doc in tools]
        
        existing_ids_response = collection.get(ids=all_ids)
        existing_ids = set(existing_ids_response['ids'])
        
        print(f"Found {len(existing_ids)} tools already in the database.")

        tools_to_embed = [
            doc for doc in tools 
            if generate_stable_id(doc) not in existing_ids
        ]

        if tools_to_embed:
            print(f"\nStep 2: Preparing and embedding {len(documents_to_embed)} new tool(s).")
            db_ready_data = embed_content(tools_to_embed)
            upsert_to_chroma(db_ready_data, collection_name)
        else:
            print("\nStep 2: No new tools to add. Database is already up-to-date.")

        final_count = collection.count()
        print(f"\nVerification: The collection '{collection.name}' now contains a total of {final_count} items.")
        print("\n--- Process Complete ---")

    except Exception as e:
        print(f"An error occurred: {e}")
