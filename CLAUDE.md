# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NouriPet is a Next.js-based fresh dog food subscription platform featuring personalized meal planning, nutritional calculations, Stripe payment integration, and Supabase backend.

## Development Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Building
npm run build        # Production build

# Linting
npm run lint         # Run Next.js linter

# Note: TypeScript and ESLint errors are ignored during builds (see next.config.mjs)
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Radix UI components, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Stripe
- **TypeScript**: Strict mode enabled
- **Fonts**: Inter and Manrope (Google Fonts)

## Architecture

### Authentication Flow

The app uses a dual-layer auth system:

1. **Supabase Auth**: Core authentication via `@supabase/ssr`
   - Client: `lib/supabase/client.ts` (browser)
   - Server: `lib/supabase/server.ts` (server components/API routes)
   - Middleware: `lib/supabase/middleware.ts` (session refresh)

2. **AuthContext**: React context wrapper (`contexts/auth-context.tsx`)
   - Provides `user`, `isAuthenticated`, `hasSubscription` state
   - Handles subscription status checking
   - Manages logout and profile updates
   - Use `useAuth()` hook in client components

3. **Plan Token System**: Guest users can create plans before signup
   - Token stored in `localStorage` as `x-plan-token`
   - Passed in Supabase client headers for plan claiming
   - See `lib/plan-token.ts` and `app/plan-builder/_actions/claimPlan.ts`

### Database Structure

Key Supabase tables:
- `profiles`: User profile data (full_name, avatar_url)
- `dogs`: Dog profiles with health data
- `plans`: Meal plans (linked to dogs)
- `plan_items`: Individual recipe items in a plan
- `subscriptions`: Stripe subscription tracking (status, stripe_subscription_id)
- `orders`: Order history
- `allowed_zipcodes`: Service area validation (Westchester NY, Fairfield CT)

**Important**: Row Level Security (RLS) is enabled. Use `supabaseAdmin` from `lib/supabase/server.ts` when bypassing RLS is needed (service role).

### Stripe Integration

- Server-side: `lib/stripe.ts` (lazy initialization with Proxy pattern)
- Pricing: `lib/stripe-pricing.ts` (calculates weekly costs, Stripe price IDs)
- Webhooks: `app/api/webhooks/stripe/route.ts` (handles subscription events)
- Checkout: `app/api/checkout/route.ts` and `app/checkout/page.tsx`

### Nutrition Engine

Core calculation logic in `lib/nutrition-calculator.ts`:
- `calculateDERFromProfile()`: Daily Energy Requirement
- `calculateDailyGrams()`: Grams per day based on recipe kcal
- Supports multiple recipes, add-ons, meal portioning
- AAFCO standards validation (`lib/aafco-standards.ts`)
- Prescription diets (`lib/prescription-diets.ts`)
- Medical nutrition profiles (`lib/medical-nutrition-profiles.ts`)

### Plan Builder Flow

Multi-step wizard at `/plan-builder`:
1. Dog profile (breed, weight, age, activity, body condition)
2. Health goals (weight management, skin/coat, joints, digestive health)
3. Medical needs (prescription diets if needed - vet verification required)
4. Allergies (allergen exclusion)
5. Recipe selection (filtered by allergens and life stage)
6. Portions (meals per day)
7. Add-ons (fish oil, probiotics, joint supplements)
8. Review and pricing

Components in `components/plan-builder/`:
- `step-1-dog-profile.tsx` through `step-6-addons.tsx`
- `step-medical-needs.tsx` and `step-prescription-diet-selection.tsx`
- `plan-review.tsx` for final summary
- `wizard-layout.tsx` for step navigation

State management: Local state per step in `app/plan-builder/page.tsx`, saved to `localStorage` with keys like `nouripet-saved-plan-{dogId}`.

After completion, plans can be:
- Saved for guest users (with plan token)
- Claimed when user signs up via `claimGuestPlan()`
- Converted to subscriptions via checkout

### API Routes Structure

```
app/api/
├── checkout/               # Stripe checkout session creation
├── subscriptions/          # Pause/resume/create subscription management
├── webhooks/stripe/        # Stripe webhook handlers
├── upload/                 # Photo uploads (dog, profile)
├── validate-zipcode/       # Delivery area validation
├── admin/                  # Database setup utilities
└── debug/                  # Debugging endpoints
```

### Component Organization

- `components/ui/`: Radix UI primitives (Button, Card, Dialog, etc.)
- `components/plan-builder/`: Wizard steps and plan-related UI
- `components/dashboard/`: User dashboard components
- `components/checkout/`: Checkout flow components
- `components/auth/`: Auth modals and forms

### Middleware

`middleware.ts` runs on every request (except static files):
- Refreshes Supabase session via `lib/supabase/middleware.ts`
- Redirects unauthenticated users from `/dashboard/*` to `/auth/login`

