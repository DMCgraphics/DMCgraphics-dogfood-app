# Environment Setup Guide

This guide explains how to switch between test and production environments in the NouriPet application.

## Overview

The application supports two environments:

- **TEST**: Isolated test database (`wfjgcglyhnagnomdlgmd`) + Stripe test mode
- **PRODUCTION**: Live database (`tczvietgpixwonpqaotl`) + Stripe live mode

## Quick Start

### Switch to Test Environment

```bash
npm run env:test
```

or

```bash
./scripts/switch-env.sh test
```

### Switch to Production Environment

```bash
npm run env:prod
```

or

```bash
./scripts/switch-env.sh production
```

### Check Current Environment

```bash
npm run env:status
```

or

```bash
./scripts/switch-env.sh status
```

## How It Works

### Environment Files

The project uses environment template files that are committed to git:

- `.env.local.test` - Test environment configuration (committed)
- `.env.local.production` - Production environment configuration (committed)
- `.env.local` - Active configuration (gitignored, auto-generated)

When you run a switch command, the script copies the appropriate template to `.env.local`.

### Automatic Backups

Before switching environments, the script automatically backs up your current `.env.local` to:

```
.env.local.backup.YYYYMMDD_HHMMSS
```

This allows you to recover previous configurations if needed.

## Environment Differences

### Test Environment

**Database:** `wfjgcglyhnagnomdlgmd` (test database)
- Separate data from production
- Safe to create/delete test data
- Full schema matching production

**Stripe:** Test mode
- Use test credit cards (e.g., `4242 4242 4242 4242`)
- No real charges
- Stripe webhook events go to test endpoints

**Use cases:**
- Local development
- Testing checkout flows
- Experimenting with new features
- CI/CD testing

### Production Environment

**Database:** `tczvietgpixwonpqaotl` (live database)
- Real customer data
- Production subscriptions
- Live orders

**Stripe:** Live mode
- Real credit card charges
- Actual customer payments
- Production webhooks

**Use cases:**
- Production debugging (use with caution)
- Vercel production deployment
- Hotfix testing with real data

## Best Practices

### 1. Default to Test Environment

Always use the test environment for development:

```bash
npm run env:test
npm run dev
```

### 2. Verify Before Switching

Check your current environment before making changes:

```bash
npm run env:status
```

### 3. Restart Dev Server

After switching environments, always restart your dev server:

```bash
# Stop server (Ctrl+C)
npm run dev
```

### 4. Production Safety

When using production environment:

- ⚠️ Be extremely careful with data mutations
- ⚠️ Verify Stripe keys are correct
- ⚠️ Test thoroughly in test environment first
- ⚠️ Never commit `.env.local` with production secrets

### 5. Team Workflow

For team members:

1. Clone the repository
2. Run `npm run env:test` to set up test environment
3. Add your Stripe test keys to `.env.local`
4. Start development with `npm run dev`

## Configuration Details

### Required Environment Variables

Both environments need these variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-key>

# Stripe
STRIPE_SECRET_KEY=<stripe-secret-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe-publishable-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
```

### Test Environment Keys

The test environment template includes:
- Supabase test database URL and keys (pre-configured)
- Placeholder for Stripe test keys (you need to add your own)

### Production Environment Keys

The production environment template includes:
- Supabase production database URL and keys (pre-configured)
- Placeholder for Stripe live keys (you need to add your own)

## Stripe Setup

### Getting Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Toggle to **Test mode** (top right)
3. Copy:
   - Secret key (starts with `sk_test_`)
   - Publishable key (starts with `pk_test_`)
4. For webhooks, use [Stripe CLI](https://stripe.com/docs/stripe-cli) or create a webhook endpoint

### Getting Live Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Toggle to **Live mode**
3. Copy:
   - Secret key (starts with `sk_live_`)
   - Publishable key (starts with `pk_live_`)
4. Set up production webhook endpoint
5. ⚠️ **Never commit these keys to git**

## Troubleshooting

### "Wrong database" errors

If you see data from the wrong environment:

1. Check current environment: `npm run env:status`
2. Switch to correct environment: `npm run env:test` or `npm run env:prod`
3. Restart dev server: `npm run dev`

### Script permission errors

If you get permission errors:

```bash
chmod +x scripts/switch-env.sh
```

### Stripe webhook issues

**Test environment:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Production environment:**
- Set up webhook in Stripe dashboard
- Point to your production URL: `https://yourdomain.com/api/webhooks/stripe`

### Environment not switching

1. Make sure template files exist:
   - `.env.local.test`
   - `.env.local.production`
2. Check you have proper permissions
3. Manually copy if needed: `cp .env.local.test .env.local`

## Vercel Deployment

### Setting Up Production on Vercel

1. Go to Vercel project settings
2. Navigate to "Environment Variables"
3. Add all variables from `.env.local.production`
4. Make sure to use **live** Stripe keys
5. Deploy

### Setting Up Preview Environments

For preview deployments (branches), you can:

1. Use test environment variables
2. Set `NEXT_PUBLIC_SUPABASE_URL` to test database
3. Use Stripe test keys

## Advanced: Custom Environments

You can create custom environment templates:

1. Create `.env.local.staging` with staging configuration
2. Update `scripts/switch-env.sh` to support staging:

```bash
staging)
    SOURCE_FILE="$PROJECT_ROOT/.env.local.staging"
    ENV_NAME="STAGING"
    ;;
```

3. Add npm script to `package.json`:

```json
"env:staging": "bash scripts/switch-env.sh staging"
```

## Security Checklist

- [ ] Never commit `.env.local` to git
- [ ] Keep test and production Stripe keys separate
- [ ] Rotate production keys regularly
- [ ] Use environment variables in Vercel, not hardcoded values
- [ ] Review `.gitignore` to ensure secrets aren't committed
- [ ] Enable Stripe webhook signature verification
- [ ] Use Supabase Row Level Security (RLS) policies

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run env:test` | Switch to test environment |
| `npm run env:prod` | Switch to production environment |
| `npm run env:status` | Show current environment |
| `npm run dev` | Start dev server (restart after switching) |

## Support

If you encounter issues:

1. Check this guide first
2. Verify environment with `npm run env:status`
3. Check `.env.local` exists and has correct values
4. Review Supabase and Stripe dashboards for connectivity issues
5. Check the backup files if you need to recover previous configuration
