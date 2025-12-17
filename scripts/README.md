# Scripts Directory Guidelines

## ⚠️ CRITICAL SECURITY RULES

### NEVER commit scripts with:
1. Hardcoded credentials (Supabase keys, Stripe keys, API keys)
2. Production URLs with embedded secrets
3. Customer email addresses or PII
4. Database connection strings with passwords

### ✅ ALWAYS use:
1. Environment variables via `process.env`
2. Load from `.env.local` using dotenv
3. Pass sensitive data as command-line arguments
4. Use `--dryRun` flags for testing

## Template for Production Scripts

```typescript
import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load from .env.local (which is gitignored)
dotenv.config({ path: '.env.local.production' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Always implement dry-run mode
const dryRun = process.argv.includes('--dryRun')

async function runScript() {
  console.log(`Running in ${dryRun ? 'DRY RUN' : 'LIVE'} mode`)

  if (dryRun) {
    console.log('[DRY RUN] Would perform action...')
  } else {
    // Actual changes here
  }
}

runScript().catch(console.error)
```

## Running Production Scripts

1. Ensure `.env.local.production` exists and is up to date
2. Run with `npx tsx scripts/your-script.ts --dryRun` first
3. Review output carefully
4. Run without `--dryRun` only after verification

## Security Checklist

Before committing any script:
- [ ] No hardcoded URLs
- [ ] No hardcoded keys or secrets
- [ ] Uses environment variables
- [ ] Has dry-run mode
- [ ] No customer PII in code
- [ ] Reviewed by another team member
