-- Create table for storing raw webhook events from Resend
-- This provides an audit trail and allows reprocessing of failed events

CREATE TABLE IF NOT EXISTS sales_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_message_id TEXT NOT NULL,              -- Resend email ID
  event_type TEXT NOT NULL,                    -- Event type: email.sent, email.delivered, email.opened, etc.
  activity_id UUID REFERENCES sales_activities(id) ON DELETE SET NULL,  -- Link to sales activity (nullable in case activity deleted)
  payload JSONB NOT NULL,                      -- Full webhook payload from Resend
  processed BOOLEAN DEFAULT FALSE,             -- Whether event has been processed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient webhook processing
CREATE INDEX IF NOT EXISTS idx_sales_email_events_message_id
  ON sales_email_events(email_message_id);

CREATE INDEX IF NOT EXISTS idx_sales_email_events_unprocessed
  ON sales_email_events(processed, created_at)
  WHERE processed = FALSE;

CREATE INDEX IF NOT EXISTS idx_sales_email_events_activity_id
  ON sales_email_events(activity_id)
  WHERE activity_id IS NOT NULL;

-- Enable RLS
ALTER TABLE sales_email_events ENABLE ROW LEVEL SECURITY;

-- Policy: Sales team can view email events
CREATE POLICY "Sales team can view email events"
  ON sales_email_events FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE is_admin = TRUE
        OR 'sales_manager' = ANY(roles)
        OR 'sales_rep' = ANY(roles)
    )
  );

-- Policy: Only system can insert events (webhooks use service role)
-- No need for explicit policy since webhooks use supabaseAdmin

-- Add comments for documentation
COMMENT ON TABLE sales_email_events IS 'Audit log of all email webhook events from Resend';
COMMENT ON COLUMN sales_email_events.payload IS 'Full JSON payload from Resend webhook';
COMMENT ON COLUMN sales_email_events.processed IS 'Whether event has been successfully processed and applied to sales_activities';
