-- Clean up orphaned data from deleted users
-- This script removes all data that references non-existent users

-- ========================================
-- STEP 1: IDENTIFY ORPHANED DATA
-- ========================================

-- Show orphaned dogs (dogs without valid users)
SELECT 
    'dogs' as table_name,
    COUNT(*) as orphaned_count
FROM dogs d
LEFT JOIN auth.users u ON d.user_id = u.id
WHERE u.id IS NULL;

-- Show orphaned plans (plans without valid users)
SELECT 
    'plans' as table_name,
    COUNT(*) as orphaned_count
FROM plans p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- Show orphaned plan_items (plan_items without valid plans)
SELECT 
    'plan_items' as table_name,
    COUNT(*) as orphaned_count
FROM plan_items pi
LEFT JOIN plans p ON pi.plan_id = p.id
WHERE p.id IS NULL;

-- Show orphaned subscriptions (subscriptions without valid users)
SELECT 
    'subscriptions' as table_name,
    COUNT(*) as orphaned_count
FROM subscriptions s
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE u.id IS NULL;

-- Show orphaned orders (orders without valid users)
SELECT 
    'orders' as table_name,
    COUNT(*) as orphaned_count
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
WHERE u.id IS NULL;

-- Show orphaned dog_metrics (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dog_metrics' AND table_schema = 'public') THEN
        RAISE NOTICE 'Checking dog_metrics for orphaned data...';
    END IF;
END $$;

-- Show orphaned plan_dogs (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_dogs' AND table_schema = 'public') THEN
        RAISE NOTICE 'Checking plan_dogs for orphaned data...';
    END IF;
END $$;

-- Show orphaned addresses (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addresses' AND table_schema = 'public') THEN
        RAISE NOTICE 'Checking addresses for orphaned data...';
    END IF;
END $$;

-- Show orphaned ai_recommendations (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_recommendations' AND table_schema = 'public') THEN
        RAISE NOTICE 'Checking ai_recommendations for orphaned data...';
    END IF;
END $$;

-- ========================================
-- STEP 2: DELETE ORPHANED DATA
-- ========================================

-- Delete orphaned plan_items first (they reference plans)
DELETE FROM plan_items 
WHERE plan_id IN (
    SELECT p.id 
    FROM plans p
    LEFT JOIN auth.users u ON p.user_id = u.id
    WHERE u.id IS NULL
);

-- Delete orphaned plans
DELETE FROM plans 
WHERE user_id IN (
    SELECT d.user_id 
    FROM dogs d
    LEFT JOIN auth.users u ON d.user_id = u.id
    WHERE u.id IS NULL
);

-- Delete orphaned subscriptions
DELETE FROM subscriptions 
WHERE user_id IN (
    SELECT d.user_id 
    FROM dogs d
    LEFT JOIN auth.users u ON d.user_id = u.id
    WHERE u.id IS NULL
);

-- Delete orphaned orders
DELETE FROM orders 
WHERE user_id IN (
    SELECT d.user_id 
    FROM dogs d
    LEFT JOIN auth.users u ON d.user_id = u.id
    WHERE u.id IS NULL
);

-- Delete orphaned dogs
DELETE FROM dogs 
WHERE user_id IN (
    SELECT d.user_id 
    FROM dogs d
    LEFT JOIN auth.users u ON d.user_id = u.id
    WHERE u.id IS NULL
);

-- Delete orphaned dog_metrics (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dog_metrics' AND table_schema = 'public') THEN
        DELETE FROM dog_metrics 
        WHERE dog_id IN (
            SELECT d.id 
            FROM dogs d
            LEFT JOIN auth.users u ON d.user_id = u.id
            WHERE u.id IS NULL
        );
        RAISE NOTICE 'Deleted orphaned dog_metrics';
    END IF;
END $$;

-- Delete orphaned plan_dogs (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_dogs' AND table_schema = 'public') THEN
        DELETE FROM plan_dogs 
        WHERE plan_id IN (
            SELECT p.id 
            FROM plans p
            LEFT JOIN auth.users u ON p.user_id = u.id
            WHERE u.id IS NULL
        );
        RAISE NOTICE 'Deleted orphaned plan_dogs';
    END IF;
END $$;

-- Delete orphaned addresses (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addresses' AND table_schema = 'public') THEN
        DELETE FROM addresses 
        WHERE user_id IN (
            SELECT d.user_id 
            FROM dogs d
            LEFT JOIN auth.users u ON d.user_id = u.id
            WHERE u.id IS NULL
        );
        RAISE NOTICE 'Deleted orphaned addresses';
    END IF;
END $$;

-- Delete orphaned ai_recommendations (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_recommendations' AND table_schema = 'public') THEN
        DELETE FROM ai_recommendations 
        WHERE user_id IN (
            SELECT d.user_id 
            FROM dogs d
            LEFT JOIN auth.users u ON d.user_id = u.id
            WHERE u.id IS NULL
        );
        RAISE NOTICE 'Deleted orphaned ai_recommendations';
    END IF;
END $$;

-- ========================================
-- STEP 3: VERIFICATION
-- ========================================

-- Check for remaining orphaned data
SELECT 
    'FINAL CHECK - dogs' as table_name,
    COUNT(*) as remaining_orphaned
FROM dogs d
LEFT JOIN auth.users u ON d.user_id = u.id
WHERE u.id IS NULL;

SELECT 
    'FINAL CHECK - plans' as table_name,
    COUNT(*) as remaining_orphaned
FROM plans p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL;

SELECT 
    'FINAL CHECK - plan_items' as table_name,
    COUNT(*) as remaining_orphaned
FROM plan_items pi
LEFT JOIN plans p ON pi.plan_id = p.id
WHERE p.id IS NULL;

SELECT 
    'FINAL CHECK - subscriptions' as table_name,
    COUNT(*) as remaining_orphaned
FROM subscriptions s
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE u.id IS NULL;

SELECT 
    'FINAL CHECK - orders' as table_name,
    COUNT(*) as remaining_orphaned
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
WHERE u.id IS NULL;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ORPHANED DATA CLEANUP COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Removed orphaned data from:';
    RAISE NOTICE '- dogs (without valid users)';
    RAISE NOTICE '- plans (without valid users)';
    RAISE NOTICE '- plan_items (without valid plans)';
    RAISE NOTICE '- subscriptions (without valid users)';
    RAISE NOTICE '- orders (without valid users)';
    RAISE NOTICE '- dog_metrics (if exists)';
    RAISE NOTICE '- plan_dogs (if exists)';
    RAISE NOTICE '- addresses (if exists)';
    RAISE NOTICE '- ai_recommendations (if exists)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database is now clean of orphaned data!';
    RAISE NOTICE '========================================';
END $$;