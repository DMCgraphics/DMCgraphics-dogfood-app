-- CLEANUP ORPHANED DATA BEFORE APPLYING CASCADE DELETE CONSTRAINTS
-- This script removes all data that references non-existent users

-- ========================================
-- STEP 1: IDENTIFY ORPHANED DATA
-- ========================================

-- Show orphaned dogs
SELECT 'ORPHANED DOGS:' as table_name, count(*) as orphaned_count
FROM dogs 
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR user_id IS NULL

UNION ALL

-- Show orphaned plans
SELECT 'ORPHANED PLANS:', count(*)
FROM plans 
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR user_id IS NULL

UNION ALL

-- Show orphaned subscriptions
SELECT 'ORPHANED SUBSCRIPTIONS:', count(*)
FROM subscriptions 
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR user_id IS NULL

UNION ALL

-- Show orphaned orders
SELECT 'ORPHANED ORDERS:', count(*)
FROM orders 
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR user_id IS NULL;

-- ========================================
-- STEP 2: DELETE ORPHANED DATA
-- ========================================

-- Delete orphaned plan_items first (they reference plans)
DELETE FROM plan_items 
WHERE plan_id IN (
    SELECT id FROM plans 
    WHERE user_id NOT IN (SELECT id FROM auth.users)
       OR user_id IS NULL
);

-- Delete orphaned subscriptions
DELETE FROM subscriptions 
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR user_id IS NULL;

-- Delete orphaned orders
DELETE FROM orders 
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR user_id IS NULL;

-- Delete orphaned plans
DELETE FROM plans 
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR user_id IS NULL;

-- Delete orphaned dogs
DELETE FROM dogs 
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR user_id IS NULL;

-- Delete orphaned billing_customers (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_customers' AND table_schema = 'public') THEN
        DELETE FROM billing_customers 
        WHERE user_id NOT IN (SELECT id FROM auth.users)
           OR user_id IS NULL;
    END IF;
END $$;

-- Delete orphaned addresses (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addresses' AND table_schema = 'public') THEN
        DELETE FROM addresses 
        WHERE user_id NOT IN (SELECT id FROM auth.users)
           OR user_id IS NULL;
    END IF;
END $$;

-- Delete orphaned ai_recommendations (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_recommendations' AND table_schema = 'public') THEN
        DELETE FROM ai_recommendations 
        WHERE user_id NOT IN (SELECT id FROM auth.users)
           OR user_id IS NULL;
    END IF;
END $$;

-- ========================================
-- STEP 3: VERIFY CLEANUP
-- ========================================

-- Show remaining orphaned data (should be 0)
SELECT 'REMAINING ORPHANED DOGS:' as table_name, count(*) as orphaned_count
FROM dogs 
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR user_id IS NULL

UNION ALL

SELECT 'REMAINING ORPHANED PLANS:', count(*)
FROM plans 
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR user_id IS NULL

UNION ALL

SELECT 'REMAINING ORPHANED SUBSCRIPTIONS:', count(*)
FROM subscriptions 
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR user_id IS NULL

UNION ALL

SELECT 'REMAINING ORPHANED ORDERS:', count(*)
FROM orders 
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR user_id IS NULL;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ORPHANED DATA CLEANUP COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All orphaned data has been removed.';
    RAISE NOTICE 'You can now run the CASCADE DELETE constraints script.';
    RAISE NOTICE '========================================';
END $$;
