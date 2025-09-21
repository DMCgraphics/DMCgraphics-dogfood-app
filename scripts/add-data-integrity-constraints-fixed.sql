-- Add data integrity constraints to prevent incomplete data creation
-- This script ensures all required fields are present and valid
-- FIXED VERSION - Uses correct column names based on actual database schema

-- ========================================
-- DOGS TABLE CONSTRAINTS
-- ========================================

-- Ensure dog name is not empty
ALTER TABLE dogs ADD CONSTRAINT dogs_name_not_empty 
    CHECK (name IS NOT NULL AND LENGTH(TRIM(name)) > 0);

-- Ensure weight is positive
ALTER TABLE dogs ADD CONSTRAINT dogs_weight_positive 
    CHECK (weight IS NOT NULL AND weight > 0);

-- Ensure weight_unit is valid
ALTER TABLE dogs ADD CONSTRAINT dogs_weight_unit_valid 
    CHECK (weight_unit IS NULL OR weight_unit IN ('lb', 'kg'));

-- Ensure age is reasonable (0-30 years)
ALTER TABLE dogs ADD CONSTRAINT dogs_age_reasonable 
    CHECK (age IS NULL OR (age >= 0 AND age <= 30));

-- Ensure weight_kg is calculated if not provided
ALTER TABLE dogs ADD CONSTRAINT dogs_weight_kg_calculated 
    CHECK (
        weight_kg IS NOT NULL AND 
        (
            (weight_unit = 'kg' AND weight_kg = weight) OR
            (weight_unit = 'lb' AND ABS(weight_kg - (weight * 0.453592)) < 0.01)
        )
    );

-- ========================================
-- PLANS TABLE CONSTRAINTS
-- ========================================

-- Ensure plan status is valid
ALTER TABLE plans ADD CONSTRAINT plans_status_valid 
    CHECK (status IN ('draft', 'saved', 'checkout', 'active', 'paused', 'cancelled'));

-- Ensure financial fields are non-negative
ALTER TABLE plans ADD CONSTRAINT plans_subtotal_non_negative 
    CHECK (subtotal_cents IS NOT NULL AND subtotal_cents >= 0);

ALTER TABLE plans ADD CONSTRAINT plans_discount_non_negative 
    CHECK (discount_cents IS NULL OR discount_cents >= 0);

ALTER TABLE plans ADD CONSTRAINT plans_total_non_negative 
    CHECK (total_cents IS NOT NULL AND total_cents >= 0);

-- Ensure current_step is reasonable
ALTER TABLE plans ADD CONSTRAINT plans_current_step_reasonable 
    CHECK (current_step IS NULL OR (current_step >= 0 AND current_step <= 10));

-- Ensure total_cents is consistent with subtotal and discount
ALTER TABLE plans ADD CONSTRAINT plans_total_consistent 
    CHECK (total_cents >= (subtotal_cents - COALESCE(discount_cents, 0)));

-- ========================================
-- PLAN_ITEMS TABLE CONSTRAINTS (FIXED)
-- ========================================

-- Ensure qty is positive (using correct column name)
ALTER TABLE plan_items ADD CONSTRAINT plan_items_qty_positive 
    CHECK (qty IS NULL OR qty > 0);

-- Ensure size_g is positive if provided
ALTER TABLE plan_items ADD CONSTRAINT plan_items_size_positive 
    CHECK (size_g IS NULL OR size_g > 0);

-- Ensure billing_interval is valid
ALTER TABLE plan_items ADD CONSTRAINT plan_items_billing_interval_valid 
    CHECK (billing_interval IS NULL OR billing_interval IN ('weekly', 'monthly', 'quarterly'));

-- ========================================
-- SUBSCRIPTIONS TABLE CONSTRAINTS
-- ========================================

-- Ensure subscription status is valid
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_valid 
    CHECK (status IN ('active', 'paused', 'cancelled', 'expired'));

