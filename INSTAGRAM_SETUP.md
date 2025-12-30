# Instagram Integration Setup Guide 

This guide will help you set up the Instagram Basic Display API to show your Instagram posts on the NouriPet homepage.

## Prerequisites

- An Instagram account (preferably Business or Creator account)
- A Facebook Developer account
- Access to your Instagram account settings

## Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Click "My Apps" → "Create App"
3. Select "Consumer" as the app type
4. Fill in the app details:
   - App name: "NouriPet Instagram Feed"
   - App contact email: your email
5. Click "Create App"

## Step 2: Add Instagram Basic Display

1. In your app dashboard, click "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Scroll down to "Basic Display" section
4. Click "Create New App"
5. Fill in:
   - Display Name: "NouriPet"
   - Valid OAuth Redirect URIs: `https://nouripet.net/api/instagram/auth/callback`
   - Deauthorize Callback URL: `https://nouripet.net/api/instagram/auth/deauthorize`
   - Data Deletion Request URL: `https://nouripet.net/api/instagram/auth/delete`
6. Click "Save Changes"

## Step 3: Add Instagram Test User

1. In the Instagram Basic Display settings, scroll to "User Token Generator"
2. Click "Add or Remove Instagram Testers"
3. This will open Instagram settings
4. On Instagram app (on your phone):
   - Go to Settings → Apps and Websites → Tester Invites
   - Accept the invite from your Facebook app
5. Back in Facebook Developer Console:
   - Refresh the page
   - You should now see your Instagram account
   - Click "Generate Token"
   - Copy the Access Token (you'll need this in Step 4)

## Step 4: Get a Long-Lived Access Token

The token from Step 3 expires in 1 hour. Convert it to a long-lived token (60 days):

```bash
curl -X GET "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret={YOUR_APP_SECRET}&access_token={SHORT_LIVED_TOKEN}"
```

Replace:
- `{YOUR_APP_SECRET}`: Found in Facebook App → Settings → Basic
- `{SHORT_LIVED_TOKEN}`: The token from Step 3

The response will contain:
```json
{
  "access_token": "IGQVJxxxxx...",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

## Step 5: Add Environment Variables

Add these to your Vercel environment variables (or `.env.local` for development):

```bash
# Instagram API
INSTAGRAM_ACCESS_TOKEN=IGQVJxxxxx...  # From Step 4
CRON_SECRET=your-random-secret-here    # Generate a random string
```

## Step 6: Initial Data Sync

After deploying with the environment variables:

1. Manually trigger the first sync:
```bash
curl -X POST "https://nouripet.net/api/instagram/refresh" \
  -H "x-cron-secret: your-random-secret-here"
```

2. Verify posts are cached:
```bash
curl "https://nouripet.net/api/instagram/posts"
```

3. Visit your homepage - you should see the Instagram grid!

## Step 7: Token Refresh

Long-lived tokens expire after 60 days. To refresh:

1. The system logs a warning when the token is close to expiration
2. Manually refresh using:
```bash
curl "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token={YOUR_TOKEN}"
```

3. Update the `INSTAGRAM_ACCESS_TOKEN` environment variable with the new token

## Automatic Updates

The cron job runs every 12 hours to sync new posts:
- Schedule: `0 */12 * * *` (every 12 hours at :00)
- Endpoint: `/api/cron/instagram-refresh`
- Managed by: `vercel.json` cron configuration

## Troubleshooting

### No posts showing on homepage
1. Check if posts are in database: `SELECT * FROM instagram_posts;`
2. Check API endpoint: `curl https://nouripet.net/api/instagram/posts`
3. Check browser console for JavaScript errors

### "Instagram API error" in logs
1. Verify `INSTAGRAM_ACCESS_TOKEN` is set correctly
2. Check if token has expired (60-day limit)
3. Ensure Instagram Test User is still active

### Cron job not running
1. Check Vercel dashboard → Project → Settings → Cron Jobs
2. Verify `CRON_SECRET` environment variable is set
3. Check deployment logs for errors

## API Rate Limits

Instagram Basic Display API limits:
- 200 requests per hour per user
- Our cron runs every 12 hours = 2 requests/day
- Well within limits ✅

## Future Enhancements

- Auto-refresh tokens before expiration
- Store tokens in database instead of environment variables
- Support for multiple Instagram accounts
- Instagram Stories integration
- Comment and like counts
