-- ================================================
-- NouriPet Test Database - Sample Data
-- ================================================
-- Run this AFTER running test-database-schema.sql
-- ================================================

-- ================================================
-- Insert Recipes
-- ================================================

INSERT INTO recipes (id, name, slug, description, allergens, macros, is_active, status) VALUES
(
    '074fd394-7109-4339-8260-a77fff9950a1'::uuid,
    'Beef & Quinoa Harvest',
    'beef-quinoa-harvest',
    'Premium grass-fed beef with nutrient-rich quinoa and fresh vegetables',
    ARRAY['beef'],
    '{"protein": 28, "fat": 15, "fiber": 4, "kcal_per_100g": 120}'::jsonb,
    true,
    'active'
),
(
    '0a81857d-1966-47c0-a38c-4ce444b59322'::uuid,
    'Lamb & Pumpkin Feast',
    'lamb-pumpkin-feast',
    'New Zealand lamb with digestive-friendly pumpkin',
    ARRAY['lamb'],
    '{"protein": 26, "fat": 16, "fiber": 5, "kcal_per_100g": 118}'::jsonb,
    true,
    'active'
),
(
    'a2ed68f6-6eb5-449c-a6bd-b533e085a850'::uuid,
    'Turkey & Brown Rice Comfort',
    'turkey-brown-rice-comfort',
    'Lean turkey with wholesome brown rice and garden vegetables',
    ARRAY['turkey', 'rice'],
    '{"protein": 25, "fat": 12, "fiber": 3, "kcal_per_100g": 110}'::jsonb,
    true,
    'active'
),
(
    'f5e8c3d1-2a4b-4c6d-8e9f-1a2b3c4d5e6f'::uuid,
    'Low-Fat Chicken & Garden Veggie',
    'low-fat-chicken-garden-veggie',
    'Ultra-lean chicken breast with fresh garden vegetables - perfect for sensitive digestion',
    ARRAY['chicken'],
    '{"protein": 30, "fat": 8, "fiber": 4, "kcal_per_100g": 95}'::jsonb,
    true,
    'active'
);

-- ================================================
-- Insert TEST Stripe Price IDs
-- ================================================
-- IMPORTANT: Replace these with YOUR actual test price IDs
-- after you create them in Stripe Test Dashboard
-- ================================================

-- Beef & Quinoa Harvest - TEST Prices
INSERT INTO product_prices (recipe_id, size_g, billing_interval, unit_price_cents, stripe_price_id, active) VALUES
('074fd394-7109-4339-8260-a77fff9950a1'::uuid, 6804, 'week', 2900, 'price_TEST_beef_small', true),      -- Small $29/week
('074fd394-7109-4339-8260-a77fff9950a1'::uuid, 13608, 'week', 4700, 'price_TEST_beef_medium', true),    -- Medium $47/week
('074fd394-7109-4339-8260-a77fff9950a1'::uuid, 27216, 'week', 6900, 'price_TEST_beef_large', true),     -- Large $69/week
('074fd394-7109-4339-8260-a77fff9950a1'::uuid, 40824, 'week', 8700, 'price_TEST_beef_xl', true);        -- XL $87/week

-- Lamb & Pumpkin Feast - TEST Prices
INSERT INTO product_prices (recipe_id, size_g, billing_interval, unit_price_cents, stripe_price_id, active) VALUES
('0a81857d-1966-47c0-a38c-4ce444b59322'::uuid, 6804, 'week', 2900, 'price_TEST_lamb_small', true),
('0a81857d-1966-47c0-a38c-4ce444b59322'::uuid, 13608, 'week', 4700, 'price_TEST_lamb_medium', true),
('0a81857d-1966-47c0-a38c-4ce444b59322'::uuid, 27216, 'week', 6900, 'price_TEST_lamb_large', true),
('0a81857d-1966-47c0-a38c-4ce444b59322'::uuid, 40824, 'week', 8700, 'price_TEST_lamb_xl', true);

-- Turkey & Brown Rice Comfort - TEST Prices
INSERT INTO product_prices (recipe_id, size_g, billing_interval, unit_price_cents, stripe_price_id, active) VALUES
('a2ed68f6-6eb5-449c-a6bd-b533e085a850'::uuid, 6804, 'week', 2900, 'price_TEST_turkey_small', true),
('a2ed68f6-6eb5-449c-a6bd-b533e085a850'::uuid, 13608, 'week', 4700, 'price_TEST_turkey_medium', true),
('a2ed68f6-6eb5-449c-a6bd-b533e085a850'::uuid, 27216, 'week', 6900, 'price_TEST_turkey_large', true),
('a2ed68f6-6eb5-449c-a6bd-b533e085a850'::uuid, 40824, 'week', 8700, 'price_TEST_turkey_xl', true);

-- Low-Fat Chicken & Garden Veggie - TEST Prices
INSERT INTO product_prices (recipe_id, size_g, billing_interval, unit_price_cents, stripe_price_id, active) VALUES
('f5e8c3d1-2a4b-4c6d-8e9f-1a2b3c4d5e6f'::uuid, 6804, 'week', 2900, 'price_TEST_chicken_small', true),
('f5e8c3d1-2a4b-4c6d-8e9f-1a2b3c4d5e6f'::uuid, 13608, 'week', 4700, 'price_TEST_chicken_medium', true),
('f5e8c3d1-2a4b-4c6d-8e9f-1a2b3c4d5e6f'::uuid, 27216, 'week', 6900, 'price_TEST_chicken_large', true),
('f5e8c3d1-2a4b-4c6d-8e9f-1a2b3c4d5e6f'::uuid, 40824, 'week', 8700, 'price_TEST_chicken_xl', true);

-- ================================================
-- Insert Allowed Zipcodes (Westchester NY + Fairfield CT)
-- ================================================
-- Add your allowed zipcodes here
-- Example:
-- INSERT INTO allowed_zipcodes (zipcode, county, state) VALUES
-- ('06850', 'Fairfield', 'CT'),
-- ('10601', 'Westchester', 'NY');

-- ================================================
-- IMPORTANT NEXT STEPS
-- ================================================
/*
1. Go to https://dashboard.stripe.com/test/products
2. Create 16 products (4 recipes × 4 sizes)
3. For each product, set:
   - Name: "Recipe Name - Size (15/30/60/90 lbs)"
   - Price: $29/$47/$69/$87 per week
   - Billing: Weekly recurring
4. Copy each price ID (starts with price_)
5. Update the stripe_price_id values above with your actual test price IDs
6. Re-run this script to update the database

Example:
UPDATE product_prices
SET stripe_price_id = 'price_1ABC123...'
WHERE stripe_price_id = 'price_TEST_beef_small';
*/

-- ================================================
-- DATA MIGRATION COMPLETE
-- ================================================
