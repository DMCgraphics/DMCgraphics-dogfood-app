import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { zipcode, recipeName, isSubscription } = await req.json()

    // Subscriptions always get standard timeline, skip inventory checks
    if (isSubscription) {
      return NextResponse.json({
        deliveryMethod: 'shipping',
        estimatedDays: '5-7',
        estimatedDate: null,
        inStock: true, // Always true for subscriptions
        message: 'Your first shipment will arrive within 5-7 business days.'
      })
    }

    const supabase = await createServerSupabase()

    // Check if zipcode is in local delivery area
    const { data: zipcodeData } = await supabase
      .from('allowed_zipcodes')
      .select('zipcode')
      .eq('zipcode', zipcode)
      .single()

    const isLocalDelivery = !!zipcodeData

    // Check inventory for one-time orders
    const { data: inventoryData } = await supabase
      .from('inventory')
      .select('quantity_on_hand, reserved_quantity')
      .eq('recipe_name', recipeName.toLowerCase())
      .single()

    const availableQuantity = (inventoryData?.quantity_on_hand || 0) - (inventoryData?.reserved_quantity || 0)
    const inStock = availableQuantity > 0

    // Get next batch date
    const { data: nextBatch } = await supabase
      .from('batch_schedules')
      .select('batch_date')
      .eq('status', 'upcoming')
      .gte('batch_date', new Date().toISOString().split('T')[0])
      .order('batch_date', { ascending: true })
      .limit(1)
      .single()

    // Calculate delivery estimate
    let deliveryMethod = 'shipping'
    let estimatedDays = '5-7'
    let estimatedDate = null
    let message = ''

    if (isLocalDelivery && inStock) {
      // Local delivery + in stock = same day or next day
      deliveryMethod = 'local_delivery'
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      estimatedDate = tomorrow.toISOString().split('T')[0]
      estimatedDays = '1'
      message = 'Your order will be delivered tomorrow!'
    } else if (isLocalDelivery && !inStock) {
      // Local delivery + out of stock = wait for next batch
      deliveryMethod = 'local_delivery'
      if (nextBatch?.batch_date) {
        const batchDate = new Date(nextBatch.batch_date)
        batchDate.setDate(batchDate.getDate() + 2) // Add 2 days after batch for delivery
        estimatedDate = batchDate.toISOString().split('T')[0]
        const daysUntil = Math.ceil((batchDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        estimatedDays = daysUntil.toString()
        message = `Your order will be delivered after our next batch on ${batchDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
      } else {
        message = 'Currently out of stock. We\'ll notify you when available.'
      }
    } else {
      // Not local delivery = standard shipping
      deliveryMethod = 'shipping'
      estimatedDays = '5-7'
      message = 'Your order will arrive within 5-7 business days via USPS.'
    }

    return NextResponse.json({
      deliveryMethod,
      estimatedDays,
      estimatedDate,
      inStock,
      isLocalDelivery,
      availableQuantity,
      message,
      nextBatchDate: nextBatch?.batch_date || null
    })
  } catch (error: any) {
    console.error("Error calculating delivery estimate:", error)
    return NextResponse.json(
      { error: error.message || "Failed to calculate delivery estimate" },
      { status: 500 }
    )
  }
}
