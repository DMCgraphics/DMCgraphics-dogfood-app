-- Migration: Create contact_rate_limits table
-- Description: Tracks contact form submissions by IP hash for rate limiting
-- Privacy: Only stores SHA-256 hashed IPs, never raw IP addresses

-- Create the contact_rate_limits table
CREATE TABLE IF NOT EXISTS public.contact_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for rate limit queries
CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_ip_hash ON public.contact_rate_limits(ip_hash);
CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_created_at ON public.contact_rate_limits(created_at DESC);

-- Composite index for common query pattern (ip_hash + created_at)
CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_ip_created ON public.contact_rate_limits(ip_hash, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access needed - only service role should access this table
-- Service role bypasses RLS, so no policies needed

-- Grant permissions to service role only (implicit)
GRANT ALL ON public.contact_rate_limits TO postgres;

-- Add comments
COMMENT ON TABLE public.contact_rate_limits IS 'Tracks contact form submissions by hashed IP for rate limiting. IPs are hashed with SHA-256 for privacy.';
COMMENT ON COLUMN public.contact_rate_limits.ip_hash IS 'SHA-256 hash of IP address (never stores raw IPs)';
COMMENT ON COLUMN public.contact_rate_limits.created_at IS 'Timestamp of submission for rate limit window calculations';

-- Optional: Create cleanup function to remove old records (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_contact_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM public.contact_rate_limits
    WHERE created_at < (NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_contact_rate_limits() IS 'Removes rate limit records older than 30 days. Run periodically via cron to keep table size manageable.';
