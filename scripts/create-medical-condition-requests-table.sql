-- Create table for medical condition requests
CREATE TABLE IF NOT EXISTS medical_condition_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  condition_name TEXT,
  dog_name TEXT,
  dog_weight TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'implemented'))
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_medical_condition_requests_email ON medical_condition_requests(email);
CREATE INDEX IF NOT EXISTS idx_medical_condition_requests_created_at ON medical_condition_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medical_condition_requests_status ON medical_condition_requests(status);

-- Enable RLS
ALTER TABLE medical_condition_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for anonymous users)
CREATE POLICY "Anyone can insert medical condition requests"
  ON medical_condition_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Authenticated users can view their own requests
CREATE POLICY "Users can view their own requests"
  ON medical_condition_requests
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

COMMENT ON TABLE medical_condition_requests IS 'Stores email requests from users wanting support for medical conditions not yet available';
COMMENT ON COLUMN medical_condition_requests.email IS 'User email for follow-up';
COMMENT ON COLUMN medical_condition_requests.condition_name IS 'Name of the medical condition requested';
COMMENT ON COLUMN medical_condition_requests.status IS 'Status of the request: pending, contacted, or implemented';
