-- =====================================================================
--                   AGRIKART 2.0 MASTER SCHEMA SETUP
-- =====================================================================
-- Paste this entire script into your Supabase Dashboard SQL Editor and Run.
-- This creates all tables for both the core marketplace and premium modules.

-- DROP existing tables to ensure clean schema recreation
DROP TABLE IF EXISTS public.prediction_feedback CASCADE;
DROP TABLE IF EXISTS public.disease_predictions CASCADE;
DROP TABLE IF EXISTS public.diseases CASCADE;
DROP TABLE IF EXISTS public.scheme_applications CASCADE;
DROP TABLE IF EXISTS public.schemes CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;
DROP TABLE IF EXISTS public.articles CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- 1. Profiles Table (Main backend user metadata table)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY, -- References auth.users(id)
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('farmer', 'vendor', 'expert', 'admin')),
  language VARCHAR(10) DEFAULT 'en',
  location VARCHAR(255),
  state VARCHAR(100),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(20) DEFAULT 'pending',
  notification_preferences JSONB DEFAULT '{
    "emailNotifications": true,
    "pushNotifications": true,
    "smsNotifications": false,
    "newsletterSubscribed": false,
    "schemeAlerts": true,
    "diseaseAlerts": true,
    "orderUpdates": true
  }'::jsonb,
  bio TEXT,
  last_login TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Users Table (Frontend alignment table - mirrored to profiles)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY, -- References auth.users(id)
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('farmer', 'vendor', 'expert', 'admin')),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Vendors Table (Vendor business metadata, linked 1:1 to profiles)
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  phone_business VARCHAR(20),
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  verified_badge BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Products Table (Marketplace Catalog)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  stock_quantity INT DEFAULT 0,
  image VARCHAR(500),
  additional_images JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_vendor ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- 5. Reviews Table (Product Reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Orders Table (E-commerce Orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Messages Table (Peer-to-Peer Chat messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);

-- 8. Diseases Table (ML Disease Reference Catalog)
CREATE TABLE IF NOT EXISTS public.diseases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  scientific_name VARCHAR(255),
  description TEXT,
  symptoms TEXT,
  causes TEXT,
  prevention_methods JSONB DEFAULT '[]'::jsonb,
  treatment_methods JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Disease Predictions Table (User classification logs)
CREATE TABLE IF NOT EXISTS public.disease_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  disease_id UUID REFERENCES public.diseases(id) ON DELETE SET NULL,
  image_url VARCHAR(500) NOT NULL,
  image_size_bytes INT,
  predicted_disease VARCHAR(255) NOT NULL,
  confidence_score DECIMAL(5,4) NOT NULL,
  model_version VARCHAR(100) NOT NULL,
  crop_type VARCHAR(100) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(50) DEFAULT 'pending',
  expert_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. Prediction Feedback Table (User feedback loops for model retraining)
CREATE TABLE IF NOT EXISTS public.prediction_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.disease_predictions(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('correct', 'incorrect')),
  actual_disease_id UUID REFERENCES public.diseases(id) ON DELETE SET NULL,
  actual_disease_name VARCHAR(255),
  explanation TEXT,
  confidence_in_correction INT,
  is_training_data BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 11. Schemes Table (Government Subsidies Directory)
CREATE TABLE IF NOT EXISTS public.schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  agency VARCHAR(255),
  eligible_states TEXT[] DEFAULT '{}'::text[],
  eligible_roles TEXT[] DEFAULT '{}'::text[],
  min_land_size DECIMAL(10,2),
  max_income_limit DECIMAL(12,2),
  subsidy_amount DECIMAL(12,2),
  subsidy_type VARCHAR(100),
  benefits_description TEXT,
  launch_date TIMESTAMP,
  deadline TIMESTAMP,
  application_start_date TIMESTAMP,
  application_end_date TIMESTAMP,
  application_process TEXT,
  required_documents TEXT[] DEFAULT '{}'::text[],
  official_website VARCHAR(500),
  contact_details TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  year_applicable VARCHAR(10),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 12. Scheme Applications Table (Subsidy application records)
CREATE TABLE IF NOT EXISTS public.scheme_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'submitted',
  land_size_at_application DECIMAL(10,2),
  income_at_application DECIMAL(12,2),
  documents_submitted JSONB DEFAULT '[]'::jsonb,
  rejection_reason TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID,
  disbursed_amount DECIMAL(12,2),
  disbursed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 13. Articles Table (Agri News Desk)
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  featured_image_url VARCHAR(500),
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}'::text[],
  relevant_crops TEXT[] DEFAULT '{}'::text[],
  relevant_states TEXT[] DEFAULT '{}'::text[],
  author_id UUID,
  author_name VARCHAR(255),
  source_url VARCHAR(500),
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  view_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 14. Alerts Table (Pest outbreaks and Weather warnings)
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(50),
  relevant_states TEXT[] DEFAULT '{}'::text[],
  relevant_districts TEXT[] DEFAULT '{}'::text[],
  relevant_crops TEXT[] DEFAULT '{}'::text[],
  action_url VARCHAR(500),
  external_link VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 15. Chat Sessions Table (AI Conversations)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'New Farming Conversation',
  topic VARCHAR(255),
  context JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  ended_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 16. Chat Messages Table (AI Chat feeds)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_role VARCHAR(50) NOT NULL CHECK (sender_role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens_used INT,
  generation_time_ms INT,
  model_version VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
--                       TRIGGERS & FUNCTIONS
-- =====================================================================

-- Auto-sync Supabase Auth users to public.profiles and public.users on sign up
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

-- Bind the sync trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
--                   DISABLE ROW LEVEL SECURITY (RLS)
-- =====================================================================
-- Allows testing suites and seed scripts to query DB without auth limits

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.diseases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
