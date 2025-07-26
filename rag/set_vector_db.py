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

def save_tools_to_vector_db(tools: list[str], db_path: str = "./chroma_db"):
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
        cu = chroma_client.get_or_create_collection(name=cached_collection_name)
        
        all_tool_ids = [generate_stable_id(doc) for doc in tools]
        
        existing_in_cache_ids = set(cached_collection.get(ids=all_tool_ids)['ids'])
        
        new_tools_to_embed = [
            doc for i, doc in enumerate(tools) 
            if all_tool_ids[i] not in existing_in_cache_ids
        ]
        
        print(f"Input contains {len(tools)} tools: {len(new_tools_to_embed)} new, {len(existing_in_cache_ids)} existing in cache.")

        session_tools_data = {"ids": [], "embeddings": [], "documents": []}
        
        if new_tools_to_embed:
            print(f"Embedding {len(new_tools_to_embed)} new tools...")
            newly_embedded_data = embed_content(new_tools_to_embed)
            
            upsert_to_chroma(newly_embedded_data, cached_collection_name, db_path)
            
            # add the new tool data to our session data
            session_tools_data["ids"].extend(newly_embedded_data["ids"])
            session_tools_data["embeddings"].extend(newly_embedded_data["embeddings"])
            session_tools_data["documents"].extend(newly_embedded_data["documents"])

        if existing_in_cache_ids:
            print(f"Fetching {len(existing_in_cache_ids)} existing tools from the cache...")
            # Fetch the full data including embeddings from the cache
            existing_tools_from_db = cached_collection.get(
                ids=list(existing_in_cache_ids),
                include=["embeddings", "documents"]
            )
            
            # add the existing tool data to our session data
            session_tools_data["ids"].extend(existing_tools_from_db["ids"])
            session_tools_data["embeddings"].extend(existing_tools_from_db["embeddings"])
            session_tools_data["documents"].extend(existing_tools_from_db["documents"])

        print(f"Resetting the '{session_collection_name}' collection...")
        try:
            chroma_client.delete_collection(name=session_collection_name)
        except:
            pass
        session_collection = chroma_client.get_or_create_collection(name=session_collection_name)
        
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
# --- Communication Tools ---
    tool_1 = "Tool: send_email\nDescription: Composes and sends a formal email to a recipient. Best for official communication, sending attachments, or reaching external contacts.\nParameters: recipient_email (string, required), subject (string, required), body (string, required)"
    tool_2 = "Tool: send_slack_message\nDescription: Posts a message to a specified Slack channel or user. Ideal for quick, informal team communication and real-time updates.\nParameters: channel_or_user (string, required), message (string, required)"
    tool_3 = "Tool: send_sms_notification\nDescription: Sends a short, urgent text message alert to a mobile phone number. Use for critical notifications that need immediate attention.\nParameters: phone_number (string, required), message (string, required)"

# --- External Information Retrieval Tools ---
    tool_4 = "Tool: get_current_weather\nDescription: Fetches the current weather conditions for a specified city, including temperature, humidity, and wind speed.\nParameters: city (string, required), units (string, optional, either 'celsius' or 'fahrenheit')"
    tool_5 = "Tool: get_stock_price\nDescription: Retrieves the latest trading price and daily change for a public company's stock symbol.\nParameters: ticker_symbol (string, required)"
    tool_6 = "Tool: web_search\nDescription: Performs a general-purpose search on the internet using a search engine. Use this for topics not covered by other tools or for finding up-to-date information.\nParameters: search_query (string, required)"
    tool_7 = "Tool: get_latest_news\nDescription: Fetches recent news headlines from major sources on a specific topic or region.\nParameters: topic (string, required), country (string, optional)"

# --- Internal Data & Knowledge Tools ---
    tool_8 = "Tool: search_internal_wiki\nDescription: Searches the company's internal Confluence wiki for articles and documentation. Best for finding 'how-to' guides, official policies, and project plans.\nParameters: search_query (string, required)"
    tool_9 = "Tool: query_sales_database\nDescription: Executes a read-only SQL query against the production sales database to get raw, specific data about customers, orders, or transactions. Requires knowledge of the database schema.\nParameters: sql_query (string, required)"
    tool_10 = "Tool: get_quarterly_sales_report\nDescription: Generates a pre-formatted summary report of sales performance for a specific quarter. Includes key metrics like total revenue, top products, and regional performance.\nParameters: quarter (string, required, e.g., 'Q3 2024'), region (string, optional)"
    tool_11 = "Tool: get_customer_details\nDescription: Retrieves all information for a specific customer from the CRM, including contact info, order history, and recent support tickets.\nParameters: customer_id (string) OR customer_email (string)"

# --- Productivity and Scheduling Tools ---
    tool_12 = "Tool: schedule_calendar_event\nDescription: Creates a new event in the user's calendar. Use this for booking meetings, setting appointments, or blocking out focus time.\nParameters: title (string, required), start_time (datetime string, required), end_time (datetime string, required), attendees (list of strings, optional)"
    tool_13 = "Tool: create_task_in_project_manager\nDescription: Adds a new task to a project management system like Jira or Asana. Use for tracking specific work items and assigning them to team members.\nParameters: task_description (string, required), project_name (string, required), assignee (string, optional), due_date (date string, optional)"
    tool_14 = "Tool: save_note\nDescription: Saves a piece of text as a note for later reference, such as ideas, meeting minutes, or a scratchpad.\nParameters: title (string, required), content (string, required)"

# --- Finance & Utility Tools ---
    tool_15 = "Tool: calculator\nDescription: Performs basic arithmetic calculations like addition, subtraction, multiplication, and division on a given expression.\nParameters: expression (string, required)"
    tool_16 = "Tool: convert_currency\nDescription: Converts an amount from one currency to another using real-time exchange rates.\nParameters: amount (float, required), from_currency (string, required), to_currency (string, required)"

# The list of documents is now our tool descriptions
    my_documents = [
        tool_1, tool_2, tool_3, tool_4, tool_5, tool_6, tool_7, tool_8, 
        tool_9, tool_10, tool_11, tool_12, tool_13,
    ]
    save_tools_to_vector_db(my_documents)
