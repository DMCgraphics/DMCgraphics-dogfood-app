-- AI Cost Tracking Tables
-- Stores token usage and costs for monitoring and alerting

-- Table: ai_token_usage
-- Tracks every LLM API call with token counts and costs
CREATE TABLE IF NOT EXISTS ai_token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Request details
  feature TEXT NOT NULL, -- 'explanation', 'chat', 'step-guidance'
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Token usage
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  -- Cost calculation
  estimated_cost DECIMAL(10, 6) NOT NULL, -- USD

  -- Performance metrics
  response_time_ms INTEGER, -- milliseconds
  cached BOOLEAN DEFAULT FALSE,
  llm_used BOOLEAN DEFAULT TRUE,

  -- Context
  dog_profile_hash TEXT, -- For cache correlation
  explanation_type TEXT, -- 'reasoning', 'confidence', etc.

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_created_at ON ai_token_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_feature ON ai_token_usage(feature);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_user_id ON ai_token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_session_id ON ai_token_usage(session_id);

-- Table: ai_daily_costs
-- Aggregated daily cost summaries for quick lookups
CREATE TABLE IF NOT EXISTS ai_daily_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,

  -- Aggregated metrics
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Breakdown by feature
  cost_by_feature JSONB DEFAULT '{}'::jsonb,

  -- Cache performance
  cache_hits INTEGER DEFAULT 0,
  cache_misses INTEGER DEFAULT 0,
  cache_hit_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE
      WHEN (cache_hits + cache_misses) > 0
      THEN (cache_hits::DECIMAL / (cache_hits + cache_misses)) * 100
      ELSE 0
    END
  ) STORED,

  -- Alerts
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_type TEXT, -- 'warning', 'critical', 'emergency'

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_daily_costs_date ON ai_daily_costs(date DESC);

-- Table: ai_cost_alerts
-- Historical log of all cost alerts sent
CREATE TABLE IF NOT EXISTS ai_cost_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  alert_type TEXT NOT NULL, -- 'warning', 'critical', 'emergency'
  period TEXT NOT NULL, -- 'daily', 'monthly'

  current_cost DECIMAL(10, 2) NOT NULL,
  budget_limit DECIMAL(10, 2) NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,

  message TEXT NOT NULL,
  recipients TEXT[] NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  email_error TEXT,

  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ai_cost_alerts_created_at ON ai_cost_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cost_alerts_type ON ai_cost_alerts(alert_type);

-- Function: Update daily costs aggregate
CREATE OR REPLACE FUNCTION update_ai_daily_costs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ai_daily_costs (
    date,
    total_requests,
    total_tokens,
    total_cost,
    cache_hits,
    cache_misses
  )
  VALUES (
    CURRENT_DATE,
    1,
    NEW.total_tokens,
    NEW.estimated_cost,
    CASE WHEN NEW.cached THEN 1 ELSE 0 END,
    CASE WHEN NOT NEW.cached THEN 1 ELSE 0 END
  )
  ON CONFLICT (date) DO UPDATE SET
    total_requests = ai_daily_costs.total_requests + 1,
    total_tokens = ai_daily_costs.total_tokens + NEW.total_tokens,
    total_cost = ai_daily_costs.total_cost + NEW.estimated_cost,
    cache_hits = ai_daily_costs.cache_hits + CASE WHEN NEW.cached THEN 1 ELSE 0 END,
    cache_misses = ai_daily_costs.cache_misses + CASE WHEN NOT NEW.cached THEN 1 ELSE 0 END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update daily costs when new token usage is recorded
DROP TRIGGER IF EXISTS trigger_update_ai_daily_costs ON ai_token_usage;
CREATE TRIGGER trigger_update_ai_daily_costs
  AFTER INSERT ON ai_token_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_daily_costs();

-- RLS Policies
ALTER TABLE ai_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_daily_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_alerts ENABLE ROW LEVEL SECURITY;

-- Admin users can view all data
-- TODO: Replace with your actual admin user IDs or create admin role
CREATE POLICY "Admins can view all AI usage data" ON ai_token_usage
  FOR SELECT
  USING (true); -- TODO: Add admin check

CREATE POLICY "Admins can view daily costs" ON ai_daily_costs
  FOR SELECT
  USING (true); -- TODO: Add admin check

CREATE POLICY "Admins can view alerts" ON ai_cost_alerts
  FOR SELECT
  USING (true); -- TODO: Add admin check

-- Service role can insert data
-- (API endpoints will use service role)

-- Grant permissions
GRANT SELECT ON ai_token_usage TO authenticated;
GRANT SELECT ON ai_daily_costs TO authenticated;
GRANT SELECT ON ai_cost_alerts TO authenticated;

-- Comments for documentation
COMMENT ON TABLE ai_token_usage IS 'Tracks every LLM API call with token usage and costs';
COMMENT ON TABLE ai_daily_costs IS 'Aggregated daily cost summaries for monitoring';
COMMENT ON TABLE ai_cost_alerts IS 'Historical log of cost alerts sent to admins';
