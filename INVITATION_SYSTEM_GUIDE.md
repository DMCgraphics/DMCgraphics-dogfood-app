# Subscription Invitation System - User Guide

## Overview

This system allows existing Stripe subscription customers to create accounts and claim their subscriptions. It provides a complete flow from CSV import to account creation and subscription linking.

## Features

✅ **CSV Import**: Upload Stripe subscription exports
✅ **Invitation Management**: Track invitation status (pending, sent, claimed, expired)
✅ **Email Sending**: Send branded invitation emails via Resend
✅ **Secure Signup**: Pre-filled, verified signup forms with invitation tokens
✅ **Automatic Linking**: Subscriptions automatically linked to new accounts
✅ **Admin Dashboard**: Full management interface for admins

---

## How to Use

### Step 1: Export Subscriptions from Stripe

1. Go to Stripe Dashboard → Subscriptions
2. Export active subscriptions as CSV
3. Ensure the CSV includes these columns:
   - `id` (subscription ID)
   - `Customer ID`
   - `Customer Email`
   - `Status`
   - `Amount`
   - `Interval`
   - `Customer Name`
   - `Created (UTC)` or `Start Date (UTC)`
   - `Current Period Start (UTC)`
   - `Current Period End (UTC)`

### Step 2: Import to Admin Dashboard

1. Navigate to **Admin → Invitations** (`/admin/invitations`)
2. Click "Upload Subscription CSV"
3. Select your CSV file
4. Review the preview (shows first 5 entries)
5. Click "Create X Invitations"

The system will:
- Parse only **active** subscriptions
- Generate secure tokens for each invitation
- Skip duplicates automatically
- Set expiration to 14 days from creation

### Step 3: Send Invitation Emails

**Option A: Send Individual Invitations**
1. Find the invitation in the table
2. Click the "Send" button
3. Email will be sent immediately

**Option B: Send Batch Invitations**
1. Click "Send All Pending (X)" button in the header
2. Confirm the batch send
3. All pending invitations will be emailed

**Option C: Share Link Manually**
1. Click "Copy Link" button for any pending/sent invitation
2. Share the link directly with the customer

### Step 4: Customer Signup Flow

When customers click the invitation link:

1. They're redirected to `/auth/signup?invite=TOKEN`
2. The signup form automatically:
   - Verifies the invitation token
   - Pre-fills their email (locked/read-only)
   - Pre-fills their name if available
   - Shows a welcome message about claiming their subscription
3. Customer enters:
   - Password
   - Confirms password
   - Accepts terms
4. On successful signup:
   - Account is created in Supabase Auth
   - Subscription is created and linked to their account
   - Invitation status changes to "claimed"
   - Customer is redirected to `/subscription/manage`

---

## Database Schema

### `subscription_invitations` Table

```sql
- id (uuid) - Primary key
- token (text, unique) - Secure invitation token
- email (text) - Customer email
- stripe_customer_id (text) - Stripe customer ID
- stripe_subscription_id (text) - Stripe subscription ID
- stripe_price_id (text) - Stripe price ID
- plan_name (text) - Plan/product name
- customer_name (text) - Customer's full name
- metadata (jsonb) - Additional metadata
- status (text) - pending | sent | claimed | expired | cancelled
- expires_at (timestamp) - Expiration date (14 days default)
- claimed_at (timestamp) - When claimed
- claimed_by_user_id (uuid) - User who claimed it
- created_at / updated_at (timestamp)
```

---

## API Endpoints

### Admin Endpoints (Require Admin Auth)

**POST `/api/admin/invitations/create`**
- Create single or batch invitations
- Body: `{ email, stripeCustomerId, stripeSubscriptionId, ... }`
- Or: `{ invitations: [{ ... }, { ... }] }`

**GET `/api/admin/invitations`**
- List all invitations
- Query params: `?status=pending&limit=100&offset=0`

**POST `/api/admin/invitations/send`**
- Send invitation emails
- Body: `{ invitationId }` - Send single
- Or: `{ batchSend: true, status: 'pending' }` - Send all pending

### Public Endpoints

