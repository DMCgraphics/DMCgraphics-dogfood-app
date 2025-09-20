-- Fix cascade deletion for proper user deletion
-- This script ensures that when a user is deleted, all related data is automatically deleted

-- First, let's check the current constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
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
  AND tc.table_schema = 'public'
  AND (tc.table_name IN ('dogs', 'plans', 'plan_items', 'subscriptions', 'orders')
       OR ccu.table_name = 'auth.users')
ORDER BY tc.table_name, tc.constraint_name;

-- Drop existing foreign key constraints that don't have CASCADE DELETE
-- and recreate them with CASCADE DELETE

-- 1. Fix dogs table foreign key to auth.users
ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_user_id_fkey;
ALTER TABLE dogs ADD CONSTRAINT dogs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Fix plans table foreign key to auth.users
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_user_id_fkey;
ALTER TABLE plans ADD CONSTRAINT plans_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Fix plans table foreign key to dogs
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_dog_id_fkey;
ALTER TABLE plans ADD CONSTRAINT plans_dog_id_fkey 
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;

-- 4. Fix plan_items table foreign key to plans
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS plan_items_plan_id_fkey;
ALTER TABLE plan_items ADD CONSTRAINT plan_items_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- 5. Fix plan_items table foreign key to dogs
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS plan_items_dog_id_fkey;
ALTER TABLE plan_items ADD CONSTRAINT plan_items_dog_id_fkey 
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;

-- 6. Fix subscriptions table foreign key to auth.users
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Fix subscriptions table foreign key to plans
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- 8. Fix orders table foreign key to auth.users
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 9. Fix orders table foreign key to plans
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_plan_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- 10. Fix orders table foreign key to subscriptions
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_subscription_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_subscription_id_fkey 
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;

-- Now clean up orphaned data (data that references non-existent users)
-- This will remove plans, dogs, etc. that have user_id pointing to deleted users

-- Delete orphaned plan_items first (they reference plans and dogs)
DELETE FROM plan_items 
WHERE plan_id IN (
    SELECT id FROM plans WHERE user_id IS NULL
) OR dog_id IN (
    SELECT id FROM dogs WHERE user_id IS NULL
);

-- Delete orphaned subscriptions
DELETE FROM subscriptions 
WHERE user_id IS NULL OR plan_id IN (
    SELECT id FROM plans WHERE user_id IS NULL
);

-- Delete orphaned orders
DELETE FROM orders 
WHERE user_id IS NULL OR plan_id IN (
    SELECT id FROM plans WHERE user_id IS NULL
);

-- Delete orphaned plans
DELETE FROM plans WHERE user_id IS NULL;

-- Delete orphaned dogs
DELETE FROM dogs WHERE user_id IS NULL;

-- Verify the cleanup
SELECT 'dogs' as table_name, COUNT(*) as count FROM dogs WHERE user_id IS NULL
UNION ALL
SELECT 'plans', COUNT(*) FROM plans WHERE user_id IS NULL
UNION ALL
SELECT 'plan_items', COUNT(*) FROM plan_items WHERE plan_id IN (SELECT id FROM plans WHERE user_id IS NULL)
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions WHERE user_id IS NULL
UNION ALL
SELECT 'orders', COUNT(*) FROM orders WHERE user_id IS NULL;
