/**
 * Default email templates for sales team
 * These templates include merge fields and will be seeded into the database
 */

export interface EmailTemplate {
  name: string
  slug: string
  category: 'outreach' | 'nurture' | 'closing'
  subject: string
  html_body: string
  text_body: string
  description: string
  merge_fields: string[]
}

export const DEFAULT_SALES_TEMPLATES: EmailTemplate[] = [
  {
    name: "Initial Outreach",
    slug: "initial-outreach",
    category: "outreach",
    subject: "Hi {{lead_name}} - Fresh, Local Meals for {{dog_name}}",
    description: "First contact email for new leads from events or website",
    merge_fields: ["lead_name", "dog_name", "dog_breed", "rep_name", "rep_email"],
    html_body: `<h1>Hi {{lead_name}}! 👋</h1>

<p>I'm {{rep_name}} from NouriPet, and I wanted to personally reach out about {{dog_name}}'s nutrition.</p>

<p>We specialize in fresh, locally-prepared meals tailored specifically for your dog's needs. ${'{'}{{dog_breed ? `As a ${dog_breed} parent` : 'As a dog parent'}}${'}'}}, you know how important quality nutrition is for {{dog_name}}'s health and happiness.</p>

<div class="highlight">
  <strong>Why NouriPet?</strong>
  <ul style="margin:8px 0 0 20px;">
    <li>Fresh meals prepared locally and delivered to your door</li>
    <li>Customized portions based on {{dog_name}}'s size and needs</li>
    <li>Human-grade ingredients, no preservatives</li>
    <li>Flexible subscription - pause or adjust anytime</li>
  </ul>
</div>

<p>I'd love to help you create a personalized meal plan for {{dog_name}}. It takes just a few minutes, and I can answer any questions you might have.</p>

<p>Would you be available for a quick chat this week?</p>

<p>Looking forward to helping {{dog_name}} thrive!<br>
{{rep_name}}</p>`,
    text_body: `Hi {{lead_name}}!

I'm {{rep_name}} from NouriPet, and I wanted to personally reach out about {{dog_name}}'s nutrition.

We specialize in fresh, locally-prepared meals tailored specifically for your dog's needs. As a {{dog_breed}} parent, you know how important quality nutrition is for {{dog_name}}'s health and happiness.

Why NouriPet?
- Fresh meals prepared locally and delivered to your door
- Customized portions based on {{dog_name}}'s size and needs
- Human-grade ingredients, no preservatives
- Flexible subscription - pause or adjust anytime

I'd love to help you create a personalized meal plan for {{dog_name}}. It takes just a few minutes, and I can answer any questions you might have.

Would you be available for a quick chat this week?

Looking forward to helping {{dog_name}} thrive!
{{rep_name}}`
  },

  {
    name: "Follow-up",
    slug: "follow-up",
    category: "nurture",
    subject: "Following up about {{dog_name}}'s nutrition plan",
    description: "General follow-up email after initial contact",
    merge_fields: ["lead_name", "dog_name", "rep_name"],
    html_body: `<h1>Hi {{lead_name}},</h1>

<p>I wanted to follow up on our conversation about {{dog_name}}'s meal plan. I know you're busy, so I wanted to make this easy.</p>

<p>Here's what happens next if you'd like to move forward:</p>

<div class="highlight">
  <strong>Simple 3-Step Process:</strong>
  <ol style="margin:8px 0 0 20px;">
    <li><strong>Quick consultation</strong> - We'll chat about {{dog_name}}'s needs (5-10 minutes)</li>
    <li><strong>Custom plan</strong> - I'll create a personalized meal plan with pricing</li>
    <li><strong>Easy start</strong> - If it looks good, we'll schedule your first delivery</li>
  </ol>
</div>

<p>No pressure at all - I'm here to answer questions and help you make the best decision for {{dog_name}}.</p>

<p>When would be a good time to connect?</p>

<p>Best,<br>
{{rep_name}}</p>`,
    text_body: `Hi {{lead_name}},

I wanted to follow up on our conversation about {{dog_name}}'s meal plan. I know you're busy, so I wanted to make this easy.

Here's what happens next if you'd like to move forward:

Simple 3-Step Process:
1. Quick consultation - We'll chat about {{dog_name}}'s needs (5-10 minutes)
2. Custom plan - I'll create a personalized meal plan with pricing
3. Easy start - If it looks good, we'll schedule your first delivery

No pressure at all - I'm here to answer questions and help you make the best decision for {{dog_name}}.

When would be a good time to connect?

Best,
{{rep_name}}`
  },

  {
    name: "Quote Provided",
    slug: "quote-provided",
    category: "closing",
    subject: "Your personalized meal plan for {{dog_name}}",
    description: "Send after providing a custom quote to a lead",
    merge_fields: ["lead_name", "dog_name", "dog_breed", "dog_weight", "rep_name"],
    html_body: `<h1>Here's {{dog_name}}'s Custom Plan! 🎉</h1>

<p>Hi {{lead_name}},</p>

<p>Great chatting with you! As promised, I've put together a personalized meal plan for {{dog_name}}.</p>

<div class="highlight">
  <strong>Plan Details for {{dog_name}}:</strong>
  <ul style="margin:8px 0 0 20px;">
    <li>Breed: {{dog_breed}}</li>
    <li>Weight: {{dog_weight}} lbs</li>
    <li>Fresh, balanced meals delivered weekly</li>
    <li>Perfectly portioned for optimal health</li>
  </ul>
</div>

<p><strong>Pricing and next steps are in the quote I sent separately.</strong> If you have any questions about the plan, ingredients, or delivery schedule, I'm here to help!</p>

<p>Many of our customers notice positive changes in their dog's energy, coat quality, and overall health within the first few weeks. I'm excited for you to see {{dog_name}} thrive on fresh food!</p>

<p>Ready to get started? Just let me know and I'll set everything up for you.</p>

<p>Cheers,<br>
{{rep_name}}</p>`,
    text_body: `Here's {{dog_name}}'s Custom Plan!

Hi {{lead_name}},

Great chatting with you! As promised, I've put together a personalized meal plan for {{dog_name}}.

Plan Details for {{dog_name}}:
- Breed: {{dog_breed}}
- Weight: {{dog_weight}} lbs
- Fresh, balanced meals delivered weekly
- Perfectly portioned for optimal health

Pricing and next steps are in the quote I sent separately. If you have any questions about the plan, ingredients, or delivery schedule, I'm here to help!

Many of our customers notice positive changes in their dog's energy, coat quality, and overall health within the first few weeks. I'm excited for you to see {{dog_name}} thrive on fresh food!

Ready to get started? Just let me know and I'll set everything up for you.

Cheers,
{{rep_name}}`
  },

  {
    name: "Event Follow-up",
    slug: "event-follow-up",
    category: "outreach",
    subject: "Great meeting you at the event!",
    description: "Follow-up email after meeting lead at an in-person event",
    merge_fields: ["lead_name", "dog_name", "rep_name", "rep_email"],
    html_body: `<h1>Great meeting you! 🐾</h1>

<p>Hi {{lead_name}},</p>

<p>It was wonderful meeting you and learning about {{dog_name}} at the event! I loved hearing about your journey as a dog parent.</p>

<p>As we discussed, NouriPet offers fresh, locally-prepared meals that can make a real difference in {{dog_name}}'s health and energy. I wanted to follow up and see if you had any questions.</p>

<div class="highlight">
  <strong>Next Steps (totally optional!):</strong>
  <ul style="margin:8px 0 0 20px;">
    <li>Schedule a quick call to discuss {{dog_name}}'s specific needs</li>
    <li>Get a personalized meal plan with pricing</li>
    <li>Learn about our money-back guarantee and flexible delivery</li>
  </ul>
</div>

<p>No obligation - I just want to make sure you have all the information you need to make the best decision for {{dog_name}}.</p>

<p>Feel free to reply here or give me a call anytime!</p>

<p>Best,<br>
{{rep_name}}<br>
{{rep_email}}</p>`,
    text_body: `Great meeting you!

Hi {{lead_name}},

It was wonderful meeting you and learning about {{dog_name}} at the event! I loved hearing about your journey as a dog parent.

As we discussed, NouriPet offers fresh, locally-prepared meals that can make a real difference in {{dog_name}}'s health and energy. I wanted to follow up and see if you had any questions.

Next Steps (totally optional!):
- Schedule a quick call to discuss {{dog_name}}'s specific needs
- Get a personalized meal plan with pricing
- Learn about our money-back guarantee and flexible delivery

No obligation - I just want to make sure you have all the information you need to make the best decision for {{dog_name}}.

Feel free to reply here or give me a call anytime!

Best,
{{rep_name}}
{{rep_email}}`
  },

  {
    name: "Re-engagement",
    slug: "re-engagement",
    category: "nurture",
    subject: "Still thinking about {{dog_name}}?",
    description: "Re-engage leads who haven't responded in a while",
    merge_fields: ["lead_name", "dog_name", "rep_name"],
    html_body: `<h1>Hi {{lead_name}},</h1>

<p>I haven't heard from you in a while, so I wanted to check in about {{dog_name}}'s nutrition plan.</p>

<p>I totally understand if now isn't the right time - life gets busy! But I also don't want you to miss out if you're still interested.</p>

<div class="highlight">
  <strong>What our customers love most:</strong>
  <ul style="margin:8px 0 0 20px;">
    <li>"My dog's coat is shinier than ever!"</li>
    <li>"So convenient - one less thing to worry about"</li>
    <li>"I love knowing exactly what's in my dog's food"</li>
    <li>"The customer service is incredible"</li>
  </ul>
</div>

<p>If you'd like to revisit this, I'm happy to help. If not, no worries at all - I won't bother you again.</p>

<p>Either way, I hope {{dog_name}} is doing great!</p>

<p>Best wishes,<br>
{{rep_name}}</p>`,
    text_body: `Hi {{lead_name}},

I haven't heard from you in a while, so I wanted to check in about {{dog_name}}'s nutrition plan.

I totally understand if now isn't the right time - life gets busy! But I also don't want you to miss out if you're still interested.

What our customers love most:
- "My dog's coat is shinier than ever!"
- "So convenient - one less thing to worry about"
- "I love knowing exactly what's in my dog's food"
- "The customer service is incredible"

If you'd like to revisit this, I'm happy to help. If not, no worries at all - I won't bother you again.

Either way, I hope {{dog_name}} is doing great!

Best wishes,
{{rep_name}}`
  }
]
