-- Corrected SQL commands for cascade deletion based on actual table structure
-- Run these commands in your Supabase SQL editor

-- Fix dogs table foreign key to auth.users
ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_user_id_fkey;
ALTER TABLE dogs ADD CONSTRAINT dogs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix plans table foreign key to auth.users
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_user_id_fkey;
ALTER TABLE plans ADD CONSTRAINT plans_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix plans table foreign key to dogs
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_dog_id_fkey;
ALTER TABLE plans ADD CONSTRAINT plans_dog_id_fkey 
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;

-- Fix plan_items table foreign key to plans
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS plan_items_plan_id_fkey;
ALTER TABLE plan_items ADD CONSTRAINT plan_items_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Fix plan_items table foreign key to dogs
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS plan_items_dog_id_fkey;
ALTER TABLE plan_items ADD CONSTRAINT plan_items_dog_id_fkey 
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;

-- Fix subscriptions table foreign key to auth.users
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix subscriptions table foreign key to plans
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Fix orders table foreign key to auth.users
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix orders table foreign key to plans (if plan_id exists and is not null)
-- Note: plan_id can be null in orders, so we'll skip this constraint for now
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_plan_id_fkey;
-- ALTER TABLE orders ADD CONSTRAINT orders_plan_id_fkey 
--     FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Note: orders table has stripe_subscription_id but no direct subscription_id column
-- The stripe_subscription_id references Stripe's subscription ID, not our internal subscription ID
-- So we cannot create a foreign key constraint to our subscriptions table
-- This is by design - orders reference Stripe subscriptions, not our internal subscription records
