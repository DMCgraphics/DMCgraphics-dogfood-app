/**
 * HTML email template generator for sales emails
 * Follows NouriPet branding and responsive design patterns
 */

interface SalesEmailHTMLData {
  subject: string
  bodyContent: string  // Main HTML content
  footerNote?: string  // Optional footer note
}

/**
 * Generate complete HTML email for sales outreach
 * Uses NouriPet branding and responsive design with dark mode support
 */
export function generateSalesEmailHTML(data: SalesEmailHTMLData): string {
  const { bodyContent, footerNote } = data

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>NouriPet</title>
<style type="text/css">
  body { margin:0; padding:0; background:#f6f7fb; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:#1f2937; }
  a { color:#0ea5e9; text-decoration:none; }
  .wrapper { width:100%; background:#f6f7fb; padding:24px 12px; }
  .container { max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
  .header { padding:20px 24px; background:#ffffff; border-bottom:1px solid #eef2f7; }
  .logo { width:70px; height:auto; display:block; }
  .content { padding:24px; }
  h1 { margin:0 0 16px; font-size:24px; line-height:1.3; color:#0f172a; }
  h2 { margin:20px 0 12px; font-size:20px; line-height:1.3; color:#0f172a; }
  p { margin:12px 0; font-size:16px; line-height:1.6; color:#334155; }
  .highlight { background:#f0f9ff; border-left:4px solid #0ea5e9; padding:16px; margin:16px 0; border-radius:8px; }
  .cta { background:#0ea5e9; color:#fff !important; padding:14px 28px; border-radius:10px; display:inline-block; font-weight:600; text-decoration:none; margin:16px 0; }
  .cta:hover { background:#0284c7; }
  .divider { height:1px; background:#eef2f7; margin:24px 0; }
  .footer { padding:16px 24px 28px; color:#6b7280; font-size:13px; line-height:1.5; }
  .footer-note { background:#fef3c7; border:1px solid #fde68a; color:#92400e; padding:12px; border-radius:8px; margin-bottom:16px; font-size:14px; }

  @media (prefers-color-scheme: dark) {
    body { background:#0b1220; color:#e5e7eb; }
    .container { background:#0f172a; box-shadow:none; }
    .header { background:#0f172a; border-bottom:1px solid #111827; }
    h1, h2 { color:#f1f5f9; }
    p { color:#cbd5e1; }
    .highlight { background:#1e293b; border-left-color:#38bdf8; }
    .divider { background:#1f2937; }
    .footer { color:#9ca3af; }
    .footer-note { background:#3a2e10; border-color:#451a03; color:#fde68a; }
    .cta { background:#38bdf8; }
  }
</style>
</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <img class="logo" src="https://mcusercontent.com/b93f484f5e48093398a4a8238/images/110a6f3a-ebc8-564b-616c-30893c78ad11.png" alt="NouriPet">
    </div>

    <div class="content">
      ${bodyContent}
    </div>

    <div class="divider"></div>

    <div class="footer">
      ${footerNote ? `<div class="footer-note">${footerNote}</div>` : ''}

      Questions? We're here to help! Reply to this email or contact us:<br>
      📧 <a href="mailto:support@nouripet.net">support@nouripet.net</a><br>
      📞 <b>(203) 208-6186</b><br><br>

      NouriPet • Fresh, local meals for happier dogs 🐶
    </div>
  </div>
</div>
</body>
</html>`
}

/**
 * Generate plain text version of sales email
 */
export function generateSalesEmailText(data: {
  bodyContent: string
  footerNote?: string
}): string {
  const { bodyContent, footerNote } = data

  // Strip HTML tags for plain text version
  const plainBody = bodyContent
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim()

  return `${plainBody}

${footerNote ? `${footerNote}\n\n` : ''}---

Questions? We're here to help!
Reply to this email or contact us:

Email: support@nouripet.net
Phone: (203) 208-6186

NouriPet • Fresh, local meals for happier dogs 🐶
`
}
