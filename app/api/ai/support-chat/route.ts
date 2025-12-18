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
 * Fetch relevant user context based on question intent
 */
async function fetchUserContext(userId: string, question: string): Promise<string> {
  const supabase = await createClient()

  // Determine what data to fetch
  const needsOrders = /order|delivery|track|status|when will|shipped|arriving/i.test(question)
  const needsSubscription = /subscription|plan|billing|pause|cancel|skip|next delivery|recurring/i.test(question)

  const contextParts: string[] = []

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
    const { question, conversationHistory, userId, currentPage } = body

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

    return NextResponse.json({
      answer,
      tokensUsed: inputTokens + outputTokens,
      llmUsed: true,
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
