import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { buildSystemPrompt, getFallbackAnswer } from "@/lib/ai/support-prompts"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface SupportChatRequest {
  question: string
  conversationHistory: ChatMessage[]
  userId?: string
  currentPage?: string
  conversationId?: string
}

/**
 * Detect if a question requires user-specific data
 */
function detectUserDataIntent(question: string): boolean {
  const userDataKeywords = [
    "my order",
    "my subscription",
    "my delivery",
    "when will",
    "track",
    "status of my",
    "my account",
    "my plan",
    "change my",
    "cancel",
    "pause",
    "skip",
    "my next",
  ]

  const lowerQ = question.toLowerCase()
  return userDataKeywords.some((kw) => lowerQ.includes(kw))
}

/**
 * Generate a conversation title from the first user message
 */
function generateTitle(firstMessage: string): string {
  // Use first 50 chars or first sentence
  const cleaned = firstMessage.trim()
  if (cleaned.length <= 50) return cleaned

  // Try to get first sentence
  const firstSentence = cleaned.match(/^[^.!?]+[.!?]/)
  if (firstSentence) {
    const sentence = firstSentence[0]
    return sentence.length <= 60 ? sentence : `${sentence.substring(0, 57)}...`
  }

  // Fallback: truncate at 50 chars
  return `${cleaned.substring(0, 47)}...`
}

/**
 * Create or get conversation
 */
async function ensureConversation(
  conversationId: string | undefined,
  userId: string,
  firstMessage: string,
  currentPage?: string
): Promise<string> {
  const supabase = await createClient()

  // If conversationId provided, return it (conversation already exists)
  if (conversationId) {
    return conversationId
  }

  // Create new conversation
  const title = generateTitle(firstMessage)

  const { data, error } = await supabase
    .from("ai_chat_conversations")
    .insert({
      user_id: userId,
      title,
      page_context: currentPage || null,
      started_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error) {
    console.error("[Support Chat] Failed to create conversation:", error)
    throw new Error("Failed to create conversation")
  }

  return data.id
}

/**
 * Save a message to the database
 */
async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  tokensUsed?: number,
  llmModel?: string
): Promise<void> {
  const supabase = await createClient()

  const { error: messageError } = await supabase
    .from("ai_chat_messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
      tokens_used: tokensUsed || null,
      llm_model: llmModel || null,
    })

  if (messageError) {
    console.error("[Support Chat] Failed to save message:", messageError)
    throw new Error("Failed to save message")
  }

  // Update conversation last_message_at
  const { error: updateError } = await supabase
    .from("ai_chat_conversations")
    .update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)

  if (updateError) {
    console.error("[Support Chat] Failed to update conversation timestamp:", updateError)
    // Don't throw - this is not critical
  }
}

/**
 * Generate card data based on question and user context
 * Returns an array of cards to support multiple cards per message
 */
