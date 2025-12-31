/**
 * Instagram newsletter email template
 * Generates HTML email with AI summary and post images
 * Follows NouriPet branding and responsive design patterns
 */

export interface NewsletterEmailData {
  recipientName: string
  monthName: string // "December 2025"
  aiSummary: string // Claude-generated summary
  posts: Array<{
    id: string
    media_url: string
    thumbnail_url?: string | null
    permalink: string
    caption?: string | null
  }>
  previewText?: string
}

/**
 * Generate complete HTML email for newsletter
 */
export function generateNewsletterHTML(data: NewsletterEmailData): string {
  const { recipientName, monthName, aiSummary, posts } = data

  // Generate post grid HTML
  const postsHTML = posts
    .map(
      (post) => `
    <div style="margin-bottom: 20px;">
      <a href="${post.permalink}" target="_blank" style="display: block; text-decoration: none;">
        <img
          src="${post.thumbnail_url || post.media_url}"
          alt="Instagram post"
          style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 8px; display: block;"
        />
      </a>
      ${
        post.caption
          ? `<p style="font-size: 14px; color: #6b7280; margin: 0; line-height: 1.4;">${truncateCaption(post.caption, 100)}</p>`
          : ""
      }
    </div>
  `
    )
    .join("\n")

  const bodyContent = `
    <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 1.3; color: #0f172a;">Your ${monthName} NouriPet Update 🐾</h1>

    <p style="margin: 12px 0; font-size: 16px; line-height: 1.6; color: #334155;">Hi ${recipientName},</p>

    <p style="margin: 12px 0; font-size: 16px; line-height: 1.6; color: #334155;">Here's what we've been sharing on Instagram this month:</p>

    <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0; border-radius: 8px;">
      ${aiSummary}
    </div>

    <h2 style="margin: 20px 0 12px; font-size: 20px; line-height: 1.3; color: #0f172a;">Recent Posts</h2>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin: 20px 0;">
      ${postsHTML}
    </div>

    <p style="text-align: center; margin-top: 32px;">
      <a href="https://instagram.com/nouripet" style="background: #0ea5e9; color: #fff !important; padding: 14px 28px; border-radius: 10px; display: inline-block; font-weight: 600; text-decoration: none; margin: 16px 0;">Follow Us on Instagram →</a>
    </p>

    <p style="margin: 12px 0; font-size: 16px; line-height: 1.6; color: #334155;">Thanks for being part of the NouriPet family!</p>

    <p style="margin: 12px 0; font-size: 16px; line-height: 1.6; color: #334155;">Best,<br>
    The NouriPet Team</p>
  `

  // Use NouriPet template structure
  return generateEmailHTML({
    bodyContent,
    footerNote:
      "You received this email because you opted in to NouriPet marketing updates. You can manage your email preferences in your account settings.",
  })
}

/**
 * Generate plain text version of newsletter
 */
export function generateNewsletterText(data: NewsletterEmailData): string {
  const { recipientName, monthName, aiSummary, posts } = data

  // Strip HTML tags from summary
  const plainSummary = aiSummary
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim()

  const postsList = posts
    .map(
      (post, idx) =>
        `${idx + 1}. ${post.permalink}${post.caption ? `\n   ${truncateCaption(post.caption, 80)}` : ""}`
    )
    .join("\n\n")

  return `Your ${monthName} NouriPet Update

Hi ${recipientName},

Here's what we've been sharing on Instagram this month:

${plainSummary}

Recent Posts:
${postsList}

Follow us: https://instagram.com/nouripet

Thanks for being part of the NouriPet family!

Best,
The NouriPet Team

---

Questions? We're here to help!
Reply to this email or contact us:

Email: support@nouripet.net
Phone: (203) 208-6186

NouriPet • Fresh, local meals for happier dogs 🐶

You received this email because you opted in to NouriPet marketing updates. You can manage your email preferences in your account settings.`
}

/**
 * Truncate caption to max length
 */
function truncateCaption(caption: string, maxLength: number): string {
  if (caption.length <= maxLength) return caption
  return caption.substring(0, maxLength).trim() + "..."
}

/**
 * Base HTML email template (NouriPet branded)
 */
function generateEmailHTML(data: { bodyContent: string; footerNote?: string }): string {
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
      ${footerNote ? `<div class="footer-note">${footerNote}</div>` : ""}

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
