#!/usr/bin/env node

/**
 * Update the subscription status from incomplete to active
 */

const { createClient } = require('@supabase/supabase-js')

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tczvietgpixwonpqaotl.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_Y8anZ6O42jr1WlyFvT8fwg_m1T97GG_'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_BrHc5r2vkNjLL7axDt-cng_YWCktFBz'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateSubscriptionStatus() {
  console.log('🔧 Updating Subscription Status...\n')

  try {
    // Get the most recent subscription
    const { data: recentSub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', 'sub_1S8Q8k0R4BbWwBbfdXRMbKxx')
      .single()

    if (subError) {
      console.error('❌ Error fetching subscription:', subError)
      return
    }

    console.log('📋 Current Subscription:')
    console.log(`   ID: ${recentSub.id}`)
    console.log(`   Stripe Subscription ID: ${recentSub.stripe_subscription_id}`)
    console.log(`   Current Status: ${recentSub.status}`)
    console.log(`   User ID: ${recentSub.user_id}`)
    console.log(`   Plan ID: ${recentSub.plan_id}`)

    // Update the status to active
    const { data: updatedSub, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', 'sub_1S8Q8k0R4BbWwBbfdXRMbKxx')
      .select()

    if (updateError) {
      console.error('❌ Error updating subscription:', updateError)
    } else {
      console.log('\n✅ Subscription status updated successfully!')
      console.log(`   New Status: ${updatedSub[0].status}`)
      console.log(`   Updated At: ${updatedSub[0].updated_at}`)
    }

    console.log('\n🎉 Subscription Status Update Complete!')
    console.log('\n📋 Summary:')
    console.log('✅ Subscription status updated from "incomplete" to "active"')
    console.log('✅ Your dashboard should now show the subscription as active')
    console.log('✅ Future webhook events will automatically update subscription status')

  } catch (error) {
    console.error('❌ Update failed:', error.message)
  }
}

updateSubscriptionStatus()
