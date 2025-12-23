import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/ai/conversations/[id]/messages
 * Load conversation message history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const conversationId = params.id

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from("ai_chat_conversations")
      .select("id, user_id, title")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Fetch messages for this conversation
    const { data: messages, error: msgError } = await supabase
      .from("ai_chat_messages")
      .select("id, role, content, message_type, metadata, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (msgError) {
      console.error("[Conversation Messages API] Error fetching messages:", msgError)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
      },
      messages: messages || [],
    })
  } catch (error) {
    console.error("[Conversation Messages API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
