# Individual Packs Purchase Setup Guide

This guide will help you configure the Stripe price IDs for the individual packs purchase feature.

## Overview

The individual packs feature allows users to purchase 1 or 3 packs of fresh dog food without a subscription. This is a one-time payment processed through Stripe.

**Current Setup:** ✅ Already configured with all 4 recipes and price IDs from Stripe!

## Recipe Price IDs (Already Set Up)

The following recipes and price IDs are already configured:

### Beef & Quinoa Harvest
- **Single Pack**: `price_1STtdA0R4BbWwBbf9G5uIXl3` ($7.00)
- **3 Pack Bundle**: `price_1STteJ0R4BbWwBbfCeqiKDkO` ($20.00)

### Chicken & Garden Veggie
- **Single Pack**: `price_1STtbI0R4BbWwBbf71C6jMmd` ($7.00)
- **3 Pack Bundle**: `price_1STtfh0R4BbWwBbfGZC78YSL` ($20.00)

### Lamb & Pumpkin Feast
- **Single Pack**: `price_1STtaL0R4BbWwBbfXDr9f5mZ` ($7.00)
- **3 Pack Bundle**: `price_1STtgF0R4BbWwBbf322yK4Nj` ($20.00)

### Turkey & Brown Rice Comfort
- **Single Pack**: `price_1STtYg0R4BbWwBbf56M9CSBF` ($7.00)
- **3 Pack Bundle**: `price_1STtgs0R4BbWwBbfpaXHPagF` ($20.00)

## No Setup Required!

All price IDs have been configured in `/app/shop/individual-packs/page.tsx`. You can skip to Step 3 (Testing) below.

## Step 3: Test the Flow

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/dashboard`
3. Click **"Buy Individual Packs"** on any dog card
4. You'll be redirected to `/shop/individual-packs`
5. **Step 1**: Select a recipe (Beef, Chicken, Lamb, or Turkey)
6. **Step 2**: Choose quantity (1 pack for $7 or 3 packs for $20)
7. Click the checkout button
8. You should be redirected to Stripe Checkout
9. Use Stripe test card: `4242 4242 4242 4242`
10. Complete the checkout
11. Verify the payment in Stripe Dashboard → Payments

## How It Works

### User Flow
1. User clicks "Buy Individual Packs" button on a dog card
2. Redirected to `/shop/individual-packs?dogId={dogId}&dogName={dogName}`
3. **Step 1**: User selects a recipe (4 options)
4. **Step 2**: User selects quantity (1 or 3 packs) - this step only appears after recipe selection
5. Clicks checkout button (disabled until both selections made)
6. API creates Stripe checkout session with the correct price ID for the recipe + quantity combo
7. User is redirected to Stripe hosted checkout page
8. After payment, user returns to `/dashboard?checkout=success`

### Technical Flow
```
DogCard → Individual Packs Page → API Route → Stripe Checkout → Dashboard
   ↓              ↓                    ↓              ↓              ↓
Button      Select quantity    Create session   Process payment  Show success
```

### API Endpoint
The checkout is handled by `/app/api/topper-checkout/route.ts`:
- Accepts: `priceId`, `dogId`, `dogName`, `productType`, `isSubscription`
- For individual packs: `isSubscription: false` → Stripe `mode: "payment"`
- Creates checkout session with metadata for tracking
- Returns checkout URL for redirect

## Metadata Stored in Stripe

When a purchase is made, the following metadata is attached to the Stripe checkout session:
- `user_id`: The authenticated user's ID
- `dog_id`: The dog's ID
- `dog_name`: The dog's name
- `product_type`: Either "individual" or "3-packs"
- `recipe_name`: The selected recipe (e.g., "Beef & Quinoa Harvest")

This metadata can be used in webhooks to track purchases or fulfill orders.

## Success/Cancel URLs

- **Success**: `/dashboard?checkout=success`
- **Cancel**: `/dashboard?checkout=cancelled`

You can add toast notifications or success messages based on the `checkout` query parameter.

## Files Modified

1. `/app/shop/individual-packs/page.tsx` - The purchase page (new)
2. `/components/dashboard/dog-card.tsx` - Added "Buy Individual Packs" button
3. `/app/api/topper-checkout/route.ts` - API endpoint for Stripe checkout (created earlier)

## Production Deployment

Before deploying to production:

1. Create the same products in Stripe **Live Mode**
2. Update the price IDs in the code with production price IDs
3. Ensure `NEXT_PUBLIC_APP_URL` environment variable is set correctly
4. Test the full flow in production mode

## Troubleshooting

### "Failed to create checkout session" error
- Check that the Stripe price IDs are correct
- Verify `STRIPE_SECRET_KEY` is set in environment variables
- Check Stripe Dashboard → Logs for detailed error messages

### User sees "Please select a dog from the dashboard"
- The `dogName` query parameter is missing
- Make sure the link includes both `dogId` and `dogName` parameters

### Checkout session created but redirect doesn't work
- Check browser console for JavaScript errors
- Verify the API route returns a valid `url` field
- Check that Stripe is not in test mode mismatch (test key with live mode product)

## Next Steps

After setting up individual packs, you might want to:
- Add email notifications when packs are purchased
- Track purchase history in the database
- Add fulfillment workflow for pack delivery
- Create admin interface to view individual pack orders
