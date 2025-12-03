-- Add tracking_token column to orders table for shareable tracking links
-- This allows admins to share tracking links via SMS, email, etc.
-- Token is automatically generated for each order

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

-- Create index for faster lookups by token
CREATE INDEX IF NOT EXISTS orders_tracking_token_idx ON orders(tracking_token);

-- Update existing orders to have tracking tokens
UPDATE orders
SET tracking_token = encode(gen_random_bytes(16), 'hex')
WHERE tracking_token IS NULL;

-- Make tracking_token NOT NULL after backfilling
ALTER TABLE orders
ALTER COLUMN tracking_token SET NOT NULL;
