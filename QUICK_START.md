# Quick Start - Test Environment Setup

## What I've Done For You ✅

1. ✅ Created complete database schema migration (`test-database-schema.sql`)
2. ✅ Created test data script with recipe templates (`test-database-data.sql`)
3. ✅ Created test environment config (`.env.local.test`)
4. ✅ Created production environment backup (`.env.local.production`)
5. ✅ Updated `.mcp.json` with test database connection
6. ✅ Created comprehensive setup guide (`TEST_DATABASE_SETUP.md`)

## What You Need To Do 📝

### 1. Set Up Database (5 minutes)

```bash
# Open your test database SQL editor
https://supabase.com/dashboard/project/wfjgcglyhnagnomdlgmd/sql/new

# Copy & paste test-database-schema.sql
# Click RUN
# ✅ 28 tables created!
```

### 2. Create Stripe Test Products (10 minutes)

Go to https://dashboard.stripe.com/test/products and create **16 products**:

- 4 recipes: Beef, Lamb, Turkey, Chicken
- 4 sizes each: Small ($29), Medium ($47), Large ($69), XL ($87)
- Set billing to "Weekly recurring"
- **Copy each price ID** (starts with `price_`)

### 3. Update Database with Price IDs (2 minutes)

```bash
# Edit test-database-data.sql
# Replace 'price_TEST_beef_small' with your real test price IDs
# Run in SQL editor
```

### 4. Configure Environment (1 minute)

```bash
# Get Stripe TEST keys from:
https://dashboard.stripe.com/test/apikeys

# Update .env.local.test with your Stripe keys
# Copy to .env.local
cp .env.local.test .env.local

# Restart dev server
npm run dev
```

### 5. Test It! 🎉

```bash
# Visit your app
http://localhost:3000

# Create account, build plan, checkout
# Use test card: 4242 4242 4242 4242

# ✅ Checkout should work!
```

## Switching Environments

### Use TEST (recommended for development):
```bash
cp .env.local.test .env.local
npm run dev
```

### Use PRODUCTION:
```bash
cp .env.local.production .env.local
npm run dev
```

## Files Created

| File | Purpose |
|------|---------|
| `test-database-schema.sql` | Complete schema for test DB |
| `test-database-data.sql` | Sample data + price IDs |
| `.env.local.test` | Test environment config |
| `.env.local.production` | Production config backup |
| `TEST_DATABASE_SETUP.md` | Detailed setup guide |
| `QUICK_START.md` | This file |

## Need Help?

1. Read `TEST_DATABASE_SETUP.md` for detailed instructions
2. Check Stripe test mode: https://stripe.com/docs/testing
3. Check Supabase docs: https://supabase.com/docs

## Summary

You now have:
- ✅ Complete test database (empty, ready to use)
- ✅ All migration scripts ready
- ✅ Environment configs for test & production
- ✅ Easy switching between environments

**Next**: Follow the 5 steps above to complete setup! Should take ~20 minutes total.

---

**Current Status**: Your production database is untouched and safe. Test database is ready for setup.
