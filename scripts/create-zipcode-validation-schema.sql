-- Create zipcode validation schema
-- This script adds database-level zipcode validation for Westchester County, NY and Fairfield County, CT

-- ========================================
-- CREATE ALLOWED ZIPCODES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS allowed_zipcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zipcode VARCHAR(5) NOT NULL UNIQUE,
  county VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INSERT WESTCHESTER COUNTY, NY ZIPCODES
-- ========================================

INSERT INTO allowed_zipcodes (zipcode, county, state) VALUES
-- Westchester County, NY
('10501', 'Westchester', 'NY'),
('10502', 'Westchester', 'NY'),
('10504', 'Westchester', 'NY'),
('10505', 'Westchester', 'NY'),
('10506', 'Westchester', 'NY'),
('10507', 'Westchester', 'NY'),
('10510', 'Westchester', 'NY'),
('10511', 'Westchester', 'NY'),
('10514', 'Westchester', 'NY'),
('10518', 'Westchester', 'NY'),
('10520', 'Westchester', 'NY'),
('10522', 'Westchester', 'NY'),
('10523', 'Westchester', 'NY'),
('10526', 'Westchester', 'NY'),
('10527', 'Westchester', 'NY'),
('10528', 'Westchester', 'NY'),
('10530', 'Westchester', 'NY'),
('10532', 'Westchester', 'NY'),
('10533', 'Westchester', 'NY'),
('10535', 'Westchester', 'NY'),
('10536', 'Westchester', 'NY'),
('10538', 'Westchester', 'NY'),
('10540', 'Westchester', 'NY'),
('10543', 'Westchester', 'NY'),
('10545', 'Westchester', 'NY'),
('10546', 'Westchester', 'NY'),
('10547', 'Westchester', 'NY'),
('10548', 'Westchester', 'NY'),
('10549', 'Westchester', 'NY'),
('10552', 'Westchester', 'NY'),
('10553', 'Westchester', 'NY'),
('10560', 'Westchester', 'NY'),
('10562', 'Westchester', 'NY'),
('10566', 'Westchester', 'NY'),
('10567', 'Westchester', 'NY'),
('10570', 'Westchester', 'NY'),
('10573', 'Westchester', 'NY'),
('10576', 'Westchester', 'NY'),
('10577', 'Westchester', 'NY'),
('10580', 'Westchester', 'NY'),
('10583', 'Westchester', 'NY'),
('10588', 'Westchester', 'NY'),
('10589', 'Westchester', 'NY'),
('10590', 'Westchester', 'NY'),
('10591', 'Westchester', 'NY'),
('10594', 'Westchester', 'NY'),
('10595', 'Westchester', 'NY'),
('10596', 'Westchester', 'NY'),
('10597', 'Westchester', 'NY'),
('10598', 'Westchester', 'NY'),
('10601', 'Westchester', 'NY'),
('10603', 'Westchester', 'NY'),
('10604', 'Westchester', 'NY'),
('10605', 'Westchester', 'NY'),
('10606', 'Westchester', 'NY'),
('10607', 'Westchester', 'NY'),
('10701', 'Westchester', 'NY'),
('10703', 'Westchester', 'NY'),
('10704', 'Westchester', 'NY'),
('10705', 'Westchester', 'NY'),
('10706', 'Westchester', 'NY'),
('10707', 'Westchester', 'NY'),
('10708', 'Westchester', 'NY'),
('10709', 'Westchester', 'NY'),
('10710', 'Westchester', 'NY'),
('10801', 'Westchester', 'NY'),
('10803', 'Westchester', 'NY'),
('10804', 'Westchester', 'NY'),
('10805', 'Westchester', 'NY')
ON CONFLICT (zipcode) DO NOTHING;

-- ========================================
-- INSERT FAIRFIELD COUNTY, CT ZIPCODES
-- ========================================

