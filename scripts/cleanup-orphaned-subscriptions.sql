-- Cleanup script to remove subscriptions that aren't associated with existing users
-- This script identifies and removes orphaned subscriptions from the database

-- Step 1: Identify orphaned subscriptions (subscriptions with user_id that don't exist in auth.users)
-- First, let's see what we're dealing with
SELECT 
  'Orphaned Subscriptions' as category,
  COUNT(*) as count
FROM subscriptions s
WHERE s.user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = s.user_id
  )

UNION ALL

SELECT 
  'NULL User Subscriptions' as category,
  COUNT(*) as count
FROM subscriptions s
WHERE s.user_id IS NULL

UNION ALL

SELECT 
  'Total Subscriptions' as category,
  COUNT(*) as count
FROM subscriptions;

-- Step 2: Show details of orphaned subscriptions before deletion
SELECT 
  s.id,
  s.user_id,
  s.stripe_subscription_id,
  s.status,
  s.plan_id,
  s.created_at,
  'ORPHANED' as issue_type
FROM subscriptions s
WHERE s.user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = s.user_id
  )

UNION ALL

SELECT 
  s.id,
  s.user_id,
  s.stripe_subscription_id,
  s.status,
  s.plan_id,
  s.created_at,
  'NULL_USER_ID' as issue_type
FROM subscriptions s
WHERE s.user_id IS NULL

ORDER BY created_at DESC;

-- Step 3: Delete orphaned subscriptions (uncomment to execute)
-- WARNING: This will permanently delete the subscriptions!
-- Make sure to backup your data before running this

/*
-- Delete subscriptions with user_id that don't exist in auth.users
DELETE FROM subscriptions 
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = subscriptions.user_id
  );

-- Delete subscriptions with NULL user_id
DELETE FROM subscriptions 
WHERE user_id IS NULL;

-- Show final count
SELECT COUNT(*) as remaining_subscriptions FROM subscriptions;
*/

-- Step 4: Alternative approach - Update orphaned subscriptions instead of deleting
-- This sets the status to 'cancelled' instead of deleting them
-- Uncomment if you prefer to keep the records but mark them as cancelled

/*
UPDATE subscriptions 
SET 
  status = 'cancelled',
  updated_at = NOW(),
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"cleanup_reason": "orphaned_user"}'::jsonb
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = subscriptions.user_id
  );

UPDATE subscriptions 
SET 
  status = 'cancelled',
  updated_at = NOW(),
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"cleanup_reason": "null_user_id"}'::jsonb
WHERE user_id IS NULL;
*/

-- Step 5: Verification query - run this after cleanup to verify
SELECT 
  'Remaining Subscriptions' as category,
  COUNT(*) as count
FROM subscriptions

UNION ALL

SELECT 
  'Valid Subscriptions (with existing users)' as category,
  COUNT(*) as count
FROM subscriptions s
WHERE s.user_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = s.user_id
  )

UNION ALL

SELECT 
  'Cancelled Subscriptions' as category,
  COUNT(*) as count
FROM subscriptions
WHERE status = 'cancelled';
