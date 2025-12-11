"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Truck, CheckCircle, Clock, AlertCircle, Copy, ExternalLink, ArrowUp, ArrowDown, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"

type InventoryItem = {
  id: string
  recipe_name: string
  quantity_on_hand: number
  reserved_quantity: number
  low_stock_threshold: number
  updated_at: string
}

type Order = {
  id: string
  order_number: string
  status: string
  fulfillment_status: string
  recipe_name: string
  quantity: number
  delivery_method: string
  delivery_zipcode: string
  estimated_delivery_date: string
  created_at: string
  user_id: string
  guest_email: string
  is_subscription_order: boolean
  tracking_token: string
  driver_id?: string
  driver_name?: string
  driver_phone?: string
  driver_home_zipcode?: string
  route_position?: number
  route_override?: boolean
  route_notes?: string
}

type Driver = {
  id: string
  name: string
  phone?: string
  email?: string
  home_zipcode: string
  home_address?: string
  is_active: boolean
}

type Subscription = {
  id: string
  user_id: string
  stripe_subscription_id: string
  status: string
  current_period_end: string
  interval: string
  interval_count: number
  billing_cycle: string
  user_email: string
  user_name?: string
  plan_id: string
  delivery_zipcode?: string
  plan_type?: string
  topper_level?: string
  dogs: Array<{
    id: string
    name: string
    breed?: string
    weight?: number
    weight_unit?: string
  }>
  recipes: Array<{
    id: string
    name: string
    slug: string
  }>
}

