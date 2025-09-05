-- Adding sample recipes to populate the empty recipes table
INSERT INTO recipes (id, name, description, ingredients, price, size, status, is_active, allergens) VALUES
(
  gen_random_uuid(),
  'Beef & Quinoa Harvest',
  'Premium beef with quinoa, sweet potatoes, and vegetables for balanced nutrition',
  ARRAY['beef', 'quinoa', 'sweet potato', 'carrots', 'peas', 'blueberries'],
  45.99,
  '400g',
  'active',
  true,
  ARRAY['beef']
),
(
  gen_random_uuid(),
  'Chicken & Brown Rice',
  'Free-range chicken with brown rice, spinach, and cranberries',
  ARRAY['chicken', 'brown rice', 'spinach', 'cranberries', 'carrots'],
  42.99,
  '400g',
  'active',
  true,
  ARRAY['chicken']
),
(
  gen_random_uuid(),
  'Turkey & Sweet Potato',
  'Lean turkey with sweet potatoes, green beans, and apples',
  ARRAY['turkey', 'sweet potato', 'green beans', 'apples', 'pumpkin'],
  44.99,
  '400g',
  'active',
  true,
  ARRAY['turkey']
),
(
  gen_random_uuid(),
  'Salmon & Lentil',
  'Wild-caught salmon with lentils, broccoli, and omega-3 rich ingredients',
  ARRAY['salmon', 'lentils', 'broccoli', 'flaxseed', 'kelp'],
  48.99,
  '400g',
  'active',
  true,
  ARRAY['fish', 'salmon']
),
(
  gen_random_uuid(),
  'Lamb & Barley',
  'Grass-fed lamb with barley, carrots, and rosemary for sensitive stomachs',
  ARRAY['lamb', 'barley', 'carrots', 'rosemary', 'parsley'],
  49.99,
  '400g',
  'active',
  true,
  ARRAY['lamb']
),
(
  gen_random_uuid(),
  'Duck & Pumpkin',
  'Free-range duck with pumpkin, peas, and antioxidant-rich berries',
  ARRAY['duck', 'pumpkin', 'peas', 'blackberries', 'thyme'],
  52.99,
  '400g',
  'active',
  true,
  ARRAY['duck']
);

-- Adding product prices for Stripe integration
INSERT INTO product_prices (recipe_id, size_g, unit_price_cents, billing_interval, stripe_price_id, active) 
SELECT 
  r.id,
  400,
  ROUND(r.price * 100)::integer,
  '4w',
  'price_' || substr(r.id::text, 1, 8),
  true
FROM recipes r
WHERE r.is_active = true;
