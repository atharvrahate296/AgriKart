-- =====================================================================
--     AGRIKART — VERIFIABLE CROP QUALITY AUDIT SCHEMA
-- =====================================================================
-- Run this AFTER fpo_aggregation_schema.sql
-- =====================================================================

-- ─────────────────────────────────────────────
-- Crop Quality Audits
-- ─────────────────────────────────────────────
-- Each audit record is tied to a specific FPO yield batch.
-- A "Quality Certificate" is issued once is_certified = TRUE.
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.crop_quality_audits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the FPO yield batch being audited
  fpo_yield_id        UUID NOT NULL REFERENCES public.fpo_yields(id) ON DELETE CASCADE,

  -- The FPO agent who performed the audit
  auditor_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- ─── Physical Metrics ───────────────────────────────────────
  -- Moisture content (%) — acceptable range depends on crop type
  --   e.g. wheat: 11–13%, paddy: <14%, vegetables: varies
  moisture_content    DECIMAL(5, 2)
                        CHECK (moisture_content >= 0 AND moisture_content <= 100),

  -- Size grade: visual size classification
  size_grade          VARCHAR(20)
                        CHECK (size_grade IN ('Extra Large', 'Large', 'Medium', 'Small', 'Mixed')),

  -- Visual defect score: 0 (no defects) → 10 (severe defects)
  defect_score        DECIMAL(4, 2)
                        CHECK (defect_score >= 0 AND defect_score <= 10),

  -- Colour uniformity: percentage of produce with uniform colour
  colour_uniformity   DECIMAL(5, 2)
                        CHECK (colour_uniformity >= 0 AND colour_uniformity <= 100),

  -- Weight per unit (grams) — for grading fruits/vegetables
  avg_weight_grams    DECIMAL(8, 2),

  -- ─── Contamination / Pesticide ──────────────────────────────
  pesticide_residue   VARCHAR(50) DEFAULT 'Not Tested'
                        CHECK (pesticide_residue IN ('Pass', 'Fail', 'Not Tested')),

  -- ─── Storage / Logistics Conditions ────────────────────────
  storage_condition   VARCHAR(100),     -- e.g. "Dry warehouse, 25°C"
  packaging_type      VARCHAR(100),     -- e.g. "Jute bags, 50kg"

  -- ─── Photo Evidence ─────────────────────────────────────────
  -- Stored as a JSON array of Supabase Storage URLs
  -- e.g. ["https://...supabase.co/storage/v1/object/public/audits/img1.jpg"]
  image_urls          JSONB DEFAULT '[]'::jsonb,

  -- ─── Auditor Notes ──────────────────────────────────────────
  auditor_notes       TEXT,

  -- ─── Overall Assessment ─────────────────────────────────────
  overall_grade       VARCHAR(10)
                        CHECK (overall_grade IN ('A+', 'A', 'B', 'C', 'Rejected')),

  -- Certificate status
  is_certified        BOOLEAN DEFAULT FALSE,
  certified_at        TIMESTAMP,

  -- Who verified the certificate (can be a senior agent or auto-certified)
  certified_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  certification_notes TEXT,

  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW(),

  -- One audit per yield batch (can be updated before certification)
  UNIQUE(fpo_yield_id)
);

CREATE INDEX IF NOT EXISTS idx_audit_yield ON public.crop_quality_audits(fpo_yield_id);
CREATE INDEX IF NOT EXISTS idx_audit_certified ON public.crop_quality_audits(is_certified);
CREATE INDEX IF NOT EXISTS idx_audit_grade ON public.crop_quality_audits(overall_grade);

-- ─────────────────────────────────────────────
-- Auto-update updated_at on changes
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_audit_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_updated_at_trigger ON public.crop_quality_audits;
CREATE TRIGGER audit_updated_at_trigger
  BEFORE UPDATE ON public.crop_quality_audits
  FOR EACH ROW EXECUTE FUNCTION public.touch_audit_updated_at();

-- ─────────────────────────────────────────────
-- Storage bucket for audit images (run in Supabase Storage settings or via SDK)
-- ─────────────────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('crop-audits', 'crop-audits', true)
-- ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- Disable RLS (consistent with project pattern)
-- ─────────────────────────────────────────────
ALTER TABLE public.crop_quality_audits DISABLE ROW LEVEL SECURITY;
