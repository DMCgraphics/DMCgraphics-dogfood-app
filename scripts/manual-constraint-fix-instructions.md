# Manual Foreign Key Constraint Fix Instructions

## Problem
When you manually delete users from the database, the related data (dogs, plans, plan_items, subscriptions, orders) is not automatically deleted due to missing CASCADE DELETE constraints.

## Solution
Run these SQL commands in your Supabase SQL editor to fix the foreign key constraints:

```sql
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

-- Fix orders table foreign key to plans
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_plan_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Fix orders table foreign key to subscriptions
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_subscription_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_subscription_id_fkey 
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;
```

## What This Does
After running these commands, when you delete a user from the `auth.users` table:

1. **All dogs** belonging to that user will be automatically deleted
2. **All plans** belonging to that user will be automatically deleted
3. **All plan_items** belonging to those plans will be automatically deleted
4. **All subscriptions** belonging to that user will be automatically deleted
5. **All orders** belonging to that user will be automatically deleted

## How to Run
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Paste the SQL commands above
4. Click "Run" to execute them

## Verification
After running the commands, you can test by:
1. Creating a test user with some data
2. Deleting the user from `auth.users`
3. Verifying that all related data is automatically deleted

## Current Status
✅ **Orphaned data has been cleaned up** - All existing orphaned records have been removed
⏳ **Constraints need to be fixed** - Run the SQL commands above to prevent future orphaned data
