-- Force fix CASCADE DELETE constraints
-- This script will aggressively remove all existing constraints and recreate them properly

-- ========================================
-- STEP 1: REMOVE ALL EXISTING CONSTRAINTS
-- ========================================

-- Remove all possible constraint names for dogs.user_id
ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_user_id_fkey;
ALTER TABLE dogs DROP CONSTRAINT IF EXISTS fk_dogs_user_id;
ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_user_id;
ALTER TABLE dogs DROP CONSTRAINT IF EXISTS fk_user_id;

-- Remove all possible constraint names for plans.user_id
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_user_id_fkey;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS fk_plans_user_id;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_user_id;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS fk_user_id;

-- Remove all possible constraint names for plans.dog_id
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_dog_id_fkey;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS fk_plans_dog_id;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_dog_id;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS fk_dog_id;

-- Remove all possible constraint names for plan_items.plan_id
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS plan_items_plan_id_fkey;
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS fk_plan_items_plan_id;
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS plan_items_plan_id;
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS fk_plan_id;

-- Remove all possible constraint names for plan_items.dog_id
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS plan_items_dog_id_fkey;
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS fk_plan_items_dog_id;
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS plan_items_dog_id;
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS fk_dog_id;

-- Remove all possible constraint names for subscriptions.user_id
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_user_id;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_user_id;

-- Remove all possible constraint names for subscriptions.plan_id
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_plan_id;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_plan_id;

-- Remove all possible constraint names for orders.user_id
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_user_id;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_user_id;

-- Remove all possible constraint names for billing_customers.user_id
ALTER TABLE billing_customers DROP CONSTRAINT IF EXISTS billing_customers_user_id_fkey;
ALTER TABLE billing_customers DROP CONSTRAINT IF EXISTS fk_billing_customers_user_id;
ALTER TABLE billing_customers DROP CONSTRAINT IF EXISTS billing_customers_user_id;
ALTER TABLE billing_customers DROP CONSTRAINT IF EXISTS fk_user_id;

-- Remove all possible constraint names for addresses.user_id
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS fk_addresses_user_id;
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_user_id;
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS fk_user_id;

-- Remove all possible constraint names for ai_recommendations.user_id
ALTER TABLE ai_recommendations DROP CONSTRAINT IF EXISTS ai_recommendations_user_id_fkey;
ALTER TABLE ai_recommendations DROP CONSTRAINT IF EXISTS fk_ai_recommendations_user_id;
ALTER TABLE ai_recommendations DROP CONSTRAINT IF EXISTS ai_recommendations_user_id;
ALTER TABLE ai_recommendations DROP CONSTRAINT IF EXISTS fk_user_id;

-- ========================================
-- STEP 2: CREATE NEW CASCADE DELETE CONSTRAINTS
-- ========================================

-- Create dogs.user_id constraint with CASCADE DELETE
ALTER TABLE dogs ADD CONSTRAINT dogs_user_id_cascade 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create plans.user_id constraint with CASCADE DELETE
ALTER TABLE plans ADD CONSTRAINT plans_user_id_cascade 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create plans.dog_id constraint with CASCADE DELETE
ALTER TABLE plans ADD CONSTRAINT plans_dog_id_cascade 
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;

-- Create plan_items.plan_id constraint with CASCADE DELETE
ALTER TABLE plan_items ADD CONSTRAINT plan_items_plan_id_cascade 
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Create plan_items.dog_id constraint with CASCADE DELETE
ALTER TABLE plan_items ADD CONSTRAINT plan_items_dog_id_cascade 
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;

-- Create subscriptions.user_id constraint with CASCADE DELETE
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_cascade 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create subscriptions.plan_id constraint with CASCADE DELETE
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_id_cascade 
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Create orders.user_id constraint with CASCADE DELETE
ALTER TABLE orders ADD CONSTRAINT orders_user_id_cascade 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create billing_customers.user_id constraint with CASCADE DELETE (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_customers' AND table_schema = 'public') THEN
        ALTER TABLE billing_customers ADD CONSTRAINT billing_customers_user_id_cascade 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create addresses.user_id constraint with CASCADE DELETE (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addresses' AND table_schema = 'public') THEN
        ALTER TABLE addresses ADD CONSTRAINT addresses_user_id_cascade 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create ai_recommendations.user_id constraint with CASCADE DELETE (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_recommendations' AND table_schema = 'public') THEN
        ALTER TABLE ai_recommendations ADD CONSTRAINT ai_recommendations_user_id_cascade 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ========================================
-- STEP 3: VERIFICATION
-- ========================================

-- This query should show all the new CASCADE DELETE constraints
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
-- STEP 4: TEST INSTRUCTIONS
-- ========================================

-- After running this script, you should be able to delete users directly in the Supabase Auth interface.
-- When you delete a user, all their related data should be automatically deleted due to the CASCADE DELETE constraints.

-- To test:
-- 1. Create a test user
-- 2. Create some data for that user (dogs, plans, etc.)
-- 3. Delete the user in the Supabase Auth interface
-- 4. Verify that all related data was automatically deleted