async function generateCardData(
  question: string,
  userId: string | undefined,
  aiResponse: string
): Promise<Array<{ type: string; data: any }>> {
  if (!userId) return []

  const supabase = await createClient()
  const lowerQ = question.toLowerCase()
  const lowerResponse = aiResponse.toLowerCase()
  const cards: Array<{ type: string; data: any }> = []

  // Order card: When asking about orders or tracking
  if (/track|order|delivery|where is my|status|shipped/i.test(lowerQ)) {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, status, fulfillment_status, estimated_delivery_date, tracking_url, tracking_token")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)

    if (orders && orders.length > 0) {
      const order = orders[0]
      cards.push({
        type: "order_card",
        data: {
          orderId: order.id,
          orderNumber: order.order_number,
          status: order.status,
          fulfillmentStatus: order.fulfillment_status,
          estimatedDelivery: order.estimated_delivery_date
            ? new Date(order.estimated_delivery_date).toLocaleDateString()
            : undefined,
          trackingUrl: order.tracking_url,
          trackingToken: order.tracking_token,
        },
      })
    }
  }

  // Recipe cards: When AI mentions specific recipe names (find ALL mentioned recipes)
  const recipeKeywords = /turkey|beef|chicken|lamb|pork|salmon|fish|sweet potato|barley|recipe|quinoa|pumpkin|rice|veggie/i
  if (recipeKeywords.test(lowerResponse) && /recipe|recommend|suggest|best|compare/i.test(lowerQ)) {
    const { data: recipes } = await supabase
      .from("recipes")
      .select("name, slug, description, macros")
      .eq("is_active", true)

    if (recipes && recipes.length > 0) {
      // Find ALL recipes mentioned in response
      // Use flexible matching with multiple strategies
      const mentionedRecipes = recipes.filter((r) => {
        // Strategy 1: Normalize full recipe name matching
        const normalizedRecipeName = r.name
          .toLowerCase()
          .replace(/&/g, "and")
          .replace(/[^a-z0-9\s]/g, "")
          .trim()

        const normalizedResponse = lowerResponse
          .replace(/&/g, "and")
          .replace(/[^a-z0-9\s]/g, "")

        if (normalizedResponse.includes(normalizedRecipeName)) {
          return true
        }

        // Strategy 2: Extract key protein + key ingredient (more flexible)
        // e.g., "Beef & Quinoa Harvest" → match "beef" AND "quinoa"
        // e.g., "Chicken & Garden Veggie" → match "chicken" AND ("veggie" OR "vegetable")
        // e.g., "Lamb & Pumpkin Feast" → match "lamb" AND "pumpkin"
        // e.g., "Turkey & Brown Rice Comfort" → match "turkey" AND "rice"

        const recipeLower = r.name.toLowerCase()

        // Check for protein + key ingredient combinations
        if (recipeLower.includes("beef") && recipeLower.includes("quinoa")) {
          return normalizedResponse.includes("beef") && normalizedResponse.includes("quinoa")
        }
        if (recipeLower.includes("chicken") && (recipeLower.includes("veggie") || recipeLower.includes("garden"))) {
          return normalizedResponse.includes("chicken") && (normalizedResponse.includes("veggie") || normalizedResponse.includes("vegetable") || normalizedResponse.includes("garden"))
        }
        if (recipeLower.includes("lamb") && recipeLower.includes("pumpkin")) {
          return normalizedResponse.includes("lamb") && normalizedResponse.includes("pumpkin")
        }
        if (recipeLower.includes("turkey") && recipeLower.includes("rice")) {
          return normalizedResponse.includes("turkey") && normalizedResponse.includes("rice")
        }

        return false
      })

      // Add a card for each mentioned recipe
      mentionedRecipes.forEach((recipe) => {
        cards.push({
          type: "recipe_card",
          data: {
            name: recipe.name,
            description: recipe.description,
            protein: recipe.macros?.protein,
            fat: recipe.macros?.fat,
            slug: recipe.slug,
          },
        })
      })
    }
  }

  // Dog profile card: When discussing user's dog
  if (/my dog|dog profile|about.*dog/i.test(lowerQ)) {
    const { data: dogs } = await supabase
      .from("dogs")
      .select("name, breed, age, age_unit, weight, weight_kg, weight_unit, activity_level, allergies, conditions")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)

    if (dogs && dogs.length > 0) {
      const dog = dogs[0]

      // Format age based on age_unit
      let age = ""
      if (dog.age_unit === "months") {
        age = `${dog.age} month${dog.age !== 1 ? "s" : ""}`
      } else {
        age = `${dog.age} year${dog.age !== 1 ? "s" : ""}`
      }

      // Convert weight to lbs for display
      let weightLbs = dog.weight || 0
      if (dog.weight_unit === "kg") {
        weightLbs = Math.round((dog.weight_kg || dog.weight || 0) * 2.20462)
      }

      cards.push({
        type: "dog_profile_card",
        data: {
          name: dog.name,
          breed: dog.breed,
          age,
          weight: weightLbs,
          activityLevel: dog.activity_level,
          allergens: dog.allergies || [],
          healthGoals: [], // No health_goals column in database
        },
      })
    }
  }

  return cards
}

