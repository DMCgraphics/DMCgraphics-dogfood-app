// Script to manually create missing subscription record for matzs
// This fixes the issue where the webhook failed to create the subscription due to RLS 403 error

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local.production' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMissingSubscription() {
  const subscriptionId = 'sub_1STlKm0WbfuHe9kAtOlDjITt';
  const planId = '2d862dee-3dd6-4687-9b18-eea4556f878a';
  const userId = '52523cfb-f4b1-4a83-a888-59eb391127ee';

  console.log('Fetching Stripe subscription:', subscriptionId);

  try {
    // Fetch the subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('Stripe subscription status:', stripeSubscription.status);
    console.log('Current period:', new Date(stripeSubscription.current_period_start * 1000), 'to', new Date(stripeSubscription.current_period_end * 1000));

    // Map Stripe interval to billing_cycle
    const mapStripeIntervalToBillingCycle = (stripeInterval) => {
      const mapping = {
        'day': 'day',
        'week': 'weekly',
        'month': 'monthly',
        'quarter': 'quarterly',
        'year': 'yearly'
      };
      return mapping[stripeInterval] || 'monthly';
    };

    // Check if subscription already exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (existingSub) {
      console.log('Subscription already exists in database:', existingSub.id);
      return;
    }

    // Determine status (check for pause_collection)
    let subscriptionStatus = stripeSubscription.status;
    if (stripeSubscription.pause_collection && stripeSubscription.pause_collection.behavior) {
      subscriptionStatus = 'paused';
    }

    // Create the subscription record
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      stripe_subscription_id: subscriptionId,
      status: subscriptionStatus,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      currency: stripeSubscription.currency,
      interval: stripeSubscription.items.data[0]?.price.recurring?.interval || 'month',
      interval_count: stripeSubscription.items.data[0]?.price.recurring?.interval_count || 1,
      billing_cycle: mapStripeIntervalToBillingCycle(stripeSubscription.items.data[0]?.price.recurring?.interval),
      stripe_price_id: stripeSubscription.items.data[0]?.price.id || null,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
      canceled_at: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000).toISOString() : null,
      default_payment_method_id: stripeSubscription.default_payment_method || null,
      stripe_customer_id: typeof stripeSubscription.customer === 'string' ? stripeSubscription.customer : stripeSubscription.customer.id,
      metadata: {
        plan_id: planId,
        stripe_customer_id: typeof stripeSubscription.customer === 'string' ? stripeSubscription.customer : stripeSubscription.customer.id
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('\nInserting subscription with data:', JSON.stringify(subscriptionData, null, 2));

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) {
      console.error('Failed to insert subscription:', error);
      throw error;
    }

    console.log('\n✅ SUCCESS! Subscription created:', data.id);
    console.log('User should now see their subscription in the app');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixMissingSubscription();
