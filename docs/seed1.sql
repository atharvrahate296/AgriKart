-- =====================================================================
-- AgriKart Seed Data — demo records for development & testing
-- Run AFTER consolidated_schema.sql, fpo_aggregation_schema.sql,
-- quality_audit_schema.sql, and demand_workflow_schema.sql
-- =====================================================================

-- -------------------------------------------------------
-- 1. Profiles & Users (mirror rows)
-- -------------------------------------------------------
-- Farmer user / profile
INSERT INTO public.profiles (id, email, full_name, phone, role, state, location, email_verified, phone_verified, verification_status, notification_preferences)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'farmer1@example.com',
  'Ramesh Kumar',
  '9876543210',
  'farmer',
  'Maharashtra',
  'Pune district, Velhe',
  TRUE,
  TRUE,
  'verified',
  '{"emailNotifications": true, "pushNotifications": true, "smsNotifications": false, "newsletterSubscribed": false, "schemeAlerts": true, "diseaseAlerts": true, "orderUpdates": true}'::jsonb
);

INSERT INTO public.users (id, email, full_name, phone, role, verified, location, bio, created_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'farmer1@example.com',
  'Ramesh Kumar',
  '9876543210',
  'farmer',
  TRUE,
  'Pune district, Velhe',
  'Smallholder farmer growing wheat and soybeans.',
  NOW()
);

-- Buyer user / profile
INSERT INTO public.profiles (id, email, full_name, phone, role, state, location, email_verified, phone_verified, verification_status, notification_preferences)
VALUES (
  'b1b2c3d4-e5f6-7a89-b0c1-1d2e3f4a5b6c'::uuid,
  'buyer1@example.com',
  'AgriTrade Corp',
  '9123456789',
  'buyer',
  'Gujarat',
  'Ahmedabad',
  TRUE,
  TRUE,
  'verified',
  '{"emailNotifications": true, "pushNotifications": false, "smsNotifications": false, "newsletterSubscribed": false, "schemeAlerts": true, "diseaseAlerts": false, "orderUpdates": true}'::jsonb
);

INSERT INTO public.users (id, email, full_name, phone, role, verified, location, bio, created_at)
VALUES (
  'b1b2c3d4-e5f6-7a89-b0c1-1d2e3f4a5b6c'::uuid,
  'buyer1@example.com',
  'AgriTrade Corp',
  '9123456789',
  'buyer',
  TRUE,
  'Ahmedabad',
  'Institutional buyer of wheat and pulses.',
  NOW()
);

-- Admin user / profile
INSERT INTO public.profiles (id, email, full_name, phone, role, state, location, email_verified, phone_verified, verification_status, notification_preferences)
VALUES (
  'c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid,
  'admin@agrikart.test',
  'System Administrator',
  '0000000000',
  'admin',
  'Delhi',
  'New Delhi',
  TRUE,
  TRUE,
  'verified',
  '{"emailNotifications": true, "pushNotifications": true, "smsNotifications": false, "newsletterSubscribed": false, "schemeAlerts": true, "diseaseAlerts": true, "orderUpdates": true}'::jsonb
);

INSERT INTO public.users (id, email, full_name, phone, role, verified, location, bio, created_at)
VALUES (
  'c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid,
  'admin@agrikart.test',
  'System Administrator',
  '0000000000',
  'admin',
  TRUE,
  'New Delhi',
  'Platform admin overseeing the marketplace.',
  NOW()
);

-- -------------------------------------------------------
-- 2. FPO Yields (supply side)
-- -------------------------------------------------------
-- FPO 1: Wheat batch from Maharashtra
INSERT INTO public.fpo_yields (id, fpo_profile_id, crop_type, variety, available_quantity, price_per_kg, quality_grade, harvest_date, available_from, available_until, latitude, longitude, location_name, is_available, is_aggregated, metadata)
VALUES (
  'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f90'::uuid,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'wheat',
  'Swarna',
  50.00,
  2100.00,
  'B',
  DATE '2024-03-15',
  DATE '2024-03-20',
  DATE '2024-06-30',
  19.2156,
  72.8278,
  'Pune Rural FPO',
  TRUE,
  FALSE,
  '{"source":"Kharif 2024"}'::jsonb
);

-- FPO 2: Tomato batch from Gujarat
INSERT INTO public.fpo_yields (id, fpo_profile_id, crop_type, variety, available_quantity, price_per_kg, quality_grade, harvest_date, available_from, available_until, latitude, longitude, location_name, is_available, is_aggregated, metadata)
VALUES (
  'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9012'::uuid,
  'b1b2c3d4-e5f6-7a89-b0c1-1d2e3f4a5b6c'::uuid,  -- buyer profile also works as fpo_profile_id for demo; normally a separate FPO profile
  'tomato',
  'Roma',
  30.00,
  120.00,
  'A',
  DATE '2024-02-10',
  DATE '2024-02-15',
  DATE '2024-05-31',
  23.0225,
  72.5713,
  'Surat FPO',
  TRUE,
  FALSE,
  '{"source":"Rabi 2024"}'::jsonb
);