/**
 * Fetch relevant user context based on question intent
 */
async function fetchUserContext(userId: string, question: string): Promise<string> {
  const supabase = await createClient()

  // Determine what data to fetch
  const needsOrders = /order|delivery|track|status|when will|shipped|arriving/i.test(question)
  const needsSubscription = /subscription|plan|billing|pause|cancel|skip|next delivery|recurring/i.test(question)
  const needsDogProfile = /my dog|his|her|dog's|recipe|food|meal|nutrition|allergies|allergen|health|weight|breed|activity|pet/i.test(question)

  const contextParts: string[] = []

  // Fetch dog profiles if question is dog-related
  if (needsDogProfile) {
    const { data: dogs } = await supabase
      .from("dogs")
      .select("id, name, breed, age, age_unit, weight, weight_kg, weight_unit, activity_level, allergies, conditions")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (dogs && dogs.length > 0) {
      contextParts.push("\nUser's Dogs:")
      for (const dog of dogs) {
        // Format age based on age_unit
        let age = ""
        if (dog.age_unit === "months") {
          age = `${dog.age} month${dog.age !== 1 ? 's' : ''}`
        } else {
          age = `${dog.age} year${dog.age !== 1 ? 's' : ''}`
        }

        // Convert weight to lbs for display
        let weightLbs = dog.weight || 0
        if (dog.weight_unit === "kg") {
          weightLbs = Math.round((dog.weight_kg || dog.weight || 0) * 2.20462)
        }

        let dogInfo = `- ${dog.name}: ${dog.breed}, ${age} old, ${weightLbs}lbs, ${dog.activity_level} activity`

        if (dog.allergies && dog.allergies.length > 0) {
          dogInfo += `, Allergies: ${dog.allergies.join(', ')}`
        }

        if (dog.conditions && dog.conditions.length > 0) {
          dogInfo += `, Medical Conditions: ${dog.conditions.join(', ')}`
        }

        contextParts.push(dogInfo)
      }
    } else {
      contextParts.push("\nUser's Dogs: No dog profiles found. Suggest creating a profile in the Plan Builder.")
    }
  }

  if (needsOrders) {
    // Fetch recent orders (last 5)
    const { data: orders } = await supabase
      .from("orders")
      .select("id, created_at, status, fulfillment_status, estimated_delivery_date, order_number, tracking_url, tracking_token")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (orders && orders.length > 0) {
      contextParts.push("\nUser Orders:")
      orders.forEach((order) => {
        const orderDate = new Date(order.created_at).toLocaleDateString()
        let orderInfo = `- Order #${order.order_number}: Status: ${order.fulfillment_status || order.status}, Ordered: ${orderDate}, Delivery: ${order.estimated_delivery_date || "TBD"}`

        // Add tracking URL if available
        if (order.tracking_url) {
          orderInfo += `, Tracking: ${order.tracking_url}`
        } else if (order.tracking_token) {
          // Generate internal tracking URL from token
          orderInfo += `, Tracking: /track/${order.tracking_token}`
        }

        contextParts.push(orderInfo)
      })
    } else {
      contextParts.push("\nUser Orders: No orders found")
    }
  }

  if (needsSubscription) {
    // Fetch active subscriptions
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id, status, billing_cycle, current_period_end, created_at")
      .eq("user_id", userId)
      .in("status", ["active", "trialing", "past_due", "paused"])

    if (subs && subs.length > 0) {
      contextParts.push("\nActive Subscriptions:")
      subs.forEach((sub) => {
        const nextBilling = sub.current_period_end
          ? new Date(sub.current_period_end).toLocaleDateString()
          : "Unknown"
        contextParts.push(
          `- Subscription: ${sub.billing_cycle}, Status: ${sub.status}, Next billing: ${nextBilling}`
        )
      })
    } else {
      contextParts.push("\nActive Subscriptions: No active subscriptions found")
    }
  }

  return contextParts.length > 0 ? `\n${contextParts.join("\n")}` : ""
}

