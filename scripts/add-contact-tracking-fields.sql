-- Migration: Add tracking fields to contact_submissions
-- Description: Adds spam detection and analytics fields to contact submissions table
-- Privacy: Stores only hashed IPs, user agent, and anonymous timing data

-- Add tracking columns
ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS submission_time_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create indexes for analysis and spam detection
CREATE INDEX IF NOT EXISTS idx_contact_submissions_ip_hash
  ON public.contact_submissions(ip_hash);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_user_agent
  ON public.contact_submissions(user_agent);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_submission_time
  ON public.contact_submissions(submission_time_seconds);

-- GIN index for JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_metadata
  ON public.contact_submissions USING GIN (metadata);

-- Add column comments
COMMENT ON COLUMN public.contact_submissions.ip_hash IS 'SHA-256 hash of submitter IP address for spam analysis (privacy-preserving, never stores raw IPs)';
COMMENT ON COLUMN public.contact_submissions.user_agent IS 'Browser user agent string for spam detection and bot identification';
COMMENT ON COLUMN public.contact_submissions.submission_time_seconds IS 'Time in seconds from form load to submission (bot detection - bots typically submit instantly)';
COMMENT ON COLUMN public.contact_submissions.metadata IS 'Additional metadata for extensibility (e.g., referrer, utm params, client-side feature flags)';

-- Add check constraint to ensure submission_time is reasonable (0 to 1 hour)
ALTER TABLE public.contact_submissions
  ADD CONSTRAINT IF NOT EXISTS check_submission_time_reasonable
  CHECK (submission_time_seconds IS NULL OR (submission_time_seconds >= 0 AND submission_time_seconds < 3600));

COMMENT ON CONSTRAINT check_submission_time_reasonable ON public.contact_submissions IS 'Ensures submission time is between 0 and 1 hour (3600 seconds)';