-- -------------------------------------------------------
-- 3. Institutional Demands (demand side)
-- -------------------------------------------------------
-- Buyer demand for wheat
INSERT INTO public.institutional_demands (id, buyer_profile_id, crop_type, required_quantity, max_price_per_kg, min_quality_grade, required_by, latitude, longitude, delivery_address, status, matched_quantity, metadata)
VALUES (
  'f7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c'::uuid,
  'b1b2c3d4-e5f6-7a89-b0c1-1d2e3f4a5b6c'::uuid,
  'wheat',
  100.00,
  2200.00,
  'B',
  DATE '2024-07-15',
  19.0798,
  72.8807,
  'Distribution centre, Ahmedabad',
  'open',
  0,
  '{"season":"Kharif 2024","priority":"high"}'::jsonb
);

-- Buyer demand for tomato
INSERT INTO public.institutional_demands (id, buyer_profile_id, crop_type, required_quantity, max_price_per_kg, min_quality_grade, required_by, latitude, longitude, delivery_address, status, matched_quantity, metadata)
VALUES (
  '0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d'::uuid,
  'b1b2c3d4-e5f6-7a89-b0c1-1d2e3f4a5b6c'::uuid,
  'tomato',
  80.00,
  130.00,
  'A',
  DATE '2024-06-30',
  22.7196,
  75.8570,
  'Processing plant, Surat',
  'open',
  0,
  '{"season":"Summer 2024","priority":"medium"}'::jsonb
);

-- -------------------------------------------------------
-- 4. Demand Fulfilment Groups (junction)
-- -------------------------------------------------------
-- Link wheat demand to FPO wheat yield (partial allocation)
INSERT INTO public.demand_fulfillment_groups (id, demand_id, fpo_yield_id, allocated_quantity, agreed_price_per_kg, status, confirmed_at, delivered_at)
VALUES (
  '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'::uuid,
  'f7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c'::uuid,
  'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f90'::uuid,
  30.00,               -- 30 MT allocated out of 100 MT demand
  2150.00,
  'matched',
  NOW(),
  NULL
);

-- -------------------------------------------------------
-- 5. Crop Quality Audits
-- -------------------------------------------------------
-- Audit for the wheat FPO yield
INSERT INTO public.crop_quality_audits (id, fpo_yield_id, auditor_id, moisture_content, size_grade, defect_score, colour_uniformity, avg_weight_grams, pesticide_residue, storage_condition, packaging_type, image_urls, overall_grade, is_certified, certified_by, certification_notes, metadata)
VALUES (
  '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e'::uuid,
  'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f90'::uuid,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,   -- farmer acting as auditor for demo
  12.50,
  'Large',
  2.00,
  95.00,
  28.00,
  'Pass',
  'Dry warehouse, 25°C',
  'Jute bags, 50kg',
  '["https://example.com/audit1.jpg"]'::jsonb,
  'A',
  TRUE,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'Moisture within spec, good size grade, no defects. Certificate issued.'
);

-- -------------------------------------------------------
-- 6. Escrow Payments
-- -------------------------------------------------------
-- Escrow for the wheat demand; status 'deposited'
INSERT INTO public.escrow_payments (id, demand_id, buyer_id, total_amount, currency, status, deposited_at, held_at, released_at, refunded_at, delivery_verified, verified_by, verified_at, verification_notes, farmer_payouts, metadata)
VALUES (
  '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f'::uuid,
  'f7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c'::uuid,
  'b1b2c3d4-e5f6-7a89-b0c1-1d2e3f4a5b6c'::uuid,
  215000.00,
  'INR',
  'deposited',
  NOW(),
  NULL,
  NULL,
  NULL,
  FALSE,
  NULL,
  NULL,
  'Buyer has deposited escrow; delivery not yet verified.',
  '[]'::jsonb,
  '{"estimated_farmer_payout":215000,"payout_scheme":"per_MT"}'
);

-- -------------------------------------------------------
-- 7. Logistics Orders
-- -------------------------------------------------------
-- Optimized route for wheat pickup from FPO to buyer depot
INSERT INTO public.logistics_orders (id, demand_id, depot_location, waypoints, total_distance_km, estimated_time_hrs, estimated_fuel_cost, total_quantity_mt, status, vehicle_number, driver_name, driver_phone, pickup_started_at, delivered_at, savings_vs_individual, metadata)
VALUES (
  '4e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b'::uuid,
  'f7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c'::uuid,
  '{"latitude": 19.0798, "longitude": 72.8807, "name": "Ahmedabad Depot"}'::jsonb,
  '[]'::jsonb,               -- waypoints would be populated by TSP optimizer
  480.00,                  -- approx 480 km (farmer region to buyer city)
  8.00,
  3500.00,
  100.00,
  'planned',
  'TRUK-001',
  'Rajesh Sharma',
  '9876543211',
  NULL,
  NULL,
  '{"distance_km":480,"fuel_cost_inr":3500,"percentage_saved":25.0}'::jsonb,
  '{"route_optimized":true,"stops":2}'
);

-- =====================================================================
-- End of seed1.sql
-- =====================================================================