export default function FulfillmentPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [todayOrders, setTodayOrders] = useState<Order[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingOrders, setIsGeneratingOrders] = useState(false)
  const [dateFilter, setDateFilter] = useState<'today' | 'upcoming' | 'all'>('today')
  const [drivers, setDrivers] = useState<Driver[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [dateFilter])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Calculate today's date fresh each time we fetch
      const today = new Date().toISOString().split('T')[0]
      console.log('[FULFILLMENT] Fetching data for date:', today)

      // Fetch inventory
      const { data: inv } = await supabase
        .from('inventory')
        .select('*')
        .order('recipe_name')

      if (inv) setInventory(inv)

      // Fetch active drivers
      const { data: driversList } = await supabase
        .from('drivers')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (driversList) setDrivers(driversList)
      console.log('[FULFILLMENT] Active drivers:', driversList?.length || 0)

      // Fetch pending orders (both individual packs and subscriptions)
      const { data: pending } = await supabase
        .from('orders')
        .select('*')
        .in('fulfillment_status', ['pending', 'looking_for_driver', 'driver_assigned', 'in_stock', 'needs_batch'])
        .order('created_at', { ascending: false })

      if (pending) setPendingOrders(pending)
      console.log('[FULFILLMENT] Pending orders:', pending?.length || 0)

      // Fetch deliveries based on date filter (both individual packs and subscriptions)
      let query = supabase
        .from('orders')
        .select('*')
        .in('fulfillment_status', ['preparing', 'out_for_delivery'])

      // Apply date filter conditionally
      if (dateFilter === 'today') {
        query = query.eq('estimated_delivery_date', today)
      } else if (dateFilter === 'upcoming') {
        query = query.gte('estimated_delivery_date', today)
      }
      // 'all' = no date filter

      query = query
        .order('estimated_delivery_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      const { data: todayDel } = await query

      if (todayDel) setTodayOrders(todayDel)
      console.log(`[FULFILLMENT] Deliveries (${dateFilter}):`, todayDel?.length || 0)

      // Fetch active subscriptions with user email, dog info, and recipes
      const { data: subs, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          user_id,
          stripe_subscription_id,
          status,
          current_period_end,
          interval,
          interval_count,
          billing_cycle,
          plan_id,
          plans (
            id,
            delivery_zipcode,
            plan_type,
            topper_level,
            plan_dogs (
              dog_id,
              meals_per_day,
              dogs (
                id,
                name,
                breed,
                weight,
                weight_unit
              )
            ),
            plan_items (
              recipe_id,
              qty,
              recipes (
                id,
                name,
                slug
              )
            )
          )
        `)
        .eq('status', 'active')
        .order('current_period_end')

      if (subsError) {
        console.error('[FULFILLMENT] Error fetching subscriptions:', subsError)
      }

      if (subs) {
        console.log('[FULFILLMENT] Raw subscriptions from DB:', subs.length, subs)
        // Fetch user details using RPC function (gets emails from auth.users)
        const userIds = subs.map((s: any) => s.user_id).filter(Boolean)
        const { data: users, error: usersError } = await supabase
          .rpc('get_user_emails', { user_ids: userIds })

        if (usersError) {
          console.error('[FULFILLMENT] Error fetching user emails:', usersError)
        }

        const userMap = new Map(users?.map((u: any) => [u.user_id, { email: u.email, name: u.full_name }]) || [])

        const subsWithDetails = subs.map((s: any) => {
          const user = userMap.get(s.user_id)
          const plan = s.plans
          const dogs = plan?.plan_dogs?.map((pd: any) => pd.dogs).filter(Boolean) || []
          const recipes = plan?.plan_items?.map((pi: any) => pi.recipes).filter(Boolean) || []

          return {
            ...s,
            user_email: user?.email || 'Unknown',
            user_name: user?.name || null,
            delivery_zipcode: plan?.delivery_zipcode || null,
            plan_type: plan?.plan_type || null,
            topper_level: plan?.topper_level || null,
            dogs,
            recipes
          }
        })

        setSubscriptions(subsWithDetails)
        console.log('[FULFILLMENT] Active subscriptions with details:', subsWithDetails)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load fulfillment data",
        variant: "destructive"
      })
    }
    setIsLoading(false)
  }

  const updateInventory = async (id: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ quantity_on_hand: quantity })
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Inventory updated",
        description: "Stock quantity has been updated"
      })
      fetchData()
    } catch (error) {
      console.error('Error updating inventory:', error)
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive"
      })
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const updateData: any = { fulfillment_status: status }

      // Set delivered_at timestamp when order is marked as delivered
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) throw error

      toast({
        title: "Order updated",
        description: `Order marked as ${status}`
      })
      fetchData()
    } catch (error) {
      console.error('Error updating order:', error)
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      })
    }
  }

  const copyTrackingLink = async (orderId: string, trackingToken: string) => {
    try {
      const baseUrl = window.location.origin
      const trackingUrl = `${baseUrl}/orders/${orderId}/track?token=${trackingToken}`

      await navigator.clipboard.writeText(trackingUrl)

      toast({
        title: "Link copied!",
        description: "Tracking link has been copied to clipboard"
      })
    } catch (error) {
      console.error('Error copying link:', error)
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      })
    }
  }

  const generateSubscriptionOrders = async (deliveryDate?: string) => {
    setIsGeneratingOrders(true)
    try {
      const response = await fetch('/api/admin/subscriptions/generate-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryDate: deliveryDate || new Date().toISOString().split('T')[0]
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Orders generated",
          description: `Created ${data.created} subscription orders. ${data.failed > 0 ? `${data.failed} failed.` : ''}`
        })
        fetchData()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate orders",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Error generating orders:', error)
      toast({
        title: "Error",
        description: "Failed to generate orders",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingOrders(false)
    }
  }

  const calculateZipcodeDistance = (zip1: string, zip2: string): number => {
    // Simple numeric difference (works well for same geographic region)
    const num1 = parseInt(zip1.replace(/\D/g, '')) || 0
    const num2 = parseInt(zip2.replace(/\D/g, '')) || 0
    return Math.abs(num1 - num2)
  }

  const sortOrdersByDistance = (orders: Order[], driverZipcode: string | null): Order[] => {
    if (!driverZipcode) return orders

    // Check if any orders have manual route override
    const hasManualRoute = orders.some(o => o.route_override && o.route_position != null)

    if (hasManualRoute) {
      // Sort by manual route_position
      return [...orders].sort((a, b) => {
        const posA = a.route_position ?? 999
        const posB = b.route_position ?? 999
        return posA - posB
      })
    }

    // Default: sort by distance
    return [...orders].sort((a, b) => {
      const distA = calculateZipcodeDistance(driverZipcode, a.delivery_zipcode || '')
      const distB = calculateZipcodeDistance(driverZipcode, b.delivery_zipcode || '')
      return distA - distB
    })
  }

  const moveOrderInRoute = async (orderId: string, direction: 'up' | 'down', orders: Order[]) => {
    const currentIndex = orders.findIndex(o => o.id === orderId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= orders.length) return

    try {
      // Swap the positions
      const updates = [
        {
          id: orders[currentIndex].id,
          route_position: newIndex + 1,
          route_override: true
        },
        {
          id: orders[newIndex].id,
          route_position: currentIndex + 1,
          route_override: true
        }
      ]

      for (const update of updates) {
        await supabase
          .from('orders')
          .update({
            route_position: update.route_position,
            route_override: update.route_override
          })
          .eq('id', update.id)
      }

      toast({
        title: "Route updated",
        description: "Stop order has been rearranged"
      })
      fetchData()
    } catch (error) {
      console.error('Error updating route:', error)
      toast({
        title: "Error",
        description: "Failed to update route",
        variant: "destructive"
      })
    }
  }

  const resetRouteToAutomatic = async (driverZip: string) => {
    try {
      const ordersToReset = todayOrders.filter(o => o.driver_home_zipcode === driverZip)

      for (const order of ordersToReset) {
        await supabase
          .from('orders')
          .update({
            route_position: null,
            route_override: false
          })
          .eq('id', order.id)
      }

      toast({
        title: "Route reset",
        description: "Route has been reset to automatic optimization"
      })
      fetchData()
    } catch (error) {
      console.error('Error resetting route:', error)
      toast({
        title: "Error",
        description: "Failed to reset route",
        variant: "destructive"
      })
    }
  }

  const assignDriver = async (orderId: string, driverId: string) => {
    try {
      const driver = drivers.find(d => d.id === driverId)
      if (!driver) throw new Error('Driver not found')

      const { error } = await supabase
        .from('orders')
        .update({
          fulfillment_status: 'driver_assigned',
          driver_id: driverId,
          driver_name: driver.name,
          driver_phone: driver.phone || null,
          driver_home_zipcode: driver.home_zipcode,
        })
        .eq('id', orderId)

      if (error) throw error

      toast({
        title: "Driver assigned",
        description: `Order assigned to ${driver.name}`
      })
      fetchData()
    } catch (error) {
      console.error('Error assigning driver:', error)
      toast({
        title: "Error",
        description: "Failed to assign driver",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string, icon: any }> = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      looking_for_driver: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      driver_assigned: { color: 'bg-blue-100 text-blue-800', icon: Package },
      in_stock: { color: 'bg-blue-100 text-blue-800', icon: Package },
      needs_batch: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      preparing: { color: 'bg-purple-100 text-purple-800', icon: Package },
      out_for_delivery: { color: 'bg-green-100 text-green-800', icon: Truck },
      delivered: { color: 'bg-green-600 text-white', icon: CheckCircle },
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Order Fulfillment</h1>
        <p className="text-muted-foreground">Manage inventory and process orders</p>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Pending Orders ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions ({subscriptions.length})</TabsTrigger>
          <TabsTrigger value="today">Today's Deliveries ({todayOrders.length})</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
              <CardDescription>One-time pack orders waiting for fulfillment</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending orders</p>
              ) : (
                <div className="space-y-4">
                  {pendingOrders.map(order => (
                    <Card key={order.id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-sm sm:text-base">Order #{order.order_number}</h3>
                              {getStatusBadge(order.fulfillment_status)}
                              {order.is_subscription_order && (
                                <Badge variant="outline">Subscription</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {order.recipe_name} × {order.quantity}
                            </p>
                            <p className="text-sm">
                              <strong>Delivery:</strong> {order.delivery_method || 'Not set'} |
                              <strong> Zipcode:</strong> {order.delivery_zipcode || 'Not set'}
                            </p>
                            <p className="text-sm">
                              <strong>Customer:</strong> {order.guest_email || 'Registered user'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Ordered: {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:min-w-[180px]">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyTrackingLink(order.id, order.tracking_token)}
                              className="w-full whitespace-nowrap"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Copy Tracking Link</span>
                              <span className="sm:hidden">Copy Link</span>
                            </Button>
                            {order.fulfillment_status === 'looking_for_driver' && (
                              <div className="space-y-2 w-full">
                                <Label htmlFor={`driver-${order.id}`} className="text-xs">Assign Driver</Label>
                                <Select onValueChange={(driverId) => assignDriver(order.id, driverId)}>
                                  <SelectTrigger id={`driver-${order.id}`} className="h-9 w-full">
                                    <SelectValue placeholder="Select driver..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {drivers.map(driver => (
                                      <SelectItem key={driver.id} value={driver.id}>
                                        {driver.name} ({driver.home_zipcode})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {order.fulfillment_status === 'driver_assigned' && (
                              <Button size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')} className="w-full whitespace-nowrap">
                                Start Preparing
                              </Button>
                            )}
                            {order.fulfillment_status === 'pending' && (
                              <Button size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')} className="w-full whitespace-nowrap">
                                Mark Preparing
                              </Button>
                            )}
                            {order.fulfillment_status === 'preparing' && (
                              <Button size="sm" onClick={() => updateOrderStatus(order.id, 'out_for_delivery')} className="w-full whitespace-nowrap">
                                Out for Delivery
                              </Button>
                            )}
                            {order.fulfillment_status === 'out_for_delivery' && (
                              <Button size="sm" onClick={() => updateOrderStatus(order.id, 'delivered')} className="w-full whitespace-nowrap">
                                Mark Delivered
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Subscriptions</CardTitle>
                  <CardDescription>Manage bi-weekly subscription deliveries</CardDescription>
                </div>
                <Button
                  onClick={() => generateSubscriptionOrders()}
                  disabled={isGeneratingOrders}
                >
                  {isGeneratingOrders ? "Generating..." : "Generate Today's Orders"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No active subscriptions</p>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map(subscription => (
                    <Card key={subscription.id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex flex-col gap-4">
                          {/* Header with user info and status */}
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">
                                  {subscription.user_name || subscription.user_email}
                                </h3>
                                <Badge variant="outline">
                                  {subscription.billing_cycle === 'weekly' && subscription.interval_count === 2
                                    ? 'Bi-Weekly'
                                    : subscription.billing_cycle}
                                </Badge>
                                {subscription.plan_type && (
                                  <Badge variant="secondary">
                                    {subscription.plan_type}
                                    {subscription.topper_level && ` (${subscription.topper_level}%)`}
                                  </Badge>
                                )}
                              </div>
                              {subscription.user_name && (
                                <p className="text-sm text-muted-foreground">{subscription.user_email}</p>
                              )}
                            </div>
                            <Badge className="bg-green-100 text-green-800 w-fit h-fit">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {subscription.status}
                            </Badge>
                          </div>

                          {/* Dogs */}
                          {subscription.dogs.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Dogs:</p>
                              <div className="flex flex-wrap gap-2">
                                {subscription.dogs.map(dog => (
                                  <Badge key={dog.id} variant="outline" className="text-xs">
                                    {dog.name}
                                    {dog.breed && ` - ${dog.breed}`}
                                    {dog.weight && ` (${dog.weight}${dog.weight_unit})`}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recipes */}
                          {subscription.recipes.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Recipes:</p>
                              <div className="flex flex-wrap gap-2">
                                {subscription.recipes.map(recipe => (
                                  <Badge key={recipe.id} variant="outline" className="text-xs bg-blue-50">
                                    {recipe.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Delivery info */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm border-t pt-4">
                            <div>
                              <strong>Next Delivery:</strong>{' '}
                              {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            {subscription.delivery_zipcode && (
                              <div>
                                <strong>Zipcode:</strong> {subscription.delivery_zipcode}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground sm:col-span-2">
                              <strong>Stripe ID:</strong> {subscription.stripe_subscription_id}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle>Today's Deliveries</CardTitle>
              <CardDescription>Orders scheduled for delivery today</CardDescription>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant={dateFilter === 'today' ? 'default' : 'outline'}
                  onClick={() => setDateFilter('today')}
                >
                  Today
                </Button>
                <Button
                  size="sm"
                  variant={dateFilter === 'upcoming' ? 'default' : 'outline'}
                  onClick={() => setDateFilter('upcoming')}
                >
                  Upcoming
                </Button>
                <Button
                  size="sm"
                  variant={dateFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setDateFilter('all')}
                >
                  All Deliveries
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todayOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No deliveries scheduled</p>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    // Group orders by driver zipcode
                    const grouped = todayOrders.reduce((acc, order) => {
                      const driverZip = order.driver_home_zipcode || 'unassigned'
                      if (!acc[driverZip]) acc[driverZip] = []
                      acc[driverZip].push(order)
                      return acc
                    }, {} as Record<string, Order[]>)

                    // Sort each driver's orders by distance
                    Object.keys(grouped).forEach(driverZip => {
                      if (driverZip !== 'unassigned') {
                        grouped[driverZip] = sortOrdersByDistance(grouped[driverZip], driverZip)
                      }
                    })

                    return Object.entries(grouped).map(([driverZip, orders]) => {
                      const hasManualRoute = orders.some(o => o.route_override)
                      return (
                      <div key={driverZip} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            {driverZip === 'unassigned'
                              ? `Unassigned Deliveries (${orders.length})`
                              : `Driver Route (${driverZip}) - ${orders.length} deliveries`}
                            {hasManualRoute && driverZip !== 'unassigned' && (
                              <Badge variant="secondary" className="ml-2">Manual Route</Badge>
                            )}
                          </h3>
                          {driverZip !== 'unassigned' && hasManualRoute && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resetRouteToAutomatic(driverZip)}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reset to Auto
                            </Button>
                          )}
                        </div>
                        <div className="space-y-4">
                          {orders.map((order, idx) => (
                            <Card key={order.id} className="border-2 border-green-200">
                              <CardContent className="pt-6">
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                                  <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      {driverZip !== 'unassigned' && (
                                        <Badge variant="secondary" className="text-xs">Stop #{idx + 1}</Badge>
                                      )}
                                      <h3 className="font-semibold text-sm sm:text-base">Order #{order.order_number}</h3>
                                      {getStatusBadge(order.fulfillment_status)}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {order.recipe_name} × {order.quantity}
                                    </p>
                                    <p className="text-sm">
                                      <strong>Zipcode:</strong> {order.delivery_zipcode}
                                      {driverZip !== 'unassigned' && order.delivery_zipcode && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                          (distance: {calculateZipcodeDistance(driverZip, order.delivery_zipcode)})
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-sm">
                                      <strong>Customer:</strong> {order.guest_email || 'Registered user'}
                                    </p>
                                    {order.driver_name && (
                                      <p className="text-sm">
                                        <strong>Driver:</strong> {order.driver_name}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-2 sm:min-w-[180px]">
                                    {driverZip !== 'unassigned' && (
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => moveOrderInRoute(order.id, 'up', orders)}
                                          disabled={idx === 0}
                                          className="flex-1"
                                        >
                                          <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => moveOrderInRoute(order.id, 'down', orders)}
                                          disabled={idx === orders.length - 1}
                                          className="flex-1"
                                        >
                                          <ArrowDown className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyTrackingLink(order.id, order.tracking_token)}
                                      className="w-full whitespace-nowrap"
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      <span className="hidden sm:inline">Copy Tracking Link</span>
                                      <span className="sm:hidden">Copy Link</span>
                                    </Button>
                                    {order.fulfillment_status === 'preparing' && (
                                      <Button size="sm" onClick={() => updateOrderStatus(order.id, 'out_for_delivery')} className="w-full whitespace-nowrap">
                                        Out for Delivery
                                      </Button>
                                    )}
                                    {order.fulfillment_status === 'out_for_delivery' && (
                                      <Button size="sm" onClick={() => updateOrderStatus(order.id, 'delivered')} className="w-full whitespace-nowrap">
                                        Mark Delivered
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )})
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory</CardTitle>
              <CardDescription>Manage stock levels for individual packs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory.map(item => {
                  const available = item.quantity_on_hand - item.reserved_quantity
                  const isLowStock = available <= item.low_stock_threshold

                  return (
                    <Card key={item.id} className={`border-2 ${isLowStock ? 'border-orange-200' : ''}`}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold capitalize">{item.recipe_name}</h3>
                              {isLowStock && (
                                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                  Low Stock
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              On Hand: {item.quantity_on_hand} | Reserved: {item.reserved_quantity} | Available: {available}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Last updated: {new Date(item.updated_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              defaultValue={item.quantity_on_hand}
                              className="w-20"
                              id={`qty-${item.id}`}
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                const input = document.getElementById(`qty-${item.id}`) as HTMLInputElement
                                updateInventory(item.id, parseInt(input.value))
                              }}
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
