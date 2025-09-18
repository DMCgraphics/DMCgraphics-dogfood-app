-- Update canonical recipe rows to match the 4 live recipes
-- This script ensures the database stays in sync with the new recipe names/ingredients

-- 1) Upsert recipes with correct names and ingredients
INSERT INTO recipes (name, description, ingredients, is_active, status, size, price, allergens)
VALUES
  ('Beef & Quinoa Harvest', 'Lean beef with quinoa and veggies for balanced nutrition.', 
    ARRAY['Lean ground beef','Quinoa','Carrots','Zucchini','Spinach','Balance IT supplement','Fish oil'], 
    true, 'active', '400g', 0, ARRAY['beef']),
  ('Lamb & Pumpkin Feast', 'Lamb with pumpkin, quinoa, and greens for sensitive digestion.', 
    ARRAY['Ground lamb','Pumpkin purée','Quinoa','Carrots','Kale or spinach','Balance IT supplement','Fish oil'], 
    true, 'active', '400g', 0, ARRAY['lamb']),
  ('Low-Fat Chicken & Garden Veggie', 'Low-fat chicken breast, egg whites, quinoa, and greens.', 
    ARRAY['Skinless chicken breast','Egg whites','Quinoa','Carrots (lightened with zucchini when needed)','Spinach','Balance IT supplement','Fish oil'], 
    true, 'active', '400g', 0, ARRAY['chicken','egg']),
  ('Turkey & Brown Rice Comfort', 'Lean turkey with brown rice and garden vegetables.', 
    ARRAY['Lean ground turkey','Brown rice','Carrots','Zucchini','Spinach','Balance IT supplement','Fish oil'], 
    true, 'active', '400g', 0, ARRAY['turkey'])
ON CONFLICT (name) DO UPDATE SET
  ingredients = EXCLUDED.ingredients,
  is_active = EXCLUDED.is_active,
  status = EXCLUDED.status,
  size = EXCLUDED.size,
  allergens = EXCLUDED.allergens;

-- 2) Map Stripe price IDs into product_prices table
-- Replace the placeholders with real Stripe price IDs from the spreadsheet
WITH r AS (
  SELECT id, name FROM recipes WHERE name IN (
    'Beef & Quinoa Harvest','Lamb & Pumpkin Feast','Low-Fat Chicken & Garden Veggie','Turkey & Brown Rice Comfort'
  )
)
INSERT INTO product_prices (recipe_id, size_g, unit_price_cents, billing_interval, stripe_price_id, active)
VALUES
  -- Beef & Quinoa Harvest pricing
  ((SELECT id FROM r WHERE name='Beef & Quinoa Harvest'), 400, 2100, 'week', 'price_1S32GB0R4BbWwBbfY0N2OQyo', true),
  ((SELECT id FROM r WHERE name='Beef & Quinoa Harvest'), 700, 3500, 'week', 'price_1S330D0R4BbWwBbfsZMb9vOm', true),
  ((SELECT id FROM r WHERE name='Beef & Quinoa Harvest'), 1000, 4900, 'week', 'price_1S33yk0R4BbWwBbfKd5a0Jpk', true),
  ((SELECT id FROM r WHERE name='Beef & Quinoa Harvest'), 1300, 6300, 'week', 'price_1S33zx0R4BbWwBbf1AC8sUHf', true),

  -- Lamb & Pumpkin Feast pricing
  ((SELECT id FROM r WHERE name='Lamb & Pumpkin Feast'), 400, 2100, 'week', 'price_1S345x0R4BbWwBbfJRGIQ4g5', true),
  ((SELECT id FROM r WHERE name='Lamb & Pumpkin Feast'), 700, 3500, 'week', 'price_1S346x0R4BbWwBbf1FENODao', true),
  ((SELECT id FROM r WHERE name='Lamb & Pumpkin Feast'), 1000, 4900, 'week', 'price_1S347g0R4BbWwBbfvaKYdyLs', true),
  ((SELECT id FROM r WHERE name='Lamb & Pumpkin Feast'), 1300, 6300, 'week', 'price_1S348p0R4BbWwBbfHoE8iLli', true),

  -- Low-Fat Chicken & Garden Veggie pricing
  ((SELECT id FROM r WHERE name='Low-Fat Chicken & Garden Veggie'), 400, 2100, 'week', 'price_1S340d0R4BbWwBbfqjQqMlhv', true),
  ((SELECT id FROM r WHERE name='Low-Fat Chicken & Garden Veggie'), 700, 3500, 'week', 'price_1S341d0R4BbWwBbf7S33jVQr', true),
  ((SELECT id FROM r WHERE name='Low-Fat Chicken & Garden Veggie'), 1000, 4900, 'week', 'price_1S342T0R4BbWwBbfQ0v71HSC', true),
  ((SELECT id FROM r WHERE name='Low-Fat Chicken & Garden Veggie'), 1300, 6300, 'week', 'price_1S34300R4BbWwBbf5RVMEC8L', true),

  -- Turkey & Brown Rice Comfort pricing
  ((SELECT id FROM r WHERE name='Turkey & Brown Rice Comfort'), 400, 2100, 'week', 'price_1S8ktS0R4BbWwBbfTY4sxMrL', true),
  ((SELECT id FROM r WHERE name='Turkey & Brown Rice Comfort'), 700, 3500, 'week', 'price_1S8ktx0R4BbWwBbfPf6vt2qs', true),
  ((SELECT id FROM r WHERE name='Turkey & Brown Rice Comfort'), 1000, 4900, 'week', 'price_1S8kuf0R4BbWwBbfRB6gwhiA', true),
  ((SELECT id FROM r WHERE name='Turkey & Brown Rice Comfort'), 1300, 6300, 'week', 'price_1S8kww0R4BbWwBbfGsB8CiwP', true)
ON CONFLICT (stripe_price_id) DO UPDATE SET
  unit_price_cents = EXCLUDED.unit_price_cents,
  active = EXCLUDED.active;

-- 3) Deactivate old recipe entries that are no longer used
UPDATE recipes 
SET is_active = false, status = 'deprecated'
WHERE name NOT IN (
  'Beef & Quinoa Harvest',
  'Lamb & Pumpkin Feast', 
  'Low-Fat Chicken & Garden Veggie',
  'Turkey & Brown Rice Comfort'
) AND is_active = true;

-- 4) Update any existing orders or subscriptions that reference old recipe names
-- This would need to be customized based on your actual database schema
-- Example: UPDATE orders SET recipe_name = 'Low-Fat Chicken & Garden Veggie' WHERE recipe_name = 'Chicken & Greens';
