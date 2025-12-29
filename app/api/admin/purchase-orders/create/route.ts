import { NextRequest, NextResponse } from "next/server"
import { createClient, supabaseAdmin } from "@/lib/supabase/server"
import { generateMosnerPO, combinePOs, type POGenerationInput } from "@/lib/purchase-orders/po-generator"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface CreatePORequest {
  recipes: {
    recipeName: string
    batchMultiplier: number
    cookDate: string
  }[]
  vendorId?: string // Optional: will default to Mosner
  notes?: string
  autoSendEmail?: boolean
  customQuantities?: { [ingredientName: string]: number }
}

export async function POST(req: NextRequest) {
  try {
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

    const body: CreatePORequest = await req.json()
    const { recipes, vendorId, notes, autoSendEmail = false, customQuantities } = body

    if (!recipes || recipes.length === 0) {
      return NextResponse.json({ error: "At least one recipe required" }, { status: 400 })
    }

    // Get vendor (default to Mosner)
    let vendor
    if (vendorId) {
      const { data: vendorData, error: vendorError } = await supabaseAdmin
        .from("vendors")
        .select("*")
        .eq("id", vendorId)
        .single()

      if (vendorError || !vendorData) {
        return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
      }
      vendor = vendorData
    } else {
      // Default to Mosner
      const { data: vendorData, error: vendorError } = await supabaseAdmin
        .from("vendors")
        .select("*")
        .eq("name", "Mosner Family Brands")
        .single()

      if (vendorError || !vendorData) {
        return NextResponse.json({ error: "Mosner Family Brands vendor not found" }, { status: 404 })
      }
      vendor = vendorData
    }

    // Generate POs for each recipe
    const generatedPOs = recipes.map(recipe => {
      const input: POGenerationInput = {
        recipeName: recipe.recipeName,
        batchMultiplier: recipe.batchMultiplier,
        cookDate: new Date(recipe.cookDate),
        minimumOrderLbs: vendor.minimum_order_lbs,
      }
      return generateMosnerPO(input)
    })

    // Combine into single PO if multiple recipes
    const finalPO = generatedPOs.length > 1 ? combinePOs(generatedPOs) : generatedPOs[0]

    // Generate PO number
    const { data: poNumberData, error: poNumberError } = await supabaseAdmin
      .rpc("generate_po_number")

    if (poNumberError) {
      console.error("Error generating PO number:", poNumberError)
      return NextResponse.json({ error: "Failed to generate PO number" }, { status: 500 })
    }

    const poNumber = poNumberData as string

    // Calculate totals (in cents for database storage)
    const subtotal_cents = 0 // Will be updated when vendor pricing is added
    const tax_cents = 0
    const total_cents = subtotal_cents + tax_cents

    // Create purchase order
    const { data: purchaseOrder, error: poError } = await supabaseAdmin
      .from("purchase_orders")
      .insert({
        po_number: poNumber,
        vendor_id: vendor.id,
        order_date: new Date().toISOString().split('T')[0],
        needed_by_date: finalPO.neededByDate.toISOString().split('T')[0],
        pickup_date: finalPO.pickupDate.toISOString().split('T')[0],
        status: autoSendEmail ? "sent" : "draft",
        subtotal_cents,
        tax_cents,
        total_cents,
        notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (poError) {
      console.error("Error creating purchase order:", poError)
      return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 })
    }

    // Create line items (use custom quantities if provided)
    const lineItemsToInsert = finalPO.lineItems.map(item => ({
      po_id: purchaseOrder.id,
      ingredient_name: item.ingredientName,
      quantity_lbs: customQuantities?.[item.ingredientName] ?? item.orderQuantityLbs,
      unit_price_cents: 0, // Will be updated when vendor pricing is added
      total_price_cents: 0,
      notes: item.notes,
    }))

    const { error: itemsError } = await supabaseAdmin
      .from("purchase_order_items")
      .insert(lineItemsToInsert)

    if (itemsError) {
      console.error("Error creating PO items:", itemsError)
      // Rollback the PO
      await supabaseAdmin.from("purchase_orders").delete().eq("id", purchaseOrder.id)
      return NextResponse.json({ error: "Failed to create PO items" }, { status: 500 })
    }

    // Optionally send email
    if (autoSendEmail) {
      try {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/purchase-orders/${purchaseOrder.id}/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!emailResponse.ok) {
          console.error("Failed to send PO email")
          // Don't fail the whole request if email fails
        }
      } catch (emailError) {
        console.error("Error sending PO email:", emailError)
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      purchaseOrder: {
        ...purchaseOrder,
        lineItems: lineItemsToInsert,
      },
    })
  } catch (error: any) {
    console.error("Error creating purchase order:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create purchase order" },
      { status: 500 }
    )
  }
}
