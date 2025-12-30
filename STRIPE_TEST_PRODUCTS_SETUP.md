# Stripe Test Products Setup Guide

This guide walks you through creating test mode products and prices in your Stripe dashboard.

## Why You Need This

The production Stripe price IDs in `lib/stripe-pricing.ts` won't work with test mode Stripe keys. You need to create matching products/prices in your **test mode** Stripe account.

## Automatic Mode Detection

The app now automatically detects test vs production mode based on your Stripe keys:
- `pk_test_*` / `sk_test_*` → Uses test price IDs
- `pk_live_*` / `sk_live_*` → Uses production price IDs

When you switch environments with `npm run env:test` or `npm run env:prod`, the pricing automatically switches.

## Step 1: Create Products in Stripe Test Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Make sure you're in **Test Mode** (toggle in top right)

### Create These 16 Products

You need 4 recipes × 4 sizes = 16 products total:

#### Beef & Quinoa Harvest
- **Small (5-20 lbs)** - $29.00/week
- **Medium (21-50 lbs)** - $47.00/week
- **Large (51-90 lbs)** - $69.00/week
- **XL (91+ lbs)** - $87.00/week

#### Lamb & Pumpkin Feast
- **Small (5-20 lbs)** - $29.00/week
- **Medium (21-50 lbs)** - $47.00/week
- **Large (51-90 lbs)** - $69.00/week
- **XL (91+ lbs)** - $87.00/week

#### Chicken & Garden Veggie
- **Small (5-20 lbs)** - $29.00/week
- **Medium (21-50 lbs)** - $47.00/week
- **Large (51-90 lbs)** - $69.00/week
- **XL (91+ lbs)** - $87.00/week

#### Turkey & Brown Rice Comfort
- **Small (5-20 lbs)** - $29.00/week
- **Medium (21-50 lbs)** - $47.00/week
- **Large (51-90 lbs)** - $69.00/week
- **XL (91+ lbs)** - $87.00/week

## Step 2: Create Each Product

For each product:

1. Click **+ Add product**
2. **Name**: Use exact name from list above (e.g., "Beef & Quinoa Harvest – Small (5–20 lbs) (Weekly)")
3. **Description**: "Fresh-cooked dog meal delivered weekly"
4. **Pricing model**: Standard pricing
5. **Price**: Enter amount (e.g., $29.00)
6. **Billing period**: Weekly
7. **Currency**: USD
8. Click **Save product**

## Step 3: Copy Price IDs

After creating each product, copy its **Price ID** (starts with `price_`):

1. Click on the product
2. Copy the Price ID (e.g., `price_1ABC2DEF3GHI4JKL`)
3. Save it in a text file with the product name

## Step 4: Update lib/stripe-pricing.ts

Replace the placeholder test price IDs with your actual test price IDs:

```typescript
// Find this section in lib/stripe-pricing.ts
const STRIPE_PRICING_TEST: Record<string, StripePricing[]> = {
  "beef-quinoa-harvest": [
    {
      priceId: "price_YOUR_ACTUAL_TEST_ID_HERE", // Replace this
      productName: "Beef & Quinoa Harvest – Small (5–20 lbs) (Weekly)",
      amountCents: 2900,
      interval: "week",
    },
    // ... repeat for all 16 products
  ],
```

## Quick Reference: Which Price Goes Where

### beef-quinoa-harvest
- Small: `price_test_beef_small` → Your test price ID for Beef Small
- Medium: `price_test_beef_medium` → Your test price ID for Beef Medium
- Large: `price_test_beef_large` → Your test price ID for Beef Large
- XL: `price_test_beef_xl` → Your test price ID for Beef XL

### lamb-pumpkin-feast
- Small: `price_test_lamb_small` → Your test price ID for Lamb Small
- Medium: `price_test_lamb_medium` → Your test price ID for Lamb Medium
- Large: `price_test_lamb_large` → Your test price ID for Lamb Large
- XL: `price_test_lamb_xl` → Your test price ID for Lamb XL

### low-fat-chicken-garden-veggie
- Small: `price_test_chicken_small` → Your test price ID for Chicken Small
- Medium: `price_test_chicken_medium` → Your test price ID for Chicken Medium
- Large: `price_test_chicken_large` → Your test price ID for Chicken Large
- XL: `price_test_chicken_xl` → Your test price ID for Chicken XL

### turkey-brown-rice-comfort
- Small: `price_test_turkey_small` → Your test price ID for Turkey Small
- Medium: `price_test_turkey_medium` → Your test price ID for Turkey Medium
- Large: `price_test_turkey_large` → Your test price ID for Turkey Large
- XL: `price_test_turkey_xl` → Your test price ID for Turkey XL

## Step 5: Verify Setup

After updating the price IDs, run this script to verify they exist:

```bash
npm run verify-stripe-prices
```

Or manually:

```bash
node scripts/verify-stripe-prices.js
```

This will check if all test price IDs are valid in your Stripe account.

## Alternative: Use Stripe CLI

If you want to script the creation, you can use the Stripe CLI:

```bash
# Login to Stripe CLI
stripe login

# Create a product and price
stripe products create \
  --name="Beef & Quinoa Harvest – Small (5–20 lbs) (Weekly)" \
  --description="Fresh-cooked dog meal delivered weekly"

# Get the product ID from output, then create price
stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=2900 \
  --currency=usd \
  --recurring[interval]=week
```

## Testing Your Setup

1. Switch to test environment:
   ```bash
   npm run env:test
   ```

2. Restart your dev server:
   ```bash
   npm run dev
   ```

3. Go through the plan builder and try to checkout
4. You should see your test products at checkout
5. Use test card `4242 4242 4242 4242` to complete payment

## Troubleshooting

### "No such price" error
- Make sure you're in Test Mode in Stripe dashboard
- Verify the price ID is correct (starts with `price_`)
- Check that the price ID is from your test account, not production

### Wrong prices showing
- Clear your browser cache
- Restart your dev server
- Verify `.env.local` has test Stripe keys
- Check `npm run env:status` shows test environment

### Products not appearing
- Ensure all 16 products are created
- Check that billing period is set to "Weekly"
- Verify currency is USD

## Production Note

Your production price IDs are already configured in `STRIPE_PRICING_PRODUCTION`. When you deploy to production (or switch with `npm run env:prod`), the app will automatically use production price IDs.
