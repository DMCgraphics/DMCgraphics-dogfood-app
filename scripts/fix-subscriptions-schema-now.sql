-- Fix subscriptions table schema to support Stripe integration
-- This script adds all the missing columns that the webhook expects

-- Add Stripe subscription ID column
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add Stripe customer ID column  
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add Stripe price ID column
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Add current period start/end columns
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE;

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Add currency column
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd';

-- Add interval columns
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS interval TEXT DEFAULT 'month';

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS interval_count INTEGER DEFAULT 1;

-- Add billing_cycle column (this is the missing one!)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

-- Add cancellation columns
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;

-- Add payment method column
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS default_payment_method_id TEXT;

-- Add metadata column for storing additional data
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add pause collection column for subscription pausing
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS pause_json JSONB;

-- Add unique constraint for stripe_subscription_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_stripe_subscription_id_key'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_stripe_subscription_id_key
      UNIQUE (stripe_subscription_id);
  END IF;
END
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- Update the status check constraint to include more Stripe statuses
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check 
  CHECK (status IN ('active', 'paused', 'cancelled', 'expired', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'));

-- Update the billing_cycle constraint to include more intervals
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_billing_cycle_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_billing_cycle_check 
  CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly', 'day'));

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
