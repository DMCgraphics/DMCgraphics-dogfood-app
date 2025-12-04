"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Truck, CheckCircle, Clock, AlertCircle, Copy, ExternalLink } from "lucide-react"
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

export default function FulfillmentPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [todayOrders, setTodayOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

      // Fetch pending orders (one-time only, not subscriptions)
      const { data: pending } = await supabase
        .from('orders')
        .select('*')
        .eq('is_subscription_order', false)
        .in('fulfillment_status', ['pending', 'looking_for_driver', 'driver_assigned', 'in_stock', 'needs_batch'])
        .order('created_at', { ascending: false })

      if (pending) setPendingOrders(pending)
      console.log('[FULFILLMENT] Pending orders:', pending?.length || 0)

      // Fetch deliveries based on date filter
      let query = supabase
        .from('orders')
        .select('*')
        .eq('is_subscription_order', false)
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

  const calculateZipcodeDistance = (zip1: string, zip2: string): number => {
    // Simple numeric difference (works well for same geographic region)
    const num1 = parseInt(zip1.replace(/\D/g, '')) || 0
    const num2 = parseInt(zip2.replace(/\D/g, '')) || 0
    return Math.abs(num1 - num2)
  }

  const sortOrdersByDistance = (orders: Order[], driverZipcode: string | null): Order[] => {
    if (!driverZipcode) return orders

    return [...orders].sort((a, b) => {
      const distA = calculateZipcodeDistance(driverZipcode, a.delivery_zipcode || '')
      const distB = calculateZipcodeDistance(driverZipcode, b.delivery_zipcode || '')
      return distA - distB
    })
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

                    return Object.entries(grouped).map(([driverZip, orders]) => (
                      <div key={driverZip} className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Truck className="h-5 w-5" />
                          {driverZip === 'unassigned'
                            ? `Unassigned Deliveries (${orders.length})`
                            : `Driver Route (${driverZip}) - ${orders.length} deliveries`}
                        </h3>
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
                    ))
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
