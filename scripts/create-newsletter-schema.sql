-- ================================================
-- Monthly Instagram Newsletter Schema
-- ================================================
-- Created: 2025-12-30
-- Purpose: Track newsletter sends and opt in existing subscribers
--
-- Run this in Supabase SQL Editor for both dev and production

-- ================================================
-- Part A: Create newsletter_sends tracking table
-- ================================================

CREATE TABLE IF NOT EXISTS newsletter_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  newsletter_month TEXT NOT NULL, -- Format: "2025-01" for January 2025
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  resend_email_id TEXT, -- Resend's email ID for tracking
  error_message TEXT,
  post_count INTEGER, -- Number of posts in that month's summary

  -- Prevent duplicate sends
  UNIQUE(user_id, newsletter_month),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_month ON newsletter_sends(newsletter_month);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_status ON newsletter_sends(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_user_id ON newsletter_sends(user_id);

-- ================================================
-- RLS Policies
-- ================================================

ALTER TABLE newsletter_sends ENABLE ROW LEVEL SECURITY;

-- Users can view their own newsletter history
CREATE POLICY IF NOT EXISTS "Users can view own newsletter sends"
  ON newsletter_sends
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage newsletters
CREATE POLICY IF NOT EXISTS "Service role can manage newsletters"
  ON newsletter_sends
  FOR ALL
  TO service_role
  USING (true);

-- ================================================
-- Part B: Backfill existing subscribers
-- ================================================
-- Opt in all current active subscribers except Jill Carmichael
-- Current subscribers: Brianna Garus, Dyl MC, Keisha Russell, Mike Nass, Stefanie Aivalis

UPDATE profiles
SET marketing_opt_in = true
WHERE id IN (
  SELECT DISTINCT p.id
  FROM profiles p
  JOIN subscriptions s ON p.id = s.user_id
  WHERE s.status IN ('active', 'trialing', 'past_due')
    AND LOWER(p.full_name) NOT LIKE '%jill%'
    AND LOWER(p.full_name) NOT LIKE '%carmichael%'
);

-- ================================================
-- Verification Query
-- ================================================
-- Should show 5 opted in users

SELECT
  COUNT(*) as opted_in_count,
  STRING_AGG(p.full_name, ', ') as subscriber_names
FROM profiles p
JOIN subscriptions s ON p.id = s.user_id
WHERE s.status IN ('active', 'trialing', 'past_due')
  AND p.marketing_opt_in = true;
