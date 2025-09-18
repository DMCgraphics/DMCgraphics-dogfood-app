import { NextRequest, NextResponse } from "next/server"
import { createClient, supabaseAdmin } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated (optional - you might want to restrict this to admin users)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Setting up weight_logs and stool_logs tables...')
    
    // Create weight_logs table
    const { error: weightTableError } = await supabaseAdmin.rpc('exec_sql', {
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
      `
    })

    if (weightTableError) {
      console.error('Error creating weight_logs table:', weightTableError)
      return NextResponse.json({ error: 'Failed to create weight_logs table' }, { status: 500 })
    }

    // Create stool_logs table
    const { error: stoolTableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS stool_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          score INT CHECK (score BETWEEN 1 AND 5),
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })

    if (stoolTableError) {
      console.error('Error creating stool_logs table:', stoolTableError)
      return NextResponse.json({ error: 'Failed to create stool_logs table' }, { status: 500 })
    }

    // Enable RLS
    await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;'
    })
    
    await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE stool_logs ENABLE ROW LEVEL SECURITY;'
    })

    // Create RLS policies
    const policies = [
      'CREATE POLICY "sel own weight" ON weight_logs FOR SELECT USING (auth.uid() = user_id);',
      'CREATE POLICY "ins own weight" ON weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);',
      'CREATE POLICY "upd own weight" ON weight_logs FOR UPDATE USING (auth.uid() = user_id);',
      'CREATE POLICY "del own weight" ON weight_logs FOR DELETE USING (auth.uid() = user_id);',
      'CREATE POLICY "sel own stool" ON stool_logs FOR SELECT USING (auth.uid() = user_id);',
      'CREATE POLICY "ins own stool" ON stool_logs FOR INSERT WITH CHECK (auth.uid() = user_id);',
      'CREATE POLICY "upd own stool" ON stool_logs FOR UPDATE USING (auth.uid() = user_id);',
      'CREATE POLICY "del own stool" ON stool_logs FOR DELETE USING (auth.uid() = user_id);'
    ]

    for (const policy of policies) {
      await supabaseAdmin.rpc('exec_sql', { sql: policy })
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_weight_logs_dog_date ON weight_logs(dog_id, date);',
      'CREATE INDEX IF NOT EXISTS idx_stool_logs_dog_date ON stool_logs(dog_id, date);',
      'CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id ON weight_logs(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_stool_logs_user_id ON stool_logs(user_id);'
    ]

    for (const index of indexes) {
      await supabaseAdmin.rpc('exec_sql', { sql: index })
    }

    console.log('✅ Successfully created weight_logs and stool_logs tables')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully created weight_logs and stool_logs tables with RLS policies and indexes' 
    })

  } catch (error) {
    console.error('Error setting up tables:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
