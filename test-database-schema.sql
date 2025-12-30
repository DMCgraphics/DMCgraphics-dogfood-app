-- ================================================
-- NouriPet Test Database Schema Migration
-- ================================================
-- Run this script in your new test database SQL editor
-- Project: wfjgcglyhnagnomdlgmd
-- ================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ================================================
-- DROP existing tables (if rerunning)
-- ================================================
DROP TABLE IF EXISTS medical_condition_requests CASCADE;
DROP TABLE IF EXISTS contact_submissions CASCADE;
DROP TABLE IF EXISTS event_signups CASCADE;
DROP TABLE IF EXISTS allowed_zipcodes CASCADE;
DROP TABLE IF EXISTS weight_logs CASCADE;
DROP TABLE IF EXISTS stripe_events CASCADE;
DROP TABLE IF EXISTS stool_logs CASCADE;
DROP TABLE IF EXISTS recipe_embeddings CASCADE;
DROP TABLE IF EXISTS product_prices CASCADE;
DROP TABLE IF EXISTS plan_items CASCADE;
DROP TABLE IF EXISTS plan_dogs CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS early_access_signups CASCADE;
DROP TABLE IF EXISTS dog_restrictions CASCADE;
DROP TABLE IF EXISTS dog_profiles CASCADE;
DROP TABLE IF EXISTS dog_preferences CASCADE;
DROP TABLE IF EXISTS dog_notes CASCADE;
DROP TABLE IF EXISTS dog_metrics CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS billing_customers CASCADE;
DROP TABLE IF EXISTS ai_recommendations CASCADE;
DROP TABLE IF EXISTS ai_feedback CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS dogs CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ================================================
-- Core Tables
-- ================================================

-- Profiles table
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    phone text,
    avatar_url text,
    marketing_opt_in boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Recipes table
CREATE TABLE recipes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    slug text UNIQUE NOT NULL,
    ingredients jsonb,
    macros jsonb,
    allergens text[],
    is_active boolean DEFAULT true,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Dogs table
CREATE TABLE dogs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    breed text,
    weight numeric,
    weight_unit text DEFAULT 'lb' CHECK (weight_unit IN ('kg', 'lb')),
    weight_kg numeric,
    age integer,
    age_unit text DEFAULT 'years' CHECK (age_unit IN ('months', 'years')),
    sex text CHECK (sex IN ('male', 'female')),
    is_neutered boolean,
    activity_level text CHECK (activity_level IN ('low', 'moderate', 'high')),
    body_condition_score integer CHECK (body_condition_score >= 1 AND body_condition_score <= 9),
    allergies text[],
    conditions text[],
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Addresses table
CREATE TABLE addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label text DEFAULT 'Home',
    line1 text NOT NULL,
    line2 text,
    city text,
    state text,
    postal_code text,
    country text DEFAULT 'US',
    lat double precision,
    lng double precision,
    is_default boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- ================================================
-- Dog-related tables
-- ================================================

-- Dog metrics
CREATE TABLE dog_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    measured_at date DEFAULT CURRENT_DATE,
    weight_kg numeric,
    body_condition_score integer CHECK (body_condition_score >= 1 AND body_condition_score <= 9),
    notes text
);

-- Dog notes
CREATE TABLE dog_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    note text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Dog preferences
CREATE TABLE dog_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    preference text NOT NULL,
    weight numeric DEFAULT 1.0,
    created_at timestamptz DEFAULT now()
);

-- Dog profiles (legacy - keeping for compatibility)
CREATE TABLE dog_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    breed text,
    birthdate date,
    weight_kg numeric,
    activity_level text,
    picky boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Dog restrictions
CREATE TABLE dog_restrictions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    restriction text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Weight logs
CREATE TABLE weight_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
    date date NOT NULL,
    weight numeric NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Stool logs
CREATE TABLE stool_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
    date date NOT NULL,
    score integer CHECK (score >= 1 AND score <= 5),
    notes text,
    created_at timestamptz DEFAULT now()
);

-- ================================================
-- Plans and Subscriptions
-- ================================================

-- Plans table
CREATE TABLE plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    dog_id uuid REFERENCES dogs(id) ON DELETE SET NULL CHECK (dog_id IS NOT NULL),
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'checkout', 'checkout_in_progress', 'active', 'purchased', 'abandoned')),
    current_step integer DEFAULT 1,
    claim_token text UNIQUE,
    snapshot jsonb,
    subtotal_cents integer DEFAULT 0,
    discount_cents integer DEFAULT 0,
    total_cents integer DEFAULT 0,
    delivery_zipcode varchar,
    stripe_session_id text,
    stripe_subscription_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Plan dogs (junction table)
CREATE TABLE plan_dogs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    position integer,
    snapshot jsonb,
    meals_per_day integer,
    selected_prescription_diet text,
    verification_required boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Plan items
CREATE TABLE plan_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    dog_id uuid REFERENCES dogs(id) ON DELETE SET NULL,
    recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
    qty integer DEFAULT 1,
    size_g integer,
    billing_interval text,
    unit_price_cents integer,
    amount_cents integer,
    stripe_price_id text,
    meta jsonb,
    created_at timestamptz DEFAULT now()
);

