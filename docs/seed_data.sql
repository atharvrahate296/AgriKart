-- =====================================================================
--      AGRIKART — AUTHENTIC SAMPLE POPULATION SEED SCRIPT
-- =====================================================================
-- Run this AFTER executing all 4 schema scripts:
-- 1. consolidated_schema.sql
-- 2. docs/fpo_aggregation_schema.sql
-- 3. docs/quality_audit_schema.sql
-- 4. docs/demand_workflow_schema.sql
-- =====================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────
-- 1. PROFILES (Buyers, FPOs / Farmers, Field Agents, Admin)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, email, full_name, role, phone, location, bio) VALUES
  -- Buyers
  ('a1111111-1111-4111-a111-111111111111', 'procurement@bigbasket.com', 'BigBasket Wholesale Hub', 'buyer', '+91 9822011223', 'Pune, Maharashtra', 'Institutional bulk buyer for supermarket chains across Western India'),
  ('a2222222-2222-4222-a222-222222222222', 'sourcing@relianceretail.com', 'Reliance Fresh Distribution', 'buyer', '+91 9822022334', 'Mumbai, Maharashtra', 'Direct-from-farm procurement wing for fresh produce'),
  ('a3333333-3333-4333-a333-333333333333', 'grain@motherdairy.com', 'Safal Processing Division', 'buyer', '+91 9822033445', 'Delhi NCR', 'Bulk processor for fruits, vegetables, and staples'),

  -- Farmers / FPOs
  ('b1111111-1111-4111-b111-111111111111', 'contact@sahyadrifarms.com', 'Sahyadri Farmers Producer Co.', 'farmer', '+91 9422155667', 'Nashik, Maharashtra', 'Leading FPO with 1,200+ member farmers specializing in horticultural crops'),
  ('b2222222-2222-4222-b222-222222222222', 'info@mahaagro.fpo.org', 'MahaAgro Farmer Collective', 'farmer', '+91 9422166778', 'Narayangaon, Pune', 'Collective of smallholder tomato and onion farmers'),
  ('b3333333-3333-4333-b333-333333333333', 'wheat@punjabfpo.org', 'Malwa Grain Producer Union', 'farmer', '+91 9422177889', 'Ludhiana, Punjab', 'Wheat and paddy FPO operating in Malwa belt'),

  -- FPO Field Agent (Auditor)
  ('c1111111-1111-4111-c111-111111111111', 'agent.nashik@agrikart.org', 'Ramesh Patil (Agronomist)', 'fpo_agent', '+91 9890188990', 'Nashik Cluster', 'Certified crop quality inspector & farm-gate auditor'),

  -- Admin
  ('d1111111-1111-4111-d111-111111111111', 'admin@agrikart.org', 'AgriKart Control Room', 'admin', '+91 9000000000', 'HQ, Bengaluru', 'Platform operations & escrow supervisor')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  location = EXCLUDED.location;


-- ─────────────────────────────────────────────────────────────────
-- 2. INSTITUTIONAL DEMANDS (Confirmed Demand Requirements)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.institutional_demands 
  (id, buyer_profile_id, crop_type, required_quantity, max_price_per_kg, min_quality_grade, required_by, latitude, longitude, delivery_address, status, matched_quantity)