### Path Aliases

TypeScript paths configured in `tsconfig.json`:
- `@/*` maps to project root

## Database Setup

Manual database setup required for new environments. Key scripts in `scripts/` directory:

**SQL Scripts** (run in Supabase SQL Editor):
- `create-zipcode-validation-schema.sql`: Zipcode validation tables
- `create-plan-items-schema.sql`: Plan items with constraints
- `add-data-integrity-constraints-fixed.sql`: Data validation constraints
- `setup-cascade-deletion.sql`: Cascade delete rules for user cleanup

**Node.js Scripts** (run with `node scripts/<script>.js`):
- `setup-photo-upload.js`: Configure photo upload buckets
- `setup-logs-tables.js`: Create logging tables
- `check-*.js`: Various data validation/debugging scripts

**Setup Guides**:
- `MANUAL_DATABASE_SETUP.md`: Zipcode validation setup
- `DATA_VALIDATION_GUIDE.md`: Data integrity constraints
- `RECOMMENDATIONS_SETUP.md`: Recommendations system setup

## Important Implementation Notes

1. **Supabase Client Creation**: Always create fresh clients in server contexts (per Supabase Fluid compute recommendations). Never reuse client instances across requests.

2. **Guest Plan Flow**: Plans created without auth are saved with a plan token. After signup, use `claimGuestPlan()` to associate with user.

3. **Subscription Status**: Fetched separately from auth. Check `user.subscriptionStatus` or `hasSubscription` from `useAuth()`. The auth context automatically refreshes subscription status on login.

4. **Zipcode Validation**: Service limited to Westchester County (NY) and Fairfield County (CT). Validate via `lib/allowed-zips.ts` or API route `/api/validate-zipcode`.

5. **Safe Data Creation**: ALWAYS use functions from `lib/safe-data-creation.ts` instead of direct database inserts. These functions:
   - Validate all required fields via `lib/data-validation.ts`
   - Calculate derived fields automatically (e.g., `weight_kg` from `weight` + `weight_unit`)
   - Prevent incomplete data that breaks CASCADE DELETE operations
   - Throw clear `DataValidationError` or `SafeDataCreationError` exceptions

6. **Error Handling**: Checkout errors handled via `lib/checkout-error-handler.ts`. Authentication loops prevented by dual session checking.

7. **Analytics**: Custom analytics utils in `lib/analytics.ts` and `lib/analytics-utils.ts`.

8. **Recommendations Engine**: Use `lib/recommendations-engine.ts` to build personalized health/nutrition recommendations based on dog data, weight logs, and stool logs.

## Environment Variables

Required environment variables (not committed to git, see `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations bypassing RLS)
- `STRIPE_SECRET_KEY` - Stripe secret key for server-side operations
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for client-side
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

**Note**: The Supabase project ref is `tczvietgpixwonpqaotl` (hardcoded in `.cursor/mcp.json` for MCP server)

## Common Development Tasks

### Adding a New Recipe
1. Update `lib/nutrition-calculator.ts` mock recipes or database
2. Ensure AAFCO compliance validation passes
3. Add allergen information
4. Update recipe selection UI in `components/plan-builder/step-4-recipe-selection.tsx`

### Modifying Plan Builder Steps
1. Edit corresponding step component in `components/plan-builder/`
2. Update state management in `app/plan-builder/page.tsx`
3. Ensure localStorage persistence works correctly
4. Update `DogPlanData` interface if adding new fields

### Adding New API Routes
1. Create route handler in `app/api/[route-name]/route.ts`
2. Use `createServerSupabase()` for authenticated requests
3. Use safe data creation functions from `lib/safe-data-creation.ts` for database writes
4. Return `NextResponse.json()` with proper error handling

### Database Schema Changes
1. Write SQL migration script in `scripts/` directory
2. Test in development Supabase instance
3. Update TypeScript types if table structure changes
4. Document in relevant guide (see existing `*_GUIDE.md` files)
5. Apply to production via Supabase dashboard SQL editor

## Testing Notes

No test framework currently configured. Manual testing via:
- Development server (`npm run dev`)
- Debug endpoints in `app/api/debug/`
- Browser console logs (extensive logging in auth-context)

## Known Issues & Workarounds

See documentation files:
- `CHECKOUT_AUTH_FIXES.md`: Checkout authentication flow fixes
- `CHECKOUT_ERROR_FIXES.md`: Error handling improvements
- `SUBSCRIPTION_FIX_GUIDE.md`: Subscription status sync issues
- `DATA_VALIDATION_GUIDE.md`: Data validation patterns
- `ZIPCODE_VALIDATION_IMPLEMENTATION.md`: Service area validation

## Deployment

Configured for Vercel deployment:
- Build command: `npm run build`
- Output directory: `.next`
- Environment variables must be set in Vercel dashboard
- Supabase webhooks should point to production domain