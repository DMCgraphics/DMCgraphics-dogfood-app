export function generateInvitationEmailHTML(data: {
  customerName: string
  inviteLink: string
  expiresAt: string
}) {
  const { customerName, inviteLink, expiresAt } = data
  const expirationDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>Welcome to NouriPet - Set Up Your Account</title>
<style type="text/css">
  body { margin:0; padding:0; background:#f6f7fb; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:#1f2937; }
  a { color:#0ea5e9; text-decoration:none; }
  .wrapper { width:100%; background:#f6f7fb; padding:24px 12px; }
  .container { max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
  .header { padding:20px 24px; background:#ffffff; border-bottom:1px solid #eef2f7; }
  .logo { width:70px; height:auto; display:block; }
  .hero { padding:28px 24px 8px; }
  .tag { display:inline-block; font-size:12px; letter-spacing:.5px; text-transform:uppercase; background:#dbeafe; color:#1e40af; padding:6px 10px; border-radius:999px; }
  h1 { margin:14px 0 6px; font-size:24px; line-height:1.3; }
  p { margin:12px 0; font-size:16px; line-height:1.6; color:#334155; }
  .card { background:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin:12px 0 4px; }
  .mini { font-size:13px; color:#475569; }
  .b { font-weight:600; color:#0f172a; }
  .btnbar { text-align:center; padding:18px 16px 26px; }
  .btn { background:#0ea5e9; color:#fff !important; padding:14px 22px; border-radius:10px; display:inline-block; font-weight:600; text-decoration:none; }
  .btn:hover { background:#0284c7; }
  .divider { height:1px; background:#eef2f7; margin:20px 0; }
  .footer { padding:16px 24px 28px; color:#6b7280; font-size:13px; }
  .expiry { background:#fef3c7; border:1px solid #fde68a; color:#92400e; padding:12px; border-radius:8px; margin:12px 0; font-size:14px; }
  @media (prefers-color-scheme: dark) {
    body { background:#0b1220; color:#e5e7eb; }
    .container { background:#0f172a; box-shadow:none; }
    .header { background:#0f172a; border-bottom:1px solid #111827; }
    .hero p, p { color:#cbd5e1; }
    .card { background:#111827; border-color:#1f2937; }
    .divider { background:#1f2937; }
    .footer { color:#9ca3af; }
    .tag { background:#1e3a8a; color:#bfdbfe; }
    .btn { background:#38bdf8; }
    .expiry { background:#3a2e10; border-color:#451a03; color:#fde68a; }
  }
</style>
</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <img class="logo" src="https://mcusercontent.com/b93f484f5e48093398a4a8238/images/110a6f3a-ebc8-564b-616c-30893c78ad11.png" alt="NouriPet">
    </div>

    <div class="hero">
      <span class="tag">Account Setup</span>
      <h1>Welcome${customerName ? ', ' + customerName : ''}! 🐾</h1>
      <p>You're receiving this email because you have an active NouriPet subscription. We've made it easier than ever to manage your deliveries, track your orders, and access exclusive features.</p>
      <p>Click the button below to set up your account and get started:</p>
    </div>

    <div class="btnbar">
      <a href="${inviteLink}" class="btn">Set Up My Account →</a>
    </div>

    <div class="card">
      <h2 style="margin:0 0 10px;font-size:18px;">What you'll get with your account</h2>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li style="margin:6px 0;">View and manage your active subscription</li>
        <li style="margin:6px 0;">Track upcoming deliveries and order history</li>
        <li style="margin:6px 0;">Update delivery preferences and contact information</li>
        <li style="margin:6px 0;">Pause, resume, or modify your subscription anytime</li>
        <li style="margin:6px 0;">Access nutritional information and feeding guides</li>
      </ul>
    </div>

    <div class="expiry">
      ⏰ <span class="b">This invitation link expires on ${expirationDate}.</span> Please set up your account before then to ensure uninterrupted access.
    </div>

    <div class="divider"></div>

    <div class="footer">
      If you didn't request this email or have questions, please contact us at <a href="mailto:support@nouripet.net">support@nouripet.net</a> or text <b>‪(203) 208-6186‬</b>.<br><br>
      NouriPet • Fresh, local meals for happier dogs 🐶
    </div>
  </div>
</div>
</body>
</html>`
}

export function generateInvitationEmailText(data: {
  customerName: string
  inviteLink: string
  expiresAt: string
}) {
  const { customerName, inviteLink, expiresAt } = data
  const expirationDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return `Welcome to NouriPet${customerName ? ', ' + customerName : ''}!

You're receiving this email because you have an active NouriPet subscription. We've made it easier than ever to manage your deliveries, track your orders, and access exclusive features.

Set up your account by clicking this link:
${inviteLink}

What you'll get with your account:
• View and manage your active subscription
• Track upcoming deliveries and order history
• Update delivery preferences and contact information
• Pause, resume, or modify your subscription anytime
• Access nutritional information and feeding guides

IMPORTANT: This invitation link expires on ${expirationDate}. Please set up your account before then to ensure uninterrupted access.

If you didn't request this email or have questions, please contact us at support@nouripet.net or text (203) 208-6186.

NouriPet • Fresh, local meals for happier dogs 🐶`
}
