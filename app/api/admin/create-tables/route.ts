import { NextRequest, NextResponse } from "next/server"
import { createClient, supabaseAdmin } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Creating weight_logs and stool_logs tables...')
    
    // Create weight_logs table
    const { error: weightTableError } = await supabaseAdmin
      .from('weight_logs')
      .select('*')
      .limit(1)

    if (weightTableError && weightTableError.code === 'PGRST116') {
      // Table doesn't exist, create it
      console.log('Creating weight_logs table...')
      // We'll need to create this through SQL editor or migration
      return NextResponse.json({ 
        message: 'Tables need to be created manually in Supabase SQL editor. Please run the SQL from scripts/create-logs-tables.sql',
        sql: `
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stool_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  score INT CHECK (score BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stool_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sel own weight" ON weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ins own weight" ON weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd own weight" ON weight_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "del own weight" ON weight_logs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "sel own stool" ON stool_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ins own stool" ON stool_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd own stool" ON stool_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "del own stool" ON stool_logs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_weight_logs_dog_date ON weight_logs(dog_id, date);
CREATE INDEX IF NOT EXISTS idx_stool_logs_dog_date ON stool_logs(dog_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id ON weight_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_stool_logs_user_id ON stool_logs(user_id);
        `
      })
    }

    // Check stool_logs table
    const { error: stoolTableError } = await supabaseAdmin
      .from('stool_logs')
      .select('*')
      .limit(1)

    if (stoolTableError && stoolTableError.code === 'PGRST116') {
      return NextResponse.json({ 
        message: 'Tables need to be created manually in Supabase SQL editor. Please run the SQL from scripts/create-logs-tables.sql',
        sql: `
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stool_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  score INT CHECK (score BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stool_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sel own weight" ON weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ins own weight" ON weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd own weight" ON weight_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "del own weight" ON weight_logs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "sel own stool" ON stool_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ins own stool" ON stool_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd own stool" ON stool_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "del own stool" ON stool_logs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_weight_logs_dog_date ON weight_logs(dog_id, date);
CREATE INDEX IF NOT EXISTS idx_stool_logs_dog_date ON stool_logs(dog_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id ON weight_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_stool_logs_user_id ON stool_logs(user_id);
        `
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tables already exist' 
    })

  } catch (error) {
    console.error('Error checking tables:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
