# 📡 AgriKart REST API Documentation

## Base URLs
- **Backend API:** `http://localhost:3001`
- **FastAPI ML Service:** `http://localhost:8000`

---

## 1. 📋 Institutional Demands API (`/api/demands`)

### Create Demand Requirement
```http
POST /api/demands
Content-Type: application/json

{
  "buyer_profile_id": "uuid",
  "crop_type": "tomato",
  "required_quantity": 25.0,
  "max_price_per_kg": 38.5,
  "min_quality_grade": "A",
  "required_by": "2026-09-05",
  "latitude": 18.5204,
  "longitude": 73.8567,
  "delivery_address": "APMC Yard, Pune, Maharashtra"
}
```

### List Demands
```http
GET /api/demands?status=open&crop_type=tomato&page=1&limit=20
```

### Get Demand Detail & Matched FPOs
```http
GET /api/demands/:id
```

### Trigger Auto-Matching Algorithm
```http
POST /api/demands/:id/match
```

### Buyer Confirm Order
```http
POST /api/demands/:id/confirm
```

---

## 2. 🌾 Farmer Supply API (`/api/supply`)

### Get Demands Available for Farmer Commitment
```http
GET /api/supply/available-demands?crop_type=tomato
```

### Commit Farmer Supply to a Demand
```http
POST /api/supply/commit
Content-Type: application/json

{
  "fpo_profile_id": "uuid",
  "demand_id": "uuid",
  "crop_type": "tomato",
  "available_quantity": 15.0,
  "price_per_kg": 35.0,
  "quality_grade": "A",
  "latitude": 19.9975,
  "longitude": 73.7898,
  "location_name": "Sahyadri Packhouse, Nashik"
}
```

### Get Farmer Active Commitments
```http
GET /api/supply/my-commitments?farmer_id=uuid
```

---

## 3. 🔐 Escrow & Settlement API (`/api/escrow`)

### Record Buyer Escrow Deposit
```http
POST /api/escrow/deposit
Content-Type: application/json

{
  "demand_id": "uuid",
  "buyer_id": "uuid",
  "total_amount": 525000.00
}
```

### Get Escrow Status for Demand
```http
GET /api/escrow/:demandId
```

### Verify Delivery (Agent/Admin)
```http
POST /api/escrow/verify-delivery
Content-Type: application/json

{
  "demand_id": "uuid",
  "verified_by": "uuid",
  "verification_notes": "All 25 MT received in good condition"
}
```

### Release Escrow Payment to Farmers
```http
POST /api/escrow/release
Content-Type: application/json

{
  "demand_id": "uuid"
}
```

---

## 4. 🚛 Micro-Logistics API (`/api/logistics`)

### Optimize Multi-Stop Pickup Route (TSP Heuristic)
```http
POST /logistics/optimize
Content-Type: application/json

{
  "depot": { "id": "d1", "name": "Pune Hub", "latitude": 18.5204, "longitude": 73.8567 },
  "fpo_locations": [
    { "id": "f1", "name": "Nashik Packhouse", "latitude": 19.9975, "longitude": 73.7898, "quantity": 15 },
    { "id": "f2", "name": "Narayangaon Center", "latitude": 19.1158, "longitude": 73.9806, "quantity": 10 }
  ]
}
```

---

## 5. 🔬 Quality Audit API (`/quality-audit`)

### Submit Farm-Gate Crop Inspection
```http
POST /quality-audit
Content-Type: application/json

{
  "fpo_yield_id": "uuid",
  "auditor_id": "uuid",
  "moisture_content": 11.2,
  "size_grade": "Large",
  "defect_score": 1.5,
  "colour_uniformity": 92,
  "pesticide_residue": "Pass",
  "image_urls": ["https://..."],
  "auditor_notes": "Excellent quality"
}
```

---

## 6. 🤖 XGBoost Demand ML API (`http://localhost:8000`)

### Forecast Price & Demand
```http
POST /api/demand-forecast
Content-Type: application/json

{
  "crop_type": "tomato",
  "state": "Maharashtra",
  "forecast_months": 3
}
```

### System & Model Health Check
```http
GET /api/health
```
