"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface WishlistItem {
  id: string
  type: "recipe" | "addon" | "product"
  name: string
  description: string
  price: number
  image: string
  addedDate: Date
}

export function Wishlist() {
  const { user } = useAuth()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([
    {
      id: "1",
      type: "recipe",
      name: "Salmon & Sweet Potato",
      description: "Premium recipe with wild-caught salmon",
      price: 4.5,
      image: "/placeholder.svg?height=100&width=100",
      addedDate: new Date("2024-11-20"),
    },
    {
      id: "2",
      type: "addon",
      name: "Joint Support Supplement",
      description: "Glucosamine and chondroitin for joint health",
      price: 24.99,
      image: "/placeholder.svg?height=100&width=100",
      addedDate: new Date("2024-11-18"),
    },
  ])

  const handleRemoveItem = (itemId: string) => {
    setWishlistItems((items) => items.filter((item) => item.id !== itemId))
    console.log("[v0] wishlist_item_removed", { itemId })
  }

  const handleAddToCart = (itemId: string) => {
    console.log("[v0] wishlist_item_added_to_cart", { itemId })
    alert("Item added to your next order!")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            My Wishlist ({wishlistItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wishlistItems.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Your wishlist is empty</h3>
              <p className="text-muted-foreground">Save recipes and products you'd like to try later</p>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlistItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-4">
                    <div className="flex gap-4">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{item.type}</Badge>
                              <span className="text-sm text-muted-foreground">
                                Added {item.addedDate.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${item.price}</div>
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" onClick={() => handleAddToCart(item.id)}>
                                <ShoppingCart className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleRemoveItem(item.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
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
    </div>
  )
}
