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

def save_tools_to_vector_db(tools:list):
    try:
        collection_name = "tools"
        
        chroma_client = chromadb.PersistentClient(path="./chroma_db")
        collection = chroma_client.get_or_create_collection(name=collection_name)

        all_ids = [generate_stable_id(doc) for doc in tools]
        
        existing_ids_response = collection.get(ids=all_ids)
        existing_ids = set(existing_ids_response['ids'])
        
        print(f"round {len(existing_ids)} tools already in the database.")

        tools_to_embed = [
            doc for doc in tools 
            if generate_stable_id(doc) not in existing_ids
        ]

        if tools_to_embed:
            db_ready_data = embed_content(tools_to_embed)
            upsert_to_chroma(db_ready_data, collection_name)
        else:
            print(" no new tools to add. Database is already uptodate.")

        final_count = collection.count()
        print(f"the collection '{collection.name}' now contains a total of {final_count} items.")

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
        tool_9, tool_10, tool_11, tool_12, tool_13, tool_14, tool_15, tool_16
    ]
    save_tools_to_vector_db(my_documents)
