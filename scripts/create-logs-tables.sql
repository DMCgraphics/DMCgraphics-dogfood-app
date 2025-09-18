-- Create weight_logs table
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stool_logs table
CREATE TABLE IF NOT EXISTS stool_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  score INT CHECK (score BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stool_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for weight_logs
CREATE POLICY "sel own weight" ON weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ins own weight" ON weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd own weight" ON weight_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "del own weight" ON weight_logs FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for stool_logs
CREATE POLICY "sel own stool" ON stool_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ins own stool" ON stool_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd own stool" ON stool_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "del own stool" ON stool_logs FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_weight_logs_dog_date ON weight_logs(dog_id, date);
CREATE INDEX IF NOT EXISTS idx_stool_logs_dog_date ON stool_logs(dog_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id ON weight_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_stool_logs_user_id ON stool_logs(user_id);
