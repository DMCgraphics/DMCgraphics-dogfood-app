-- Add constraint to prevent plans with null dog_id
-- This ensures that every plan must be linked to a dog

-- First, let's check if there are any existing plans with null dog_id
SELECT COUNT(*) as plans_with_null_dog_id 
FROM plans 
WHERE dog_id IS NULL;

-- Add the constraint
ALTER TABLE plans 
ADD CONSTRAINT plans_dog_id_not_null 
CHECK (dog_id IS NOT NULL);

-- Add a comment to document this constraint
COMMENT ON CONSTRAINT plans_dog_id_not_null ON plans IS 'Ensures every plan is linked to a dog to prevent dashboard display issues';
