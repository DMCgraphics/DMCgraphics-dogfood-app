/**
 * One-time script to send welcome and abandoned plan emails to Mark Ziegler and Vincent Carilli
 * Run with: npx tsx scripts/send-welcome-abandoned-emails.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { Resend } from "resend"
import { generateSalesEmailHTML, generateSalesEmailText } from "../lib/sales/email-template-html"

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in .env.local')
}

const resend = new Resend(process.env.RESEND_API_KEY)

interface UserData {
  email: string
  fullName: string
  dogName: string
  dogWeight: string
  dogBreed: string
  planId: string
  totalCents: number
  planType: string | null
  topperLevel: string | null
  recipes: { name: string; slug: string }[]
}

const users: UserData[] = [
  {
    email: "markeziegler@yahoo.com",
    fullName: "Mark Ziegler",
    dogName: "Lily",
    dogWeight: "75",
    dogBreed: "Vizsla",
    planId: "b7e0912a-cd59-42fb-a407-2e932cbbdb6f",
    totalCents: 3500,
    planType: "topper",
    topperLevel: "25",
    recipes: [{ name: "Beef & Quinoa Harvest", slug: "beef-quinoa-harvest" }],
  },
  {
    email: "vcarilli@majestickitchens.com",
    fullName: "Vincent Carilli",
    dogName: "Lulu",
    dogWeight: "24",
    dogBreed: "Anatolian Shepherd",
    planId: "dd315668-6235-4eb8-8843-59fd3017826f",
    totalCents: 9400,
    planType: null,
    topperLevel: null,
    recipes: [{ name: "Lamb & Pumpkin Feast", slug: "lamb-pumpkin-feast" }],
  },
]

async function sendWelcomeEmail(user: UserData) {
  const firstName = user.fullName.split(" ")[0]

  const bodyContent = `
    <h1>Welcome to Nouripet, ${firstName}! 🐾</h1>

    <p>Welcome to the Nouripet family! We're so glad you're here.</p>

    <p>Fresh, nutritious meals for your pup are just a few steps away. Here's what happens next:</p>

    <div class="highlight">
      <p style="margin: 8px 0;">✓ Tell us about your dog</p>
      <p style="margin: 8px 0;">✓ Choose your recipes</p>
      <p style="margin: 8px 0;">✓ Get a personalized meal plan</p>
      <p style="margin: 8px 0;">✓ Fresh food delivered every 2 weeks</p>
    </div>

    <p style="text-align: center;">
      <a href="https://nouripet.net/plan-builder" class="cta">Complete Your Plan →</a>
    </p>

    <p>Have questions? We're here to help!</p>

    <p>Happy feeding,<br>
    The Nouripet Team</p>

    <p><em>P.S. All our recipes are nutritionist-approved and made with human-grade ingredients. Your pup is going to love this.</em></p>
  `

  const html = generateSalesEmailHTML({
    subject: `Welcome to Nouripet, ${firstName}!`,
    bodyContent,
  })

  const text = generateSalesEmailText({
    bodyContent,
  })

  const { data, error } = await resend.emails.send({
    from: "Nouripet <hello@updates.nouripet.net>",
    to: [user.email],
    subject: `Welcome to Nouripet, ${firstName}! 🐾`,
    html,
    text,
    tags: [{ name: "type", value: "welcome" }],
  })

  if (error) {
    console.error(`❌ Failed to send welcome email to ${user.email}:`, error)
    return false
  }

  console.log(`✅ Welcome email sent to ${user.email} (ID: ${data?.id})`)
  return true
}

async function sendAbandonedPlanEmail(user: UserData) {
  const firstName = user.fullName.split(" ")[0]
  const priceFormatted = `$${(user.totalCents / 100).toFixed(2)}`
  const recipeList = user.recipes.map((r) => `• ${r.name}`).join("<br>")
  const planUrl = `https://nouripet.net/plan-builder?plan_id=${user.planId}`

  const planTypeText =
    user.planType === "topper"
      ? `${user.topperLevel}% Topper Plan`
      : "Full Meal Plan"

  const bodyContent = `
    <h1>We saved ${user.dogName}'s meal plan for you</h1>

    <p>Hi ${firstName},</p>

    <p>We noticed you started creating a meal plan for ${user.dogName} but didn't finish checkout. No worries – we saved everything for you!</p>

    <div class="highlight">
      <p style="margin: 8px 0;"><strong>Here's what you selected:</strong></p>
      <p style="margin: 8px 0;">🐕 <strong>${user.dogName}</strong> - ${user.dogWeight} lb ${user.dogBreed}</p>
      <p style="margin: 8px 0;"><strong>🥘 Recipes:</strong><br>${recipeList}</p>
      <p style="margin: 8px 0;">📋 <strong>Plan Type:</strong> ${planTypeText}</p>
      <p style="margin: 8px 0;">💰 <strong>${priceFormatted} every 2 weeks</strong></p>
    </div>

    <p style="text-align: center;">
      <a href="${planUrl}" class="cta">Complete ${user.dogName}'s Plan →</a>
    </p>

    <h2>Still deciding? Here's what makes Nouripet special:</h2>
    <p style="margin: 8px 0;">✓ Fresh, human-grade ingredients</p>
    <p style="margin: 8px 0;">✓ Nutritionist-formulated recipes</p>
    <p style="margin: 8px 0;">✓ No artificial preservatives</p>
    <p style="margin: 8px 0;">✓ Convenient local delivery</p>

    <p>Questions or concerns? Just reply to this email – we'd love to help.</p>

    <p>Best,<br>
    The Nouripet Team</p>

    <p><em>P.S. ${user.dogName} deserves the best. Let's make mealtime something special.</em></p>
  `

  const html = generateSalesEmailHTML({
    subject: `We saved ${user.dogName}'s meal plan for you`,
    bodyContent,
  })

  const text = generateSalesEmailText({
    bodyContent,
  })

  const { data, error } = await resend.emails.send({
    from: "Nouripet <hello@updates.nouripet.net>",
    to: [user.email],
    subject: `We saved ${user.dogName}'s meal plan for you`,
    html,
    text,
    tags: [
      { name: "type", value: "abandoned_plan" },
      { name: "plan_id", value: user.planId },
    ],
  })

  if (error) {
    console.error(`❌ Failed to send abandoned plan email to ${user.email}:`, error)
    return false
  }

  console.log(`✅ Abandoned plan email sent to ${user.email} (ID: ${data?.id})`)
  return true
}

async function main() {
  console.log("🚀 Starting email campaign for Mark Ziegler and Vincent Carilli...\n")

  for (const user of users) {
    console.log(`\n📧 Processing ${user.fullName} (${user.email})...`)

    // Send welcome email
    await sendWelcomeEmail(user)

    // Wait 2 seconds between emails to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Send abandoned plan email
    await sendAbandonedPlanEmail(user)

    // Wait 2 seconds before next user
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  console.log("\n\n✨ Email campaign complete!")
  console.log(`📊 Sent ${users.length * 2} emails total (${users.length} welcome + ${users.length} abandoned plan)`)
}

main().catch(console.error)
