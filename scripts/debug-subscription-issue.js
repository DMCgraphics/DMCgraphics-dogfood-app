#!/usr/bin/env node

/**
 * Debug script to help identify subscription creation issues
 * This script provides guidance on what to check and how to debug the issue
 */

console.log('🔍 NouriPet Subscription Creation Debug Guide\n')

console.log('Based on your description, the issue is:')
console.log('✅ Stripe checkout completes successfully')
console.log('✅ Plan is created and marked as active')
console.log('❌ Subscription is NOT created in the database')
console.log('❌ Dashboard shows "No Active Subscriptions"')
console.log('❌ Dashboard uses mock data instead of real data\n')

console.log('🔧 Potential Issues to Check:\n')

console.log('1. WEBHOOK CONFIGURATION:')
console.log('   - Check if Stripe webhook endpoint is configured correctly')
console.log('   - Verify webhook URL: https://yourdomain.com/api/webhooks/stripe')
console.log('   - Ensure these events are enabled:')
console.log('     * checkout.session.completed')
console.log('     * customer.subscription.created')
console.log('   - Check webhook secret is set in environment variables\n')

console.log('2. WEBHOOK LOGS:')
console.log('   - Check your application logs for webhook events')
console.log('   - Look for these log messages:')
console.log('     * "[v0] Webhook received"')
console.log('     * "[v0] Processing checkout.session.completed"')
console.log('     * "[v0] Attempting to upsert subscription"')
console.log('     * "[v0] Subscription upserted successfully"')
console.log('   - If you see errors, they will show the exact issue\n')

console.log('3. DATABASE SCHEMA:')
console.log('   - Run this SQL to check if the subscriptions table has the right columns:')
console.log('     SELECT column_name, data_type, is_nullable')
console.log('     FROM information_schema.columns')
console.log('     WHERE table_name = \'subscriptions\' AND table_schema = \'public\';')
console.log('   - Ensure these columns exist:')
console.log('     * stripe_subscription_id (TEXT, UNIQUE)')
console.log('     * stripe_customer_id (TEXT)')
console.log('     * stripe_price_id (TEXT)')
console.log('     * billing_cycle (TEXT)')
console.log('     * current_period_start (TIMESTAMPTZ)')
console.log('     * current_period_end (TIMESTAMPTZ)')
console.log('     * metadata (JSONB)\n')

console.log('4. RECENT WEBHOOK EVENTS:')
console.log('   - Check the stripe_events table for recent events:')
console.log('     SELECT type, created_at, payload->>\'id\' as event_id')
console.log('     FROM stripe_events')
console.log('     ORDER BY created_at DESC LIMIT 10;')
console.log('   - Look for checkout.session.completed and customer.subscription.created events\n')

console.log('5. PLAN DATA:')
console.log('   - Check if plans are being created correctly:')
console.log('     SELECT id, user_id, status, stripe_session_id, created_at')
console.log('     FROM plans')
console.log('     WHERE status = \'active\'')
console.log('     ORDER BY created_at DESC LIMIT 5;')
console.log('   - Verify the plan has the correct user_id and status\n')

console.log('6. SUBSCRIPTION ATTEMPTS:')
console.log('   - Check if there are any subscription creation attempts:')
console.log('     SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;')
console.log('   - If this returns empty, the webhook is not creating subscriptions\n')

console.log('🚀 QUICK FIXES TO TRY:\n')

console.log('1. Test the webhook endpoint manually:')
console.log('   - Use Stripe CLI: stripe listen --forward-to localhost:3000/api/webhooks/stripe')
console.log('   - Or test with a webhook testing tool\n')

console.log('2. Check environment variables:')
console.log('   - STRIPE_SECRET_KEY (should start with sk_test_ or sk_live_)')
console.log('   - STRIPE_WEBHOOK_SECRET (should start with whsec_)')
console.log('   - SUPABASE_SERVICE_ROLE_KEY (should start with eyJ)')
console.log('   - NEXT_PUBLIC_SUPABASE_URL\n')

console.log('3. Verify the webhook is receiving events:')
console.log('   - Check your application logs during a test checkout')
console.log('   - Look for the webhook signature verification message\n')

console.log('4. Test subscription creation manually:')
console.log('   - Use the /api/subscriptions/create endpoint with a valid session ID')
console.log('   - This can help isolate if the issue is in the webhook or the creation logic\n')

console.log('📋 NEXT STEPS:\n')
console.log('1. Check your application logs for webhook events')
console.log('2. Verify the database schema matches the webhook expectations')
console.log('3. Test the webhook endpoint manually')
console.log('4. If webhooks are working, check the subscription creation logic')
console.log('5. Verify the dashboard is fetching data from the correct tables\n')

console.log('💡 The most likely issue is that the webhook is not being triggered')
console.log('   or there\'s a database constraint preventing subscription creation.')
console.log('   Check the logs first - they will tell you exactly what\'s happening.\n')
