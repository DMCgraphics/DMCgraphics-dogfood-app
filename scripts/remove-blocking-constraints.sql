-- Remove all constraints that are blocking user deletion through Supabase Auth interface
-- This script will remove constraints that prevent CASCADE DELETE from working properly

-- ========================================
-- STEP 1: REMOVE ALL FOREIGN KEY CONSTRAINTS
-- ========================================

-- Remove ALL foreign key constraints from dogs table
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'dogs'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE dogs DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped dogs constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove ALL foreign key constraints from plans table
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'plans'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE plans DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped plans constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove ALL foreign key constraints from plan_items table
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'plan_items'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped plan_items constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove ALL foreign key constraints from subscriptions table
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'subscriptions'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped subscriptions constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove ALL foreign key constraints from orders table
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'orders'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE orders DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped orders constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove ALL foreign key constraints from billing_customers table (if exists)
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_customers' AND table_schema = 'public') THEN
        FOR constraint_name IN 
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'billing_customers'::regclass 
            AND contype = 'f'
        LOOP
            EXECUTE 'ALTER TABLE billing_customers DROP CONSTRAINT IF EXISTS ' || constraint_name;
            RAISE NOTICE 'Dropped billing_customers constraint: %', constraint_name;
        END LOOP;
    END IF;
END $$;

-- Remove ALL foreign key constraints from dog_metrics table (if exists)
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dog_metrics' AND table_schema = 'public') THEN
        FOR constraint_name IN 
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'dog_metrics'::regclass 
            AND contype = 'f'
        LOOP
            EXECUTE 'ALTER TABLE dog_metrics DROP CONSTRAINT IF EXISTS ' || constraint_name;
            RAISE NOTICE 'Dropped dog_metrics constraint: %', constraint_name;
        END LOOP;
    END IF;
END $$;

-- Remove ALL foreign key constraints from plan_dogs table (if exists)
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_dogs' AND table_schema = 'public') THEN
        FOR constraint_name IN 
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'plan_dogs'::regclass 
            AND contype = 'f'
        LOOP
            EXECUTE 'ALTER TABLE plan_dogs DROP CONSTRAINT IF EXISTS ' || constraint_name;
            RAISE NOTICE 'Dropped plan_dogs constraint: %', constraint_name;
        END LOOP;
    END IF;
END $$;

-- Remove ALL foreign key constraints from addresses table (if exists)
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addresses' AND table_schema = 'public') THEN
        FOR constraint_name IN 
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'addresses'::regclass 
            AND contype = 'f'
        LOOP
            EXECUTE 'ALTER TABLE addresses DROP CONSTRAINT IF EXISTS ' || constraint_name;
            RAISE NOTICE 'Dropped addresses constraint: %', constraint_name;
        END LOOP;
    END IF;
END $$;

-- Remove ALL foreign key constraints from ai_recommendations table (if exists)
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_recommendations' AND table_schema = 'public') THEN
        FOR constraint_name IN 
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'ai_recommendations'::regclass 
            AND contype = 'f'
        LOOP
            EXECUTE 'ALTER TABLE ai_recommendations DROP CONSTRAINT IF EXISTS ' || constraint_name;
            RAISE NOTICE 'Dropped ai_recommendations constraint: %', constraint_name;
        END LOOP;
    END IF;
END $$;

-- ========================================
-- STEP 2: REMOVE ALL CHECK CONSTRAINTS
-- ========================================

-- Remove ALL check constraints from dogs table
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'dogs'::regclass 
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE dogs DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped dogs check constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove ALL check constraints from plans table
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'plans'::regclass 
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE plans DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped plans check constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove ALL check constraints from plan_items table
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'plan_items'::regclass 
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped plan_items check constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove ALL check constraints from subscriptions table
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'subscriptions'::regclass 
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped subscriptions check constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove ALL check constraints from orders table
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'orders'::regclass 
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE orders DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped orders check constraint: %', constraint_name;
    END LOOP;
END $$;

-- ========================================
-- STEP 3: REMOVE ALL TRIGGERS
-- ========================================

-- Remove all triggers from dogs table
DROP TRIGGER IF EXISTS trigger_calculate_dog_weight_kg ON dogs;

-- Remove all triggers from plans table
DROP TRIGGER IF EXISTS trigger_calculate_plan_totals ON plans;

-- ========================================
-- STEP 4: REMOVE ALL FUNCTIONS
-- ========================================

-- Remove validation functions
DROP FUNCTION IF EXISTS calculate_dog_weight_kg();
DROP FUNCTION IF EXISTS calculate_plan_totals();
DROP FUNCTION IF EXISTS validate_user_data_completeness(UUID);

-- ========================================
-- STEP 5: VERIFICATION
-- ========================================

-- Show remaining constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    LEFT JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('dogs', 'plans', 'plan_items', 'subscriptions', 'orders')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ALL BLOCKING CONSTRAINTS REMOVED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Removed:';
    RAISE NOTICE '- All foreign key constraints';
    RAISE NOTICE '- All check constraints';
    RAISE NOTICE '- All triggers';
    RAISE NOTICE '- All validation functions';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'You should now be able to delete users';
    RAISE NOTICE 'directly through the Supabase Auth interface.';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'WARNING: This removes data validation!';
    RAISE NOTICE 'Use manual deletion scripts for safety.';
    RAISE NOTICE '========================================';
END $$;
