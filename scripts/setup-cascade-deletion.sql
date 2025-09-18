-- Script to set up proper cascade deletion for user-related data
-- This ensures that when a user is deleted, all their associated data is automatically deleted

-- 1. Drop existing foreign key constraints that don't have CASCADE
-- Note: This is a destructive operation, so be careful in production

-- Drop and recreate dogs table foreign key to users
ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_user_id_fkey;
ALTER TABLE dogs ADD CONSTRAINT dogs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop and recreate plans table foreign key to users
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_user_id_fkey;
ALTER TABLE plans ADD CONSTRAINT plans_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop and recreate plans table foreign key to dogs
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_dog_id_fkey;
ALTER TABLE plans ADD CONSTRAINT plans_dog_id_fkey 
  FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;

-- Drop and recreate plan_items table foreign key to plans
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS plan_items_plan_id_fkey;
ALTER TABLE plan_items ADD CONSTRAINT plan_items_plan_id_fkey 
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Drop and recreate plan_items table foreign key to dogs
ALTER TABLE plan_items DROP CONSTRAINT IF EXISTS plan_items_dog_id_fkey;
ALTER TABLE plan_items ADD CONSTRAINT plan_items_dog_id_fkey 
  FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;

-- Drop and recreate plan_dogs table foreign key to plans
ALTER TABLE plan_dogs DROP CONSTRAINT IF EXISTS plan_dogs_plan_id_fkey;
ALTER TABLE plan_dogs ADD CONSTRAINT plan_dogs_plan_id_fkey 
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Drop and recreate plan_dogs table foreign key to dogs
ALTER TABLE plan_dogs DROP CONSTRAINT IF EXISTS plan_dogs_dog_id_fkey;
ALTER TABLE plan_dogs ADD CONSTRAINT plan_dogs_dog_id_fkey 
  FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;

-- Drop and recreate dog_metrics table foreign key to dogs
ALTER TABLE dog_metrics DROP CONSTRAINT IF EXISTS dog_metrics_dog_id_fkey;
ALTER TABLE dog_metrics ADD CONSTRAINT dog_metrics_dog_id_fkey 
  FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE;

-- Drop and recreate subscriptions table foreign key to users
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop and recreate subscriptions table foreign key to plans
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_id_fkey 
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

-- Create a function to handle user deletion cleanup
CREATE OR REPLACE FUNCTION cleanup_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called automatically when a user is deleted
  -- due to the CASCADE constraints above, but we can add additional cleanup here if needed
  
  -- Log the deletion (optional)
  INSERT INTO user_deletion_log (user_id, deleted_at) 
  VALUES (OLD.id, NOW())
  ON CONFLICT DO NOTHING;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create a log table for user deletions (optional)
CREATE TABLE IF NOT EXISTS user_deletion_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create trigger to log user deletions
DROP TRIGGER IF EXISTS user_deletion_trigger ON auth.users;
CREATE TRIGGER user_deletion_trigger
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_user_data();

-- Verify the constraints are set up correctly
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
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
  AND (tc.table_name IN ('dogs', 'plans', 'plan_items', 'plan_dogs', 'dog_metrics', 'subscriptions'))
ORDER BY tc.table_name, tc.constraint_name;
