# Render Deployment Guide for Chatbot Service

## Prerequisites

1. **Groq API Keys**: You need at least one Groq API key. Get them from https://console.groq.com/
2. **Render Account**: Sign up at https://render.com

## Deployment Steps

### Option 1: Using Render Dashboard (Recommended)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Create New Web Service**
3. **Connect your repository**
4. **Configure the service:**

   - **Name**: `chatbot-service` (or your preferred name)
   - **Environment**: `Python 3`
   - **Root Directory**: `backend/chatbot/vnit-lms-chatbot`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
   - **Python Version**: `3.11` or `3.12` (recommended)

### Option 2: Using render.yaml

The `render.yaml` file is already configured. Just connect your repo and Render will use those settings.

## Required Environment Variables

Add these in Render Dashboard → Your Service → Environment:

### Required:
```
GROQ_API_KEYS=your-key1,your-key2,your-key3
FLASK_ENV=production
PORT=10000
```

### Optional (for CORS):
```
ALLOWED_ORIGINS=https://your-frontend.onrender.com,https://synhack-2.onrender.com
```

**Important Notes:**
- `GROQ_API_KEYS`: Comma-separated list of Groq API keys (the service randomly selects one)
- `PORT`: Render automatically sets this, but we include it as a fallback
- Multiple API keys help with rate limiting

## Build Commands Summary

- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py`

## First-Time Setup Notes

1. **Initial Build Time**: The first build may take 10-15 minutes because:
   - EasyOCR downloads models (~500MB)
   - Sentence transformers download models
   - All Python dependencies are installed

2. **ChromaDB Storage**: The `chroma_db` folder will be created automatically. On Render, this is ephemeral unless you use a persistent disk.

3. **Memory Requirements**: This service needs at least 2GB RAM due to ML models. Consider upgrading your Render plan if needed.

## Troubleshooting

### Build Fails

1. **Check Python version**: Use Python 3.11 or 3.12
2. **Check build logs**: Look for missing dependencies
3. **Memory issues**: Upgrade Render plan if models fail to load

### Service Crashes

1. **Check logs**: Look for API key errors or model loading issues
2. **Verify GROQ_API_KEYS**: Make sure at least one valid key is set
3. **Check memory**: Service needs ~2GB RAM minimum

### CORS Errors

Update `app.py` to restrict CORS origins:
```python
CORS(app, resources={r"/*": {"origins": os.environ.get("ALLOWED_ORIGINS", "*").split(",")}}, supports_credentials=True)
```

## Updating Frontend

After deployment, update your frontend `.env` or Render environment variables:

```
VITE_CHAT_API_URL=https://your-chatbot-service.onrender.com
```

## Cost Considerations

- **Free Tier**: Limited to 750 hours/month, may sleep after inactivity
- **Starter Plan**: $7/month - Always on, 512MB RAM (may not be enough)
- **Standard Plan**: $25/month - Always on, 2GB RAM (recommended)

## Testing Locally

Before deploying, test locally:
```bash
cd backend/chatbot/vnit-lms-chatbot
pip install -r requirements.txt
# Create .env file with GROQ_API_KEYS
python app.py
```

The service will run on http://localhost:5001

