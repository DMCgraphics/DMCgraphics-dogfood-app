-- COMPREHENSIVE FIX FOR USER DELETION CONSTRAINTS
-- This script will fix ALL constraints to allow proper user deletion with CASCADE DELETE

-- ========================================
-- STEP 1: REMOVE ALL EXISTING CONSTRAINTS
-- ========================================

-- Remove ALL possible constraint variations for dogs table
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Get all foreign key constraints on dogs table
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'dogs'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE dogs DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove ALL possible constraint variations for plans table
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
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove ALL possible constraint variations for plan_items table
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
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove ALL possible constraint variations for subscriptions table
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
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove ALL possible constraint variations for orders table
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
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Remove ALL possible constraint variations for billing_customers table (if exists)
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
            RAISE NOTICE 'Dropped constraint: %', constraint_name;
        END LOOP;
    END IF;
END $$;

-- Remove ALL possible constraint variations for addresses table (if exists)
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
            RAISE NOTICE 'Dropped constraint: %', constraint_name;
        END LOOP;
    END IF;
END $$;

-- Remove ALL possible constraint variations for ai_recommendations table (if exists)
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
            RAISE NOTICE 'Dropped constraint: %', constraint_name;
        END LOOP;
    END IF;
END $$;

-- ========================================
-- STEP 2: CREATE NEW CASCADE DELETE CONSTRAINTS
-- ========================================

-- Create dogs.user_id constraint with CASCADE DELETE
ALTER TABLE dogs ADD CONSTRAINT dogs_user_id_cascade_delete 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create plans.user_id constraint with CASCADE DELETE
ALTER TABLE plans ADD CONSTRAINT plans_user_id_cascade_delete 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create plans.dog_id constraint with CASCADE DELETE
ALTER TABLE plans ADD CONSTRAINT plans_dog_id_cascade_delete 
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;

-- Create plan_items.plan_id constraint with CASCADE DELETE
ALTER TABLE plan_items ADD CONSTRAINT plan_items_plan_id_cascade_delete 
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Create plan_items.dog_id constraint with CASCADE DELETE
ALTER TABLE plan_items ADD CONSTRAINT plan_items_dog_id_cascade_delete 
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;

-- Create subscriptions.user_id constraint with CASCADE DELETE
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_cascade_delete 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create subscriptions.plan_id constraint with CASCADE DELETE
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_id_cascade_delete 
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Create orders.user_id constraint with CASCADE DELETE
ALTER TABLE orders ADD CONSTRAINT orders_user_id_cascade_delete 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create billing_customers.user_id constraint with CASCADE DELETE (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_customers' AND table_schema = 'public') THEN
        ALTER TABLE billing_customers ADD CONSTRAINT billing_customers_user_id_cascade_delete 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Created billing_customers constraint';
    END IF;
END $$;

-- Create addresses.user_id constraint with CASCADE DELETE (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addresses' AND table_schema = 'public') THEN
        ALTER TABLE addresses ADD CONSTRAINT addresses_user_id_cascade_delete 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Created addresses constraint';
    END IF;
END $$;

-- Create ai_recommendations.user_id constraint with CASCADE DELETE (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_recommendations' AND table_schema = 'public') THEN
        ALTER TABLE ai_recommendations ADD CONSTRAINT ai_recommendations_user_id_cascade_delete 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Created ai_recommendations constraint';
    END IF;
END $$;

-- ========================================
-- STEP 3: VERIFICATION QUERY
-- ========================================

-- This query will show all CASCADE DELETE constraints
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name,
  rc.delete_rule
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'users'
  AND tc.table_schema = 'public'
  AND rc.delete_rule = 'CASCADE'
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- STEP 4: ADDITIONAL SAFETY MEASURES
-- ========================================

-- Create indexes to improve deletion performance
CREATE INDEX IF NOT EXISTS idx_dogs_user_id ON dogs(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_dog_id ON plans(dog_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_plan_id ON plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_dog_id ON plan_items(dog_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ALL CONSTRAINTS FIXED FOR USER DELETION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'You can now delete users in the Supabase Auth interface';
    RAISE NOTICE 'and all their associated data will be automatically deleted.';
    RAISE NOTICE '========================================';
END $$;
