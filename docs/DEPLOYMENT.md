# 🚀 AgriKart Production Deployment Guide

This guide provides step-by-step instructions for deploying the refactored **AgriKart Demand-First Agricultural Supply Chain Platform** (SIH 26033) across cloud providers.

---

## 🏗️ Architecture Overview

The system consists of three independent microservices connected to a managed Supabase database:

```
                  ┌─────────────────────────────────┐
                  │    Next.js 14 Frontend          │
                  │    (Deploy on Vercel)           │
                  └────────────────┬────────────────┘
                                   │
                                   ▼
                  ┌─────────────────────────────────┐
                  │    Express TypeScript Backend   │
                  │    (Deploy on Render / Railway) │
                  └───────┬─────────────────┬───────┘
                          │                 │
                          ▼                 ▼
  ┌───────────────────────────────┐   ┌───────────────────────────────┐
  │   Supabase (PostgreSQL + Auth)│   │   FastAPI ML Demand Service   │
  │   (Cloud Database & Storage)  │   │   (Deploy on Render / Railway)│
  └───────────────────────────────┘   └───────────────────────────────┘
```

---

## 1. Database & Storage Deployment (Supabase)

### Step 1: SQL Schema Execution
In your production Supabase project [SQL Editor](https://supabase.com/dashboard), run the scripts in exact order:
1. `consolidated_schema.sql` (Users & Profiles)
2. `docs/fpo_aggregation_schema.sql` (Demands & Yields)
3. `docs/quality_audit_schema.sql` (Crop Audits)
4. `docs/demand_workflow_schema.sql` (Escrow & Logistics)

### Step 2: Storage Bucket Setup
Create a public storage bucket for farm-gate quality audit photo evidence:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('crop-audits', 'crop-audits', true)
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Auth & Custom SMTP Configuration
1. Go to **Authentication ➔ URL Configuration**:
   * **Site URL**: `https://your-frontend-domain.vercel.app`
   * **Redirect URLs**: `https://your-frontend-domain.vercel.app/**`
2. Configure Custom SMTP under **Authentication ➔ Provider Settings ➔ Email**.

---

## 2. Frontend Deployment (Vercel)

### Step 1: Import Project to Vercel
1. Sign in to [Vercel](https://vercel.com) and click **Add New ➔ Project**.
2. Connect your GitHub repository: `atharvrahate296/AgriKart`.
3. Set **Root Directory** to `frontend`.

### Step 2: Configure Environment Variables
Add the following production environment variables in Vercel:

| Variable | Value Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` (Your deployed Express backend URL) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase `anon` public key |

### Step 3: Deploy
* Click **Deploy**. Vercel will automatically build the Next.js app.

---

## 3. Backend API Deployment (Render / Railway)

### Option A: Render Deployment (Free/Paid Web Service)

1. Sign in to [Render](https://render.com) and click **New ➔ Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   * **Root Directory**: `backend`
   * **Environment**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `node dist/index.js`
4. Add Environment Variables in Render:

| Variable | Value |
|---|---|
| `PORT` | `3001` (or leave default) |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-frontend-domain.vercel.app` |
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase `anon` key |
| `SUPABASE_SERVICE_KEY` | Your Supabase `service_role` secret key |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your-email@gmail.com` |
| `SMTP_PASS` | Your 16-character Gmail App Password |
| `SMTP_FROM` | `"AgriKart" <your-email@gmail.com>` |

5. Click **Create Web Service**.

---

### Option B: Railway Deployment (CLI)

```bash
cd backend
railway login
railway init
railway up
```
In Railway Dashboard, set the environment variables listed above.

---

## 4. ML Demand Forecasting Service Deployment (Render / Railway)

### Option A: Render Deployment (Python Web Service)

1. Click **New ➔ Web Service** on Render.
2. Select repository and set **Root Directory** to `ml`.
3. Configure settings:
   * **Environment**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt && python src/demand_forecasting/train_xgboost.py --data dataset/sample_demand_data.csv --output models`
   * **Start Command**: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   * `ENV` = `production`
   * `DEMAND_MODEL_DIR` = `models`

---

### Option B: Docker Deployment

You can containerize the ML service using Docker:

```dockerfile
# ml/Dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Train XGBoost models at build time
RUN python src/demand_forecasting/train_xgboost.py --data dataset/sample_demand_data.csv --output models

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run container:
```bash
cd ml
docker build -t agrikart-ml-service .
docker run -d -p 8000:8000 agrikart-ml-service
```

---

## 5. Post-Deployment Verification & Smoke Tests

After deploying all three services, verify system health:

### 1. Backend Health Check:
```bash
curl https://your-backend.onrender.com/health
# Expected: {"status":"OK","timestamp":"..."}
```

### 2. ML Service Health Check:
```bash
curl https://your-ml-service.onrender.com/api/demand-forecast/health
# Expected: {"success":true,"ready":true,"message":"All models loaded and ready"}
```

### 3. End-to-End Workflow Test:
1. Open your Vercel frontend URL.
2. Register a new user as an **Institutional Buyer**.
3. Create a **Demand Requirement** (e.g. 20 MT Tomato, Max ₹40/kg).
4. Click **Find FPOs** to trigger the aggregation engine.
5. Verify matching and escrow deposit initialization.

---

## 🔒 Production Security Checklist

- [x] CORS restricted to `FRONTEND_URL` in backend `index.ts`.
- [x] `SUPABASE_SERVICE_KEY` stored exclusively in server environment variables (never exposed in frontend).
- [x] SSL/HTTPS enabled across Vercel, Render, and Supabase.
- [x] Database RLS policies verified on Supabase tables.
- [x] Public storage bucket permissions set for `crop-audits`.
