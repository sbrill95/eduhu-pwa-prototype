# Teacher Assistant - Deployment Guide

## Issue: Vercel Frontend Shows Mock Responses

### Problem
The Vercel deployed frontend shows mock responses like "Das ist eine Beispiel-Antwort vom KI-Assistenten" instead of real OpenAI responses.

### Root Cause
1. **Backend Missing Environment Variables**: The backend Vercel deployment lacks the OpenAI API key
2. **Frontend Production Configuration**: In production, frontend expects backend at `/api` (same domain)

### Solution Steps

#### 1. Backend Deployment (Vercel)
1. **Set Environment Variables in Vercel Dashboard**:
   ```
   OPENAI_API_KEY = [YOUR_OPENAI_API_KEY]
   NODE_ENV = production
   API_PREFIX = /api
   FRONTEND_URL = [YOUR_FRONTEND_DOMAIN]
   ```

2. **Deploy Backend**:
   ```bash
   cd teacher-assistant/backend
   vercel --prod
   ```

#### 2. Frontend Deployment (Vercel)
1. **Set Environment Variables in Vercel Dashboard**:
   ```
   VITE_INSTANTDB_APP_ID = 39f14e13-9afb-4222-be45-3d2c231be3a1
   VITE_API_BASE_URL = [YOUR_BACKEND_DOMAIN]/api
   ```

2. **Deploy Frontend**:
   ```bash
   cd teacher-assistant/frontend
   vercel --prod
   ```

### Alternative: Separate Domain Deployment

If deploying frontend and backend to separate domains:

#### Update Frontend Configuration
```typescript
// In frontend/src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  'https://your-backend-domain.vercel.app/api';
```

#### Update Frontend Environment
```
VITE_API_BASE_URL=https://your-backend-domain.vercel.app/api
```

## Current Status
- ✅ Backend Vercel configuration updated with environment variables
- ✅ OpenAI API key properly configured in local development
- ⚠️ Need to set environment variables in Vercel dashboard
- ⚠️ Need to redeploy both frontend and backend

## Testing Deployment
1. **Test Backend Health**: `https://your-backend-domain.vercel.app/api/health`
2. **Test Chat Health**: `https://your-backend-domain.vercel.app/api/chat/health`
3. **Test Frontend**: Send a chat message and verify real OpenAI response

## Environment Variables Reference

### Backend (.env)
```
NODE_ENV=production
OPENAI_API_KEY=sk-proj-...
API_PREFIX=/api
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Frontend (.env)
```
VITE_INSTANTDB_APP_ID=39f14e13-9afb-4222-be45-3d2c231be3a1
VITE_API_BASE_URL=https://your-backend-domain.vercel.app/api
```