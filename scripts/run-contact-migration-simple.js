#!/usr/bin/env node

/**
 * Run the contact_submissions table migration in Supabase
 */

require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log("🚀 Running contact_submissions table migration...\n")

  const statements = [
    {
      name: "Create contact_submissions table",
      sql: `CREATE TABLE IF NOT EXISTS public.contact_submissions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL CHECK (subject IN ('general', 'order', 'nutrition', 'partnership', 'other')),
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
        notes TEXT,
        responded_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );`,
    },
    {
      name: "Create index on created_at",
      sql: `CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);`,
    },
    {
      name: "Create index on status",
      sql: `CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);`,
    },
    {
      name: "Create index on email",
      sql: `CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);`,
    },
    {
      name: "Create updated_at trigger function",
      sql: `CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = timezone('utc'::text, now());
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;`,
    },
    {
      name: "Create updated_at trigger",
      sql: `DROP TRIGGER IF EXISTS set_contact_submissions_updated_at ON public.contact_submissions;
      CREATE TRIGGER set_contact_submissions_updated_at
          BEFORE UPDATE ON public.contact_submissions
          FOR EACH ROW
          EXECUTE FUNCTION public.handle_updated_at();`,
    },
    {
      name: "Enable Row Level Security",
      sql: `ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;`,
    },
    {
      name: "Create policy for public insert",
      sql: `DROP POLICY IF EXISTS "Allow public insert" ON public.contact_submissions;
      CREATE POLICY "Allow public insert" ON public.contact_submissions
          FOR INSERT
          WITH CHECK (true);`,
    },
    {
      name: "Create policy for authenticated select",
      sql: `DROP POLICY IF EXISTS "Allow authenticated users to view" ON public.contact_submissions;
      CREATE POLICY "Allow authenticated users to view" ON public.contact_submissions
          FOR SELECT
          TO authenticated
          USING (true);`,
    },
    {
      name: "Create policy for authenticated update",
      sql: `DROP POLICY IF EXISTS "Allow authenticated users to update" ON public.contact_submissions;
      CREATE POLICY "Allow authenticated users to update" ON public.contact_submissions
          FOR UPDATE
          TO authenticated
          USING (true)
          WITH CHECK (true);`,
    },
  ]

  try {
    for (let i = 0; i < statements.length; i++) {
      const { name, sql } = statements[i]
      console.log(`${i + 1}/${statements.length} ${name}...`)

      // Use fetch to call Supabase REST API directly with SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
      })

      if (!response.ok) {
        // This approach may not work, fall back to manual instructions
        throw new Error("REST API approach not available")
      }

      console.log(`   ✅ Done`)
    }

    console.log("\n✅ Migration completed successfully!\n")

    // Verify the table exists
    console.log("🔍 Verifying table creation...")
    const { error: verifyError } = await supabase.from("contact_submissions").select("count", { count: "exact", head: true })

    if (verifyError) {
      console.error("⚠️  Warning: Could not verify table:", verifyError.message)
      throw new Error("Verification failed")
    }

    console.log("✅ Table verified successfully!")
    console.log("\n✨ contact_submissions table is ready to use!")
  } catch (err) {
    console.log("\n⚠️  Automatic migration not available. Using manual approach...\n")
    console.log("📋 Please run this SQL in Supabase SQL Editor:\n")
    console.log("=" .repeat(60))

    // Output the complete SQL
    const completeSql = `-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL CHECK (subject IN ('general', 'order', 'nutrition', 'partnership', 'other')),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    notes TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_contact_submissions_updated_at ON public.contact_submissions;
CREATE TRIGGER set_contact_submissions_updated_at
    BEFORE UPDATE ON public.contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow public insert" ON public.contact_submissions;
CREATE POLICY "Allow public insert" ON public.contact_submissions
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to view" ON public.contact_submissions;
CREATE POLICY "Allow authenticated users to view" ON public.contact_submissions
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to update" ON public.contact_submissions;
CREATE POLICY "Allow authenticated users to update" ON public.contact_submissions
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);`

    console.log(completeSql)
    console.log("=" .repeat(60))
    console.log("\nSteps:")
    console.log("1. Copy the SQL above")
    console.log("2. Go to: " + supabaseUrl.replace(".supabase.co", ".supabase.co/project/_") + "/sql")
    console.log("3. Paste and click 'Run'")
    console.log("4. Then run: node scripts/test-contact-submission.js")
  }
}

runMigration().catch((error) => {
  console.error("❌ Migration script failed:", error)
  process.exit(1)
})
