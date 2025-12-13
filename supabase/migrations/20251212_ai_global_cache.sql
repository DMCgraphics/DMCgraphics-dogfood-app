-- AI Global Cache (Layer 3)
-- Stores frequently-requested LLM explanations for sharing across all users

CREATE TABLE IF NOT EXISTS ai_global_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Cache key (deterministic hash of dog profile)
  cache_key TEXT NOT NULL UNIQUE,

  -- Cached content
  explanation TEXT NOT NULL,
  explanation_type TEXT NOT NULL, -- 'reasoning', 'confidence', etc.

  -- Usage tracking
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),

  -- TTL (time to live)
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_global_cache_cache_key ON ai_global_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_global_cache_hit_count ON ai_global_cache(hit_count DESC);
CREATE INDEX IF NOT EXISTS idx_ai_global_cache_expires_at ON ai_global_cache(expires_at);

-- Function: Update hit count and last accessed time
CREATE OR REPLACE FUNCTION update_cache_hit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hit_count = OLD.hit_count + 1;
  NEW.last_accessed_at = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_global_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE ai_global_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read cache (service role will write)
CREATE POLICY "Anyone can read cache" ON ai_global_cache
  FOR SELECT
  USING (true);

-- Service role can insert/update (via API)
CREATE POLICY "Service role can manage cache" ON ai_global_cache
  FOR ALL
  USING (true);

-- Grant permissions
GRANT SELECT ON ai_global_cache TO authenticated;
GRANT SELECT ON ai_global_cache TO anon;

-- Comments
COMMENT ON TABLE ai_global_cache IS 'Global LLM response cache shared across all users (Layer 3)';
COMMENT ON COLUMN ai_global_cache.cache_key IS 'Deterministic hash of dog profile for cache lookup';
COMMENT ON COLUMN ai_global_cache.hit_count IS 'Number of times this cache entry has been accessed';
COMMENT ON COLUMN ai_global_cache.expires_at IS 'When this cache entry expires (default: 30 days)';
