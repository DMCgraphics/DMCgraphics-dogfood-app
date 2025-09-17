-- Test script to verify subscription creation works
-- This script helps you test if the subscription table can accept the data structure
-- that the webhook is trying to insert

-- First, let's check if the subscriptions table has all the required columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test inserting a sample subscription record (this won't actually insert due to foreign key constraints)
-- but it will show if the column structure is correct
INSERT INTO subscriptions (
  user_id,
  plan_id,
  stripe_subscription_id,
  stripe_customer_id,
  stripe_price_id,
  status,
  current_period_start,
  current_period_end,
  currency,
  interval,
  interval_count,
  cancel_at_period_end,
  canceled_at,
  default_payment_method_id,
  metadata,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- dummy UUID
  '00000000-0000-0000-0000-000000000000', -- dummy UUID  
  'sub_test_123',
  'cus_test_123',
  'price_test_123',
  'active',
  NOW(),
  NOW() + INTERVAL '1 month',
  'usd',
  'month',
  1,
  false,
  null,
  'pm_test_123',
  '{"test": true}',
  NOW(),
  NOW()
);

-- If the above insert fails with a foreign key constraint error, that's expected and good
-- If it fails with a column doesn't exist error, then the schema fix didn't work

-- Check if the unique constraint exists
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'subscriptions' 
  AND table_schema = 'public'
  AND constraint_name = 'subscriptions_stripe_subscription_id_key';
