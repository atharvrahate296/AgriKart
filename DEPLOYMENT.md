# AgriKart – Full‑Stack Deployment Guide
*Frontend (Vercel) · Backend (Render) · ML Service (Render)*

> This document walks you through deploying the complete AgriKart platform—frontend, Node/Express backend, and Python FastAPI ML service—on **Vercel** and **Render**.  
> All three parts share the same GitHub repository and a single **Supabase** PostgreSQL project.

---  

## Table of Contents
1. [Prerequisites](#1-prerequisites)  
2. [Repository Setup](#2-repository-setup)  
3. [Supabase Database](#3-supabase-database)  
4. [Frontend – Vercel](#4-frontend---vercel)  
5. [Backend – Render](#5-backend---render)  
6. [ML Service – Render](#6-ml-service---render)  
7. [Environment Variables](#7-environment-variables)  
8. [Post‑deployment verification](#8-post-deployment-verification)  
9. [Troubleshooting & Tips](#9-troubleshooting--tips)  

---  

## 1️⃣ Prerequisites  

| Tool/Account | What you need |
|--------------|---------------|
| **GitHub** | Repo containing the `AgriKart` folder (frontend, backend, ml). |
| **Vercel account** | Free tier – https://vercel.com |
| **Render account** | Free tier – https://render.com |
| **Supabase project** | PostgreSQL + Auth + Storage – https://supabase.com |
| **Node ≥ 18** & **Python ≥ 3.10** | Only needed for local testing; the platforms provide their own runtimes. |
| (Optional) **Gmail App‑Password** | For SMTP mail delivery – see § 7.2. |

---  

## 2️⃣ Repository Setup  

1. **Create a new GitHub repo** (e.g. `agrikart`).  
2. **Push the whole project** (all folders: `frontend/`, `backend/`, `ml/`, `docs/`, `consolidated_schema.sql`, etc.).  
3. Make sure `.gitignore` excludes `node_modules/`, `backend/.env`, `ml/env/`, and any local build artefacts.

```bash
# Example (from the project root)
git init
git add .
git commit -m "initial commit"
git remote add origin git@github.com:your‑user/agrikart.git
git push -u origin main
```

---  

## 3️⃣ Supabase Database  

> Run the SQL scripts **in this order** via the Supabase SQL editor.

1. `consolidated_schema.sql` – core `profiles` & `users` tables.  
2. `docs/fpo_aggregation_schema.sql` – `institutional_demands`, `fpo_yields`, etc.  
3. `docs/quality_audit_schema.sql` – `crop_quality_audits`.  
4. `docs/demand_workflow_schema.sql` – `escrow_payments`, `logistics_orders`.  

Create the public storage bucket for quality‑audit photos:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('crop-audits', 'crop-audits', true);
```

> **Note** – Keep the Supabase anon key and service role key handy; you’ll add them as environment variables later.

---  

## 4️⃣ Frontend – Vercel  

### 4.1 Create the project  

1. Vercel → **New Project** → import the GitHub repo.  
2. Framework preset: **Next.js** (auto‑detected).  

### 4.2 Build & Start commands  

| Field | Value |
|-------|-------|
| **Build Command** | `npm run build` (runs `next build`) |
| **Start Command** | `npm run start` (runs `next start`) |

### 4.3 Environment variables (Vercel → Project → Settings → Environment Variables)

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-onrender.com` *(the Render backend URL you’ll get in § 5)* |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your‑supabase-project>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `public anon key from Supabase → Settings → API` |

> **Tip:** Enable **Preview Deployments** so every PR gets a temporary URL for testing.

### 4.4 Deploy  

Vercel will give you a URL like `https://agrikart.vercel.app`.  
All frontend API calls (auth, demands, logistics, etc.) will hit the Render backend via `NEXT_PUBLIC_API_URL`.

---  

## 5️⃣ Backend – Render (Node + Express)  

### 5.1 Create a Web Service  

1. Render dashboard → **New → Web Service** → connect the same GitHub repo.  
2. **Root Directory**: leave blank (the repo root contains `backend/`).  
3. **Environment**: Node.  

### 5.2 Build / Start commands  

| Field | Value |
|-------|-------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` (runs `node dist/index.js`) |

### 5.3 Environment variables (Render → Service → Environment)

| Key | Value (replace placeholders) |
|-----|-----------------------------|
| `PORT` | *leave empty – Render injects `$PORT*` automatically* |
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | `https://<your‑supabase-project>.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `service_role key from Supabase → Settings → API` |
| `FRONTEND_URL` | `https://your-vercel-app.vercel.app` (the Vercel URL from § 4) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your‑gmail‑address@gmail.com` |
| `SMTP_PASS` | *Google **App Password** (16‑char) – see note below* |
| `SMTP_FROM` | `"AgriKart <your‑gmail‑address@gmail.com>"` |

#### Gmail App‑Password steps  

1. Log into the Google account that will send mail.  
2. **Security → 2‑Step Verification** (enable if off).  
3. Scroll to **App passwords** → **Generate**.  
4. Choose *Mail* as the app and *Windows computer* as the device.  
5. Copy the 16‑character password → paste into `SMTP_PASS` on Render.

> **Alternative** – If you prefer a transactional service (SendGrid, Mailgun, Amazon SES), just set the corresponding `SMTP_HOST`, `PORT`, `USER`, `PASS`. The code already reads those env vars.

### 5.4 Deploy  

Render will give you a URL like `https://agrikart-backend.onrender.com`.  
The backend CORS middleware already uses `FRONTEND_URL`, so the frontend can call `https://agrikart-backend.onrender.com/...`.

---  

## 6️⃣ ML Service – Render (Python + FastAPI)  

### 6.1 Create a second Web Service  

1. **Root Directory**: `ml/`.  
2. **Environment**: Python.  

### 6.2 Build / Start commands  

| Field | Value |
|-------|-------|
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn api.main:app --host 0.0.0.0 --port $PORT` |

### 6.3 Environment variables (same panel as the backend, if the ML service needs Supabase)

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://<your‑supabase-project>.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `service_role key` (optional – only if the ML service writes audit data) |

### 6.4 Deploy  

Render will give you a URL like `https://agrikart-ml.onrender.com`.  
The service exposes `/api/demand-forecast` (POST) for price/volume predictions.

---  

## 7️⃣ Environment Variables – Complete Summary  

| Service | Variable | Description | Example |
|---------|----------|-------------|---------|
| **Frontend (Vercel)** | `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://agrikart-backend.onrender.com` |
| | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://hjxbviudggsqswsktwhb.supabase.co` |
| | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous JWT key | `eyJ...` |
| **Backend (Render)** | `PORT` | (omitted – Render injects) | — |
| | `NODE_ENV` | `production` | — |
| | `SUPABASE_URL` | Supabase URL | — |
| | `SUPABASE_SERVICE_KEY` | Service‑role key | — |
| | `FRONTEND_URL` | Vercel app URL | `https://agrikart.vercel.app` |
| | `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| | `SMTP_PORT` | Port (587 for STARTTLS) | `587` |
| | `SMTP_USER` | Gmail address (or other SMTP user) | `my.email@gmail.com` |
| | `SMTP_PASS` | App password or SMTP password | `abcd efgh ijkl mnop` |
| | `SMTP_FROM` | Sender name & address | `"AgriKart <my.email@gmail.com>"` |
| **ML Service (Render)** | `SUPABASE_URL` | (optional) | — |
| | `SUPABASE_SERVICE_KEY` | (optional) | — |

> **Important:** Keep `backend/.env` **out of the repository** (it is already listed in `.gitignore`). All production values must be supplied via the platforms’ UI, not checked in.

---  

## 8️⃣ Post‑deployment verification  

| Test | Expected result |
|------|-----------------|
| **Open frontend** `https://agrikart.vercel.app` | Landing page loads, “Sign up / Log in” works. |
| **Create a new account** (buyer or farmer) | Receives a verification email (check the Gmail inbox you configured). |
| **Password‑reset request** | Email with 6‑digit OTP arrives; entering the OTP logs you in. |
| **Call backend health** `curl https://agrikart-backend.onrender.com/health` | JSON `{ status: "ok" }` (or similar). |
| **Call ML forecast** `curl -X POST https://agrikart-ml.onrender.com/api/demand-forecast -H "Content-Type: application/json" -d '{"crop":"Corn","state":"Maharashtra","planting_date":"2024-06-01"}'` | Returns a JSON forecast object (price, volume, demand signal). |
| **CORS** – try a request from the Vercel URL to the backend; no `CORS` errors. | Success. |

If any test fails, check the **Render logs** (`Render → Service → Logs`) and **Vercel logs** (`Vercel → Functions → Logs`) for the exact error messages.

---  

## 9️⃣ Troubleshooting & Tips  

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| Emails never arrive | Wrong `SMTP_PASS` (maybe not an App Password) or Gmail blocking new IP | Generate a fresh Gmail App Password; or switch to SendGrid/Mailgun. |
| `CORS` error on frontend → backend | `FRONTEND_URL` not set or mismatched | Add the exact Vercel URL to `FRONTEND_ENV` on Render, redeploy. |
| ML forecast returns 500 | Missing model files or wrong `requirements.txt` | Ensure `ml/models/` folder is committed, or re‑run `python src/demand_forecasting/train_xgboost.py` locally and push the `models/` directory. |
| Build fails on Render (Node) | `npm run build` expects `tsc` output in `dist/` | Verify `backend/tsconfig.json` and that `npm run build` runs successfully locally first. |
| Frontend shows blank page | `NEXT_PUBLIC_API_URL` points to wrong backend URL | Update the env var on Vercel to the correct Render URL and redeploy. |

---  

## 📂 Final Folder‑Level Checklist  

```
AgriKart/
├── frontend/                # Next.js app – deployed to Vercel
│   ├── package.json
│   └── ... (all source)
├── backend/                # Express API – deployed to Render
│   ├── package.json
│   ├── .env                # kept OUT of git
│   └── ...
├── ml/                     # FastAPI ML – deployed to Render (sub‑service)
│   ├── api/main.py
│   ├── requirements.txt
│   └── ...
├── docs/                   # SQL schemas
├── consolidated_schema.sql
└── README.md
```

When you push a commit to `main`, **Vercel** and **Render** automatically start a new build/deploy. No further manual steps are required besides updating environment variables if you change any config.

---  

### 🎉 You’re ready!

1. Follow the steps above to set up Supabase, create the GitHub repo, and add the env vars on Vercel & Render.  
2. Push your first commit – the platforms will build and give you live URLs.  
3. Test the sign‑up / password‑reset flow; you should receive the HTML emails in your inbox.  

If you hit any snag, drop the exact log line here and I’ll help troubleshoot!