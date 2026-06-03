# Deployment Guide

## Frontend Deployment (Vercel)

### Step 1: Connect GitHub
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project" and connect your GitHub repo
3. Select your frontend directory

### Step 2: Add Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

### Step 3: Deploy
Vercel auto-deploys on push to main branch

---

## Backend Deployment (Railway)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Deploy
```bash
cd backend
railway up
```

### Step 3: Add Environment Variables
In Railway dashboard:
```
SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_key
PORT=3001
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## Database Setup (Supabase)

1. Create project at [supabase.com](https://supabase.com)
2. Run SQL migrations from `docs/DATABASE.md`
3. Get URL and API keys
4. Update environment variables

---

## Custom Domain Setup

### Frontend
Update DNS: `yourdomain.com` -> Vercel DNS records

### Backend
Update DNS: `api.yourdomain.com` -> Railway/Render domain

---

## Security Checklist

- ✅ Environment variables secured
- ✅ HTTPS enabled
- ✅ CORS configured
- ✅ Rate limiting active
- ✅ API keys rotated

---

## Cost Estimation (Monthly)

- Frontend (Vercel): $0-20
- Backend (Railway): $5-50
- Database (Supabase): $25-100
- Domain: $10-15

**Total**: ~$50-150/month

---

For detailed deployment instructions, refer to platform-specific documentation.
