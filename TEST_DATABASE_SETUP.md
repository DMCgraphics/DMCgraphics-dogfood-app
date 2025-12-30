# Test Database Setup Guide

This guide will help you set up a complete test environment with a separate Supabase database and Stripe test mode.

## Overview

You now have:
- ✅ New test Supabase database: `wfjgcglyhnagnomdlgmd`
- ✅ Production database: `tczvietgpixwonpqaotl` (unchanged)
- 📝 Migration scripts ready to run
- 📝 Environment configuration ready

## Step 1: Set Up Test Database Schema

1. Go to your test database SQL editor:
   ```
   https://supabase.com/dashboard/project/wfjgcglyhnagnomdlgmd/sql/new
   ```

2. Open the file `test-database-schema.sql` in your project root

3. Copy the entire contents and paste into the SQL editor

4. Click **RUN** to create all tables and RLS policies

5. Verify it worked by checking the "Table Editor" - you should see 28 tables

## Step 2: Create Test Products in Stripe

1. Go to Stripe Test Dashboard:
   ```
   https://dashboard.stripe.com/test/products
   ```

2. Make sure you're in **TEST MODE** (toggle at top of page)

3. Create 16 products (4 recipes × 4 sizes):

### Products to Create:

| Recipe | Size | Price | Billing |
|--------|------|-------|---------|
| Beef & Quinoa Harvest - Small | 15 lbs/week | $29.00 | Weekly |
| Beef & Quinoa Harvest - Medium | 30 lbs/week | $47.00 | Weekly |
| Beef & Quinoa Harvest - Large | 60 lbs/week | $69.00 | Weekly |
| Beef & Quinoa Harvest - XL | 90 lbs/week | $87.00 | Weekly |
| Lamb & Pumpkin Feast - Small | 15 lbs/week | $29.00 | Weekly |
| Lamb & Pumpkin Feast - Medium | 30 lbs/week | $47.00 | Weekly |
| Lamb & Pumpkin Feast - Large | 60 lbs/week | $69.00 | Weekly |
| Lamb & Pumpkin Feast - XL | 90 lbs/week | $87.00 | Weekly |
| Turkey & Brown Rice - Small | 15 lbs/week | $29.00 | Weekly |
| Turkey & Brown Rice - Medium | 30 lbs/week | $47.00 | Weekly |
| Turkey & Brown Rice - Large | 60 lbs/week | $69.00 | Weekly |
| Turkey & Brown Rice - XL | 90 lbs/week | $87.00 | Weekly |
| Chicken & Veggie - Small | 15 lbs/week | $29.00 | Weekly |
| Chicken & Veggie - Medium | 30 lbs/week | $47.00 | Weekly |
| Chicken & Veggie - Large | 60 lbs/week | $69.00 | Weekly |
| Chicken & Veggie - XL | 90 lbs/week | $87.00 | Weekly |

4. For each product:
   - Click "+ Add product"
   - Enter name and price
   - Set "Recurring" billing to "Weekly"
   - Save and **COPY THE PRICE ID** (starts with `price_`)

## Step 3: Update Test Database with Price IDs

1. Open `test-database-data.sql`

2. Replace placeholder price IDs with your real test price IDs:
   ```sql
   -- Change this:
   'price_TEST_beef_small'

   -- To your actual price ID:
   'price_1ABC123def456GHI789jkl'
   ```

3. Go back to SQL editor and run the updated `test-database-data.sql`

## Step 4: Configure Environment Variables

1. Get your Stripe TEST keys:
   ```
   https://dashboard.stripe.com/test/apikeys
   ```

2. Copy the SECRET key and PUBLISHABLE key

3. Open `.env.local.test` and add your Stripe keys

4. Copy `.env.local.test` to `.env.local`:
   ```bash
   cp .env.local.test .env.local
   ```

5. Restart your dev server:
   ```bash
   npm run dev
   ```

## Step 5: Test the Setup

1. Go to `http://localhost:3000`

2. Create a new account (test email)

3. Build a meal plan

4. Try to checkout - should work now!

5. Use Stripe test card: `4242 4242 4242 4242`

6. Verify subscription created in:
   - Supabase test database (subscriptions table)
   - Stripe test dashboard

## Switching Between Test and Production

### To use TEST environment:
```bash
cp .env.local.test .env.local
npm run dev
```

### To use PRODUCTION environment:
```bash
cp .env.local.production .env.local
npm run dev
```

## Troubleshooting

### "No such price" error
- Make sure you're using Stripe TEST keys with TEST price IDs
- Check that price IDs in database match those in Stripe dashboard
- Verify you created the prices as "weekly recurring"

### Database connection errors
- Check Supabase project URL and keys in `.env.local`
- Make sure you copied the keys correctly (no extra spaces)

### RLS policy errors
- Verify RLS policies were created (check SQL editor for errors)
- Some tables might need service role key for admin operations

## Files Created

- ✅ `test-database-schema.sql` - Complete schema migration
- ✅ `test-database-data.sql` - Sample data and price IDs
- ✅ `.env.local.test` - Test environment configuration
- ✅ `.mcp.json` - Updated with test database connection
- ✅ `TEST_DATABASE_SETUP.md` - This guide

## Next Steps

After setup is complete, you can:
1. Test checkout flow with test cards
2. Test subscription management
3. Test plan builder
4. Verify data isolation from production
5. Create test users and test data freely

---

**Need Help?** Check the Stripe test mode docs or Supabase documentation.
