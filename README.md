# 🌾 AgriKart — Demand-First Agricultural Supply Chain Platform (SIH 26033)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/ML-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)

AgriKart is a demand-first B2B/B2F agricultural supply chain platform engineered for **Smart India Hackathon (SIH) Problem Statement 26033**. The platform directly connects bulk buyers with farmers and Farmer Producer Organizations (FPOs) by starting with **confirmed demand**, eliminating speculative farming and reducing multi-tiered middleman markups.

---

## 🎯 Problem Statement: SIH 26033

*   **Problem:** Multiple intermediaries in the agricultural supply chain reduce farmers' earnings and increase prices for end consumers.
*   **Expected Solution:**
    1.  **Direct Farmer/FPO Connectivity:** Connect producers directly with bulk buyers via confirmed demand.
    2.  **Micro-Logistics Support:** Shared transport pooling and AI route optimization to minimize transport overhead.
    3.  **AI Demand & Price Forecasting:** Machine learning predictions to prevent gluts and guide pricing.
    4.  **Price Realization & Efficiency:** Better returns for farmers, lower costs for buyers, and full escrow payment transparency.

---

## 🚀 Core Platform Modules (SIH PPT Architecture)

### 1. 📋 Demand-Led Aggregation
*   **Confirmed Demand First:** Institutional buyers post verified crop requirements (crop type, quantity in MT, target max price, minimum quality grade, delivery deadline, and location).
*   **Radius Geofencing (Haversine):** Backend dynamically filters FPO crop yields within a configurable radius (e.g. 50km).
*   **Greedy Matching Algorithm:** Automatically matches and allocates yields from nearby FPOs prioritizing quality grade, price, and distance.

### 2. 🚛 Micro-Logistics & Route Optimization
*   **TSP Route Heuristic:** Computes optimal multi-stop pickup paths for transport trucks visiting multiple FPO collection points.
*   **Cost & Savings Analytics:** Calculates cumulative distance, estimated transit hours, diesel fuel costs, and percentage savings compared to individual pickup trips.

### 3. 🔬 Verifiable Quality Grading
*   **Farm-Gate Quality Audit:** FPO field agents log physical crop metrics (moisture content, size grade, defect score, pesticide test status, storage condition).
*   **Photo Evidence & Certificates:** Generates verifiable "Quality Certificates" (Grades A+, A, B, C) with photo evidence visible to buyers prior to order confirmation.

### 4. 🔐 Escrow & Payment Settlement
*   **Escrow Lifecycle:** Buyer payments are held in escrow (`deposited` → `held` → `released`).
*   **Delivery Verification:** Funds are released to farmers upon verified delivery confirmation with complete status tracking and payout breakdowns.

---

## 🤖 AI & ML Capability: XGBoost Demand Forecasting

*   **Demand & Price Forecaster:** Trained XGBoost models predict monthly INR/kg price trends and demand volume (MT) based on crop type, state, historical price/volume series, rainfall, temperature, and MSP.
*   **FastAPI ML Endpoint:** Exposes endpoints returning monthly forecasts with confidence intervals and categorical demand signals (`HIGH` / `MEDIUM` / `LOW`).

---

## 💻 Technology Stack

*   **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Zustand, React Icons.
*   **Backend:** Node.js, Express, TypeScript, Supabase (PostgreSQL + Auth + Storage), Nodemailer (Custom SMTP).
*   **ML Service:** Python 3.10+, FastAPI, XGBoost, Scikit-learn, Pandas, NumPy, Joblib, Uvicorn.

---

## 📁 Repository Structure

```
AgriKart/
├── frontend/             # Next.js 14 Web Application
│   ├── app/              # Demand-first pages (dashboard, demands, supply, quality, logistics, orders, auth)
│   ├── components/       # Design system, navbar, hero, features, quality audit form
│   └── lib/              # API integration clients (demands, supply, escrow, logistics, quality)
├── backend/              # Node.js + Express API Server
│   ├── src/routes/       # REST endpoints (demands, supply, escrow, aggregation, logistics, qualityAudit, auth)
│   ├── src/services/     # Core algorithms (aggregationService, logisticsService)
│   └── server.js         # Alternative Express entrypoint
├── ml/                   # FastAPI XGBoost Demand Forecasting Service
│   ├── api/              # Demand forecast HTTP routes & health checks
│   ├── dataset/          # Agriculture market historical dataset CSV
│   └── src/              # XGBoost training & inference scripts
├── docs/                 # SQL schemas & migration files
└── README.md             # This file
```

---

## 🛠️ Setup & Running Instructions

### 1. Prerequisites
*   **Node.js:** v18.0.0 or higher
*   **Python:** v3.10 or higher
*   **Database:** Supabase project (PostgreSQL)

---

### 2. Database Setup (Supabase)

Run the SQL scripts in your Supabase SQL Editor in the following order:
1. `consolidated_schema.sql` — Core users and profiles table
2. `docs/fpo_aggregation_schema.sql` — FPO yields and institutional demands tables
3. `docs/quality_audit_schema.sql` — Crop quality audit tables
4. `docs/demand_workflow_schema.sql` — Escrow payments and logistics orders tables

Create the required public storage bucket for photo evidence:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('crop-audits', 'crop-audits', true);
```

---

### 3. Environment Variables Setup

Create a `.env` file in `backend/`:
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

Create a `.env.local` file in `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

### 4. Running the Platform

#### A. Start the Backend API (Terminal 1):
```bash
cd backend
npm install
npm run dev
# Starts Express server at http://localhost:3001
```

#### B. Start the Frontend Client (Terminal 2):
```bash
cd frontend
npm install
npm run dev
# Starts Next.js app at http://localhost:3000
```

#### C. Start the ML Service (Terminal 3):
```bash
cd ml
pip install -r requirements.txt

# Train XGBoost Models (if not already trained)
python src/demand_forecasting/train_xgboost.py --data dataset/sample_demand_data.csv --output models

# Start FastAPI ML Server
uvicorn api.main:app --port 8000 --reload
# Starts ML service at http://localhost:8000
```

---

## 👤 User Roles & Key Workflows

1. **Institutional Buyer:**
   * Post demand requirements → View AI matched FPOs → Confirm order → Deposit escrow → Track delivery.
2. **Farmer / FPO:**
   * Browse open demands → Commit available supply quantity → View quality audits → Track pickup & payout status.
3. **FPO Field Agent:**
   * Conduct farm-gate crop quality audits → Log metrics & upload photos → Issue certified grade (A+, A, B, C).
4. **Logistics & Admin:**
   * View AI-optimized multi-stop pickup routes → Monitor transit & fuel savings → Verify delivery & trigger escrow release.
