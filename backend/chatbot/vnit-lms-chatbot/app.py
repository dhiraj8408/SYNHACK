import os
import random
import threading
import requests
import fitz  # PyMuPDF
import io
import mimetypes
import zipfile
from flask import Flask, request, jsonify
from flask_cors import CORS
import chromadb
from sentence_transformers import SentenceTransformer
from groq import Groq
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pptx import Presentation
from PIL import Image
import easyocr
import numpy as np
import cv2

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
    
    # Initialize EasyOCR reader (supports English by default)
    # This will download models on first run - takes a few minutes
    print("Initializing EasyOCR (this may take a minute on first run)...")
    ocr_reader = easyocr.Reader(['en'], gpu=False)  # Set gpu=True if you have CUDA
    print("EasyOCR initialized successfully.")
    
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

def detect_file_type(content, content_type=None, filename=None):
    """
    Detects file type from content, content-type header, or filename.
    Returns: 'pdf', 'ppt', 'pptx', 'image', or None
    """
    # Check content-type header first
    if content_type:
        if 'pdf' in content_type.lower():
            return 'pdf'
        if 'presentation' in content_type.lower() or 'powerpoint' in content_type.lower():
            return 'pptx'
        if 'image' in content_type.lower():
            return 'image'
    
    # Check filename extension
    if filename:
        ext = filename.lower().split('.')[-1] if '.' in filename else ''
        if ext in ['pdf']:
            return 'pdf'
        if ext in ['ppt', 'pptx']:
            return 'pptx'
        if ext in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp']:
            return 'image'
    
    # Check magic bytes (file signatures)
    if content:
        # PDF: starts with %PDF
        if content[:4] == b'%PDF':
            return 'pdf'
        # PPTX: ZIP archive with specific structure (starts with PK)
        if content[:2] == b'PK':
            # Check if it's a PPTX by looking for specific files inside
            try:
                with zipfile.ZipFile(io.BytesIO(content)) as zip_file:
                    if 'ppt/presentation.xml' in zip_file.namelist():
                        return 'pptx'
            except:
                pass
        # Images: Check common image signatures
        if content[:2] == b'\xff\xd8':  # JPEG
            return 'image'
        if content[:8] == b'\x89PNG\r\n\x1a\n':  # PNG
            return 'image'
        if content[:6] in [b'GIF87a', b'GIF89a']:  # GIF
            return 'image'
        if content[:2] == b'BM':  # BMP
            return 'image'
    
    return None

def extract_text_from_pdf(content):
    """Extracts text from PDF. Uses OCR if text extraction fails."""
    full_text = ""
    try:
        with io.BytesIO(content) as pdf_stream:
            with fitz.open(stream=pdf_stream, filetype="pdf") as doc:
                for page_num, page in enumerate(doc):
                    # Try direct text extraction first
                    page_text = page.get_text()
                    if page_text.strip():
                        full_text += f"\n--- Page {page_num + 1} ---\n" + page_text
                    else:
                        # If no text, it's likely a scanned/image-based PDF - use OCR
                        print(f"[PDF] Page {page_num + 1} has no text, attempting OCR...")
                        try:
                            # Convert PDF page to image
                            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
                            img_data = pix.tobytes("png")
                            img = Image.open(io.BytesIO(img_data))
                            img_array = np.array(img)
                            
                            # Perform OCR
                            ocr_results = ocr_reader.readtext(img_array)
                            page_text = "\n".join([result[1] for result in ocr_results])
                            if page_text.strip():
                                full_text += f"\n--- Page {page_num + 1} (OCR) ---\n" + page_text
                        except Exception as ocr_error:
                            print(f"[PDF] OCR failed for page {page_num + 1}: {ocr_error}")
    except Exception as e:
        print(f"[PDF] Error extracting text from PDF: {e}")
        return None
    return full_text.strip()