-- Billing customers
CREATE TABLE billing_customers (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id text UNIQUE NOT NULL,
    default_payment_method_id text,
    created_at timestamptz DEFAULT now()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES plans(id) ON DELETE SET NULL,
    stripe_subscription_id text UNIQUE NOT NULL,
    stripe_customer_id text,
    stripe_price_id text,
    price_id text,
    status text CHECK (status IN ('active', 'paused', 'canceled', 'expired', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')),
    billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly', 'day')),
    currency text,
    interval text,
    interval_count integer,
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean,
    canceled_at timestamptz,
    default_payment_method_id text,
    pause_json jsonb,
    metadata jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Payment methods
CREATE TABLE payment_methods (
    id text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand text,
    last4 text,
    exp_month integer,
    exp_year integer,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- ================================================
-- Orders
-- ================================================

-- Orders
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES plans(id) ON DELETE SET NULL,
    shipping_address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
    order_number text UNIQUE NOT NULL,
    status text DEFAULT 'pending',
    total numeric NOT NULL,
    delivery_date timestamptz,
    delivery_method text,
    notes text,
    stripe_subscription_id text,
    period_start timestamptz,
    period_end timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Order items
CREATE TABLE order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
    quantity integer NOT NULL,
    price numeric NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ================================================
-- Pricing and Products
-- ================================================

-- Product prices
CREATE TABLE product_prices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    size_g integer NOT NULL,
    billing_interval text DEFAULT '4w',
    unit_price_cents integer NOT NULL,
    stripe_price_id text UNIQUE,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- ================================================
-- AI and Recommendations
-- ================================================

-- AI recommendations
CREATE TABLE ai_recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
    recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
    score numeric,
    rationale jsonb,
    created_at timestamptz DEFAULT now()
);

-- AI feedback
CREATE TABLE ai_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id uuid NOT NULL REFERENCES ai_recommendations(id) ON DELETE CASCADE,
    helpful boolean,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Recipe embeddings
CREATE TABLE recipe_embeddings (
    recipe_id uuid PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
    embedding vector,
    updated_at timestamptz DEFAULT now()
);

-- ================================================
-- Marketing and Signups
-- ================================================

-- Early access signups
CREATE TABLE early_access_signups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    full_name text,
    address text,
    mobile_phone text,
    dog_name text,
    dog_age text,
    dog_weight text,
    dog_breed text,
    medical_conditions text,
    source text DEFAULT 'early-access-landing',
    created_at timestamptz DEFAULT now()
);

-- Event signups
CREATE TABLE event_signups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name text NOT NULL,
    dog_name text,
    email text NOT NULL,
    phone_number text,
    zip_code text,
    subscribe_to_updates boolean DEFAULT false,
    utm_source text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Contact submissions
CREATE TABLE contact_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL CHECK (subject IN ('general', 'order', 'nutrition', 'partnership', 'other')),
    message text NOT NULL,
    status text DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    notes text,
    responded_at timestamptz,
    created_at timestamptz DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE contact_submissions IS 'Stores contact form submissions from the website with tracking and admin management capabilities';

-- Medical condition requests
CREATE TABLE medical_condition_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    email text NOT NULL,
    condition_name text,
    dog_name text,
    dog_weight text,
    notes text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'implemented')),
    created_at timestamptz DEFAULT now()
);

-- ================================================
-- Utility Tables
-- ================================================

-- Allowed zipcodes
CREATE TABLE allowed_zipcodes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    zipcode varchar UNIQUE NOT NULL,
    county varchar NOT NULL,
    state varchar NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Stripe events
CREATE TABLE stripe_events (
    id text PRIMARY KEY,
    type text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ================================================
-- Enable Row Level Security (RLS)
-- ================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stool_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE early_access_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_condition_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_zipcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS Policies - Users can access their own data
-- ================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Dogs policies
CREATE POLICY "Users can view own dogs" ON dogs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dogs" ON dogs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dogs" ON dogs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dogs" ON dogs FOR DELETE USING (auth.uid() = user_id);

-- Addresses policies
CREATE POLICY "Users can view own addresses" ON addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON addresses FOR DELETE USING (auth.uid() = user_id);

-- Plans policies
CREATE POLICY "Users can view own plans" ON plans FOR SELECT USING (auth.uid() = user_id OR claim_token IS NOT NULL);
CREATE POLICY "Users can insert own plans" ON plans FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own plans" ON plans FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);

-- Recipes policies (public read)
CREATE POLICY "Anyone can view active recipes" ON recipes FOR SELECT USING (is_active = true OR status = 'active');

-- Medical condition requests policies
CREATE POLICY "Anyone can insert medical condition requests" ON medical_condition_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own requests" ON medical_condition_requests FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow signup policies
CREATE POLICY "Anyone can view allowed zipcodes" ON allowed_zipcodes FOR SELECT USING (true);
CREATE POLICY "Anyone can signup for early access" ON early_access_signups FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can signup for events" ON event_signups FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can submit contact forms" ON contact_submissions FOR INSERT WITH CHECK (true);

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
-- Next step: Insert test data (recipes, etc)
-- See test-database-data.sql
-- ================================================
