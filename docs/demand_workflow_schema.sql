-- =====================================================================
--     AGRIKART — DEMAND-FIRST WORKFLOW EXTENSION SCHEMA
-- =====================================================================
-- Run this AFTER quality_audit_schema.sql
-- Adds: escrow_payments, logistics_orders, role updates
-- =====================================================================

-- ─────────────────────────────────────────────
-- 1. Update role constraints to support buyer / fpo_agent
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('farmer', 'buyer', 'fpo_agent', 'admin', 'vendor'));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('farmer', 'buyer', 'fpo_agent', 'admin', 'vendor'));

-- Update the auto-create trigger to default new users to 'farmer'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'farmer')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (id, email, full_name, role, verified)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'farmer'),
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────
-- 2. Escrow Payments — Payment lifecycle tracking
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.escrow_payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to demand fulfillment
  demand_id           UUID NOT NULL REFERENCES public.institutional_demands(id) ON DELETE CASCADE,
  buyer_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Payment details
  total_amount        DECIMAL(12, 2) NOT NULL,        -- Total escrow amount (INR)
  currency            VARCHAR(10) DEFAULT 'INR',

  -- Lifecycle status
  status              VARCHAR(30) DEFAULT 'pending'
                        CHECK (status IN ('pending', 'deposited', 'held', 'released', 'refunded', 'disputed')),

  -- Timestamps
  deposited_at        TIMESTAMP,
  held_at             TIMESTAMP,
  released_at         TIMESTAMP,
  refunded_at         TIMESTAMP,

  -- Delivery verification
  delivery_verified   BOOLEAN DEFAULT FALSE,
  verified_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at         TIMESTAMP,
  verification_notes  TEXT,

  -- Farmer payouts (JSON array of individual farmer settlements)
  farmer_payouts      JSONB DEFAULT '[]'::jsonb,
  -- e.g. [{"farmer_id": "...", "amount": 50000, "status": "paid", "paid_at": "..."}]

  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_demand ON public.escrow_payments(demand_id);
CREATE INDEX IF NOT EXISTS idx_escrow_buyer ON public.escrow_payments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON public.escrow_payments(status);

-- ─────────────────────────────────────────────
-- 3. Logistics Orders — Pooled transport jobs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logistics_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to demand
  demand_id           UUID NOT NULL REFERENCES public.institutional_demands(id) ON DELETE CASCADE,

  -- Route info (stored from optimization result)
  depot_location      JSONB NOT NULL,                  -- {latitude, longitude, name}
  waypoints           JSONB DEFAULT '[]'::jsonb,       -- Ordered pickup stops from optimizer
  total_distance_km   DECIMAL(8, 2),
  estimated_time_hrs  DECIMAL(6, 2),
  estimated_fuel_cost DECIMAL(10, 2),
  total_quantity_mt   DECIMAL(10, 2),

  -- Status tracking
  status              VARCHAR(30) DEFAULT 'planned'
                        CHECK (status IN ('planned', 'picking_up', 'in_transit', 'delivered', 'cancelled')),

  -- Driver / vehicle info (optional for prototype)
  vehicle_number      VARCHAR(50),
  driver_name         VARCHAR(255),
  driver_phone        VARCHAR(20),

  -- Timestamps
  pickup_started_at   TIMESTAMP,
  delivered_at        TIMESTAMP,

  -- Savings data
  savings_vs_individual JSONB DEFAULT '{}'::jsonb,
  -- e.g. {"distance_km": 45.2, "fuel_cost_inr": 358, "percentage_saved": 32.5}

  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logistics_demand ON public.logistics_orders(demand_id);
CREATE INDEX IF NOT EXISTS idx_logistics_status ON public.logistics_orders(status);

-- ─────────────────────────────────────────────
-- 4. Auto-update timestamps
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS escrow_updated_at ON public.escrow_payments;
CREATE TRIGGER escrow_updated_at
  BEFORE UPDATE ON public.escrow_payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS logistics_updated_at ON public.logistics_orders;
CREATE TRIGGER logistics_updated_at
  BEFORE UPDATE ON public.logistics_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─────────────────────────────────────────────
-- 5. Disable RLS (consistent with project pattern)
-- ─────────────────────────────────────────────
ALTER TABLE public.escrow_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_orders DISABLE ROW LEVEL SECURITY;
