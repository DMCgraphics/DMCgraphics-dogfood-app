import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/ai/conversations
 * List user's recent conversations
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch recent conversations (last 20, not archived)
    const { data: conversations, error } = await supabase
      .from("ai_chat_conversations")
      .select("id, title, started_at, last_message_at, page_context")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("last_message_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("[Conversations API] Error fetching conversations:", error)
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }

    return NextResponse.json({
      conversations: conversations || [],
    })
  } catch (error) {
    console.error("[Conversations API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/ai/conversations
 * Create a new conversation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, page_context } = body

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from("ai_chat_conversations")
      .insert({
        user_id: user.id,
        title: title || "New Conversation",
        page_context: page_context || null,
        started_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      })
      .select("id, title, started_at, last_message_at, page_context")
      .single()

    if (error) {
      console.error("[Conversations API] Error creating conversation:", error)
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
    }

    return NextResponse.json({
      conversation,
    })
  } catch (error) {
    console.error("[Conversations API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
