import os
import random
import threading
import requests
import fitz  # PyMuPDF
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
import chromadb
from sentence_transformers import SentenceTransformer
from groq import Groq
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter

# --- 1. LOAD ENVIRONMENT VARIABLES ---
print("Loading environment variables...")
load_dotenv()  # This loads the .env file

# --- 2. GET, SPLIT, AND CHOOSE API KEY ---
keys_string = os.environ.get("GROQ_API_KEYS")
if not keys_string:
    print("Error: GROQ_API_KEYS not found in .env file.")
    print("Please create a .env file and add: GROQ_API_KEYS='key1,key2,...'")
    exit()

api_key_list = keys_string.split(',')
selected_api_key = random.choice(api_key_list)
print(f"Using one of {len(api_key_list)} Groq API keys.")

# --- 3. SET UP FLASK APP AND CORS ---
app = Flask(__name__)
# This allows your teammates' frontend (on a different domain) to call your API
# Allow CORS from all origins (useful for development). If you need to restrict origins,
# replace '*' with a list of allowed origins or a specific domain.
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# --- 4. GLOBAL CONSTANTS ---
DB_PATH = "./chroma_db"
COLLECTION_NAME = "vnit_lms"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
GROQ_MODEL = "llama-3.1-8b-instant" # Replaced the decommissioned model
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'

# --- 5. INITIALIZE ALL MODELS AND DB (Load them once on startup) ---
print("--- Initializing models and connecting to DB... ---")
try:
    groq_client = Groq(api_key=selected_api_key)
    print("Groq client initialized.")
    
    embedding_model = SentenceTransformer(EMBEDDING_MODEL)
    print(f"Embedding model '{EMBEDDING_MODEL}' loaded.")
    
    db_client = chromadb.PersistentClient(path=DB_PATH)
    collection = db_client.get_or_create_collection(name=COLLECTION_NAME)
    print(f"Connected to ChromaDB at '{DB_PATH}'. Collection '{COLLECTION_NAME}' loaded.")
    
    print("--- Server is ready to receive requests. ---")
except Exception as e:
    print(f"--- FATAL STARTUP ERROR: {e} ---")
    print("Please check your API keys, model names, and file permissions.")
    exit()


# --- 6. INGESTION HELPER FUNCTIONS ---

def get_google_drive_file_id(url):
    """Extracts the file ID from various Google Drive share link formats."""
    try:
        # Format: /file/d/FILE_ID/view
        if '/d/' in url:
            return url.split('/d/')[1].split('/')[0]
        # Format: ?id=FILE_ID
        if 'id=' in url:
            return url.split('id=')[1].split('&')[0]
        print(f"Could not parse File ID from URL: {url}")
        return None
    except Exception as e:
        print(f"Error parsing Google Drive URL: {e}")
        return None

def process_drive_link(drive_url):
    """
    The full background task:
    1. Downloads the PDF from Google Drive.
    2. Extracts text.
    3. Chunks the text.
    4. Embeds and stores in ChromaDB.
    """
    print(f"[Background Ingest] Starting task for: {drive_url}")
    
    try:
        # 1. Get File ID and create download link
        file_id = get_google_drive_file_id(drive_url)
        if not file_id:
            print("[Background Ingest] Error: Could not parse Google Drive File ID.")
            return

        download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
        
        # 2. Download the file
        print(f"[Background Ingest] Downloading file: {file_id}...")
        response = requests.get(download_url)
        
        # Handle Google's large file confirmation redirect
        if "confirm=t" in response.url: 
            print("[Background Ingest] Large file. Following confirmation redirect...")
            response = requests.get(download_url, cookies=response.cookies)

        # --- MODIFIED SECTION START ---
        # Check if the download *failed*. A 200 status is good enough.
        if response.status_code != 200:
            print(f"[Background Ingest] Error: Failed to download file. Status: {response.status_code}")
            print("Please ensure the link is public ('Anyone with the link').")
            return
        
        # Check if we actually got a file
        if not response.content:
            print("[Background Ingest] Error: Downloaded file is empty.")
            return

        print(f"[Background Ingest] File downloaded ({len(response.content)} bytes). Content-Type: {response.headers.get('content-type')}")

        # 3. Extract text from the PDF *in memory*
        print("[Background Ingest] Attempting to open as PDF...")
        full_text = ""
        try:
            # Use io.BytesIO to treat the downloaded content as a file
            with io.BytesIO(response.content) as pdf_stream:
                with fitz.open(stream=pdf_stream, filetype="pdf") as doc:
                    for page in doc:
                        full_text += page.get_text()
        except Exception as e:
            # This catch block is our new "is it a PDF?" check
            print(f"[Background Ingest] Error: Failed to open file as PDF. It might not be a PDF. Error: {e}")
            return
        # --- MODIFIED SECTION END ---
        
        if not full_text.strip():
            print("[Background Ingest] Error: No text extracted from PDF (file might be image-based or empty).")
            return  # <-- I'll add a 'return' here just in case

        # --- THIS IS THE MISSING BLOCK ---
        # 4. Chunk the text
        print("[Background Ingest] Chunking text...")
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len
        )
        text_chunks = text_splitter.split_text(full_text)
        print(f"[Background Ingest] Split into {len(text_chunks)} chunks.")

        if not text_chunks:
            print("[Background Ingest] Error: Text could not be split into chunks.")
            return
        # --- END OF MISSING BLOCK ---

        # 5. Embed and Store
        print(f"[Background Ingest] Generating embeddings for {len(text_chunks)} chunks...")
        embeddings = embedding_model.encode(text_chunks, show_progress_bar=True)
        
        # Create unique IDs based on file ID and chunk index
        ids = [f"drive_{file_id}_chunk_{i}" for i in range(len(text_chunks))]
        
        print(f"[Background Ingest] Adding {len(ids)} chunks to ChromaDB...")
        collection.add(
            embeddings=embeddings.tolist(),
            documents=text_chunks,
            ids=ids
        )
        
        print(f"--- [Background Ingest] COMPLETED: Ingestion for file {file_id} ---")

    except Exception as e:
        print(f"--- [Background Ingest] FAILED: {e} ---")