def extract_text_from_ppt(content):
    """Extracts text from PowerPoint presentation."""
    full_text = ""
    try:
        with io.BytesIO(content) as ppt_stream:
            prs = Presentation(ppt_stream)
            for slide_num, slide in enumerate(prs.slides):
                slide_text = f"\n--- Slide {slide_num + 1} ---\n"
                # Extract text from all shapes in the slide
                for shape in slide.shapes:
                    if hasattr(shape, "text") and shape.text:
                        slide_text += shape.text + "\n"
                    # Also check for text in tables
                    if hasattr(shape, "table"):
                        for row in shape.table.rows:
                            for cell in row.cells:
                                if cell.text:
                                    slide_text += cell.text + " "
                        slide_text += "\n"
                full_text += slide_text
    except Exception as e:
        print(f"[PPT] Error extracting text from PPT: {e}")
        return None
    return full_text.strip()

def extract_text_from_image(content):
    """Extracts text from image using OCR (supports handwritten notes)."""
    try:
        # Load image
        img = Image.open(io.BytesIO(content))
        img_array = np.array(img)
        
        # Convert to RGB if needed (EasyOCR expects RGB)
        if len(img_array.shape) == 2:  # Grayscale
            img_array = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
        elif img_array.shape[2] == 4:  # RGBA
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2RGB)
        
        # Perform OCR
        print("[Image] Performing OCR...")
        ocr_results = ocr_reader.readtext(img_array)
        
        # Combine all detected text
        full_text = "\n".join([result[1] for result in ocr_results])
        
        if not full_text.strip():
            print("[Image] No text detected in image.")
            return None
        
        return full_text.strip()
    except Exception as e:
        print(f"[Image] Error extracting text from image: {e}")
        return None

def process_drive_link(drive_url):
    """
    The full background task:
    1. Downloads file from Google Drive.
    2. Detects file type (PDF, PPT, image, etc.)
    3. Extracts text (with OCR for images and scanned PDFs).
    4. Chunks the text.
    5. Embeds and stores in ChromaDB.
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

        # Check if the download failed
        if response.status_code != 200:
            print(f"[Background Ingest] Error: Failed to download file. Status: {response.status_code}")
            print("Please ensure the link is public ('Anyone with the link').")
            return
        
        # Check if we actually got a file
        if not response.content:
            print("[Background Ingest] Error: Downloaded file is empty.")
            return

        content_type = response.headers.get('content-type', '')
        print(f"[Background Ingest] File downloaded ({len(response.content)} bytes). Content-Type: {content_type}")

        # 3. Detect file type
        file_type = detect_file_type(response.content, content_type)
        if not file_type:
            print("[Background Ingest] Error: Could not detect file type. Supported: PDF, PPT/PPTX, Images (JPG, PNG, etc.)")
            return
        
        print(f"[Background Ingest] Detected file type: {file_type}")

        # 4. Extract text based on file type
        full_text = None
        if file_type == 'pdf':
            print("[Background Ingest] Extracting text from PDF...")
            full_text = extract_text_from_pdf(response.content)
        elif file_type == 'pptx':
            print("[Background Ingest] Extracting text from PowerPoint...")
            full_text = extract_text_from_ppt(response.content)
        elif file_type == 'image':
            print("[Background Ingest] Extracting text from image using OCR...")
            full_text = extract_text_from_image(response.content)
        else:
            print(f"[Background Ingest] Error: Unsupported file type: {file_type}")
            return
        
        if not full_text or not full_text.strip():
            print("[Background Ingest] Error: No text extracted from file.")
            return

        print(f"[Background Ingest] Extracted {len(full_text)} characters of text.")

        # 5. Chunk the text
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

        # 6. Embed and Store
        print(f"[Background Ingest] Generating embeddings for {len(text_chunks)} chunks...")
        embeddings = embedding_model.encode(text_chunks, show_progress_bar=True)
        
        # Create unique IDs based on file ID and chunk index
        ids = [f"drive_{file_id}_{file_type}_chunk_{i}" for i in range(len(text_chunks))]
        
        print(f"[Background Ingest] Adding {len(ids)} chunks to ChromaDB...")
        collection.add(
            embeddings=embeddings.tolist(),
            documents=text_chunks,
            ids=ids
        )
        
        print(f"--- [Background Ingest] COMPLETED: Ingestion for {file_type} file {file_id} ---")

    except Exception as e:
        print(f"--- [Background Ingest] FAILED: {e} ---")
        import traceback
        traceback.print_exc()


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