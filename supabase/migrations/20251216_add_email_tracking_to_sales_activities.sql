-- Add email tracking fields to sales_activities table
-- This enables tracking of emails sent to leads via Resend

ALTER TABLE sales_activities
  ADD COLUMN IF NOT EXISTS email_message_id TEXT,           -- Resend email ID for tracking
  ADD COLUMN IF NOT EXISTS email_to TEXT,                   -- Recipient email address
  ADD COLUMN IF NOT EXISTS email_from TEXT,                 -- Sender email address
  ADD COLUMN IF NOT EXISTS email_subject TEXT,              -- Email subject line
  ADD COLUMN IF NOT EXISTS email_html TEXT,                 -- HTML body content
  ADD COLUMN IF NOT EXISTS email_text TEXT,                 -- Plain text body content
  ADD COLUMN IF NOT EXISTS email_status TEXT,               -- sent, delivered, opened, clicked, bounced, failed
  ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMPTZ,     -- First open timestamp
  ADD COLUMN IF NOT EXISTS email_open_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_clicked_at TIMESTAMPTZ,    -- First click timestamp
  ADD COLUMN IF NOT EXISTS email_click_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_delivered_at TIMESTAMPTZ,  -- Delivery confirmation timestamp
  ADD COLUMN IF NOT EXISTS email_template_id TEXT,          -- Reference to template used (if any)
  ADD COLUMN IF NOT EXISTS email_metadata JSONB;            -- Additional tracking data

-- Create index for efficient webhook lookups by Resend message ID
CREATE INDEX IF NOT EXISTS idx_sales_activities_email_message_id
  ON sales_activities(email_message_id)
  WHERE email_message_id IS NOT NULL;

-- Create index for filtering email activities by status
CREATE INDEX IF NOT EXISTS idx_sales_activities_email_status
  ON sales_activities(email_status)
  WHERE activity_type = 'email';

-- Add comment for documentation
COMMENT ON COLUMN sales_activities.email_message_id IS 'Resend email ID for webhook tracking';
COMMENT ON COLUMN sales_activities.email_status IS 'Email delivery status: sent, delivered, opened, clicked, bounced, failed';
COMMENT ON COLUMN sales_activities.email_metadata IS 'Additional email metadata (e.g., sender info, custom variables)';
