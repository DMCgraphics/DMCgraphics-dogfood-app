/**
 * Seed script to populate sales_email_templates table with default templates
 * Run with: npx tsx scripts/seed-email-templates.ts
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_SALES_TEMPLATES } from '../lib/sales/default-email-templates'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...\n')

  let successCount = 0
  let errorCount = 0

  for (const template of DEFAULT_SALES_TEMPLATES) {
    try {
      const { error } = await supabase
        .from('sales_email_templates')
        .upsert(template, { onConflict: 'slug' })

      if (error) {
        console.error(`❌ Failed to seed "${template.name}":`, error.message)
        errorCount++
      } else {
        console.log(`✅ Seeded: ${template.name} (${template.category})`)
        successCount++
      }
    } catch (error: any) {
      console.error(`❌ Error seeding "${template.name}":`, error.message)
      errorCount++
    }
  }

  console.log(`\n📊 Results:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📝 Total: ${DEFAULT_SALES_TEMPLATES.length}`)

  if (errorCount === 0) {
    console.log('\n🎉 All email templates seeded successfully!')
  } else {
    console.log('\n⚠️  Some templates failed to seed. Check errors above.')
    process.exit(1)
  }
}

// Run the seed function
seedEmailTemplates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