# --- 7. API ENDPOINT: /chatbot-api/ingest (For Professors) ---

@app.route("/chatbot-api/ingest", methods=["POST"])
def handle_ingestion():
    """
    API endpoint to trigger the ingestion of a new document.
    It takes a Google Drive link, returns an "Accepted" response immediately,
    and starts the processing in a background thread.
    """
    data = request.json
    drive_link = data.get("drive_link")

    if not drive_link:
        return jsonify({"error": "No 'drive_link' provided"}), 400

    print(f"\n--- New Ingestion Request Received ---")
    print(f"Link: {drive_link}")

    # Start the ingestion process in a separate thread
    # This allows the API to return an immediate response
    thread = threading.Thread(target=process_drive_link, args=(drive_link,))
    thread.start()

    # Return a 202 "Accepted" status
    return jsonify({
        "message": "Ingestion process started. The document will be available for queries in a few minutes."
    }), 202


# --- 8. API ENDPOINT: /chatbot-api/chat (For Students) ---

@app.route("/chatbot-api/chat", methods=["POST"])
def handle_chat():
    """
    Handles chat requests from the frontend.
    Performs RAG to answer questions based on ingested documents.
    """
    
    data = request.json
    user_question = data.get("question")

    if not user_question:
        return jsonify({"error": "No question provided"}), 400

    print(f"\n--- New Chat Request ---")
    print(f"Question: {user_question}")

    try:
        # 1. Vectorize the user's question
        question_vector = embedding_model.encode(user_question).tolist()

        # 2. Query ChromaDB to find relevant context
        print("Searching for context...")
        results = collection.query(
            query_embeddings=[question_vector],
            n_results=5 # Get top 5 most relevant chunks
        )
        
        context_chunks = results['documents'][0]
        context = "\n\n".join(context_chunks)
        
        if not context_chunks:
            print("No relevant context found in database.")
            return jsonify({"answer": "I'm sorry, but I don't have that information in my knowledge base."})

        print(f"Found context: {context[:200]}...") # Print first 200 chars

        # 3. Build the prompt for Groq
        system_prompt = """
        You are a helpful AI teaching assistant for the VNIT Learning Management System.
        Your goal is to answer student questions based ONLY on the provided course materials.
        
        Follow these rules STRICTLY:
        1. Use ONLY the 'Provided Context' below to answer the question.
        2. If the answer is not in the context, clearly state: "I'm sorry, but I don't have that information in my knowledge base."
        3. Do not make up answers or use any external knowledge.
        4. Be concise and direct in your response.
        """
        
        final_prompt = f"""
        {system_prompt}
        
        ---
        Provided Context:
        {context}
        ---
        
        Student Question:
        {user_question}
        
        Answer:
        """

        # 4. Call Groq LLM
        print("Sending prompt to Groq...")
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "user", "content": final_prompt}
            ],
            model=GROQ_MODEL,
        )
        
        bot_answer = chat_completion.choices[0].message.content
        print(f"Groq Answer: {bot_answer}")

        # 5. Send Response
        return jsonify({"answer": bot_answer})

    except Exception as e:
        print(f"Error during RAG pipeline: {e}")
        return jsonify({"error": f"An internal error occurred: {e}"}), 500


# --- 9. RUN THE FLASK SERVER ---
if __name__ == "__main__":
    # Runs the server on port 5000 and makes it accessible on your network
    # 'debug=True' automatically reloads the server when you save changes
    app.run(host='0.0.0.0', port=5001, debug=True)