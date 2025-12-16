# Environment Setup Guide

## Current Configuration

Your local development server now connects to the **DEV** database by default.

## Environment Files

- **`.env.local`** - Currently configured for DEV environment (wfjgcglyhnagnomdlgmd)
- **`.env.local.production`** - Backup of PRODUCTION environment settings (tczvietgpixwonpqaotl)
- **`.env.local.test`** - Alternative DEV environment settings

## Switching Between Environments

### To use DEV environment (current default):
```bash
# .env.local is already set to DEV
npm run dev
```

### To use PRODUCTION environment:
```bash
# Copy production settings to .env.local
cp .env.local.production .env.local

# Restart dev server
npm run dev
```

### To switch back to DEV:
```bash
# Copy dev settings to .env.local
cp .env.local.test .env.local

# OR manually edit .env.local to use:
# NEXT_PUBLIC_SUPABASE_URL=https://wfjgcglyhnagnomdlgmd.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# SUPABASE_SERVICE_ROLE_KEY=sb_secret_7uPMGe-czJ6cPMzmOLOzUw_L30sZOy2

# Restart dev server
npm run dev
```

## Database References

### DEV Database (wfjgcglyhnagnomdlgmd)
- URL: https://wfjgcglyhnagnomdlgmd.supabase.co
- Use this for local development and testing
- Safe to experiment with data

### PRODUCTION Database (tczvietgpixwonpqaotl)
- URL: https://tczvietgpixwonpqaotl.supabase.co
- Use this carefully - contains real customer data
- Only use when testing production issues

## Important Notes

- Always restart your dev server after changing `.env.local`
- The actual production deployment on Vercel uses environment variables configured in the Vercel dashboard
- MCP tools (`mcp__supabase-dev__*` and `mcp__supabase-live__*`) connect directly to their respective databases regardless of `.env.local`
