# NouriPet Local Development Setup Guide

## Prerequisites

✅ **Node.js**: v23.11.0 (already installed)
✅ **npm**: v10.9.2 (already installed)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, React, Supabase, Stripe, and UI components.

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory with your configuration:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your actual keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tczvietgpixwonpqaotl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Where to find these keys:**

- **Supabase Keys**: [Project Settings → API](https://app.supabase.com/project/tczvietgpixwonpqaotl/settings/api)
  - URL: Found at the top
  - Anon Key: Under "Project API keys"
  - Service Role Key: Under "Project API keys" (keep secret!)

- **Stripe Keys**: [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/test/apikeys)
  - Use **Test mode** keys for local development
  - Webhook secret: Set up via Stripe CLI or webhook endpoint

### 3. Run the Development Server

```bash
npm run dev
```

The app will start on **http://localhost:3000**

### 4. Test Stripe Webhooks Locally (Optional)

To test Stripe payments locally, install the Stripe CLI:

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook secret starting with `whsec_` - add this to your `.env.local`

## Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Radix UI + Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Stripe
- **State**: React Context + SWR for data fetching

## Project Structure

```
app/                    # Next.js app router pages
├── api/               # API routes
├── dashboard/         # User dashboard
├── plan-builder/      # Meal plan wizard
├── checkout/          # Checkout flow
components/            # React components
├── ui/               # Radix UI primitives
├── plan-builder/     # Plan builder components
├── dashboard/        # Dashboard components
contexts/             # React contexts (auth, etc.)
lib/                  # Utilities and helpers
├── supabase/        # Supabase clients
├── stripe.ts        # Stripe integration
├── nutrition-calculator.ts  # Nutrition logic
public/              # Static assets
```

## Common Issues

### Port 3000 already in use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### TypeScript errors during build
The project is configured to ignore TypeScript errors during builds (see `next.config.mjs`). To check types manually:
```bash
npx tsc --noEmit
```

### Environment variables not loading
- Make sure your file is named `.env.local` (not `.env`)
- Restart the dev server after changing env variables
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser

## Database Setup

The local dev environment connects to the Supabase cloud database (project ref: `tczvietgpixwonpqaotl`). No local database setup is required.

If you need to run migrations or modify the schema, see the SQL scripts in the `scripts/` directory and run them in the Supabase SQL Editor.

## Need Help?

- Check `CLAUDE.md` for detailed project architecture
- Review existing documentation in `*_GUIDE.md` files
- See the [Next.js Documentation](https://nextjs.org/docs)
- See the [Supabase Documentation](https://supabase.com/docs)

---

Happy coding! 🐕