VALUES
  (
    'de000000-0000-4000-a000-000000000001',
    'a1111111-1111-4111-a111-111111111111',
    'tomato',
    25.00,  -- 25 Metric Tonnes
    38.50,  -- Max ₹38.50/kg
    'A',
    NOW() + INTERVAL '5 days',
    18.5204, 73.8567,
    'BigBasket APMC Warehouse, Gate 4, Gultekdi, Pune, Maharashtra 411037',
    'partially_matched',
    15.00
  ),
  (
    'de000000-0000-4000-a000-000000000002',
    'a2222222-2222-4222-a222-222222222222',
    'onion',
    40.00,  -- 40 Metric Tonnes
    28.00,  -- Max ₹28.00/kg
    'B',
    NOW() + INTERVAL '8 days',
    19.0760, 72.8777,
    'Reliance Retail Logistics Hub, Bhiwandi, Thane, Maharashtra 421302',
    'open',
    0.00
  ),
  (
    'de000000-0000-4000-a000-000000000003',
    'a3333333-3333-4333-a333-333333333333',
    'wheat',
    50.00,  -- 50 Metric Tonnes
    26.50,  -- Max ₹26.50/kg
    'A+',
    NOW() + INTERVAL '12 days',
    30.9010, 75.8573,
    'Safal Processing Silos, GT Road, Khanna, Punjab 141401',
    'fully_matched',
    50.00
  )
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, matched_quantity = EXCLUDED.matched_quantity;


-- ─────────────────────────────────────────────────────────────────
-- 3. FPO CROP YIELDS (Available Supply Commitments)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.fpo_yields 
  (id, fpo_profile_id, crop_type, variety, available_quantity, price_per_kg, quality_grade, latitude, longitude, location_name, is_available, is_aggregated)
VALUES
  (
    'ee000000-0000-4000-b000-000000000001',
    'b1111111-1111-4111-b111-111111111111',
    'tomato',
    'Roma Red',
    15.00,  -- 15 MT
    35.00,  -- ₹35/kg
    'A',
    19.9975, 73.7898,
    'Sahyadri Cold Storage & Packhouse, Dindori, Nashik',
    true,
    true
  ),
  (
    'ee000000-0000-4000-b000-000000000002',
    'b2222222-2222-4222-b222-222222222222',
    'tomato',
    'Abhinav Hyb',
    10.00,  -- 10 MT
    36.00,  -- ₹36/kg
    'A+',
    19.1158, 73.9806,
    'MahaAgro Collection Center, Narayangaon, Pune',
    true,
    false
  ),
  (
    'ee000000-0000-4000-b000-000000000003',
    'b1111111-1111-4111-b111-111111111111',
    'onion',
    'Lasalgaon Red',
    25.00,  -- 25 MT
    24.50,  -- ₹24.50/kg
    'B',
    20.1478, 74.2254,
    'Lasalgaon FPO Warehouse, Niphad, Nashik',
    true,
    false
  ),
  (
    'ee000000-0000-4000-b000-000000000004',
    'b3333333-3333-4333-b333-333333333333',
    'wheat',
    'Sharbati Premium',
    50.00,  -- 50 MT
    25.00,  -- ₹25/kg
    'A+',
    30.8358, 75.9525,
    'Malwa Grain Yard, Samrala, Ludhiana',
    true,
    true
  )
ON CONFLICT (id) DO UPDATE SET is_aggregated = EXCLUDED.is_aggregated;


-- ─────────────────────────────────────────────────────────────────
-- 4. DEMAND FULFILLMENT GROUPS (Matched Supply links)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.demand_fulfillment_groups
  (id, demand_id, fpo_yield_id, allocated_quantity, agreed_price_per_kg, distance_km, status)
VALUES
  (
    'ff000000-0000-4000-c000-000000000001',
    'de000000-0000-4000-a000-000000000001',  -- Tomato Demand (BigBasket)
    'ee000000-0000-4000-b000-000000000001',  -- Tomato Yield (Sahyadri)
    15.00,
    35.00,
    164.50,
    'confirmed'
  ),
  (
    'ff000000-0000-4000-c000-000000000002',
    'de000000-0000-4000-a000-000000000003',  -- Wheat Demand (Safal)
    'ee000000-0000-4000-b000-000000000004',  -- Wheat Yield (Malwa)
    50.00,
    25.00,
    18.20,
    'confirmed'
  )
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────
-- 5. CROP QUALITY AUDITS (Verifiable Farm-gate Certificates)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.crop_quality_audits
  (id, fpo_yield_id, auditor_id, moisture_content, size_grade, defect_score, colour_uniformity, avg_weight_grams, pesticide_residue, overall_grade, is_certified, certified_at, image_urls, auditor_notes)
