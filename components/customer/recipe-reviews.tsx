"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Star, ThumbsUp, MessageSquare, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  title: string
  content: string
  date: Date
  helpful: number
  dogName: string
  dogBreed: string
  verified: boolean
}

interface RecipeReviewsProps {
  recipeId: string
  recipeName: string
}

export function RecipeReviews({ recipeId, recipeName }: RecipeReviewsProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: "1",
      userId: "user-456",
      userName: "Sarah M.",
      rating: 5,
      title: "Max loves this recipe!",
      content:
        "My Golden Retriever absolutely loves the Low-Fat Chicken & Garden Veggie recipe. His coat is shinier and he has more energy. The portion sizes are perfect and the ingredients look so fresh!",
      date: new Date("2024-11-15"),
      helpful: 12,
      dogName: "Max",
      dogBreed: "Golden Retriever",
      verified: true,
    },
    {
      id: "2",
      userId: "user-789",
      userName: "Mike R.",
      rating: 4,
      title: "Great quality, picky eater approved",
      content:
        "My dog is usually very picky but she finished every bite. The ingredients are clearly high quality. Only reason for 4 stars is the price point, but you get what you pay for.",
      date: new Date("2024-11-10"),
      helpful: 8,
      dogName: "Luna",
      dogBreed: "Border Collie",
      verified: true,
    },
  ])

  const [newReview, setNewReview] = useState({
    rating: 5,
    title: "",
    content: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

  const handleSubmitReview = () => {
    if (!newReview.title || !newReview.content) return

    const review: Review = {
      id: Date.now().toString(),
      userId: user?.id || "",
      userName: user?.name || "Anonymous",
      rating: newReview.rating,
      title: newReview.title,
      content: newReview.content,
      date: new Date(),
      helpful: 0,
      dogName: "Your Dog", // Would come from user's dog profiles
      dogBreed: "Mixed Breed",
      verified: true,
    }

    setReviews([review, ...reviews])
    setNewReview({ rating: 5, title: "", content: "" })
    setIsDialogOpen(false)
    console.log("[v0] recipe_review_submitted", { recipeId, rating: review.rating })
  }

  const handleHelpful = (reviewId: string) => {
    setReviews(reviews.map((review) => (review.id === reviewId ? { ...review, helpful: review.helpful + 1 } : review)))
    console.log("[v0] review_marked_helpful", { reviewId })
  }

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:text-amber-400" : ""}`}
            onClick={() => interactive && onRatingChange?.(star)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer Reviews</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Write a Review</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Review {recipeName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rating</label>
                    {renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Review Title</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder="Summarize your experience"
                      value={newReview.title}
                      onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Review</label>
                    <Textarea
                      placeholder="Tell other pet parents about your experience..."
                      value={newReview.content}
                      onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSubmitReview}>Submit Review</Button>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
            <div>
              {renderStars(Math.round(averageRating))}
              <div className="text-sm text-muted-foreground">
                Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.userName}</span>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {review.dogName} • {review.dogBreed}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {renderStars(review.rating)}
                    <div className="text-sm text-muted-foreground">{review.date.toLocaleDateString()}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">{review.title}</h4>
                  <p className="text-sm text-muted-foreground">{review.content}</p>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHelpful(review.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Helpful ({review.helpful})
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
