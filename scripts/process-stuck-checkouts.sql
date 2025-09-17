-- Script to manually process stuck checkout sessions
-- This will create subscriptions for plans that are stuck in checkout_in_progress status

-- First, let's see what plans are stuck
SELECT 
    p.id as plan_id,
    p.user_id,
    p.status,
    p.stripe_session_id,
    p.updated_at,
    u.email
FROM plans p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE p.status = 'checkout_in_progress'
  AND p.stripe_session_id IS NOT NULL
  AND p.stripe_subscription_id IS NULL
ORDER BY p.updated_at DESC;

-- For each stuck plan, we need to:
-- 1. Check if the Stripe session was actually completed
-- 2. If completed, create the subscription
-- 3. Update the plan status to active

-- Note: This requires manual intervention since we need to check Stripe directly
-- or use the Stripe API to verify the session status
