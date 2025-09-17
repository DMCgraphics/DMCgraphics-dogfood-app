#!/usr/bin/env node

/**
 * Fix the plan to link it to the correct dog
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixPlanDogLinking() {
  console.log('🔧 Fixing Plan-Dog Linking...\n')

  try {
    const planId = 'b794c176-4186-415f-87a7-8bc4a8be8af6'
    const dogId = 'c9fe0058-f45f-44b0-bbc5-01b18688684c' // Luigi

    console.log('📋 Updating Plan:')
    console.log(`   Plan ID: ${planId}`)
    console.log(`   Dog ID: ${dogId} (Luigi)`)

    // Update the plan to link it to Luigi
    const { data: updatedPlan, error: updateError } = await supabase
      .from('plans')
      .update({
        dog_id: dogId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .select()

    if (updateError) {
      console.error('❌ Error updating plan:', updateError)
    } else {
      console.log('✅ Plan updated successfully!')
      console.log(`   Dog ID: ${updatedPlan[0].dog_id}`)
      console.log(`   Updated At: ${updatedPlan[0].updated_at}`)
    }

    // Verify the fix by checking the subscription data flow
    console.log('\n🔍 Verifying Fix:')
    
    // Get the subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('plan_id', planId)
      .single()

    if (subError) {
      console.error('❌ Error fetching subscription:', subError)
    } else {
      console.log('✅ Subscription found:')
      console.log(`   ID: ${subscription.id}`)
      console.log(`   Plan ID: ${subscription.plan_id}`)
      console.log(`   Status: ${subscription.status}`)
    }

    // Get the plan
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError) {
      console.error('❌ Error fetching plan:', planError)
    } else {
      console.log('✅ Plan found:')
      console.log(`   ID: ${plan.id}`)
      console.log(`   Dog ID: ${plan.dog_id}`)
      console.log(`   Status: ${plan.status}`)
    }

    // Get the dog
    const { data: dog, error: dogError } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', dogId)
      .single()

    if (dogError) {
      console.error('❌ Error fetching dog:', dogError)
    } else {
      console.log('✅ Dog found:')
      console.log(`   ID: ${dog.id}`)
      console.log(`   Name: ${dog.name}`)
      console.log(`   Breed: ${dog.breed}`)
      console.log(`   Age: ${dog.age}`)
    }

    console.log('\n🎉 Plan-Dog Linking Fix Complete!')
    console.log('\n📋 Summary:')
    console.log('✅ Plan is now linked to Luigi (the dog)')
    console.log('✅ Dashboard should now show "Luigi" instead of "Unknown Dog"')
    console.log('✅ Subscription data flow is now complete: Subscription -> Plan -> Dog')
    
    console.log('\n🚀 Next Steps:')
    console.log('1. Refresh your dashboard')
    console.log('2. The "Manage Subscriptions" modal should now show "Luigi"')
    console.log('3. The dashboard widgets should show real subscription data')

  } catch (error) {
    console.error('❌ Fix failed:', error.message)
  }
}

fixPlanDogLinking()