-- Ensure billing_cycle is valid
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_billing_cycle_valid 
    CHECK (billing_cycle IS NULL OR billing_cycle IN ('weekly', 'monthly', 'quarterly'));

-- Ensure price_monthly is non-negative
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_price_non_negative 
    CHECK (price_monthly IS NULL OR price_monthly >= 0);

-- ========================================
-- ORDERS TABLE CONSTRAINTS
-- ========================================

-- Ensure order status is not empty
ALTER TABLE orders ADD CONSTRAINT orders_status_not_empty 
    CHECK (status IS NOT NULL AND LENGTH(TRIM(status)) > 0);

-- Ensure total_cents is non-negative
ALTER TABLE orders ADD CONSTRAINT orders_total_non_negative 
    CHECK (total_cents IS NULL OR total_cents >= 0);

-- ========================================
-- TRIGGERS FOR AUTOMATIC FIELD POPULATION
-- ========================================

-- Function to automatically calculate weight_kg for dogs
CREATE OR REPLACE FUNCTION calculate_dog_weight_kg()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate weight_kg if not provided or if weight/weight_unit changed
    IF NEW.weight_kg IS NULL OR 
       (OLD.weight IS DISTINCT FROM NEW.weight) OR 
       (OLD.weight_unit IS DISTINCT FROM NEW.weight_unit) THEN
        
        IF NEW.weight_unit = 'kg' THEN
            NEW.weight_kg := NEW.weight;
        ELSIF NEW.weight_unit = 'lb' THEN
            NEW.weight_kg := NEW.weight * 0.453592;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate weight_kg
DROP TRIGGER IF EXISTS trigger_calculate_dog_weight_kg ON dogs;
CREATE TRIGGER trigger_calculate_dog_weight_kg
    BEFORE INSERT OR UPDATE ON dogs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_dog_weight_kg();

