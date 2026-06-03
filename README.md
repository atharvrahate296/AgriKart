# 🌾 AgriKart — Agricultural E-Commerce Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![Supabase](<https://img.shields.io/badge/Database-Supabase%20(PostgreSQL)-3ECF8E?logo=supabase>)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Socket.io](https://img.shields.io/badge/Real--time-Socket.io-black?logo=socket.io)](https://socket.io/)

> **Connecting Farmers with Vendors Directly** — A modern agricultural marketplace built for the Indian farming community.

AgriKart eliminates middlemen by providing a direct vendor-to-farmer e-commerce platform with real-time messaging, advanced product search, and seamless cart and checkout flows.

---

## 🎯 Problem Statement

Farmers face challenges accessing quality agricultural products at fair prices due to:

- Multiple intermediaries inflating product costs
- Lack of transparency in pricing and quality
- No efficient way to communicate directly with vendors
- Difficulty fulfilling bulk orders across multiple suppliers

**AgriKart solves this** with a direct marketplace, real-time vendor chat, transparent pricing, and cross-vendor order fulfillment.

---

## 🚀 Tech Stack

> Only technologies confirmed present in the codebase are listed.

### Frontend

| Technology           | Version | Role                         |
| -------------------- | ------- | ---------------------------- |
| **Next.js**          | 14.x    | React framework (App Router) |
| **React**            | 18.x    | UI library                   |
| **TypeScript**       | 5.4     | Type safety                  |
| **Tailwind CSS**     | 3.4     | Utility-first styling        |
| **Zustand**          | 4.4     | Global state management      |
| **Socket.io Client** | 4.7     | Real-time vendor-farmer chat |
| **Framer Motion**    | 10.x    | Animations & transitions     |
| **React Icons**      | 5.x     | Icon library                 |
| **Axios**            | 1.7     | HTTP client for API calls    |
| **Supabase JS**      | 2.x     | Auth & direct DB access      |

### Backend

| Technology            | Version | Role                            |
| --------------------- | ------- | ------------------------------- |
| **Node.js**           | 18+     | Runtime                         |
| **Express.js**        | 4.18    | REST API framework              |
| **Socket.io**         | 4.7     | WebSocket server (live chat)    |
| **Supabase JS**       | 2.x     | PostgreSQL client / Auth        |
| **JWT**               | 9.x     | Token-based authentication      |
| **bcryptjs**          | 2.4     | Password hashing                |
| **express-validator** | 7.x     | Request validation              |
| **CORS**              | 2.8     | Cross-origin resource sharing   |
| **dotenv**            | 16.x    | Environment variable management |
| **nodemon**           | 3.x     | Dev auto-reload                 |

### Cloud & Infrastructure

| Service                              | Role                                |
| ------------------------------------ | ----------------------------------- |
| **Supabase**                         | Managed PostgreSQL + Auth + Storage |
| **Vercel** _(recommended)_           | Frontend deployment                 |
| **Railway / Render** _(recommended)_ | Backend deployment                  |

---

## 📁 Project Structure

