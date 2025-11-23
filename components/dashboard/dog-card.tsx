"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Calendar, Weight, Activity, Check, ShoppingBag, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DogProfile {
  id: string
  name: string
  breed: string
  age: number
  weight: number
  weightUnit: "lb" | "kg"
  avatar?: string
  avatar_url?: string
  currentRecipe: string
  nextDelivery: string
  subscriptionStatus: "active" | "paused" | "cancelled" | "inactive"
}

interface DogCardProps {
  dog: DogProfile
  onEdit: (dogId: string) => void
  onDelete?: (dogId: string) => Promise<void>
  onSelect?: (dogId: string) => void
  isSelected?: boolean
  showSelection?: boolean
}

export function DogCard({ dog, onEdit, onDelete, onSelect, isSelected = false, showSelection = false }: DogCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary text-primary-foreground"
      case "paused":
        return "bg-orange-500 text-white"
      case "cancelled":
        return "bg-muted text-muted-foreground"
      case "inactive":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleCardClick = () => {
    if (showSelection && onSelect) {
      onSelect(dog.id)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(dog.id)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-200",
        showSelection && "cursor-pointer",
        isSelected && "ring-2 ring-primary ring-offset-2",
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={dog.avatar_url || dog.avatar || "/placeholder.svg"} alt={dog.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {dog.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isSelected && showSelection && (
                <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {dog.name}
                {isSelected && showSelection && (
                  <Badge variant="secondary" className="text-xs">
                    Selected
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {dog.breed} • {dog.age} years old
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(dog.id)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Weight className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">
                {dog.weight} {dog.weightUnit}
              </div>
              <div className="text-xs text-muted-foreground">Current weight</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{dog.currentRecipe}</div>
              <div className="text-xs text-muted-foreground">Current recipe</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Next delivery</div>
              <div className="text-xs text-muted-foreground">{dog.nextDelivery}</div>
            </div>
          </div>
          <Badge className={getStatusColor(dog.subscriptionStatus)} variant="secondary">
            {dog.subscriptionStatus}
          </Badge>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Shop
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-background"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <Link href="/shop">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Fresh Food Shop
            </Link>
          </Button>
        </div>

        {showSelection && !isSelected && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Click to view {dog.name}'s detailed tracking
          </div>
        )}
      </CardContent>
    </Card>
  )
}
