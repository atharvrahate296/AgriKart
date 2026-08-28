# 🌾 AgriKart — Project Details & Folder Guide

**Smart India Hackathon 2026 — Problem Statement 26033**  
*Title: "Multiple intermediaries reduce farmers' earnings and increase consumer prices."*

---

## 📌 Executive Summary

**AgriKart** is a **demand-first B2B/B2F agricultural supply-chain platform** engineered to solve the systemic issue of excessive middleman markups in Indian agriculture. 

Unlike traditional e-commerce or speculative listing platforms where farmers harvest crops without guaranteed buyers, AgriKart reverses the paradigm:
```
Confirmed Demand (Buyer) ➔ Radius Matching (FPOs) ➔ Quality Grading (Farm-gate) ➔ Route Optimization (Logistics) ➔ Escrow Settlement
```

1. **Institutional Buyers** post confirmed crop requirements (quantity, target price, minimum quality grade, delivery deadline, location).
2. **Nearby FPOs & Farmers** are dynamically aggregated using Haversine geofencing (50km radius) and a greedy match optimizer.
3. **FPO Field Agents** inspect produce at the farm gate, generating verifiable **Quality Certificates** with photo evidence.
4. **Shared Transport** uses Travelling Salesperson Problem (TSP) heuristics to pool multi-stop pickups, saving fuel and transport costs.
5. **Escrow Payments** hold buyer funds until delivery verification, guaranteeing transparent payouts to farmers.
6. **XGBoost ML Models** forecast crop demand and price trends to prevent market gluts.

---

## 📁 Folder Structure & Directory Purpose

```
AgriKart/
├── frontend/               # Next.js 14 web application (TypeScript + Tailwind CSS)
├── backend/                # Express API server (TypeScript)
├── ml/                     # FastAPI Python service for XGBoost Demand & Price Forecasting
├── docs/                   # SQL Schemas & Database Migration Scripts
├── consolidated_schema.sql  # Master database schema for core profiles & users
├── README.md               # Quickstart guide & installation instructions
└── PROJECT_DETAILS.md      # This architectural & directory documentation file
```

---

### 1. `frontend/` — Client Web Application
The web interface built with **Next.js 14 (App Router)**, **React 18**, **TypeScript**, and **Tailwind CSS**. It provides role-specific dashboards and streamlined workflows.

* **`frontend/app/`**: Route pages built with Next.js App Router.
  * **`page.tsx`**: Platform landing page featuring the demand-first narrative, stats, and module overviews.
  * **`dashboard/`**: Role-adapted dashboard (buyer stats, farmer commitments, admin metrics).
  * **`demands/`**: 
    * `page.tsx`: Demand Board listing open requirements.
    * `[id]/page.tsx`: Single demand detail with progress bar, matched FPOs, and action triggers.
    * `create/page.tsx`: Form for buyers to post new crop requirements.
  * **`supply/`**: 
    * `page.tsx`: View available demands that farmers/FPOs can commit supply to.
    * `commit/[demandId]/page.tsx`: Form for farmers to allocate harvest quantities.
  * **`quality/`**: Quality inspection hub displaying pending audits and certified quality badges.
  * **`logistics/`**: Route optimization visualizer showing multi-stop pickup sequences, distances, transit times, and fuel savings.
  * **`orders/`**: Order status tracking and escrow payment progress.
  * **`auth/`**: Authentication pages (Login, Signup with role selection, Password reset, Verification).
  * **`profile/`**: User profile management.

* **`frontend/components/`**: Reusable UI design system.
  * **`navbar.tsx`**: Role-aware navigation header (adapts menu options for Buyer, Farmer, Agent, Admin).
  * **`footer.tsx`**: Platform footer.
  * **`hero-section.tsx`**: Demand-first hero banner with real-time impact metrics.
  * **`features-info.tsx`**: Visual card grid explaining the 4 PPT core modules.
  * **`quality-audit-form.tsx`**: Interactive farm-gate quality inspection form and buyer-facing Quality Certificate component.
  * **`providers.tsx`**: Global context providers.

* **`frontend/lib/`**: Client utilities and API integrations.
  * **`api/demands.ts`**: API client for demand lifecycle (create, fetch, match, confirm).
  * **`api/supply.ts`**: API client for farmer supply commitments.
  * **`api/escrow.ts`**: API client for payment escrow operations.
  * **`api/logistics.ts`**: API client for route optimization services.
  * **`store/cartStore.ts`**: Global Zustand state store managing active user role and UI state.
  * **`hooks/useAuth.ts`**: Authentication hook with Supabase auth state listener.

---

### 2. `backend/` — REST API Gateway & Business Logic
The backend server built with **Node.js**, **Express**, **TypeScript**, and **Supabase (PostgreSQL)**.