-- Function to automatically calculate plan totals
CREATE OR REPLACE FUNCTION calculate_plan_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure total_cents is at least subtotal_cents - discount_cents
    IF NEW.total_cents IS NULL OR NEW.total_cents < (NEW.subtotal_cents - COALESCE(NEW.discount_cents, 0)) THEN
        NEW.total_cents := NEW.subtotal_cents - COALESCE(NEW.discount_cents, 0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate plan totals
DROP TRIGGER IF EXISTS trigger_calculate_plan_totals ON plans;
CREATE TRIGGER trigger_calculate_plan_totals
    BEFORE INSERT OR UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION calculate_plan_totals();

-- ========================================
-- FUNCTIONS FOR DATA VALIDATION (FIXED)
-- ========================================

-- Function to validate complete user data
CREATE OR REPLACE FUNCTION validate_user_data_completeness(p_user_id UUID)
RETURNS TABLE(
    table_name TEXT,
    record_count INTEGER,
    has_required_fields BOOLEAN,
    issues TEXT[]
) AS $$
DECLARE
    dog_count INTEGER;
    plan_count INTEGER;
    plan_item_count INTEGER;
    subscription_count INTEGER;
    order_count INTEGER;
    issues TEXT[];
BEGIN
    -- Check dogs
    SELECT COUNT(*) INTO dog_count FROM dogs WHERE user_id = p_user_id;
    issues := ARRAY[]::TEXT[];
    
    IF dog_count > 0 THEN
        -- Check for dogs with missing required fields
        IF EXISTS (SELECT 1 FROM dogs WHERE user_id = p_user_id AND (name IS NULL OR TRIM(name) = '')) THEN
            issues := array_append(issues, 'Dogs with empty names');
        END IF;
        
        IF EXISTS (SELECT 1 FROM dogs WHERE user_id = p_user_id AND (weight IS NULL OR weight <= 0)) THEN
            issues := array_append(issues, 'Dogs with invalid weight');
        END IF;
        
        IF EXISTS (SELECT 1 FROM dogs WHERE user_id = p_user_id AND weight_kg IS NULL) THEN
            issues := array_append(issues, 'Dogs with missing weight_kg');
        END IF;
    END IF;
    
    RETURN QUERY SELECT 'dogs'::TEXT, dog_count, (issues = ARRAY[]::TEXT[]), issues;
    
    -- Check plans
    SELECT COUNT(*) INTO plan_count FROM plans WHERE user_id = p_user_id;
    issues := ARRAY[]::TEXT[];
    
    IF plan_count > 0 THEN
        IF EXISTS (SELECT 1 FROM plans WHERE user_id = p_user_id AND status IS NULL) THEN
            issues := array_append(issues, 'Plans with missing status');
        END IF;
        
        IF EXISTS (SELECT 1 FROM plans WHERE user_id = p_user_id AND (subtotal_cents IS NULL OR subtotal_cents < 0)) THEN
            issues := array_append(issues, 'Plans with invalid subtotal_cents');
        END IF;
        
        IF EXISTS (SELECT 1 FROM plans WHERE user_id = p_user_id AND (total_cents IS NULL OR total_cents < 0)) THEN
            issues := array_append(issues, 'Plans with invalid total_cents');
        END IF;
    END IF;
    
    RETURN QUERY SELECT 'plans'::TEXT, plan_count, (issues = ARRAY[]::TEXT[]), issues;
    
    -- Check plan_items (FIXED - using correct column names)
    SELECT COUNT(*) INTO plan_item_count 
    FROM plan_items pi 
    JOIN plans p ON pi.plan_id = p.id 
    WHERE p.user_id = p_user_id;
    
    issues := ARRAY[]::TEXT[];
    IF plan_item_count > 0 THEN
        IF EXISTS (
            SELECT 1 FROM plan_items pi 
            JOIN plans p ON pi.plan_id = p.id 
            WHERE p.user_id = p_user_id AND (pi.qty IS NULL OR pi.qty <= 0)
        ) THEN
            issues := array_append(issues, 'Plan items with invalid qty');
        END IF;
    END IF;
    
    RETURN QUERY SELECT 'plan_items'::TEXT, plan_item_count, (issues = ARRAY[]::TEXT[]), issues;
    
    -- Check subscriptions
    SELECT COUNT(*) INTO subscription_count FROM subscriptions WHERE user_id = p_user_id;
    issues := ARRAY[]::TEXT[];
    
    IF subscription_count > 0 THEN
        IF EXISTS (SELECT 1 FROM subscriptions WHERE user_id = p_user_id AND status IS NULL) THEN
            issues := array_append(issues, 'Subscriptions with missing status');
        END IF;
    END IF;
    
    RETURN QUERY SELECT 'subscriptions'::TEXT, subscription_count, (issues = ARRAY[]::TEXT[]), issues;
    
    -- Check orders
    SELECT COUNT(*) INTO order_count FROM orders WHERE user_id = p_user_id;
    issues := ARRAY[]::TEXT[];
    
    IF order_count > 0 THEN
        IF EXISTS (SELECT 1 FROM orders WHERE user_id = p_user_id AND (status IS NULL OR TRIM(status) = '')) THEN
            issues := array_append(issues, 'Orders with empty status');
        END IF;
    END IF;
    
    RETURN QUERY SELECT 'orders'::TEXT, order_count, (issues = ARRAY[]::TEXT[]), issues;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ DATA INTEGRITY CONSTRAINTS ADDED (FIXED)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Added constraints for:';
    RAISE NOTICE '- Dogs: name, weight, weight_unit, age validation';
    RAISE NOTICE '- Plans: status, financial fields validation';
    RAISE NOTICE '- Plan Items: qty, size_g, billing validation (FIXED)';
    RAISE NOTICE '- Subscriptions: status, billing cycle validation';
    RAISE NOTICE '- Orders: status, total validation';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Added triggers for automatic field calculation';
    RAISE NOTICE 'Added validation function: validate_user_data_completeness()';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FIXED: Uses correct column names (qty instead of quantity)';
    RAISE NOTICE '========================================';
END $$;