**GET `/api/invitations/verify?token=xxx`**
- Verify invitation validity
- Returns: `{ valid, invitation: { email, customerName, expiresAt } }`

**POST `/api/invitations/claim`**
- Claim invitation and link subscription
- Body: `{ token, userId }`
- Creates subscription record for user

---

## Files Created/Modified

### New Files
```
app/api/admin/invitations/create/route.ts
app/api/admin/invitations/route.ts
app/api/admin/invitations/send/route.ts
app/api/invitations/verify/route.ts
app/api/invitations/claim/route.ts
app/admin/invitations/page.tsx
lib/email/invitation-template.ts
```

### Modified Files
```
app/auth/signup/page.tsx
components/auth/signup-form.tsx
app/admin/layout.tsx
```

### Database
```
supabase/migrations/TIMESTAMP_create_subscription_invitations.sql
```

---

## Testing the System

### Test with Your CSV

1. **Prepare test data**:
   - Use the provided `subscriptions.csv` with real Stripe data
   - Or create a test CSV with sample data

2. **Import invitations**:
   ```
   1. Go to http://localhost:3000/admin/invitations
   2. Upload the CSV
   3. Verify the preview shows correct data
   4. Click "Create Invitations"
   ```

3. **Send a test invitation**:
   ```
   1. Find an invitation in the list
   2. Click "Send" to email it
   3. Or click "Copy Link" to test manually
   ```

4. **Test signup flow**:
   ```
   1. Open the invitation link in incognito/private mode
   2. Verify email is pre-filled and locked
   3. Create account with password
   4. Verify redirect to /subscription/manage
   5. Check that subscription shows as active
   ```

5. **Verify in database**:
   ```sql
   -- Check invitation was claimed
   SELECT * FROM subscription_invitations
   WHERE email = 'test@example.com';

   -- Check subscription was created
   SELECT * FROM subscriptions
   WHERE user_id = 'USER_UUID';
   ```

---

## Environment Variables Required

```env
# Resend API key for sending emails
RESEND_API_KEY=re_xxxxx

# App URL for generating invitation links
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Supabase credentials (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Security Features

✅ **Token-based invitations**: Secure random 64-character tokens
✅ **Email verification**: Only the invited email can claim
✅ **Expiration**: 14-day default expiration
✅ **One-time use**: Invitations can only be claimed once
✅ **Admin-only creation**: Only admins can create/send invitations
✅ **Row Level Security**: Database policies enforce access control

---

## Troubleshooting

### Issue: Email not sending
- **Check**: `RESEND_API_KEY` is set correctly
- **Check**: Resend domain is verified
- **Check**: From address matches verified domain

### Issue: Invitation shows as expired
- **Solution**: Invitations expire after 14 days by default
- **Fix**: Create a new invitation or extend expiration in database

### Issue: "Email mismatch" error during signup
- **Cause**: User signing up with different email than invited
- **Solution**: User must use the exact email from invitation

### Issue: Subscription not appearing after signup
- **Check**: Look for errors in `/api/invitations/claim` logs
- **Check**: Verify invitation `claimed_at` and `claimed_by_user_id` are set
- **Check**: Verify `subscriptions` table has new record

### Issue: CSV import fails
- **Check**: CSV has required columns (id, Customer ID, Customer Email, Status)
- **Check**: Status column shows "active" for subscriptions to import
- **Fix**: Ensure CSV is properly formatted with headers

---

## Next Steps & Enhancements

Potential future improvements:

1. **Email Templates**: Customize email design per brand
2. **Reminder Emails**: Auto-send reminders for unclaimed invitations
3. **Invitation Analytics**: Track open rates, claim rates
4. **Bulk Actions**: Archive, cancel, or resend multiple invitations
5. **Custom Expiration**: Set different expiration per invitation
6. **Welcome Flow**: Onboarding tour after first login
7. **Migration Wizard**: Guide customers through claiming process

---

## Support

For issues or questions:
- Check server logs for detailed error messages
- Review Supabase logs for database issues
- Check Resend dashboard for email delivery status
- Contact development team for assistance

---

**System successfully implemented and ready for production use!** 🎉
