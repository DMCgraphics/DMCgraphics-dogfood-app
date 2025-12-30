# Custom Email Setup Guide 

This guide explains how to set up custom email authentication for your NouriPet application using your own domain instead of Supabase's default emails.

## Overview

By default, Supabase sends emails from their domain (`noreply@mail.app.supabase.io`). To use your own domain (e.g., `noreply@nouripet.com`), you need to configure a custom SMTP provider.

## Recommended Email Services

### 1. **Resend** (Recommended)
- Modern, developer-friendly API
- Generous free tier (3,000 emails/month)
- React Email template support
- Easy setup with Supabase
- Great deliverability

**Pricing:** Free for 3,000 emails/month, then $20/month for 50,000 emails

### 2. **SendGrid**
- Industry standard
- 100 free emails/day
- Reliable infrastructure
- Good analytics

**Pricing:** Free tier: 100 emails/day, Pro: $19.95/month for 50,000 emails

### 3. **Postmark**
- Excellent deliverability
- Focus on transactional emails
- Clean interface

**Pricing:** Free tier: 100 emails/month, $15/month for 10,000 emails

### 4. **AWS SES**
- Most cost-effective for high volume
- $0.10 per 1,000 emails
- Requires more setup

**Pricing:** $0.10 per 1,000 emails

## Setup Guide

### Option 1: Resend (Recommended for NouriPet)

#### Step 1: Create Resend Account

1. Go to https://resend.com
2. Sign up for a free account
3. Verify your email

#### Step 2: Add and Verify Your Domain

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `nouripet.com`)
4. Add the DNS records to your domain provider:

```
Type: TXT
Name: resend._domainkey
Value: [provided by Resend]

Type: MX
Name: @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
```

5. Wait for verification (usually 5-15 minutes)

#### Step 3: Get SMTP Credentials

1. In Resend dashboard, go to **SMTP**
2. Click **Generate SMTP Credentials**
3. Save these credentials:
   - **Host:** `smtp.resend.com`
   - **Port:** `465` (SSL) or `587` (TLS)
   - **Username:** `resend`
   - **Password:** `re_***` (your API key)

#### Step 4: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Auth** → **SMTP Settings**
3. Enable **Custom SMTP**
4. Enter your credentials:

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP Username: resend
SMTP Password: re_your_api_key_here
Sender Email: noreply@nouripet.com
Sender Name: NouriPet
```

5. Click **Save**

#### Step 5: Test Your Setup

1. Go to **Authentication** → **Email Templates**
2. Click **Send test email**
3. Check your inbox for the test email from `noreply@nouripet.com`

### Option 2: SendGrid

#### Step 1: Create SendGrid Account

1. Go to https://sendgrid.com
2. Sign up for a free account
3. Complete sender verification

#### Step 2: Verify Domain

1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow wizard to add DNS records
4. Wait for verification

#### Step 3: Create API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it "Supabase SMTP"
4. Choose **Full Access** or **Restricted Access** (with Mail Send permission)
5. Save the API key

#### Step 4: Get SMTP Credentials

- **Host:** `smtp.sendgrid.net`
- **Port:** `587` (TLS) or `465` (SSL)
- **Username:** `apikey` (literally the word "apikey")
- **Password:** Your API key from Step 3

#### Step 5: Configure Supabase

Follow Step 4 from Resend instructions above, using SendGrid credentials.

### Option 3: AWS SES

#### Step 1: Set Up AWS SES

1. Go to AWS Console → SES
2. Verify your domain
3. Request production access (starts in sandbox)
4. Create SMTP credentials

#### Step 2: Get SMTP Credentials

1. In SES, go to **SMTP Settings**
2. Click **Create SMTP Credentials**
3. Save the username and password

#### Step 3: Configure Supabase

- **Host:** `email-smtp.[region].amazonaws.com` (e.g., `email-smtp.us-east-1.amazonaws.com`)
- **Port:** `587` (TLS)
- **Username:** Your SMTP username
- **Password:** Your SMTP password
- **Sender:** `noreply@yourdomain.com`

## Customizing Email Templates

### Access Email Templates

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. You'll find templates for:
   - Confirm signup
   - Magic Link
   - Change Email
   - Reset Password

### Template Variables

Available variables you can use:

```
{{ .ConfirmationURL }}  - Confirmation link
{{ .Token }}            - Verification token
{{ .TokenHash }}        - Token hash
{{ .SiteURL }}          - Your app URL
{{ .RedirectTo }}       - Redirect URL after confirmation
```

### Example: Branded Confirmation Email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Confirm Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px;">
    <img src="https://yourdomain.com/logo.png" alt="NouriPet" style="height: 60px;">
  </div>

  <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; margin: 20px 0;">
    <h1 style="color: #2d3748; margin-top: 0;">Welcome to NouriPet! 🐕</h1>

    <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
      Thanks for signing up! Click the button below to confirm your email address and start creating personalized meal plans for your furry friend.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background: #4f46e5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Confirm Email Address
      </a>
    </div>

    <p style="color: #718096; font-size: 14px; margin-top: 30px;">
      If you didn't create an account with NouriPet, you can safely ignore this email.
    </p>
  </div>

  <div style="text-align: center; color: #a0aec0; font-size: 12px; margin-top: 30px;">
    <p>NouriPet - Fresh, Healthy Meals for Your Best Friend</p>
    <p>
      <a href="https://nouripet.com" style="color: #4f46e5; text-decoration: none;">Website</a> •
      <a href="https://nouripet.com/support" style="color: #4f46e5; text-decoration: none;">Support</a>
    </p>
  </div>
</body>
</html>
```

