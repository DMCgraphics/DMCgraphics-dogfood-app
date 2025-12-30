# Subscription Save Fix Guide

## Problem Identified

Your app was not saving subscriptions to the Supabase database after Stripe checkout because:

1. **Database Schema Mismatch**: The webhook was trying to insert Stripe-specific fields that didn't exist in your `subscriptions` table
2. **Frontend Dependency**: The frontend relied entirely on webhooks to save subscription data, with no backup mechanism
3. **Silent Failures**: The webhook was failing silently due to schema issues

## Solution Implemented

### 1. Database Schema Fix

**You need to run this SQL migration in your Supabase SQL editor:**

```sql
-- Fix subscriptions table schema to support Stripe integration
-- Add missing Stripe-related columns to subscriptions table

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
```

### 2. Code Changes Made

#### Enhanced Webhook (`app/api/webhooks/stripe/route.ts`)
- Added better error logging to see exactly what's happening
- The webhook will now work properly once the schema is fixed

#### Enhanced Verify Payment API (`app/api/verify-payment/route.ts`)
- Now creates subscription records as a backup if the webhook failed
- Ensures subscription data is saved even if webhooks are delayed or fail
- Updates plan status to "active" after successful payment

#### New Subscription Creation API (`app/api/subscriptions/create/route.ts`)
- Dedicated endpoint for creating subscriptions
- Can be called directly by the frontend as a backup
- Handles all the Stripe subscription data mapping

#### Enhanced Frontend Success Page (`app/order/success/page.tsx`)
- Now calls both the verify-payment endpoint AND the subscription creation endpoint
- Provides redundancy to ensure subscriptions are always saved
- Better error handling and logging

## How It Works Now

### Primary Flow (Webhook)
1. User completes Stripe checkout
2. Stripe sends `checkout.session.completed` webhook
3. Webhook creates subscription record in database ✅
4. Webhook updates plan status to "active" ✅

### Backup Flow (Frontend)
1. User completes Stripe checkout
2. User is redirected to success page
3. Frontend calls `/api/verify-payment` which creates subscription if missing ✅
4. Frontend also calls `/api/subscriptions/create` as additional backup ✅

## Testing the Fix

1. **Apply the database migration** (run the SQL above in Supabase)
2. **Test the complete flow**:
   - Build a plan for your dog
   - Go through Stripe checkout
   - Complete payment
   - Check your `subscriptions` table in Supabase - you should see a new record
   - Check your `plans` table - the plan status should be "active"

## Monitoring

The enhanced logging will help you monitor the process:

- **Webhook logs**: Check your server logs for `[v0]` prefixed messages
- **Frontend logs**: Check browser console for subscription creation messages
- **Database**: Query the `subscriptions` table to verify records are being created

## Files Modified

- `app/api/webhooks/stripe/route.ts` - Enhanced webhook with better logging
- `app/api/verify-payment/route.ts` - Now creates subscriptions as backup
- `app/api/subscriptions/create/route.ts` - New dedicated subscription creation endpoint
- `app/order/success/page.tsx` - Enhanced to call backup subscription creation

## Files Created

- `scripts/fix-subscriptions-schema.sql` - Database migration script
- `scripts/test-subscription-creation.sql` - Test script to verify schema
- `SUBSCRIPTION_FIX_GUIDE.md` - This guide

The fix ensures that subscriptions are saved to your database through multiple redundant mechanisms, making the system much more reliable.
