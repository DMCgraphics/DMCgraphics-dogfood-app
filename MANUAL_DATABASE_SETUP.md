# Manual Database Setup for Zipcode Validation

Since the automated script cannot create tables directly, please run the following SQL commands in your Supabase SQL Editor:

## Step 1: Create the allowed_zipcodes table

```sql
-- Create allowed_zipcodes table
CREATE TABLE IF NOT EXISTS allowed_zipcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zipcode VARCHAR(5) NOT NULL UNIQUE,
  county VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE allowed_zipcodes ENABLE ROW LEVEL SECURITY;

-- Create policy for read access
CREATE POLICY "Allow read access to all users" ON allowed_zipcodes 
    FOR SELECT USING (true);
```

## Step 2: Insert Westchester County, NY zipcodes

```sql
INSERT INTO allowed_zipcodes (zipcode, county, state) VALUES
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
```

## Step 3: Insert Fairfield County, CT zipcodes

```sql
INSERT INTO allowed_zipcodes (zipcode, county, state) VALUES
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
```

## Step 4: Add delivery_zipcode field to plans table

```sql
-- Add delivery_zipcode field to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS delivery_zipcode VARCHAR(5);

-- Add constraint to ensure zipcode is in allowed list
ALTER TABLE plans ADD CONSTRAINT plans_delivery_zipcode_allowed 
    CHECK (delivery_zipcode IS NULL OR delivery_zipcode IN (
        SELECT zipcode FROM allowed_zipcodes
    ));
```

## Step 5: Create indexes for performance

```sql
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_allowed_zipcodes_zipcode ON allowed_zipcodes(zipcode);
CREATE INDEX IF NOT EXISTS idx_plans_delivery_zipcode ON plans(delivery_zipcode);
```

## Step 6: Create validation function

```sql
-- Create validation function
CREATE OR REPLACE FUNCTION is_zipcode_allowed(zip VARCHAR(5))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM allowed_zipcodes 
        WHERE zipcode = zip
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Verification

After running all the SQL commands, verify the setup by running:

```sql
-- Check zipcode count
SELECT COUNT(*) as total_zipcodes FROM allowed_zipcodes;

-- Check by county
SELECT county, state, COUNT(*) as zipcode_count 
FROM allowed_zipcodes 
GROUP BY county, state;

-- Test the validation function
SELECT is_zipcode_allowed('06902') as stamford_valid;
SELECT is_zipcode_allowed('10001') as manhattan_invalid;
```

## Expected Results

- **Total zipcodes**: 125
- **Westchester County, NY**: 69 zipcodes
- **Fairfield County, CT**: 56 zipcodes
- **Stamford test**: true
- **Manhattan test**: false

## Next Steps

1. Run all the SQL commands above in your Supabase SQL Editor
2. Verify the results match the expected output
3. Test the zipcode validation in your application
4. The frontend and API validation will work immediately once the database is set up

## Troubleshooting

If you encounter any issues:

1. **Table already exists**: The `IF NOT EXISTS` clauses should handle this
2. **Constraint errors**: Make sure the `allowed_zipcodes` table is populated before adding the constraint
3. **Permission errors**: Ensure you're using the service role key or have proper database permissions

The zipcode validation system will work with just the frontend and API validation even without the database setup, but the database setup provides additional security and audit capabilities.