### Example: Password Reset Email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px;">
    <img src="https://yourdomain.com/logo.png" alt="NouriPet" style="height: 60px;">
  </div>

  <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; margin: 20px 0;">
    <h1 style="color: #2d3748; margin-top: 0;">Reset Your Password</h1>

    <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
      We received a request to reset your password. Click the button below to create a new password.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background: #4f46e5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Reset Password
      </a>
    </div>

    <p style="color: #e53e3e; font-size: 14px; background: #fff5f5; padding: 12px; border-left: 3px solid #e53e3e; border-radius: 4px;">
      <strong>Security Note:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email and your password will remain unchanged.
    </p>
  </div>

  <div style="text-align: center; color: #a0aec0; font-size: 12px; margin-top: 30px;">
    <p>NouriPet - Fresh, Healthy Meals for Your Best Friend</p>
  </div>
</body>
</html>
```

## Advanced: React Email Templates with Resend

If using Resend, you can use React Email for more maintainable templates:

### Step 1: Install React Email

```bash
npm install react-email @react-email/components
```

### Step 2: Create Email Component

Create `emails/confirmation-email.tsx`:

```tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface ConfirmationEmailProps {
  confirmationUrl: string;
  userEmail: string;
}

export default function ConfirmationEmail({
  confirmationUrl,
  userEmail,
}: ConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your email to start using NouriPet</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://yourdomain.com/logo.png"
            width="60"
            height="60"
            alt="NouriPet"
            style={logo}
          />
          <Heading style={heading}>Welcome to NouriPet! 🐕</Heading>
          <Text style={paragraph}>
            Thanks for signing up with {userEmail}! Click the button below to confirm your email address.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={confirmationUrl}>
              Confirm Email Address
            </Button>
          </Section>
          <Text style={paragraph}>
            If you didn't create an account, you can safely ignore this email.
          </Text>
          <Text style={footer}>
            NouriPet - Fresh, Healthy Meals for Your Best Friend
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logo = {
  margin: '0 auto',
};

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
  padding: '17px 0 0',
};

const paragraph = {
  fontSize: '18px',
  lineHeight: '1.4',
  color: '#484848',
};

const buttonContainer = {
  padding: '27px 0 27px',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '4px',
  color: '#fff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '14px 7px',
};

const footer = {
  color: '#9ca299',
  fontSize: '14px',
  marginTop: '60px',
};
```

### Step 3: Build & Use Templates

```bash
npx email dev  # Preview templates locally
npx email export  # Export to HTML
```

Then copy the HTML output to Supabase email templates.

## Configuration for Both Environments

### Test Environment
- Use a subdomain: `test@nouripet.com` or `noreply@test.nouripet.com`
- Lower rate limits
- Free tier is usually sufficient

### Production Environment
- Use main domain: `noreply@nouripet.com`
- Higher rate limits
- Monitor delivery rates
- Set up SPF, DKIM, and DMARC records

## DNS Records Checklist

To ensure good email deliverability, add these DNS records:

### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

### DKIM Record
```
Type: TXT
Name: resend._domainkey
Value: [Provided by your email service]
```

### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@nouripet.com
```

## Testing Your Email Setup

### 1. Test via Supabase Dashboard
1. Go to **Auth** → **Email Templates**
2. Click **Send test email**
3. Check your inbox

### 2. Test via Your App
1. Create a new test account
2. Check confirmation email arrives
3. Verify sender is your domain
4. Click confirmation link

### 3. Test Deliverability
Use tools like:
- https://www.mail-tester.com
- https://mxtoolbox.com/deliverability
- Check spam folder

## Troubleshooting

### Emails Not Sending
1. Check SMTP credentials are correct
2. Verify domain is verified in email service
3. Check Supabase logs: **Auth** → **Logs**
4. Ensure port is correct (587 for TLS, 465 for SSL)

### Emails Going to Spam
1. Add SPF, DKIM, DMARC records
2. Warm up your domain (start with low volume)
3. Use a professional email template
4. Avoid spam trigger words

### Wrong Sender Address
1. Verify sender email in Supabase SMTP settings
2. Check email service allows that sender
3. Some services require verified sender addresses

## Cost Estimates

For NouriPet with ~1,000 signups/month:

| Service | Monthly Cost | Volume |
|---------|-------------|--------|
| Resend | Free | Up to 3,000 emails |
| SendGrid | Free | Up to 3,000 emails |
| Postmark | $15 | 10,000 emails |
| AWS SES | $0.10 | 1,000 emails |

**Recommendation:** Start with Resend free tier, upgrade as you grow.

## Next Steps

1. Choose your email service provider
2. Create account and verify domain
3. Configure SMTP in Supabase
4. Customize email templates
5. Test thoroughly before going live
6. Monitor delivery rates

## Resources

- [Supabase SMTP Documentation](https://supabase.com/docs/guides/auth/auth-smtp)
- [Resend Documentation](https://resend.com/docs)
- [SendGrid SMTP Guide](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [AWS SES Developer Guide](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)
- [React Email](https://react.email)
