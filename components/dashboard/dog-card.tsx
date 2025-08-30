"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Calendar, Weight, Activity } from "lucide-react"

interface DogProfile {
  id: string
  name: string
  breed: string
  age: number
  weight: number
  weightUnit: "lb" | "kg"
  avatar?: string
  currentRecipe: string
  nextDelivery: string
  subscriptionStatus: "active" | "paused" | "cancelled"
}

interface DogCardProps {
  dog: DogProfile
  onEdit: (dogId: string) => void
}

export function DogCard({ dog, onEdit }: DogCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary text-primary-foreground"
      case "paused":
        return "bg-orange-500 text-white"
      case "cancelled":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={dog.avatar || "/placeholder.svg"} alt={dog.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {dog.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{dog.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {dog.breed} • {dog.age} years old
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEdit(dog.id)}>
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
      </CardContent>
    </Card>
  )
}