VALUES
  (
    'aa000000-0000-4000-d000-000000000001',
    'ee000000-0000-4000-b000-000000000001',  -- Tomato Yield
    'c1111111-1111-4111-c111-111111111111',  -- Ramesh Patil (Agent)
    11.20,
    'Large',
    1.50,
    92.00,
    145.00,
    'Pass',
    'A',
    true,
    NOW() - INTERVAL '1 day',
    '["https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop"]'::jsonb,
    'Excellent firm tomatoes, deep red hue. Brix rating 4.8. Zero pest infestation observed in packhouse sampling.'
  ),
  (
    'aa000000-0000-4000-d000-000000000002',
    'ee000000-0000-4000-b000-000000000004',  -- Wheat Yield
    'c1111111-1111-4111-c111-111111111111',  -- Ramesh Patil (Agent)
    9.50,
    'Extra Large',
    0.80,
    96.00,
    42.00,
    'Pass',
    'A+',
    true,
    NOW() - INTERVAL '2 days',
    '["https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop"]'::jsonb,
    'Sharbati golden grain with high gluten content. Moisture well under 10% safety limit. Premium grade.'
  )
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────
-- 6. ESCROW PAYMENTS (Status Tracking)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.escrow_payments
  (id, demand_id, buyer_id, total_amount, currency, status, deposited_at, delivery_verified, farmer_payouts)
VALUES
  (
    'bb000000-0000-4000-e000-000000000001',
    'de000000-0000-4000-a000-000000000001',  -- Tomato Demand
    'a1111111-1111-4111-a111-111111111111',  -- BigBasket
    525000.00,  -- ₹5,25,000 (15 MT @ ₹35/kg)
    'INR',
    'deposited',
    NOW() - INTERVAL '2 hours',
    false,
    '[{"farmer_id": "b1111111-1111-4111-b111-111111111111", "farmer_name": "Sahyadri Farmers Producer Co.", "amount": 525000, "status": "pending_delivery"}]'::jsonb
  ),
  (
    'bb000000-0000-4000-e000-000000000002',
    'de000000-0000-4000-a000-000000000003',  -- Wheat Demand
    'a3333333-3333-4333-a333-333333333333',  -- Safal
    1250000.00,  -- ₹12,50,000 (50 MT @ ₹25/kg)
    'INR',
    'held',
    NOW() - INTERVAL '1 day',
    true,
    '[{"farmer_id": "b3333333-3333-4333-b333-333333333333", "farmer_name": "Malwa Grain Producer Union", "amount": 1250000, "status": "ready_for_release"}]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────
-- 7. LOGISTICS ORDERS (Pooled Transport Trips)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.logistics_orders
  (id, demand_id, depot_location, waypoints, total_distance_km, estimated_time_hrs, estimated_fuel_cost, total_quantity_mt, status, savings_vs_individual)
VALUES
  (
    'cc000000-0000-4000-f000-000000000001',
    'de000000-0000-4000-a000-000000000001',
    '{"name": "BigBasket Pune Hub", "latitude": 18.5204, "longitude": 73.8567}'::jsonb,
    '[
      {"sequence": 1, "name": "Sahyadri Cold Storage, Dindori", "latitude": 19.9975, "longitude": 73.7898, "quantity": 15, "estimatedArrival": "+3h 40m"},
      {"sequence": 2, "name": "MahaAgro Center, Narayangaon", "latitude": 19.1158, "longitude": 73.9806, "quantity": 10, "estimatedArrival": "+5h 20m"}
    ]'::jsonb,
    215.40,
    5.40,
    1705.25,
    25.00,
    'in_transit',
    '{"distance_km": 88.5, "fuel_cost_inr": 700.70, "percentage_saved": 29.1}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