* **`backend/src/index.ts`**: Main entrypoint for the Express server. Configures security middleware (Helmet, CORS), route mounts, and error handlers.
* **`backend/server.js`**: Secondary server script supporting core feature endpoints.
* **`backend/src/routes/`**: API endpoint definitions.
  * **`demands.ts`**: CRUD endpoints for institutional demands and auto-matching trigger.
  * **`supply.ts`**: Endpoints for farmer yield commitments and demand browsing.
  * **`escrow.ts`**: Endpoints for escrow deposit, delivery verification, and farmer payout release.
  * **`aggregation.ts`**: Radius-based FPO aggregation matching algorithms.
  * **`logistics.ts`**: Multi-stop pickup route optimization endpoint.
  * **`qualityAudit.ts`**: Crop quality audit submission and certification endpoints.
  * **`auth.ts`**: User signup, login, custom SMTP email verification, and profile handling.
* **`backend/src/services/marketplace/`**: Business logic engines.
  * **`aggregationService.ts`**: Implements Haversine geofencing distance calculations (50km radius) and the greedy matching algorithm prioritizing quality grade, price, and distance.
  * **`logisticsService.ts`**: Implements Nearest-Neighbor Travelling Salesperson Problem (TSP) heuristic for multi-stop vehicle pickup routes and financial savings estimates.
* **`backend/src/config/`**: Supabase admin client initialization and environment configs.

---

### 3. `ml/` — XGBoost Demand Forecasting Service
An independent Python microservice powered by **FastAPI** and **XGBoost**.

* **`ml/api/main.py`**: FastAPI application entry point. Serves CORS, global exception handling, and mounts routers.
* **`ml/api/demand_routes.py`**: Exposes `/api/demand-forecast` POST endpoint for multi-month crop price (INR/kg) and volume (MT) predictions, alongside categorical demand signals (`HIGH` / `MEDIUM` / `LOW`).
* **`ml/src/demand_forecasting/`**:
  * **`train_xgboost.py`**: Training script that processes historical market data, engineers lag/rolling features, and trains XGBoost regressors.
  * **`predict.py`**: Inference pipeline loading pre-trained models to return predictions and confidence intervals.
* **`ml/dataset/sample_demand_data.csv`**: Historical dataset covering Indian crop prices, arrival volumes, weather parameters, and Minimum Support Prices (MSP).
* **`ml/requirements.txt`**: Minimal, focused Python dependencies (FastAPI, XGBoost, Scikit-learn, Pandas, NumPy, Supabase).

---

### 4. `docs/` & Database Schemas
Contains database migration scripts for PostgreSQL hosted on Supabase.

* **`consolidated_schema.sql`**: Core system schema establishing `profiles` and `users` tables with role validation (`farmer`, `buyer`, `fpo_agent`, `admin`).
* **`docs/fpo_aggregation_schema.sql`**: Defines `institutional_demands`, `fpo_yields`, and `demand_fulfillment_groups` for demand-led supply allocation.
* **`docs/quality_audit_schema.sql`**: Defines `crop_quality_audits` storing metric scores and Supabase Storage photo evidence URLs.
* **`docs/demand_workflow_schema.sql`**: Defines `escrow_payments` and `logistics_orders` tracking lifecycle statuses (`deposited` → `held` → `released` / `planned` → `in_transit` → `delivered`).

---

## ⚡ Core Feature Summary

| Module | Feature | Implementation Details |
|---|---|---|
| **Demand Aggregation** | Radius Geofencing | Filters FPOs within a 50km radius via Haversine formula |
| | Greedy Match Optimizer | Greedily satisfies bulk demand by ranking FPOs by quality, price & proximity |
| **Micro-Logistics** | Route Optimization | TSP Nearest-Neighbor heuristic plans efficient multi-pickup truck routes |
| | Financial Analytics | Calculates diesel fuel cost, estimated transit time, and % savings vs individual trips |
| **Quality Grading** | Farm-Gate Audit | FPO agents record moisture, size, defects, pesticide residue & photos |
| | Quality Certificate | Auto-generates shareable certified quality badge (Grade A+, A, B, C) |
| **Escrow Settlement** | Payment Escrow | Status-tracked escrow (`deposited` → `held` → `released`) tied to delivery verification |
| | Transparent Payouts | Breakdown of individual farmer settlements upon verified delivery |
| **AI Demand ML** | Price & Volume Forecast | XGBoost regression predicting price trends and demand signals (HIGH/MEDIUM/LOW) |

---

## 👥 User Role Overview

1. **Institutional Buyer:** Posts crop demands, triggers auto-matching, confirms allocation, deposits escrow, and tracks delivery.
2. **Farmer / FPO:** Views open demands, commits available harvest quantity, reviews quality certifications, and tracks payouts.
3. **FPO Field Agent:** Performs on-site crop quality inspections, logs physical metrics, uploads photos, and issues quality certificates.
4. **Platform Admin / Logistics:** Views logistics routes, monitors pooled transport efficiency, verifies deliveries, and releases escrow funds.
