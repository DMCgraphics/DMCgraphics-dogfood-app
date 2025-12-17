-- Create table for storing reusable email templates for sales team
-- Templates support merge fields like {{lead_name}}, {{dog_name}}, etc.

CREATE TABLE IF NOT EXISTS sales_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                         -- Display name (e.g., "Initial Outreach")
  slug TEXT UNIQUE NOT NULL,                  -- URL-safe identifier (e.g., "initial-outreach")
  category TEXT NOT NULL,                     -- Category: "outreach", "nurture", "closing"
  subject TEXT NOT NULL,                      -- Subject line with merge fields
  html_body TEXT NOT NULL,                    -- HTML template content
  text_body TEXT NOT NULL,                    -- Plain text version
  description TEXT,                           -- Usage notes for sales reps
  merge_fields TEXT[] DEFAULT ARRAY[]::TEXT[], -- Available merge fields (e.g., ["lead_name", "dog_name"])
  is_active BOOLEAN DEFAULT TRUE,             -- Whether template is active
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_sales_email_templates_category
  ON sales_email_templates(category)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_sales_email_templates_slug
  ON sales_email_templates(slug)
  WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE sales_email_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Sales team can view active templates
CREATE POLICY "Sales team can view templates"
  ON sales_email_templates FOR SELECT
  USING (
    is_active = TRUE AND
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE is_admin = TRUE
        OR 'sales_manager' = ANY(roles)
        OR 'sales_rep' = ANY(roles)
    )
  );

-- Policy: Sales managers and admins can manage templates
CREATE POLICY "Sales managers can manage templates"
  ON sales_email_templates FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE is_admin = TRUE
        OR 'sales_manager' = ANY(roles)
    )
  );

-- Add comments for documentation
COMMENT ON TABLE sales_email_templates IS 'Reusable email templates for sales team with merge field support';
COMMENT ON COLUMN sales_email_templates.merge_fields IS 'Array of available merge field names (e.g., ["lead_name", "dog_name", "rep_name"])';
COMMENT ON COLUMN sales_email_templates.slug IS 'URL-safe unique identifier for template';
