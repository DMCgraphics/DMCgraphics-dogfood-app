-- Create inventory table and populate with initial recipe data

-- Create the inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_name TEXT NOT NULL UNIQUE,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admin users to manage inventory
CREATE POLICY "Admin users can manage inventory"
  ON inventory
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create policy to allow authenticated users to view inventory
CREATE POLICY "Authenticated users can view inventory"
  ON inventory
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Populate inventory table with the four core recipes
INSERT INTO inventory (recipe_name, quantity_on_hand, reserved_quantity, low_stock_threshold)
VALUES
  ('beef', 100, 0, 20),
  ('chicken', 100, 0, 20),
  ('lamb', 100, 0, 20),
  ('turkey', 100, 0, 20)
ON CONFLICT (recipe_name) DO NOTHING;