INSERT INTO allowed_zipcodes (zipcode, county, state) VALUES
-- Fairfield County, CT
('06604', 'Fairfield', 'CT'),
('06605', 'Fairfield', 'CT'),
('06606', 'Fairfield', 'CT'),
('06607', 'Fairfield', 'CT'),
('06608', 'Fairfield', 'CT'),
('06610', 'Fairfield', 'CT'),
('06611', 'Fairfield', 'CT'),
('06612', 'Fairfield', 'CT'),
('06614', 'Fairfield', 'CT'),
('06615', 'Fairfield', 'CT'),
('06901', 'Fairfield', 'CT'),
('06902', 'Fairfield', 'CT'),
('06903', 'Fairfield', 'CT'),
('06905', 'Fairfield', 'CT'),
('06906', 'Fairfield', 'CT'),
('06907', 'Fairfield', 'CT'),
('06850', 'Fairfield', 'CT'),
('06851', 'Fairfield', 'CT'),
('06853', 'Fairfield', 'CT'),
('06854', 'Fairfield', 'CT'),
('06855', 'Fairfield', 'CT'),
('06856', 'Fairfield', 'CT'),
('06857', 'Fairfield', 'CT'),
('06858', 'Fairfield', 'CT'),
('06859', 'Fairfield', 'CT'),
('06860', 'Fairfield', 'CT'),
('06807', 'Fairfield', 'CT'),
('06830', 'Fairfield', 'CT'),
('06831', 'Fairfield', 'CT'),
('06836', 'Fairfield', 'CT'),
('06870', 'Fairfield', 'CT'),
('06878', 'Fairfield', 'CT'),
('06820', 'Fairfield', 'CT'),
('06840', 'Fairfield', 'CT'),
('06880', 'Fairfield', 'CT'),
('06881', 'Fairfield', 'CT'),
('06883', 'Fairfield', 'CT'),
('06884', 'Fairfield', 'CT'),
('06888', 'Fairfield', 'CT'),
('06890', 'Fairfield', 'CT'),
('06897', 'Fairfield', 'CT'),
('06824', 'Fairfield', 'CT'),
('06825', 'Fairfield', 'CT'),
('06804', 'Fairfield', 'CT'),
('06810', 'Fairfield', 'CT'),
('06811', 'Fairfield', 'CT'),
('06812', 'Fairfield', 'CT'),
('06813', 'Fairfield', 'CT'),
('06814', 'Fairfield', 'CT'),
('06877', 'Fairfield', 'CT'),
('06470', 'Fairfield', 'CT'),
('06875', 'Fairfield', 'CT'),
('06896', 'Fairfield', 'CT'),
('06829', 'Fairfield', 'CT'),
('06484', 'Fairfield', 'CT'),
('06784', 'Fairfield', 'CT')
ON CONFLICT (zipcode) DO NOTHING;

-- ========================================
-- ADD ZIPCODE FIELD TO PLANS TABLE
-- ========================================

-- Add delivery_zipcode field to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS delivery_zipcode VARCHAR(5);

-- ========================================
-- ADD DATABASE CONSTRAINTS
-- ========================================

-- Add constraint to ensure zipcode is in allowed list
ALTER TABLE plans ADD CONSTRAINT plans_delivery_zipcode_allowed 
    CHECK (delivery_zipcode IS NULL OR delivery_zipcode IN (
        SELECT zipcode FROM allowed_zipcodes
    ));

-- ========================================
-- ADD INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_allowed_zipcodes_zipcode ON allowed_zipcodes(zipcode);
CREATE INDEX IF NOT EXISTS idx_plans_delivery_zipcode ON plans(delivery_zipcode);

-- ========================================
-- ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE allowed_zipcodes ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users for zipcode validation
CREATE POLICY "Allow read access to all users" ON allowed_zipcodes 
    FOR SELECT USING (true);

-- ========================================
-- CREATE VALIDATION FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION is_zipcode_allowed(zip VARCHAR(5))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM allowed_zipcodes 
        WHERE zipcode = zip
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
