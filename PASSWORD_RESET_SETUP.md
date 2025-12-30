# Password Reset Setup Guide

## What Was Created

I've set up a complete password reset flow with the following pages:

1. **Forgot Password Page** (`/auth/forgot-password`)
   - Users enter their email
   - Sends a reset link via email
   - Shows confirmation message

2. **Reset Password Page** (`/auth/reset-password`)
   - Users land here after clicking the email link
   - Enter and confirm new password
   - Validates session before allowing reset

3. **Updated Login Form**
   - Added "Forgot password?" link above the password field

4. **Updated Auth Callback**
   - Properly handles password recovery redirects

## Supabase Configuration

### 1. Email Templates (Already configured via SMTP)

Since you've already set up SMTP, verify the email template in Supabase:

1. Go to **Authentication** → **Email Templates**
2. Select **Reset Password** template
3. Verify the template includes a link like:
   ```
   {{ .SiteURL }}/auth/callback?type=recovery&code={{ .Token }}
   ```

### 2. Site URL Configuration

In your Supabase project:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:3000` (for dev)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/reset-password`
   - `http://localhost:3000/**` (wildcard for all routes)

## Testing the Flow

### Step 1: Request Password Reset
```bash
# Visit the forgot password page
http://localhost:3000/auth/forgot-password

# Or click "Forgot password?" on the login page
http://localhost:3000/auth/login
```

### Step 2: Check Email
- You should receive a password reset email
- Click the link in the email
- The link will look like: `http://localhost:3000/auth/callback?type=recovery&code=...`

### Step 3: Reset Password
- You'll be redirected to `/auth/reset-password`
- Enter your new password (minimum 6 characters)
- Confirm the password
- Click "Reset Password"

### Step 4: Login
- After successful reset, you'll be redirected to the login page
- Login with your new password

## Troubleshooting

### "Invalid or expired reset link"
**Cause**: The reset token expired (default: 1 hour) or was already used
**Solution**: Request a new reset link from `/auth/forgot-password`

### Email link doesn't redirect to reset page
**Cause**: Site URL or redirect URLs not configured in Supabase
**Solution**:
1. Check Supabase **Authentication** → **URL Configuration**
2. Ensure Site URL matches your app's URL
3. Add `/auth/callback` and `/auth/reset-password` to redirect URLs

### "No session found" on reset page
**Cause**: The auth callback didn't properly exchange the code for a session
**Solution**:
1. Check the callback route logs
2. Verify the email template has the correct callback URL format
3. Make sure the `type=recovery` parameter is in the URL

### Email not sending
**Cause**: SMTP not properly configured
**Solution**:
1. Go to Supabase **Project Settings** → **Auth**
2. Verify SMTP credentials are correct
3. Test by sending a test email from Supabase dashboard

## Production Setup

When deploying to production:

1. Update Site URL in Supabase to your production domain:
   - `https://www.nouripet.net`

2. Add production redirect URLs:
   - `https://www.nouripet.net/auth/callback`
   - `https://www.nouripet.net/auth/reset-password`
   - `https://www.nouripet.net/**`

3. Update the redirect URL in the forgot-password page if needed (it currently uses `window.location.origin` which auto-detects)

## Security Notes

- Reset links expire after 1 hour (Supabase default)
- Each reset link can only be used once
- Minimum password length: 6 characters (can be changed in the reset page)
- Password recovery requires email verification
- Sessions are validated before allowing password reset

## File Locations

- Forgot Password Page: `app/auth/forgot-password/page.tsx`
- Reset Password Page: `app/auth/reset-password/page.tsx`
- Login Form (with link): `components/auth/login-form.tsx`
- Auth Callback: `app/auth/callback/route.ts`
