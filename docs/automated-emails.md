# Automated Email System

This document describes the automated email triggers set up in the Nouripet app.

## Overview

The system automatically sends two types of emails:

1. **Welcome Emails** - Sent when new users create accounts
2. **Abandoned Plan Emails** - Sent when users start but don't complete their meal plan

## Architecture

All email automation runs directly in the **Supabase database** using:
- **PostgreSQL triggers** for real-time events (welcome emails)
- **pg_cron** scheduled jobs for periodic checks (abandoned plans)
- **pg_net** extension to make HTTP requests to Next.js API endpoints

## 1. Welcome Email Automation

### How It Works

1. User signs up via `supabase.auth.signUp()`
2. Existing trigger (`handle_new_user()`) creates a profile in the `profiles` table
3. New trigger (`on_profile_created_send_welcome`) fires after profile creation
4. Trigger calls `send_welcome_email_on_profile_create()` function
5. Function makes async HTTP POST to `/api/emails/welcome`
6. Email is sent via Resend API

### Implementation Details

**Trigger:** `on_profile_created_send_welcome` on `profiles` table
**Function:** `send_welcome_email_on_profile_create()`
**API Endpoint:** `https://nouripet.net/api/emails/welcome`

**Migration:** `supabase/migrations/[timestamp]_automated_welcome_and_abandoned_emails.sql`

### Testing

To test the welcome email flow:
1. Create a new account via signup form
2. Check Resend dashboard for email delivery
3. Check Supabase logs for trigger execution

## 2. Abandoned Plan Email Automation

### How It Works

1. **pg_cron** runs `send_abandoned_plan_emails()` every 6 hours
2. Function finds plans that:
   - Are in `draft` or `checkout` status
   - Were created >24 hours ago
   - Haven't received an abandoned email yet
   - Have a logged-in user (not guest)
3. For each abandoned plan:
   - Fetches user email, name, dog details, recipes
   - Makes async HTTP POST to `/api/emails/abandoned-plan`
   - Marks plan with `abandoned_email_sent: true` in snapshot field
4. Email is sent via Resend API with plan recovery link

### Implementation Details

**Cron Jobs:**
- `send-abandoned-plan-emails-frequent` - runs every 6 hours (`0 */6 * * *`)
- `send-abandoned-plan-emails` - runs daily at 10 AM UTC (`0 10 * * *`)

**Function:** `send_abandoned_plan_emails()`
**API Endpoint:** `https://nouripet.net/api/emails/abandoned-plan`

**Migration:** `supabase/migrations/[timestamp]_automated_welcome_and_abandoned_emails.sql`

### Testing

To test abandoned plan emails:

```sql
-- Manually trigger the function
SELECT send_abandoned_plan_emails();

-- Check which plans would qualify
SELECT
  p.id,
  p.user_id,
  p.status,
  p.created_at,
  (p.snapshot->>'abandoned_email_sent')::boolean as email_sent
FROM plans p
WHERE p.status IN ('draft', 'checkout')
AND p.created_at < (NOW() - INTERVAL '24 hours')
AND (p.snapshot->>'abandoned_email_sent')::boolean IS NOT TRUE
AND p.user_id IS NOT NULL;
```

## Email Templates

Both email types use the same template system:

**Template Generator:** `/lib/sales/email-template-html.ts`
**Functions:**
- `generateSalesEmailHTML()` - generates HTML version
- `generateSalesEmailText()` - generates plain text version

## API Endpoints

### `/api/emails/welcome`

**Method:** POST
**Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "emailId": "re_..."
}
```

### `/api/emails/abandoned-plan`

**Method:** POST
**Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "dogName": "Buddy",
  "dogWeight": "50",
  "dogBreed": "Golden Retriever",
  "recipes": ["Beef & Quinoa Harvest", "Lamb & Pumpkin Feast"],
  "price": 13800,
  "planId": "uuid-here"
}
```

## Monitoring

### Check Cron Jobs

```sql
-- View all scheduled cron jobs
SELECT * FROM cron.job;

-- View cron job execution history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### Check pg_net Requests

```sql
-- View recent HTTP requests made by triggers
SELECT * FROM net.http_request_queue
ORDER BY created DESC
LIMIT 20;
```

### Check Email Logs

Check the Resend dashboard at https://resend.com/emails for:
- Email delivery status
- Open rates
- Click rates
- Bounce/spam reports

## Troubleshooting

### Welcome emails not sending

1. Check if profile was created:
```sql
SELECT * FROM profiles WHERE id = 'user-id-here';
```

2. Check trigger execution in Supabase logs:
```
Filter: "Welcome email queued"
```

3. Verify API endpoint is accessible:
```bash
curl -X POST https://nouripet.net/api/emails/welcome \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

### Abandoned plan emails not sending

1. Check if cron jobs are running:
```sql
SELECT * FROM cron.job_run_details
WHERE jobname LIKE 'send-abandoned-plan%'
ORDER BY start_time DESC;
```

2. Manually trigger the function:
```sql
SELECT send_abandoned_plan_emails();
```

3. Check for qualifying plans:
```sql
SELECT
  p.*,
  u.email,
  pr.full_name
FROM plans p
JOIN auth.users u ON u.id = p.user_id
LEFT JOIN profiles pr ON pr.id = u.id
WHERE p.status IN ('draft', 'checkout')
AND p.created_at < (NOW() - INTERVAL '24 hours')
AND (p.snapshot->>'abandoned_email_sent')::boolean IS NOT TRUE;
```

## Configuration

### Change Email Frequency

To change how often abandoned plan emails are checked:

```sql
-- Update existing cron job schedule
SELECT cron.alter_job(
  job_id,
  schedule := '0 */12 * * *' -- New schedule (every 12 hours)
)
FROM cron.job
WHERE jobname = 'send-abandoned-plan-emails-frequent';
```

### Disable Email Automation

```sql
-- Disable welcome email trigger
ALTER TABLE profiles DISABLE TRIGGER on_profile_created_send_welcome;

-- Disable abandoned plan cron jobs
SELECT cron.unschedule('send-abandoned-plan-emails');
SELECT cron.unschedule('send-abandoned-plan-emails-frequent');
```

### Re-enable Email Automation

```sql
-- Enable welcome email trigger
ALTER TABLE profiles ENABLE TRIGGER on_profile_created_send_welcome;

-- Re-schedule abandoned plan emails
SELECT cron.schedule('send-abandoned-plan-emails', '0 10 * * *', 'SELECT send_abandoned_plan_emails();');
SELECT cron.schedule('send-abandoned-plan-emails-frequent', '0 */6 * * *', 'SELECT send_abandoned_plan_emails();');
```

## Performance Considerations

- **Welcome emails:** Triggered instantly on signup, minimal database impact
- **Abandoned plan emails:** Processes max 50 plans per run to avoid overload
- **pg_net requests:** All HTTP requests are async and non-blocking
- **Plan marking:** Each plan is marked after email is sent to prevent duplicates

## Security

- All functions use `SECURITY DEFINER` to run with elevated privileges
- API endpoints validate input and require proper authentication
- Email content is sanitized before sending
- User data is only accessed for the specific purpose of sending emails
