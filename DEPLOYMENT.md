# Alerto Deployment Guide

This guide explains how to deploy the Alerto application with Hugging Face AI integration working on both localhost and Vercel.

## Architecture Overview

- **Frontend**: React + Vite (deployed on Vercel)
- **Backend**: Node.js + Express (deployed on Vercel as serverless functions)
- **AI Integration**: Hugging Face CLIP API (via backend proxy to avoid CORS)

## Prerequisites

- Node.js 16+ and npm 8+
- Vercel account
- Hugging Face API key
- All API keys from services used (Firebase, OpenWeather, Cloudinary, etc.)

## Local Development Setup

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Update .env with your API keys
# Make sure VITE_BACKEND_URL is set to http://localhost:5000
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies (including node-fetch)
npm install

# Create .env file (already created by Claude)
# Verify these variables are set:
# - HUGGING_FACE_API_KEY
# - FRONTEND_URL=http://localhost:3000
# - PORT=5000
```

### 3. Start Development Servers

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
npm run dev
```

The backend will run on `http://localhost:5000` and frontend on `http://localhost:5173`.

## Vercel Deployment

### Deploy Backend First

1. Create a new Vercel project for the backend:
   ```bash
   cd backend
   vercel
   ```

2. Set environment variables in Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add these variables:
     ```
     HUGGING_FACE_API_KEY=your_hugging_face_api_key
     FRONTEND_URL=https://your-frontend-app.vercel.app
     MONGODB_URI=your_mongodb_connection_string
     WEATHER_API_KEY=your_weather_api_key
     GEMINI_API_KEY=your_gemini_api_key
     NODE_ENV=production
     ```

3. Deploy:
   ```bash
   vercel --prod
   ```

4. Note the backend URL (e.g., `https://alerto-backend.vercel.app`)

### Deploy Frontend

1. Create a new Vercel project for the frontend:
   ```bash
   # From root directory
   vercel
   ```

2. Set environment variables in Vercel dashboard:
   ```
   VITE_BACKEND_URL=https://your-backend-app.vercel.app
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   VITE_WEATHER_API_KEY=your_weather_api_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   VITE_CLOUDINARY_API_KEY=your_cloudinary_api_key
   VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
   VITE_HUGGING_FACE_API_KEY=your_hugging_face_api_key
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

### Update CORS Configuration

After deploying both apps, update the backend CORS configuration:

1. Edit `backend/server.js` line 46:
   ```javascript
   const allowedOrigins = [
     'http://localhost:3000',
     'http://localhost:5173',
     'https://your-actual-frontend-app.vercel.app', // Update this!
     process.env.FRONTEND_URL
   ].filter(Boolean);
   ```

2. Redeploy the backend:
   ```bash
   cd backend
   vercel --prod
   ```

## How Hugging Face Integration Works

### Request Flow

1. User submits a report with images in the frontend
2. Frontend calls `analyzeReportImages()` in `src/services/imageAnalysisService.js`
3. Image is converted to base64 and sent to **backend** at `/api/huggingface/image-classification`
4. Backend (in `backend/routes/huggingface.js`) forwards the request to Hugging Face API with the API key
5. Backend returns the CLIP analysis results to frontend
6. Frontend processes the results and assigns a credibility score

### Why Use Backend Proxy?

- **CORS**: Hugging Face API doesn't allow direct browser requests
- **Security**: API key is kept secure on the backend
- **Localhost & Production**: Works seamlessly in both environments

## Testing the Integration

### Test on Localhost

1. Start both servers (frontend + backend)
2. Submit a weather report with an image
3. Check browser console for logs:
   ```
   🔍 Calling Hugging Face API via backend: http://localhost:5000/api/huggingface/image-classification
   ✅ Hugging Face API response received: [...]
   🔍 Hugging Face CLIP Analysis Result: {...}
   ```
4. Check backend terminal for logs:
   ```
   POST /api/huggingface/image-classification 200
   ```

### Test on Vercel

1. Deploy both frontend and backend
2. Submit a report with an image
3. Check browser console for the same logs with Vercel URLs
4. Check Vercel function logs in dashboard

## Troubleshooting

### CORS Errors

**Symptom**: `Access to fetch at 'https://backend.vercel.app/api/...' from origin 'https://frontend.vercel.app' has been blocked by CORS policy`

**Solution**:
1. Verify `FRONTEND_URL` is set correctly in backend environment variables
2. Check that frontend URL is in the `allowedOrigins` array in `backend/server.js`
3. Redeploy backend after changes

### API Key Not Configured

**Symptom**: Backend returns `500 - API key not configured`

**Solution**:
1. Verify `HUGGING_FACE_API_KEY` is set in backend `.env` (localhost) or Vercel environment variables (production)
2. Restart backend server (localhost) or redeploy (Vercel)

### Backend Not Found (404)

**Symptom**: Frontend shows `Failed to fetch` or `404 Not Found` when calling backend

**Solution**:
1. Verify `VITE_BACKEND_URL` is set correctly in frontend `.env`
2. Check that backend is running (localhost) or deployed (Vercel)
3. Test backend health endpoint: `curl https://your-backend.vercel.app/api/health`

### Hugging Face Model Loading

**Symptom**: First request takes 20-30 seconds or returns `503 - Model is loading`

**Solution**: This is normal! Hugging Face Inference API loads models on-demand. Subsequent requests will be faster. Wait and retry.

## Environment Variables Checklist

### Frontend (.env)
- ✅ VITE_BACKEND_URL
- ✅ VITE_FIREBASE_* (7 variables)
- ✅ VITE_WEATHER_API_KEY
- ✅ VITE_GEMINI_API_KEY
- ✅ VITE_CLOUDINARY_* (3 variables)
- ✅ VITE_HUGGING_FACE_API_KEY

### Backend (backend/.env)
- ✅ HUGGING_FACE_API_KEY
- ✅ FRONTEND_URL
- ✅ MONGODB_URI
- ✅ PORT (localhost only)
- ✅ NODE_ENV
- ✅ WEATHER_API_KEY
- ✅ GEMINI_API_KEY

## Security Notes

- Never commit `.env` files to git
- Keep API keys secure
- The Hugging Face API key is only stored on the backend
- CORS is configured to only allow requests from trusted origins
- Rate limiting is enabled on the backend API

## Support

If you encounter issues:
1. Check browser console and backend logs
2. Verify all environment variables are set
3. Test backend health endpoint
4. Review CORS configuration
5. Check Vercel function logs in dashboard
