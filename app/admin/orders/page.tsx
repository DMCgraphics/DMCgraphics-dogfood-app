import { supabaseAdmin } from "@/lib/supabase/server"
import { OrdersTable } from "@/components/admin/orders-table"
import Stripe from "stripe"

export const dynamic = "force-dynamic"
export const revalidate = 0

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

async function getOrders() {
  // Use admin client to bypass RLS
  const supabase = supabaseAdmin

  // Get plans
  const { data: plans, error } = await supabase
    .from("plans")
    .select("*")
    .in("status", ["active", "checkout_in_progress"])
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching plans:", error)
  }

  // Get topper subscriptions (plan_id is NULL, dog_id in metadata)
  const { data: topperSubscriptions, error: topperError } = await supabase
    .from("subscriptions")
    .select("id, user_id, status, stripe_subscription_id, stripe_customer_id, current_period_start, current_period_end, metadata, created_at")
    .is("plan_id", null)
    .in("status", ["active", "paused"])
    .order("created_at", { ascending: false })

  if (topperError) {
    console.error("Error fetching topper subscriptions:", topperError)
  }

  console.log("[ADMIN ORDERS] Fetched topper subscriptions:", topperSubscriptions?.length || 0)
  console.log("[ADMIN ORDERS] Topper data:", JSON.stringify(topperSubscriptions, null, 2))

  // Collect all dog IDs and user IDs
  const dogIds = new Set<string>()
  const userIds = new Set<string>()

  plans?.forEach(plan => {
    if (plan.dog_id) dogIds.add(plan.dog_id)
    if (plan.user_id) userIds.add(plan.user_id)
  })

  topperSubscriptions?.forEach(sub => {
    if (sub.metadata?.dog_id) dogIds.add(sub.metadata.dog_id)
    if (sub.user_id) userIds.add(sub.user_id)
  })

  // Fetch one-time individual/3-pack purchases from Stripe
  // We need to fetch ALL recent payment intents, not just from known customers,
  // because one-time purchases don't create subscription records
  let individualPurchases: any[] = []

  try {
    // Fetch recent payment intents (last 100) with charges expanded to get shipping info
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
      expand: ['data.charges.data'],
    })

    console.log("[ADMIN ORDERS] Total payment intents fetched:", paymentIntents.data.length)

    // Filter for successful one-time payments for individual/3-pack products
    individualPurchases = paymentIntents.data.filter(pi => {
      const metadata = pi.metadata || {}
      const isOneTime = !pi.invoice
      const isIndividualProduct = metadata.product_type === 'individual'
        || metadata.product_type === '3-packs'
        || metadata.product_type === 'cart' // Cart purchases with multiple items
      const isSuccessful = pi.status === 'succeeded'

      if (isIndividualProduct) {
        console.log("[ADMIN ORDERS] Found individual/3-pack payment intent:", {
          id: pi.id,
          status: pi.status,
          product_type: metadata.product_type,
          has_invoice: !!pi.invoice,
          amount: pi.amount,
        })
      }

      return isSuccessful && isOneTime && isIndividualProduct
    })

    console.log("[ADMIN ORDERS] Filtered individual/3-pack purchases:", individualPurchases.length)
  } catch (err) {
    console.error('[ADMIN ORDERS] Error fetching payment intents:', err)
  }

  console.log("[ADMIN ORDERS] Individual/3-pack purchases found:", individualPurchases.length)

  // Collect user IDs and dog IDs from individual purchases
  individualPurchases.forEach(pi => {
    const metadata = pi.metadata || {}
    if (metadata.user_id) userIds.add(metadata.user_id)
    if (metadata.dog_id) dogIds.add(metadata.dog_id)
  })

  const planIds = plans?.map(p => p.id) || []

  // Get related data
  const { data: planItems } = planIds.length > 0 ? await supabase
    .from("plan_items")
    .select("*, meta, recipes (name, slug)")
    .in("plan_id", planIds) : { data: [] }

  const { data: dogs } = dogIds.size > 0 ? await supabase
    .from("dogs")
    .select("id, name, breed, weight, weight_unit")
    .in("id", Array.from(dogIds)) : { data: [] }

  const { data: planSubscriptions } = planIds.length > 0 ? await supabase
    .from("subscriptions")
    .select("id, plan_id, status, stripe_subscription_id, current_period_start, current_period_end, metadata")
    .in("plan_id", planIds) : { data: [] }

  const { data: profiles } = userIds.size > 0 ? await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", Array.from(userIds)) : { data: [] }

  // Combine plan-based orders
  const planOrders = (plans || []).map(plan => ({
    ...plan,
    order_type: "plan" as const,
    plan_items: planItems?.filter(item => item.plan_id === plan.id) || [],
    dogs: dogs?.find(dog => dog.id === plan.dog_id) || null,
    subscriptions: planSubscriptions?.filter(sub => sub.plan_id === plan.id) || [],
    profiles: profiles?.find(profile => profile.id === plan.user_id) || null
  }))

  // Combine topper-based orders
  const topperOrders = (topperSubscriptions || []).map(sub => {
    const dogId = sub.metadata?.dog_id
    const dog = dogs?.find(d => d.id === dogId) || null
    const profile = profiles?.find(p => p.id === sub.user_id) || null

    // Try to get delivery zipcode from subscription metadata
    let deliveryZipcode = sub.metadata?.delivery_zipcode || null

    return {
      id: sub.id,
      order_type: "topper" as const,
      created_at: sub.created_at,
      status: sub.status,
      user_id: sub.user_id,
      dog_id: dogId,
      topper_level: sub.metadata?.product_type?.replace("topper-", "") || "25",
      delivery_zipcode: deliveryZipcode,
      total_cents: null, // Will be calculated from Stripe
      plan_items: [],
      dogs: dog,
      subscriptions: [sub],
      profiles: profile
    }
  })

  // Combine individual/3-pack purchase orders
  const individualPackOrders = individualPurchases.flatMap(pi => {
    const metadata = pi.metadata || {}
    const profile = profiles?.find(p => p.id === metadata.user_id) || null

    // Get shipping address from the latest charge
    let deliveryZipcode = null
    if (metadata.delivery_zipcode) {
      deliveryZipcode = metadata.delivery_zipcode
    }

    // Check if this is a cart purchase (multiple items) or single purchase
    const isCartPurchase = metadata.product_type === 'cart'

    if (isCartPurchase && metadata.items_json) {
      // Parse cart items from metadata
      let cartItems: any[] = []
      try {
        cartItems = JSON.parse(metadata.items_json)
        console.log("[ADMIN ORDERS] Parsed cart items for payment intent:", pi.id, cartItems)
      } catch (e) {
        console.error('[ADMIN ORDERS] Error parsing items_json from payment intent:', pi.id, e)
      }

      // Create a separate order entry for each cart item
      return cartItems.map((item: any, index: number) => {
        const dogId = metadata.dog_id
        const dog = dogs?.find(d => d.id === dogId) || null

        return {
          id: `${pi.id}-item-${index}`,
          order_type: "individual-pack" as const,
          created_at: new Date(pi.created * 1000).toISOString(),
          status: 'paid',
          user_id: metadata.user_id,
          dog_id: dogId,
          product_type: item.type === 'single-pack' ? 'individual' : '3-pack',
          recipe_name: item.recipes?.map((r: any) => r.name).join(', ') || '',
          recipes: item.recipes || [],
          amount: (item.price * 100) || 0, // Convert to cents
          delivery_zipcode: deliveryZipcode,
          total_cents: (item.price * 100) || 0,
          plan_items: [],
          dogs: dog,
          subscriptions: [],
          profiles: profile,
          payment_intent_id: pi.id,
          cart_item_index: index,
        }
      })
    } else {
      // Single item purchase (old format or direct checkout)
      const dogId = metadata.dog_id
      const dog = dogs?.find(d => d.id === dogId) || null

      // Parse recipes from metadata if available
      let recipes: any[] = []
      try {
        if (metadata.recipes) {
          recipes = JSON.parse(metadata.recipes)
        }
      } catch (e) {
        console.error('[ADMIN ORDERS] Error parsing recipes from payment intent:', pi.id, e)
      }

      return [{
        id: pi.id,
        order_type: "individual-pack" as const,
        created_at: new Date(pi.created * 1000).toISOString(),
        status: 'paid',
        user_id: metadata.user_id,
        dog_id: dogId,
        product_type: metadata.product_type || 'individual',
        recipe_name: metadata.recipe_name || '',
        recipes: recipes,
        amount: pi.amount || 0,
        delivery_zipcode: deliveryZipcode,
        total_cents: pi.amount || 0,
        plan_items: [],
        dogs: dog,
        subscriptions: [],
        profiles: profile,
        payment_intent_id: pi.id,
      }]
    }
  })

  // Combine and sort by created_at
  const allOrders = [...planOrders, ...topperOrders, ...individualPackOrders].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  console.log("[ADMIN ORDERS] Plan orders count:", planOrders.length)
  console.log("[ADMIN ORDERS] Topper orders count:", topperOrders.length)
  console.log("[ADMIN ORDERS] Individual pack orders count:", individualPackOrders.length)
  console.log("[ADMIN ORDERS] Total orders:", allOrders.length)
  console.log("[ADMIN ORDERS] First topper order:", topperOrders[0])

  return allOrders
}

export default async function OrdersManagementPage() {
  const orders = await getOrders()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <p className="text-gray-600 mt-2">{orders.length} total orders</p>
      </div>

      <OrdersTable orders={orders} />
    </div>
  )
}
