-- Create plan_items table for storing dog/recipe combinations
CREATE TABLE IF NOT EXISTS plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL,
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id),
  qty INTEGER DEFAULT 1,
  size_g INTEGER,
  billing_interval TEXT DEFAULT 'monthly',
  unit_amount_cents INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plans table to track plan status
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, checkout, completed, cancelled
  total_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_plan_items_plan_id ON plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_dog_id ON plan_items(dog_id);
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);

-- Create RPC function to set plan item price
CREATE OR REPLACE FUNCTION set_plan_item_price(p_plan_item_id UUID)
RETURNS VOID AS $$
DECLARE
  item_record RECORD;
  dog_record RECORD;
  recipe_record RECORD;
  daily_grams NUMERIC;
  monthly_cost_cents INTEGER;
BEGIN
  -- Get plan item with dog and recipe data
  SELECT pi.*, d.weight, d.age, r.price as recipe_price
  INTO item_record
  FROM plan_items pi
  JOIN dogs d ON pi.dog_id = d.id
  LEFT JOIN recipes r ON pi.recipe_id = r.id
  WHERE pi.id = p_plan_item_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan item not found: %', p_plan_item_id;
  END IF;
  
  -- Calculate daily grams based on dog weight (simplified calculation)
  -- This is a basic calculation - you may want to use more sophisticated logic
  daily_grams := GREATEST(100, item_record.weight * 15); -- ~15g per lb as baseline
  
  -- Calculate monthly cost (30 days)
  -- Using $2.25 per 100g as base price if no recipe price available
  monthly_cost_cents := ROUND((daily_grams / 100.0) * COALESCE(item_record.recipe_price, 2.25) * 30 * 100);
  
  -- Update the plan item with calculated price
  UPDATE plan_items 
  SET 
    size_g = daily_grams,
    unit_amount_cents = monthly_cost_cents,
    updated_at = NOW()
  WHERE id = p_plan_item_id;
END;
$$ LANGUAGE plpgsql;

-- Create RPC function to recalculate plan totals
CREATE OR REPLACE FUNCTION recalc_plan_totals(p_plan_id TEXT)
RETURNS VOID AS $$
DECLARE
  total_cents INTEGER;
BEGIN
  -- Calculate total from all plan items
  SELECT COALESCE(SUM(unit_amount_cents * qty), 0)
  INTO total_cents
  FROM plan_items
  WHERE plan_id = p_plan_id;
  
  -- Update or insert plan record
  INSERT INTO plans (id, user_id, total_cents, updated_at)
  VALUES (p_plan_id, auth.uid(), total_cents, NOW())
  ON CONFLICT (id) 
  DO UPDATE SET 
    total_cents = EXCLUDED.total_cents,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Create view for current user's checkout lines
CREATE OR REPLACE VIEW current_user_checkout_lines AS
SELECT 
  p.id as plan_id,
  p.status,
  p.total_cents,
  COALESCE(
    json_agg(
      json_build_object(
        'id', pi.id,
        'dog_name', d.name,
        'recipe_name', r.name,
        'qty', pi.qty,
        'size_g', pi.size_g,
        'unit_amount_cents', pi.unit_amount_cents,
        'billing_interval', pi.billing_interval,
        'stripe_price_id', NULL -- Will be populated when you create Stripe prices
      ) ORDER BY d.name
    ) FILTER (WHERE pi.id IS NOT NULL),
    '[]'::json
  ) as line_items
FROM plans p
LEFT JOIN plan_items pi ON p.id = pi.plan_id
LEFT JOIN dogs d ON pi.dog_id = d.id
LEFT JOIN recipes r ON pi.recipe_id = r.id
WHERE p.user_id = auth.uid()
  AND p.status IN ('draft', 'checkout')
GROUP BY p.id, p.status, p.total_cents;
