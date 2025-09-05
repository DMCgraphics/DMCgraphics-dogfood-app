-- Create plan_items table to store individual dog plan data
CREATE TABLE IF NOT EXISTS plan_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  size_g NUMERIC NOT NULL DEFAULT 0,
  billing_interval TEXT NOT NULL DEFAULT 'monthly',
  price_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RPC function to set plan item price based on dog weight and recipe
CREATE OR REPLACE FUNCTION set_plan_item_price(plan_item_id UUID)
RETURNS VOID AS $$
DECLARE
  item_record RECORD;
  dog_weight_kg NUMERIC;
  base_price_per_100g NUMERIC := 2.25; -- Base price per 100g
  daily_grams NUMERIC;
  monthly_grams NUMERIC;
  monthly_price_cents INTEGER;
BEGIN
  -- Get plan item with dog and recipe info
  SELECT pi.*, d.weight, r.price 
  INTO item_record
  FROM plan_items pi
  JOIN dogs d ON pi.dog_id = d.id
  LEFT JOIN recipes r ON pi.recipe_id = r.id
  WHERE pi.id = plan_item_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  dog_weight_kg := item_record.weight;
  
  -- Calculate daily grams based on dog weight (simplified formula)
  -- This is a basic calculation - in reality you'd use more complex nutrition formulas
  daily_grams := dog_weight_kg * 25; -- Roughly 25g per kg of body weight
  
  -- Calculate monthly grams (30 days)
  monthly_grams := daily_grams * 30;
  
  -- Calculate monthly price in cents
  monthly_price_cents := ROUND((monthly_grams / 100) * base_price_per_100g * 100);
  
  -- Update the plan item with calculated price and size
  UPDATE plan_items 
  SET 
    price_cents = monthly_price_cents,
    size_g = monthly_grams,
    updated_at = NOW()
  WHERE id = plan_item_id;
END;
$$ LANGUAGE plpgsql;

-- Create RPC function to recalculate plan totals
CREATE OR REPLACE FUNCTION recalc_plan_totals(user_id_param UUID)
RETURNS TABLE(
  subtotal_cents INTEGER,
  discount_cents INTEGER,
  total_cents INTEGER
) AS $$
DECLARE
  subtotal INTEGER := 0;
  discount INTEGER := 0;
BEGIN
  -- Calculate subtotal from all active plan items for user
  SELECT COALESCE(SUM(price_cents), 0)
  INTO subtotal
  FROM plan_items
  WHERE user_id = user_id_param AND status = 'active';
  
  -- Apply any discounts (placeholder for future discount logic)
  discount := 0;
  
  RETURN QUERY SELECT subtotal, discount, GREATEST(0, subtotal - discount);
END;
$$ LANGUAGE plpgsql;

-- Create view for current user checkout lines
CREATE OR REPLACE VIEW current_user_checkout_lines AS
SELECT 
  pi.user_id,
  pi.id as line_id,
  d.name as dog_name,
  r.name as recipe_name,
  pi.size_g,
  pi.price_cents,
  pi.billing_interval,
  pi.status,
  d.id as dog_id,
  r.id as recipe_id
FROM plan_items pi
JOIN dogs d ON pi.dog_id = d.id
LEFT JOIN recipes r ON pi.recipe_id = r.id
WHERE pi.status = 'active';

-- Enable RLS on plan_items table
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for plan_items
CREATE POLICY "Users can view their own plan items" ON plan_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plan items" ON plan_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan items" ON plan_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan items" ON plan_items
  FOR DELETE USING (auth.uid() = user_id);
