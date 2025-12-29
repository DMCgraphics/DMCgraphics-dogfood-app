-- Purchase Order System for Vendor Management
-- Enables automated PO generation for protein orders from suppliers like Mosner Family Brands

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  lead_time_days INTEGER NOT NULL DEFAULT 2,
  minimum_order_lbs DECIMAL(10,2) DEFAULT 10.00,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor products and pricing
CREATE TABLE IF NOT EXISTS vendor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  unit_price_per_lb DECIMAL(10,2),
  available_sizes TEXT[], -- e.g., ['10 lbs', '25 lbs', '50 lbs']
  product_code TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, ingredient_name)
);

-- Purchase orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  batch_plan_id UUID, -- Optional: link to batch plan if you have that table
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  needed_by_date DATE NOT NULL,
  pickup_date DATE,
  pickup_time TIME,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, confirmed, picked_up, received, cancelled
  subtotal_cents INTEGER DEFAULT 0,
  tax_cents INTEGER DEFAULT 0,
  total_cents INTEGER DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase order line items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity_lbs DECIMAL(10,2) NOT NULL,
  unit_price_cents INTEGER DEFAULT 0,
  total_price_cents INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory tracking (for excess protein from minimum orders)
CREATE TABLE IF NOT EXISTS ingredient_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_name TEXT NOT NULL,
  quantity_lbs DECIMAL(10,2) NOT NULL DEFAULT 0,
  location TEXT, -- e.g., 'freezer', 'cooler'
  received_date DATE,
  expiration_date DATE,
  po_id UUID REFERENCES purchase_orders(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_needed_by ON purchase_orders(needed_by_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor ON vendor_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_ingredient ON ingredient_inventory(ingredient_name);

-- RLS policies
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_inventory ENABLE ROW LEVEL SECURITY;

-- Admin-only access for vendors
CREATE POLICY "Admin full access to vendors"
  ON vendors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admin-only access for vendor products
CREATE POLICY "Admin full access to vendor_products"
  ON vendor_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admin and sales can view purchase orders
CREATE POLICY "Admin and sales can view purchase_orders"
  ON purchase_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR 'sales_manager' = ANY(profiles.roles) OR 'sales_rep' = ANY(profiles.roles))
    )
  );

-- Admin can manage purchase orders
CREATE POLICY "Admin can manage purchase_orders"
  ON purchase_orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admin and sales can view PO items
CREATE POLICY "Admin and sales can view po_items"
  ON purchase_order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR 'sales_manager' = ANY(profiles.roles) OR 'sales_rep' = ANY(profiles.roles))
    )
  );

-- Admin can manage PO items
CREATE POLICY "Admin can manage po_items"
  ON purchase_order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admin can manage inventory
CREATE POLICY "Admin can manage inventory"
  ON ingredient_inventory
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Function to generate sequential PO numbers (format: PO-NPMFB-XXX)
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  new_po_number TEXT;
BEGIN
  -- Get the highest PO number and increment
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(po_number FROM 'PO-NPMFB-([0-9]+)') AS INTEGER)),
    0
  ) + 1 INTO next_number
  FROM purchase_orders
  WHERE po_number ~ '^PO-NPMFB-[0-9]+$';

  -- Format as PO-NPMFB-003
  new_po_number := 'PO-NPMFB-' || LPAD(next_number::TEXT, 3, '0');

  RETURN new_po_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_products_updated_at
  BEFORE UPDATE ON vendor_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON ingredient_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed Mosner Family Brands as initial vendor
INSERT INTO vendors (name, contact_name, contact_email, contact_phone, lead_time_days, minimum_order_lbs, notes)
VALUES (
  'Mosner Family Brands',
  'Daisy Velez / Jessica Mosner',
  'dvelez@mosnerbrands.com,jmosner@mosnerbrands.com',
  NULL,
  2,
  10.00,
  'Primary protein supplier - grass-fed beef, pasture-raised lamb, responsibly raised poultry'
)
ON CONFLICT DO NOTHING;

-- Seed Mosner protein products
INSERT INTO vendor_products (vendor_id, ingredient_name, available_sizes, notes)
SELECT
  v.id,
  p.ingredient_name,
  ARRAY['10 lbs', '25 lbs', '50 lbs'],
  p.product_notes
FROM vendors v
CROSS JOIN (
  VALUES
    ('Ground beef 85/15', 'Grass-fed'),
    ('Beef Heart, Raw', 'Grass-fed'),
    ('Beef Liver, Raw', 'Grass-fed'),
    ('Lamb, Ground 85/15', 'Pasture-raised'),
    ('Lamb Heart, Raw', 'Pasture-raised'),
    ('Lamb Liver, Raw', 'Pasture-raised'),
    ('Ground chicken', 'Responsibly raised'),
    ('Ground turkey', 'Lean, responsibly raised')
) AS p(ingredient_name, product_notes)
WHERE v.name = 'Mosner Family Brands'
ON CONFLICT DO NOTHING;