export async function POST(request: NextRequest) {
  try {
    const body: SupportChatRequest = await request.json()
    const { question, conversationHistory, userId, currentPage, conversationId } = body

    // Validate required fields
    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // Check if LLM is enabled
    const llmEnabled =
      process.env.ENABLE_AI_LLM === "true" &&
      process.env.ANTHROPIC_API_KEY &&
      process.env.ANTHROPIC_API_KEY !== "your_anthropic_api_key_here"

    if (!llmEnabled) {
      return NextResponse.json({
        answer: getFallbackAnswer(question),
        llmUsed: false,
      })
    }

    // Ensure conversation exists (only for authenticated users)
    let currentConversationId: string | undefined = conversationId
    if (userId) {
      try {
        currentConversationId = await ensureConversation(
          conversationId,
          userId,
          question,
          currentPage
        )

        // Save user message to database
        await saveMessage(currentConversationId, "user", question)
      } catch (convError) {
        console.error("[Support Chat] Conversation persistence error:", convError)
        // Continue without persistence rather than failing the request
      }
    }

    // Build system prompt based on authentication state and current page
    const systemPrompt = await buildSystemPrompt(!!userId, currentPage)

    // Detect if question needs user-specific data
    const needsUserContext = userId && detectUserDataIntent(question)

    // Fetch user data only if needed and user is authenticated
    let userContext = ""
    if (needsUserContext) {
      try {
        userContext = await fetchUserContext(userId, question)
      } catch (contextError) {
        console.error("[Support Chat] Error fetching user context:", contextError)
        // Continue without user context rather than failing
      }
    }

    // Convert conversation history to Anthropic format
    const anthropicMessages: any[] = conversationHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }))

    // Call Claude API with system prompt + user context
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 400,
      temperature: 0.7,
      system: `${systemPrompt}${userContext}`,
      messages: anthropicMessages,
    })

    const answer = message.content[0].type === "text" ? message.content[0].text : ""

    // Track AI costs
    const inputTokens = message.usage.input_tokens
    const outputTokens = message.usage.output_tokens
    const totalTokens = inputTokens + outputTokens
    // Claude Haiku pricing: $0.25 per MTok input, $1.25 per MTok output
    const estimatedCost = (inputTokens / 1_000_000) * 0.25 + (outputTokens / 1_000_000) * 1.25

    // Save cost tracking to database
    try {
      await supabaseAdmin.from("ai_token_usage").insert({
        feature: "support_chat",
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        estimated_cost: estimatedCost,
        llm_used: true,
        cached: false,
        user_id: userId || null,
      })
    } catch (trackError) {
      console.error("[Support Chat] Failed to track cost:", trackError)
      // Don't fail the request if tracking fails
    }

    // Save assistant message to database (only for authenticated users)
    if (userId && currentConversationId) {
      try {
        await saveMessage(
          currentConversationId,
          "assistant",
          answer,
          totalTokens,
          "claude-3-haiku-20240307"
        )
      } catch (saveError) {
        console.error("[Support Chat] Failed to save assistant message:", saveError)
        // Don't fail the request if saving fails
      }
    }

    // Generate card data if applicable
    let cards: Array<{ type: string; data: any }> = []
    if (userId) {
      try {
        cards = await generateCardData(question, userId, answer)
      } catch (cardError) {
        console.error("[Support Chat] Failed to generate card data:", cardError)
        // Don't fail the request if card generation fails
      }
    }

    return NextResponse.json({
      answer,
      tokensUsed: totalTokens,
      llmUsed: true,
      conversationId: currentConversationId,
      cards: cards.length > 0 ? cards : undefined,
    })
  } catch (error) {
    console.error("[Support Chat] Error:", error)

    // Return user-friendly fallback message
    return NextResponse.json(
      {
        answer: getFallbackAnswer("error"),
        error: "Failed to generate response",
        llmUsed: false,
      },
      { status: 500 }
    )
  }
}
