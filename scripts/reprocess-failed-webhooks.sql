-- Script to reprocess failed webhook events
-- This will manually create subscriptions for webhook events that failed due to constraint issues

-- First, let's see what webhook events we have
SELECT 
    id,
    type,
    payload->'data'->'object'->>'id' as session_id,
    payload->'data'->'object'->>'payment_status' as payment_status,
    payload->'data'->'object'->>'subscription' as subscription_id,
    payload->'data'->'object'->'metadata' as metadata,
    created_at
FROM stripe_events 
WHERE type = 'checkout.session.completed'
  AND payload->'data'->'object'->>'payment_status' = 'paid'
ORDER BY created_at DESC;

-- For each webhook event, we need to:
-- 1. Check if the plan exists and has a valid user_id
-- 2. Create the subscription if it doesn't exist
-- 3. Update the plan status to active

-- Example for the most recent webhook event:
-- Plan ID: a1db2756-5486-4d66-8fc7-ff3866726474
-- User ID: 18205999-00ef-4a2e-b220-17980e7267a7 (this user doesn't exist anymore)
-- Subscription ID: sub_1S82uS0R4BbWwBbfviyiT61b

-- Since the user doesn't exist, we can't process this webhook event
-- But we can create a script to process future webhook events properly
