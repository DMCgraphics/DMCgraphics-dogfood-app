# Topper Products Setup Guide

This guide will help you configure the Stripe price IDs for the topper purchase options.

## Step 1: Get Stripe Price IDs

Go to your Stripe Dashboard (Test Mode) and find the price IDs for each product:

1. **25% Topper** - Subscription product
2. **50% Topper** - Subscription product
3. **75% Topper** - Subscription product
4. **3 Packs** - One-time payment product
5. **Individual Packs** - One-time payment product

Price IDs look like: `price_1ABC123DEF456GHI`

## Step 2: Update the Component

Open `/components/dashboard/topper-purchase-dialog.tsx` and replace the placeholder price IDs:

```typescript
const topperOptions = [
  {
    id: "25" as TopperOption,
    name: "25% Topper",
    description: "Perfect for adding variety to kibble",
    priceMultiplier: 0.25,
    badge: "Most Popular",
    badgeColor: "bg-green-100 text-green-800",
    stripePriceId: "price_XXXXX" // ← Replace with your actual Stripe price ID
  },
  {
    id: "50" as TopperOption,
    name: "50% Topper",
    description: "Half fresh, half kibble",
    priceMultiplier: 0.50,
    stripePriceId: "price_XXXXX" // ← Replace with your actual Stripe price ID
  },
  {
    id: "75" as TopperOption,
    name: "75% Topper",
    description: "Mostly fresh food",
    priceMultiplier: 0.75,
    stripePriceId: "price_XXXXX" // ← Replace with your actual Stripe price ID
  },
  {
    id: "3-packs" as TopperOption,
    name: "3 Packs",
    description: "Try 3 individual packs - perfect sample size",
    priceMultiplier: 0,
    badge: "Try It",
    badgeColor: "bg-purple-100 text-purple-800",
    stripePriceId: "price_XXXXX" // ← Replace with your actual Stripe price ID
  },
  {
    id: "individual" as TopperOption,
    name: "Individual Packs",
    description: "Buy packs individually without subscription",
    priceMultiplier: 0,
    badge: "Flexible",
    badgeColor: "bg-blue-100 text-blue-800",
    stripePriceId: "price_XXXXX" // ← Replace with your actual Stripe price ID
  }
]
```

## Step 3: Test the Flow

1. Go to your dashboard at `http://localhost:3000/dashboard`
2. Click "Buy Topper / Individual Packs" on any dog card
3. Select an option and click "Continue"
4. You should be redirected to Stripe Checkout
5. Use Stripe test card: `4242 4242 4242 4242`
6. Complete the checkout
7. Verify the purchase in Stripe Dashboard

## Product Setup in Stripe (if not done)

If you haven't created the products yet in Stripe:

### For Subscriptions (25%, 50%, 75% Toppers):
1. Go to Stripe Dashboard → Products → Create Product
2. Set the name (e.g., "25% Topper Plan")
3. Select "Recurring" as pricing model
4. Set billing period (weekly or monthly)
5. Set the price
6. Copy the Price ID

### For One-time Products (3 Packs, Individual):
1. Go to Stripe Dashboard → Products → Create Product
2. Set the name (e.g., "3 Pack Trial")
3. Select "One-time" as pricing model
4. Set the price
5. Copy the Price ID

## What Happens After Purchase

- **Subscriptions (25%, 50%, 75%)**: The webhook will create a subscription record in the database
- **One-time purchases (3 packs, Individual)**: Payment is processed, but no subscription is created

## Files Modified

- `/components/dashboard/topper-purchase-dialog.tsx` - The purchase dialog component
- `/components/dashboard/dog-card.tsx` - Added "Buy Topper" button to dog cards
- `/app/api/topper-checkout/route.ts` - API endpoint for creating Stripe checkout sessions
