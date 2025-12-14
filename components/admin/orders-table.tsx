"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Package, Calendar, ChevronLeft, ChevronRight, Edit } from "lucide-react"
import { EditSubscriptionRecipesDialog } from "@/components/admin/edit-subscription-recipes-dialog"

interface OrdersTableProps {
  orders: any[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [editRecipesOpen, setEditRecipesOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [filters, setFilters] = useState({
    zipcode: "",
    breed: "all",
    subscriptionStatus: "all",
    recipe: "all",
    orderType: "all",
    dateFrom: "",
    dateTo: ""
  })

  const itemsPerPage = 10

  // Get unique values for filters
  const { uniqueBreeds, uniqueRecipes } = useMemo(() => {
    const breeds = new Set<string>()
    const recipes = new Set<string>()

    orders.forEach(order => {
      if (order.dogs?.breed) breeds.add(order.dogs.breed)
      order.plan_items?.forEach((item: any) => {
        if (item.recipes?.name) recipes.add(item.recipes.name)
      })
    })

    return {
      uniqueBreeds: Array.from(breeds).sort(),
      uniqueRecipes: Array.from(recipes).sort()
    }
  }, [orders])

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Order type filter
      if (filters.orderType !== "all") {
        if (filters.orderType === "plan" && order.order_type !== "plan") {
          return false
        }
        if (filters.orderType === "topper" && order.order_type !== "topper") {
          return false
        }
        if (filters.orderType === "individual-pack" && order.order_type !== "individual-pack") {
          return false
        }
      }

      // Zipcode filter (only applies to plans with delivery_zipcode)
      if (filters.zipcode && order.delivery_zipcode && !order.delivery_zipcode.includes(filters.zipcode)) {
        return false
      }

      // Breed filter
      if (filters.breed !== "all" && order.dogs?.breed !== filters.breed) {
        return false
      }

      // Subscription status filter
      if (filters.subscriptionStatus !== "all") {
        const subscription = order.subscriptions?.[0]
        if (filters.subscriptionStatus === "none" && subscription) {
          return false
        }
        if (filters.subscriptionStatus !== "none" && subscription?.status !== filters.subscriptionStatus) {
          return false
        }
      }

      // Recipe filter (only applies to plans)
      if (filters.recipe !== "all") {
        const hasRecipe = order.plan_items?.some((item: any) =>
          item.recipes?.name === filters.recipe
        )
        if (!hasRecipe) return false
      }

      // Date from filter
      if (filters.dateFrom) {
        const orderDate = new Date(order.created_at)
        const fromDate = new Date(filters.dateFrom)
        if (orderDate < fromDate) return false
      }

      // Date to filter
      if (filters.dateTo) {
        const orderDate = new Date(order.created_at)
        const toDate = new Date(filters.dateTo)
        toDate.setHours(23, 59, 59) // End of day
        if (orderDate > toDate) return false
      }

      return true
    })
  }, [orders, filters])

  // Paginate
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when filters change
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters({
      zipcode: "",
      breed: "all",
      subscriptionStatus: "all",
      recipe: "all",
      orderType: "all",
      dateFrom: "",
      dateTo: ""
    })
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter orders by criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipcode">ZIP Code</Label>
              <Input
                id="zipcode"
                placeholder="Enter ZIP code"
                value={filters.zipcode}
                onChange={(e) => handleFilterChange("zipcode", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">Dog Breed</Label>
              <Select value={filters.breed} onValueChange={(value) => handleFilterChange("breed", value)}>
                <SelectTrigger id="breed">
                  <SelectValue placeholder="All breeds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All breeds</SelectItem>
                  {uniqueBreeds.map(breed => (
                    <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription">Subscription Status</Label>
              <Select value={filters.subscriptionStatus} onValueChange={(value) => handleFilterChange("subscriptionStatus", value)}>
                <SelectTrigger id="subscription">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="none">No subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderType">Order Type</Label>
              <Select value={filters.orderType} onValueChange={(value) => handleFilterChange("orderType", value)}>
                <SelectTrigger id="orderType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="plan">Full Meal Plans</SelectItem>
                  <SelectItem value="topper">Topper Subscriptions</SelectItem>
                  <SelectItem value="individual-pack">Individual/3-Pack Purchases</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipe">Recipe</Label>
              <Select value={filters.recipe} onValueChange={(value) => handleFilterChange("recipe", value)}>
                <SelectTrigger id="recipe">
                  <SelectValue placeholder="All recipes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All recipes</SelectItem>
                  {uniqueRecipes.map(recipe => (
                    <SelectItem key={recipe} value={recipe}>{recipe}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {paginatedOrders.length} of {filteredOrders.length} orders
          {filteredOrders.length !== orders.length && ` (filtered from ${orders.length} total)`}
        </p>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Orders list */}
      <div className="grid gap-4">
        {paginatedOrders.map((order) => {
          const subscription = order.subscriptions?.[0]
          const dog = order.dogs
          const profile = order.profiles
          const planItems = order.plan_items || []
          const isTopper = order.order_type === "topper"
          const isIndividualPack = order.order_type === "individual-pack"

          return (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {isIndividualPack
                        ? dog?.name
                          ? `${order.product_type === '3-packs' ? '3-Pack' : 'Individual Pack'} Purchase for ${dog.name}`
                          : `${order.product_type === '3-packs' ? '3-Pack' : 'Individual Pack'} Purchase`
                        : isTopper
                          ? `Topper Subscription for ${dog?.name || "Unknown Dog"}`
                          : `Full Meal Plan for ${dog?.name || "Unknown Dog"}`}
                      <Badge
                        className={
                          order.status === "active"
                            ? "bg-green-100 text-green-800"
                            : order.status === "paused"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "paid"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {order.status}
                      </Badge>
                      {isTopper && (
                        <Badge className="bg-purple-100 text-purple-800">
                          {order.topper_level}% Topper
                        </Badge>
                      )}
                      {isIndividualPack && (
                        <Badge className="bg-blue-100 text-blue-800">
                          One-Time Purchase
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Customer: {profile?.full_name || "Unknown"}
                      {profile?.email && ` (${profile.email})`}
                      {!profile?.email && order.user_email && ` (${order.user_email})`}
                      {" • Created "}
                      {new Date(order.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    {!isTopper && !isIndividualPack && (
                      <>
                        <div className="text-2xl font-bold">
                          ${((order.total_cents || 0) / 100).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {order.snapshot?.billing_cycle === 'every_2_weeks' ? 'every 2 weeks' : 'per week'}
                        </div>
                      </>
                    )}
                    {isTopper && (
                      <Badge className="bg-purple-50 text-purple-700 text-sm">
                        Bi-weekly Subscription
                      </Badge>
                    )}
                    {isIndividualPack && (
                      <>
                        <div className="text-2xl font-bold">
                          ${((order.total_cents || 0) / 100).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">one-time</div>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {!isTopper && (
                      <div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Plan Items
                        </div>
                        <div className="text-lg font-bold">{planItems.length}</div>
                      </div>
                    )}
                    {isTopper && (
                      <div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Product Type
                        </div>
                        <div className="text-lg font-bold">{order.topper_level}% Topper</div>
                      </div>
                    )}
                    {!isTopper && (
                      <div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Delivery ZIP
                        </div>
                        <div className="text-lg font-bold">
                          {order.delivery_zipcode || "Not set"}
                        </div>
                      </div>
                    )}
                    {isTopper && (
                      <div>
                        <div className="text-sm text-gray-600">Frequency</div>
                        <div className="text-lg font-bold">Every 2 weeks</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-600">Dog</div>
                      <div className="text-sm font-medium">
                        {dog?.breed} • {dog?.weight} {dog?.weight_unit || "lbs"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Subscription</div>
                      <div className="text-sm">
                        {subscription ? (
                          <Badge
                            className={
                              subscription.status === "active"
                                ? "bg-green-100 text-green-800"
                                : subscription.status === "paused"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {subscription.status}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">No subscription</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recipe Details - only for plans */}
                  {!isTopper && planItems.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium">Recipes:</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPlan(order)
                            setEditRecipesOpen(true)
                          }}
                          className="h-7"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {planItems.map((item: any) => {
                          // Check if this plan item has multiple recipes in metadata
                          const recipeVariety = item.meta?.recipe_variety
                          const hasVariety = recipeVariety && recipeVariety.length > 1

                          return (
                            <div key={item.id} className="text-sm text-gray-600">
                              {hasVariety ? (
                                // Multiple recipes - show all from metadata (no pricing for subscriptions)
                                <div>
                                  {recipeVariety.map((recipe: any, idx: number) => (
                                    <div key={idx}>
                                      • {recipe.name}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                // Single recipe - show without pricing for subscriptions
                                <div>
                                  • {item.recipes?.name || "Unknown recipe"}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recipe Details - for topper subscriptions */}
                  {isTopper && subscription?.metadata?.recipes && (
                    <div className="border-t pt-4">
                      <div className="text-sm font-medium mb-2">Recipes:</div>
                      <div className="space-y-1">
                        {(() => {
                          try {
                            const recipes = JSON.parse(subscription.metadata.recipes)
                            if (Array.isArray(recipes) && recipes.length > 0) {
                              return recipes.map((recipe: any, idx: number) => (
                                <div key={idx} className="text-sm text-gray-600">
                                  • {recipe.name || recipe}
                                </div>
                              ))
                            }
                          } catch (e) {
                            console.error("Error parsing topper recipes:", e)
                          }
                          return <div className="text-sm text-gray-600">No recipes specified</div>
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Recipe Details - for individual/3-pack purchases */}
                  {isIndividualPack && (
                    <div className="border-t pt-4">
                      <div className="text-sm font-medium mb-2">
                        {order.product_type === '3-packs' ? 'Recipes (3-Pack):' : 'Recipe:'}
                      </div>
                      <div className="space-y-1">
                        {(() => {
                          // First try to get recipes from the recipes array
                          if (order.recipes && Array.isArray(order.recipes) && order.recipes.length > 0) {
                            return order.recipes.map((recipe: any, idx: number) => (
                              <div key={idx} className="text-sm text-gray-600">
                                • {recipe.name || recipe}
                              </div>
                            ))
                          }
                          // Fall back to recipe_name if available
                          if (order.recipe_name) {
                            return (
                              <div className="text-sm text-gray-600">
                                • {order.recipe_name}
                              </div>
                            )
                          }
                          return <div className="text-sm text-gray-600">No recipe specified</div>
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Stripe Info - for subscriptions */}
                  {subscription?.stripe_subscription_id && (
                    <div className="border-t pt-4">
                      <div className="text-xs text-gray-500 font-mono">
                        Stripe: {subscription.stripe_subscription_id}
                      </div>
                      {subscription.current_period_end && (
                        <div className="text-xs text-gray-500">
                          Next billing:{" "}
                          {new Date(subscription.current_period_end).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stripe Info - for individual/3-pack purchases */}
                  {isIndividualPack && order.payment_intent_id && (
                    <div className="border-t pt-4">
                      <div className="text-xs text-gray-500 font-mono">
                        Payment Intent: {order.payment_intent_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        Purchased: {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {paginatedOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No orders found matching your filters</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Recipes Dialog */}
      {selectedPlan && (
        <EditSubscriptionRecipesDialog
          open={editRecipesOpen}
          onOpenChange={setEditRecipesOpen}
          planId={selectedPlan.id}
          userId={selectedPlan.user_id}
          currentRecipes={selectedPlan.plan_items
            ?.map((item: any) => item.recipes)
            .filter(Boolean) || []}
          onSuccess={() => {
            // Refresh the page to show updated recipes
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
