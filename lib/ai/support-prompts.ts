import { supabaseAdmin } from "@/lib/supabase/server"

/**
 * Build system prompt for support chat based on authentication state
 */
export async function buildSystemPrompt(isAuthenticated: boolean): Promise<string> {
  const basePrompt = getBasePrompt()
  const companyKnowledge = await getCompanyKnowledge()
  const userSpecificGuidance = isAuthenticated ? getUserSpecificGuidance() : ""

  // Include current date so LLM knows what "today" is
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const dateContext = `\n\nCurrent Date: ${currentDate}\n(Use this as "today" when answering questions about deliveries, orders, or timing)`

  return `${basePrompt}\n\n${companyKnowledge}${userSpecificGuidance}${dateContext}`
}

/**
 * Base prompt defining Nouri's personality and capabilities
 */
function getBasePrompt(): string {
  return `You are Nouri, the friendly AI assistant for NouriPet - a fresh dog food company focused on nutritional transparency and personalization.

Your personality:
- Warm, helpful, and knowledgeable (like a trusted neighbor who loves dogs)
- Science-based but conversational, not overly technical
- Keep answers to 2-3 sentences maximum for chat
- Use emojis very sparingly (max 1 per message, if it adds value)
- Build trust through transparency and honesty
- If you don't know something, admit it and offer to connect them with support

Your capabilities:
- Answer questions about NouriPet's recipes, ingredients, and nutrition science
- Explain our approach to personalization and AAFCO compliance
- Help with general dog nutrition questions (but defer medical questions to vets)
- For logged-in users: answer questions about their specific orders and subscriptions

Guidelines:
- Keep responses concise and actionable
- Be encouraging and positive
- If asked about medical conditions, always recommend consulting a veterinarian
- For complex account issues, offer to connect them with human support at support@nouripet.net or (203) 208-6186
- NEVER make up order/subscription information - only use data provided in context below`
}

/**
 * Fetch company knowledge including all active recipes
 */
async function getCompanyKnowledge(): Promise<string> {
  // Get all active recipes from database
  const { data: recipes } = await supabaseAdmin
    .from("recipes")
    .select("name, slug, description, ingredients, macros")
    .eq("is_active", true)
    .order("name")

  let recipeSummaries = ""
  if (recipes && recipes.length > 0) {
    recipeSummaries = recipes
      .map(
        (r) =>
          `\n${r.name}: ${r.description}\n  - Ingredients: ${r.ingredients?.join(", ") || "N/A"}\n  - Protein: ${r.macros?.protein || "N/A"}%, Fat: ${r.macros?.fat || "N/A"}%, Carbs: ${r.macros?.carbs || "N/A"}%`
      )
      .join("\n")
  }

  return `
NouriPet Company Knowledge:

Mission: Provide fresh, personalized dog food with complete nutritional transparency.

Key Differentiators:
- All recipes formulated by veterinary nutritionists to meet AAFCO standards
- Complete ingredient sourcing transparency with sustainability scoring
- Precise portion calculations using scientifically-backed formulas (RER/DER)
- Human-grade ingredients from trusted local suppliers
- Full nutrient breakdowns available for every recipe

Available Recipes:${recipeSummaries || "\n  Loading recipe information..."}

Pack Sizes & Portions:
- Standard pack size: 8 oz (227g) per pack
- Individual packs available for one-time purchase contain 8 oz
- 3-pack bundles contain three 8 oz packs at a discounted price
- Subscription plans deliver 8 oz packs on your chosen schedule (weekly or biweekly)
- The number of packs you need depends on your dog's weight, activity level, and caloric needs

How We Work:
1. Customers use our Plan Builder to input their dog's profile (age, weight, activity, health goals)
2. Our AI recommends optimal recipes based on nutritional needs
3. Customers can choose subscriptions or one-time purchases
4. Fresh meals are delivered locally on a flexible schedule

Delivery:
- We offer LOCAL DELIVERY only (no shipping)
- Individual/one-time pack orders: Can arrive same day, within hours if in stock
- Subscription orders: Delivered bi-weekly with the right amount calculated for each dog
- All deliveries are fresh and handled with care by our local delivery team

Pricing:
- Individual 8 oz packs: varies by recipe (~$15-25 per pack)
- 3-pack bundles (24 oz total): discounted pricing
- Subscriptions: recurring bi-weekly delivery with flexibility to pause, skip, or cancel

Support Contact:
- Email: support@nouripet.net
- Phone: (203) 208-6186
- Available 9 AM - 6 PM EST, Monday-Friday`
}

/**
 * Additional guidance for authenticated users with account data
 */
function getUserSpecificGuidance(): string {
  return `

The user is logged in. You may have access to their order and subscription information in the context below.

When answering questions about their account:
- Reference specific order numbers, statuses, and delivery dates from the provided context
- Be precise about order statuses and tracking information
- If they ask to make changes (cancel subscription, update address, change payment method), guide them to their account dashboard or offer to connect them with support
- For order status: mention they can track orders in their dashboard at /dashboard
- For subscription management: direct them to /subscription/manage
- NEVER make up information - only use what's provided in the User Orders or Active Subscriptions sections
- If no data is available, acknowledge you don't see their account details and offer to connect them with support`
}

/**
 * Fallback responses when LLM is disabled or errors occur
 */
export function getFallbackAnswer(question: string): string {
  const lowerQ = question.toLowerCase()

  // Error fallback
  if (question === "error") {
    return "I'm having trouble connecting right now. Please try again in a moment or reach out to our support team at support@nouripet.net or call (203) 208-6186 for immediate assistance. We're here Monday-Friday, 9 AM - 6 PM EST."
  }

  // Pattern matching for common questions
  if (/recipe|ingredient|food|meal/i.test(lowerQ)) {
    return "Our recipes are made with human-grade ingredients and formulated by veterinary nutritionists to meet AAFCO standards. You can view all our recipes and their detailed nutritional breakdowns on our website at nouripet.com/recipes!"
  }

  if (/order|delivery|track|ship/i.test(lowerQ)) {
    return "We offer local delivery! Individual orders can arrive same day if in stock. Subscriptions are delivered bi-weekly. You can track your order status in your dashboard at nouripet.com/dashboard. For specific delivery questions, contact support@nouripet.net or call (203) 208-6186."
  }

  if (/subscription|billing|cancel|pause|skip/i.test(lowerQ)) {
    return "You can manage your subscription in your account dashboard. Visit the Subscription page at nouripet.com/subscription/manage to pause, skip, or modify your plan!"
  }

  if (/nutrition|health|vet|medical|sick|disease/i.test(lowerQ)) {
    return "For specific health or nutrition questions about your dog, we recommend consulting with your veterinarian. Our team can provide general nutrition information at support@nouripet.net or (203) 208-6186."
  }

  if (/price|cost|payment|discount/i.test(lowerQ)) {
    return "Pricing varies by recipe and plan. Individual packs range from $15-25, and we offer discounts on subscriptions and 3-pack bundles. You can see exact pricing in our Plan Builder at nouripet.com/plan-builder!"
  }

  if (/puppy|senior|age/i.test(lowerQ)) {
    return "Our recipes are formulated to meet AAFCO standards for all life stages, from puppies to seniors. Use our Plan Builder to get personalized recommendations based on your dog's age, weight, and activity level!"
  }

  // Default fallback
  return "Thanks for reaching out! I'm here to help with questions about our recipes, nutrition, orders, and subscriptions. For personalized assistance, please email support@nouripet.net or call (203) 208-6186. Our team is available Monday-Friday, 9 AM - 6 PM EST."
}
