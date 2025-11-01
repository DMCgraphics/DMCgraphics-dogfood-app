#!/usr/bin/env node

/**
 * Run the contact_submissions table migration in Supabase
 */

require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const path = require("path")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log("🚀 Running contact_submissions table migration...\n")

  // Read the SQL file
  const sqlFilePath = path.join(__dirname, "create-contact-submissions-table.sql")
  const sql = fs.readFileSync(sqlFilePath, "utf8")

  console.log("📄 Loaded SQL migration file")

  // Split SQL into individual statements (rough split by semicolons outside of function definitions)
  // For complex migrations, we'll execute the whole thing at once
  try {
    console.log("\n⏳ Executing migration SQL...\n")

    // Execute the SQL
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql }).catch(async () => {
      // If exec_sql doesn't exist, try direct execution (this works for many statements)
      // We'll execute major sections separately
      const statements = [
        // Create table
        `CREATE TABLE IF NOT EXISTS public.contact_submissions (
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

        // Create indexes
        `CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);`,
        `CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);`,
        `CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);`,

        // Create trigger function
        `CREATE OR REPLACE FUNCTION public.handle_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = timezone('utc'::text, now());
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;`,

        // Create trigger
        `CREATE TRIGGER set_contact_submissions_updated_at
            BEFORE UPDATE ON public.contact_submissions
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();`,

        // Enable RLS
        `ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;`,

        // Policies
        `CREATE POLICY "Allow public insert" ON public.contact_submissions
            FOR INSERT
            TO public
            WITH CHECK (true);`,

        `CREATE POLICY "Allow authenticated users to view" ON public.contact_submissions
            FOR SELECT
            TO authenticated
            USING (true);`,

        `CREATE POLICY "Allow authenticated users to update" ON public.contact_submissions
            FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);`,

        // Grants
        `GRANT INSERT ON public.contact_submissions TO anon;`,
        `GRANT SELECT, UPDATE ON public.contact_submissions TO authenticated;`,
      ]

      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim()
        if (!statement) continue

        console.log(`   ${i + 1}/${statements.length} Executing statement...`)

        const { error } = await supabase.rpc("exec_sql", { sql: statement })

        if (error) {
          // If exec_sql doesn't work, this approach won't work either
          throw error
        }
      }

      return { data: null, error: null }
    })

    if (error) {
      console.error("❌ Migration failed:", error.message)
      console.log("\n📋 Manual steps required:")
      console.log("1. Open your Supabase dashboard: " + supabaseUrl.replace(".supabase.co", ".supabase.co/project/_"))
      console.log("2. Go to SQL Editor")
      console.log("3. Copy and paste the contents of: scripts/create-contact-submissions-table.sql")
      console.log("4. Click 'Run' to execute the migration")
      process.exit(1)
    }

    console.log("✅ Migration completed successfully!\n")

    // Verify the table exists
    console.log("🔍 Verifying table creation...")
    const { data: verifyData, error: verifyError } = await supabase
      .from("contact_submissions")
      .select("count", { count: "exact", head: true })

    if (verifyError) {
      console.error("⚠️  Warning: Could not verify table creation:", verifyError.message)
    } else {
      console.log("✅ Table verified successfully!")
    }

    console.log("\n✨ contact_submissions table is ready to use!")
    console.log("\n📊 Next steps:")
    console.log("   • Test with: node scripts/test-contact-submission.js")
    console.log("   • Submit a test form at /contact")
  } catch (err) {
    console.error("❌ Unexpected error:", err.message)
    console.log("\n📋 Please run the migration manually:")
    console.log("1. Open Supabase SQL Editor")
    console.log("2. Run: scripts/create-contact-submissions-table.sql")
    process.exit(1)
  }
}

runMigration().catch((error) => {
  console.error("❌ Migration script failed:", error)
  process.exit(1)
})
