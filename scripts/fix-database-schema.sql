-- Add missing weight_unit column to dogs table
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS weight_unit text DEFAULT 'lb';

-- Create plan_items table for storing individual dog plan data
CREATE TABLE IF NOT EXISTS plan_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL,
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id),
  size_g numeric NOT NULL,
  billing_interval text NOT NULL DEFAULT 'monthly',
  price_cents integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plan_items_plan_id ON plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_dog_id ON plan_items(dog_id);

-- Create RPC function to set plan item price
CREATE OR REPLACE FUNCTION set_plan_item_price(
  p_plan_item_id uuid,
  p_dog_weight numeric,
  p_weight_unit text DEFAULT 'lb'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipe_price numeric;
  v_daily_grams numeric;
  v_monthly_price_cents integer;
  v_weight_kg numeric;
BEGIN
  -- Convert weight to kg if needed
  IF p_weight_unit = 'lb' THEN
    v_weight_kg := p_dog_weight * 0.453592;
  ELSE
    v_weight_kg := p_dog_weight;
  END IF;
  
  -- Calculate daily grams needed (rough estimate: 30g per kg of body weight)
  v_daily_grams := v_weight_kg * 30;
  
  -- Get recipe price per 100g
  SELECT price INTO v_recipe_price
  FROM recipes r
  JOIN plan_items pi ON pi.recipe_id = r.id
  WHERE pi.id = p_plan_item_id;
  
  -- Calculate monthly price (30 days)
  v_monthly_price_cents := ROUND((v_daily_grams / 100.0) * v_recipe_price * 30 * 100);
  
  -- Update plan item with calculated price
  UPDATE plan_items 
  SET 
    price_cents = v_monthly_price_cents,
    size_g = v_daily_grams,
    updated_at = now()
  WHERE id = p_plan_item_id;
END;
$$;

-- Create RPC function to recalculate plan totals
CREATE OR REPLACE FUNCTION recalc_plan_totals(p_plan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be used to recalculate totals if needed
  -- For now, it's a placeholder since we calculate prices per item
  UPDATE plan_items 
  SET updated_at = now() 
  WHERE plan_id = p_plan_id;
END;
$$;

-- Create view for current user checkout lines
CREATE OR REPLACE VIEW current_user_checkout_lines AS
SELECT 
  pi.id,
  pi.plan_id,
  d.name as dog_name,
  r.name as recipe_name,
  pi.size_g,
  pi.price_cents,
  pi.billing_interval,
  d.user_id,
  pi.created_at
FROM plan_items pi
JOIN dogs d ON pi.dog_id = d.id
JOIN recipes r ON pi.recipe_id = r.id
WHERE d.user_id = auth.uid();

-- Enable RLS on plan_items table
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for plan_items
CREATE POLICY "Users can manage their own plan items" ON plan_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM dogs 
      WHERE dogs.id = plan_items.dog_id 
      AND dogs.user_id = auth.uid()
    )
  );
