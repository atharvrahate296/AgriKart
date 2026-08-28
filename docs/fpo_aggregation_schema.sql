-- =====================================================================
--     AGRIKART — FPO AGGREGATION & DEMAND-LED SUPPLY CHAIN SCHEMA
-- =====================================================================
-- Run this in the Supabase SQL Editor AFTER the consolidated_schema.sql
-- =====================================================================

-- ─────────────────────────────────────────────
-- 1. FPO Yields — Supply side
--    Represents crop batches available from an FPO (Farmer Producer Org)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fpo_yields (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Crop details
  crop_type           VARCHAR(100) NOT NULL,          -- e.g. "wheat", "tomato"
  variety             VARCHAR(100),                   -- e.g. "Sharbati", "Roma"
  available_quantity  DECIMAL(10, 2) NOT NULL,        -- in metric tonnes (MT)
  price_per_kg        DECIMAL(8, 2) NOT NULL,         -- INR per kg
  quality_grade       VARCHAR(10) DEFAULT 'B'         -- A+ / A / B / C
                        CHECK (quality_grade IN ('A+', 'A', 'B', 'C')),
  harvest_date        DATE,
  available_from      DATE DEFAULT CURRENT_DATE,
  available_until     DATE,

  -- Geolocation (required for 50km radius matching)
  latitude            DECIMAL(9, 6) NOT NULL,
  longitude           DECIMAL(9, 6) NOT NULL,
  location_name       VARCHAR(255),                   -- Human-readable label

  -- Status
  is_available        BOOLEAN DEFAULT TRUE,
  is_aggregated       BOOLEAN DEFAULT FALSE,          -- true once matched to a demand

  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fpo_yields_crop ON public.fpo_yields(crop_type);
CREATE INDEX IF NOT EXISTS idx_fpo_yields_available ON public.fpo_yields(is_available, crop_type);
CREATE INDEX IF NOT EXISTS idx_fpo_yields_location ON public.fpo_yields(latitude, longitude);

-- ─────────────────────────────────────────────
-- 2. Institutional Demands — Demand side
--    Large bulk orders from buyers (processors, exporters, govt agencies)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.institutional_demands (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Demand specification
  crop_type           VARCHAR(100) NOT NULL,
  required_quantity   DECIMAL(10, 2) NOT NULL,        -- in metric tonnes (MT)
  max_price_per_kg    DECIMAL(8, 2) NOT NULL,         -- Maximum buyer will pay (INR/kg)
  min_quality_grade   VARCHAR(10) DEFAULT 'B'
                        CHECK (min_quality_grade IN ('A+', 'A', 'B', 'C')),
  required_by         DATE NOT NULL,                   -- Delivery deadline

  -- Buyer location (centre of 50km search radius)
  latitude            DECIMAL(9, 6) NOT NULL,
  longitude           DECIMAL(9, 6) NOT NULL,
  delivery_address    TEXT,

  -- Fulfillment tracking
  status              VARCHAR(30) DEFAULT 'open'
                        CHECK (status IN ('open', 'partially_matched', 'fully_matched', 'cancelled', 'delivered')),
  matched_quantity    DECIMAL(10, 2) DEFAULT 0,       -- Running total of matched MT

  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inst_demands_crop ON public.institutional_demands(crop_type, status);
CREATE INDEX IF NOT EXISTS idx_inst_demands_buyer ON public.institutional_demands(buyer_profile_id);

-- ─────────────────────────────────────────────
-- 3. Demand Fulfillment Groups — Junction table
--    Links one Institutional Demand to many FPO Yields
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.demand_fulfillment_groups (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id           UUID NOT NULL REFERENCES public.institutional_demands(id) ON DELETE CASCADE,
  fpo_yield_id        UUID NOT NULL REFERENCES public.fpo_yields(id) ON DELETE CASCADE,

  -- How much of this yield is allocated to this demand (may be partial)
  allocated_quantity  DECIMAL(10, 2) NOT NULL,
  agreed_price_per_kg DECIMAL(8, 2) NOT NULL,
  distance_km         DECIMAL(7, 2),                  -- Distance from FPO to buyer (Haversine)

  status              VARCHAR(30) DEFAULT 'matched'
                        CHECK (status IN ('matched', 'confirmed', 'in_transit', 'delivered', 'cancelled')),
  confirmed_at        TIMESTAMP,
  delivered_at        TIMESTAMP,

  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW(),

  UNIQUE(demand_id, fpo_yield_id)
);

CREATE INDEX IF NOT EXISTS idx_dfg_demand ON public.demand_fulfillment_groups(demand_id);
CREATE INDEX IF NOT EXISTS idx_dfg_yield ON public.demand_fulfillment_groups(fpo_yield_id);

-- ─────────────────────────────────────────────
-- 4. Row Level Security — disabled (matches project pattern)
-- ─────────────────────────────────────────────
ALTER TABLE public.fpo_yields DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_demands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_fulfillment_groups DISABLE ROW LEVEL SECURITY;
