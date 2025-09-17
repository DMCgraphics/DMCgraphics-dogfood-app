-- Manual script to create subscription for stuck checkout session
-- This will create a subscription for the plan that's stuck in checkout_in_progress

-- Plan ID: eacb1722-ec44-4d72-8349-9b4f25f43fbd
-- User ID: ebdadb7b-007d-4b06-9c2d-f8909dff5b60 (bbalick@nouripet.net)
-- Session ID: cs_test_b1M8kX93QCcebSUEqWBb8sFQ8ZaT7Ntg2jaEg56CcjaHeBuX4fPou7ocnz

-- First, let's create a test subscription for this plan
INSERT INTO subscriptions (
  user_id,
  plan_id,
  stripe_subscription_id,
  stripe_customer_id,
  status,
  current_period_start,
  current_period_end,
  currency,
  interval,
  interval_count,
  metadata,
  created_at,
  updated_at
) VALUES (
  'ebdadb7b-007d-4b06-9c2d-f8909dff5b60', -- user_id for bbalick@nouripet.net
  'eacb1722-ec44-4d72-8349-9b4f25f43fbd', -- plan_id
  'sub_manual_test_002', -- test subscription ID
  'cus_manual_test_002', -- test customer ID
  'active',
  NOW(),
  NOW() + INTERVAL '1 month',
  'usd',
  'month',
  1,
  '{"manual_creation": true, "session_id": "cs_test_b1M8kX93QCcebSUEqWBb8sFQ8ZaT7Ntg2jaEg56CcjaHeBuX4fPou7ocnz"}',
  NOW(),
  NOW()
);

-- Update the plan status to active
UPDATE plans 
SET status = 'active',
    stripe_subscription_id = 'sub_manual_test_002',
    updated_at = NOW()
WHERE id = 'eacb1722-ec44-4d72-8349-9b4f25f43fbd';

-- Verify the subscription was created
SELECT * FROM subscriptions WHERE user_id = 'ebdadb7b-007d-4b06-9c2d-f8909dff5b60';
