import { NextRequest, NextResponse } from "next/server"
import { createClient, supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VALID_STATUSES = ["draft", "sent", "confirmed", "picked_up", "received", "cancelled"]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ poId: string }> }
) {
  try {
    const { poId } = await params
    const { status } = await req.json()

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update PO status
    const { data: updatedPO, error: updateError } = await supabaseAdmin
      .from("purchase_orders")
      .update({ status })
      .eq("id", poId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating PO status:", updateError)
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
    }

    return NextResponse.json({ purchaseOrder: updatedPO })
  } catch (error: any) {
    console.error("Error updating PO status:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update status" },
      { status: 500 }
    )
  }
}
