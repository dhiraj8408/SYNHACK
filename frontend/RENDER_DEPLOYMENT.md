# Render Deployment Guide for Frontend

## Render Configuration

### Option 1: Using Render Dashboard (Recommended)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Create New Web Service**
3. **Connect your repository**
4. **Configure the service with these settings:**

   - **Name**: `frontend` (or your preferred name)
   - **Environment**: `Node`
   - **Root Directory**: `frontend` (if your repo root contains both frontend and backend)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Node Version**: `18.x` or `20.x` (latest LTS)

### Option 2: Using render.yaml (Already created)

The `render.yaml` file is already configured. Just:
1. Connect your repo to Render
2. Render will automatically detect `render.yaml` and use those settings

## Environment Variables

Add these in Render Dashboard → Your Service → Environment:

```
NODE_ENV=production
PORT=10000
VITE_BACKEND_API_URL=https://your-backend-url.onrender.com
```

**Important**: Replace `your-backend-url.onrender.com` with your actual backend URL.

## Build Commands Summary

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`

## Troubleshooting

### Build Fails

1. **Check Node version**: Ensure you're using Node 18+ or 20+
2. **Check build logs**: Look for TypeScript errors or missing dependencies
3. **Clear cache**: In Render, try "Clear build cache" and redeploy

### Common Issues

1. **Port binding error**: The start command uses `$PORT` which Render provides automatically
2. **Missing environment variables**: Make sure `VITE_BACKEND_API_URL` is set
3. **Build timeout**: If build takes too long, consider optimizing dependencies

### Manual Build Test

Test locally before deploying:
```bash
cd frontend
npm install
npm run build
npm run start
```

## Notes

- The `lovable-tagger` plugin is automatically disabled in production builds
- The build output goes to `dist/` folder
- Vite preview server serves the static files from `dist/`

