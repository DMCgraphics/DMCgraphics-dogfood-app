# Raffle Page Setup & Management

## Overview
The raffle page is located at `/raffle` and is designed for the Harbor Point event. It collects entries for a giveaway and builds your email list.

## Features
✅ Mobile-optimized entry form (perfect for iPad at your booth)
✅ Collects: dog name, email, ZIP code, marketing opt-in
✅ Prevents duplicate entries by email
✅ UTM tracking (`utm_source=harborpoint_event`)
✅ Success confirmation with incentive messaging
✅ Easy enable/disable via environment variable

## Enable/Disable the Raffle

### To Enable (default):
In `.env.local`:
```bash
NEXT_PUBLIC_RAFFLE_ENABLED=true
```

### To Disable:
In `.env.local`:
```bash
NEXT_PUBLIC_RAFFLE_ENABLED=false
```

After changing the variable, restart your dev server:
```bash
npm run dev
```

For production (Vercel), update the environment variable in your Vercel dashboard.

## Accessing the Raffle Page

**Local**: http://localhost:3000/raffle
**Production**: https://www.nouripet.net/raffle

## Viewing Entries

### Via Supabase Dashboard:
1. Go to https://supabase.com
2. Open your NouriPet project
3. Navigate to: Table Editor → `event_signups`
4. Filter by `event_name = 'harbor_point_raffle'`

### Via SQL Query:
```sql
SELECT
  dog_name,
  email,
  zip_code,
  subscribe_to_updates,
  created_at
FROM event_signups
WHERE event_name = 'harbor_point_raffle'
ORDER BY created_at DESC;
```

### Export Entries (CSV):
In Supabase:
1. Run the query above
2. Click the "Download" button to export as CSV

## Data Collected

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dog_name` | Text | No | Dog's name (fun touch) |
| `email` | Text | Yes | Contact email |
| `zip_code` | Text | No | For delivery planning |
| `subscribe_to_updates` | Boolean | No | Marketing opt-in |
| `utm_source` | Text | Auto | Always "harborpoint_event" |
| `created_at` | Timestamp | Auto | Entry timestamp |

## Email Marketing

Everyone who checks "Send me updates" can be exported and added to your email marketing platform (Mailchimp, SendGrid, etc.).

**Recommended follow-up:**
1. Winner announcement email (within 1 week)
2. Exclusive discount email (to all entrants)
3. Welcome series for those who opted in

## Picking a Winner

```sql
-- Random winner from all entries
SELECT dog_name, email
FROM event_signups
WHERE event_name = 'harbor_point_raffle'
ORDER BY random()
LIMIT 1;
```

## Security Notes

- The `event_signups` table has Row Level Security (RLS) enabled
- Anyone can submit entries (needed for public form)
- Only authenticated users can read their own entries
- Duplicate emails are blocked automatically

## Customization

To customize for future events:
1. Update `event_name` in `/app/api/raffle/route.ts` (line 37)
2. Update page copy in `/app/raffle/page.tsx`
3. Update UTM source if needed

## Troubleshooting

**Problem**: Form shows "Raffle is currently not active"
**Solution**: Check `NEXT_PUBLIC_RAFFLE_ENABLED` is set to `true` in `.env.local`

**Problem**: "Email has already been entered"
**Solution**: This is expected behavior to prevent duplicate entries

**Problem**: Database error on submission
**Solution**: Verify the `event_signups` table exists in Supabase

## Production Checklist

Before going live:
- [ ] Set `NEXT_PUBLIC_RAFFLE_ENABLED=true` in Vercel
- [ ] Test form submission on mobile device
- [ ] Verify entries appear in Supabase
- [ ] Test iPad/tablet experience at booth
- [ ] Prepare follow-up email templates
- [ ] Set reminder to announce winner after event