```
AgriKart/
├── frontend/                    # Next.js 14 Application (TypeScript)
│   ├── app/
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Home page
│   │   ├── auth/                # Login / signup pages
│   │   ├── cart/                # Shopping cart
│   │   ├── checkout/            # Checkout flow
│   │   ├── products/            # Product listing & detail pages
│   │   └── vendor/              # Vendor dashboard
│   ├── components/              # Reusable React components
│   │   ├── navbar.tsx
│   │   ├── footer.tsx
│   │   ├── hero-section.tsx
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── product-details.tsx
│   │   ├── vendor-card.tsx
│   │   ├── vendor-dashboard.tsx
│   │   ├── search-filters.tsx
│   │   ├── cart-items.tsx
│   │   ├── cart-summary.tsx
│   │   ├── categories-section.tsx
│   │   ├── featured-products.tsx
│   │   ├── cta.tsx
│   │   └── providers.tsx
│   ├── lib/                     # Utilities, store, API client
│   ├── styles/                  # Global styles
│   ├── public/                  # Static assets
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   └── .env.local.example
│
├── backend/                     # Node.js + Express API Server
│   ├── server.js                # Main entry — REST API + Socket.io
│   ├── config/                  # DB & service configuration
│   ├── middleware/              # Auth & validation middleware
│   ├── check_db.js              # Database connection health check
│   ├── seed_db.js               # Database seeding script
│   ├── package.json
│   └── .env.example
│
├── docs/                        # Documentation
│   ├── API.md                   # REST API reference
│   ├── DATABASE.md              # Schema & table definitions
│   └── DEPLOYMENT.md            # Cloud deployment guide
│
├── tests/                       # Executable Jest test suite
│   ├── run_tests.js             # ▶ Master runner  →  node run_tests.js
│   ├── setup.js                 # Loads backend/.env before tests
│   ├── package.json             # Jest + test dependencies
│   ├── database.test.js         # Supabase connection & CRUD tests
│   ├── backend.test.js          # REST API endpoint tests (axios)
│   ├── socket.test.js           # Socket.io real-time event tests
│   └── frontend.test.js         # Next.js page smoke tests (axios)
│
├── .gitignore
└── README.md                    # This file
```

---

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js** 18+ (with npm)
- **Supabase** account — [supabase.com](https://supabase.com)
- **Git**

---

### 1. Clone the Repository

```bash
git clone https://github.com/atharvrahate296/AgriKart
cd AgriKart
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Fill in your Supabase credentials in .env:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_KEY=your_service_role_key
# PORT=3001
# FRONTEND_URL=http://localhost:3000
# JWT_SECRET=your_jwt_secret

# Start development server
npm run dev
# ✅ API available at http://localhost:3001
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Fill in your Supabase credentials in .env.local:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Start development server
npm run dev
# ✅ App available at http://localhost:3000
```

---

### 4. Database Setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API** and copy your URL & keys
3. Run the schema setup:

```bash
# From the backend folder, seed the database:
node seed_db.js

# Or verify DB connection first:
node check_db.js
```

4. Alternatively, manually run the SQL from `docs/DATABASE.md` in the Supabase SQL Editor.

---

### Run Tests

```bash
cd tests
node run_tests.js
```

> The runner auto-installs its dependencies, checks which servers are up, prompts you if anything is offline, then runs all suites (Database → Backend API → Socket.io → Frontend) with a final pass/fail summary.

---

## 🔑 Key Features

### For Farmers 🧑‍🌾

- Browse & search products across categories (Seeds, Fertilizers, Pesticides, Equipment, etc.)
- Advanced filters by price, category, rating, and availability
- Direct real-time chat with vendors via Socket.io
- Cart, checkout, and order placement
- Vendor ratings and reviews

### For Vendors 🏬

- Vendor profile and store management dashboard
- Product listing and inventory management
- Customer messaging via live chat
- Order tracking and fulfillment

### Platform

- Supabase-powered authentication (JWT sessions)
- Real-time WebSocket communication
- Responsive design for mobile, tablet, and desktop
- Animated UI using Framer Motion

---

## 📖 Documentation

| File                                     | Description                           |
| ---------------------------------------- | ------------------------------------- |
| [docs/API.md](docs/API.md)               | REST API endpoints reference          |
| [docs/DATABASE.md](docs/DATABASE.md)     | Database schema and table structure   |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment guide for Vercel + Railway |
| [CONTRIBUTING.md](CONTRIBUTING.md)       | How to contribute to this project     |

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork and create a feature branch
git checkout -b feature/your-feature-name
git commit -m 'feat: add amazing feature'
git push origin feature/your-feature-name
# Open a Pull Request
```

---

## 📝 License

MIT License — Copyright (c) 2026 AgriKart Contributors.

See [LICENSE](LICENSE) for full text.

---

_Made with ❤️ for Indian Farmers · Last Updated: June 2026_
