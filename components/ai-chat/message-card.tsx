"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, ExternalLink, ChefHat, Heart, Activity, AlertCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export type CardType = "order_card" | "recipe_card" | "dog_profile_card"

export interface OrderCardData {
  orderId: string
  orderNumber: string
  status: string
  fulfillmentStatus: string
  estimatedDelivery?: string
  trackingUrl?: string
  trackingToken?: string
}

export interface RecipeCardData {
  name: string
  description: string
  protein?: number
  fat?: number
  slug?: string
}

export interface DogProfileCardData {
  name: string
  breed: string
  age: string
  weight: number
  activityLevel: string
  allergens?: string[]
  healthGoals?: string[]
}

interface MessageCardProps {
  type: CardType
  data: OrderCardData | RecipeCardData | DogProfileCardData
}

export function MessageCard({ type, data }: MessageCardProps) {
  switch (type) {
    case "order_card":
      return <OrderCard data={data as OrderCardData} />
    case "recipe_card":
      return <RecipeCard data={data as RecipeCardData} />
    case "dog_profile_card":
      return <DogProfileCard data={data as DogProfileCardData} />
    default:
      return null
  }
}

function OrderCard({ data }: { data: OrderCardData }) {
  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    if (normalizedStatus.includes("delivered")) return "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-800"
    if (normalizedStatus.includes("transit") || normalizedStatus.includes("out_for_delivery")) return "bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800"
    if (normalizedStatus.includes("preparing") || normalizedStatus.includes("processing")) return "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800"
    return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700"
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const trackingLink = data.trackingUrl || (data.trackingToken ? `/orders/${data.orderId}/track?token=${data.trackingToken}` : null)

  return (
    <Card className="mt-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white flex-shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  Order #{data.orderNumber}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Order ID: {data.orderId.slice(0, 8)}...
                </p>
              </div>
              <Badge className={cn("text-xs font-medium", getStatusColor(data.fulfillmentStatus))}>
                {formatStatus(data.fulfillmentStatus)}
              </Badge>
            </div>

            {data.estimatedDelivery && (
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                Estimated delivery: {data.estimatedDelivery}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              {trackingLink && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-xs border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                >
                  <Link href={trackingLink} className="flex items-center gap-1.5">
                    <ExternalLink className="h-3 w-3" />
                    Track Order
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                <Link href="/dashboard" className="flex items-center gap-1.5">
                  View All Orders
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RecipeCard({ data }: { data: RecipeCardData }) {
  return (
    <Card className="mt-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white flex-shrink-0">
            <ChefHat className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
              {data.name}
            </h4>
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
              {data.description}
            </p>

            {(data.protein !== undefined || data.fat !== undefined) && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {data.protein !== undefined && (
                  <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700">
                    {data.protein}% Protein
                  </Badge>
                )}
                {data.fat !== undefined && (
                  <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700">
                    {data.fat}% Fat
                  </Badge>
                )}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs w-full sm:w-auto border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
            >
              <Link href={data.slug ? `/recipes/${data.slug}` : "/recipes"} className="flex items-center gap-1.5 justify-center">
                <ExternalLink className="h-3 w-3" />
                View Full Recipe
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DogProfileCard({ data }: { data: DogProfileCardData }) {
  return (
    <Card className="mt-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-white flex-shrink-0">
            <Heart className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
              {data.name}
            </h4>
            <div className="text-xs text-gray-700 dark:text-gray-300 mb-2 space-y-0.5">
              <p>{data.breed} • {data.age} • {data.weight}lbs</p>
              <p className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {data.activityLevel.charAt(0).toUpperCase() + data.activityLevel.slice(1)} activity
              </p>
            </div>

            {data.allergens && data.allergens.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Allergens:
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {data.allergens.map((allergen) => (
                    <Badge
                      key={allergen}
                      variant="outline"
                      className="text-xs bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700"
                    >
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data.healthGoals && data.healthGoals.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Health Goals:</p>
                <div className="flex gap-1.5 flex-wrap">
                  {data.healthGoals.map((goal) => (
                    <Badge
                      key={goal}
                      variant="outline"
                      className="text-xs bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                    >
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs w-full sm:w-auto border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30"
            >
              <Link href="/plan-builder" className="flex items-center gap-1.5 justify-center">
                <ExternalLink className="h-3 w-3" />
                Update Profile
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
