"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus, PawPrint, Edit, Trash2, Settings } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface Dog {
  id: string
  name: string
  breed: string
  age: number
  weight: number
  allergies?: string[]
  conditions?: string[]
}

interface DogSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectDog: (dog: Dog | null) => void
  isSubscriptionManagement?: boolean
  incompletePlans?: string[]
}

export function DogSelectionModal({
  open,
  onOpenChange,
  onSelectDog,
  isSubscriptionManagement = false,
  incompletePlans = [],
}: DogSelectionModalProps) {
  const { user } = useAuth()
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && user) {
      fetchDogs()
    }
  }, [open, user])

  const fetchDogs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("dogs")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching dogs:", error)
        return
      }

      const transformedDogs: Dog[] =
        data?.map((dog) => ({
          id: dog.id,
          name: dog.name,
          breed: dog.breed,
          age: dog.age,
          weight: Math.round(dog.weight * 2.20462), // Convert kg to lbs
          allergies: dog.allergies || [],
          conditions: dog.conditions || [],
        })) || []

      setDogs(transformedDogs)
    } catch (error) {
      console.error("[v0] Error in fetchDogs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectExistingDog = (dog: Dog) => {
    console.log("[v0] Selected existing dog:", dog)
    onSelectDog(dog)
    onOpenChange(false)
  }

  const handleCreateNewDog = () => {
    console.log("[v0] Creating new dog")
    onSelectDog(null)
    onOpenChange(false)
  }

  const handleEditDogPlan = (dog: Dog) => {
    console.log("[v0] Editing plan for dog:", dog)
    localStorage.setItem("nouripet-selected-dog", JSON.stringify(dog))
    window.location.href = "/plan-builder"
    onOpenChange(false)
  }

  const handleRemoveDogFromSubscription = (dog: Dog) => {
    console.log("[v0] Removing dog from subscription:", dog)
    // This would call an API to remove the dog from the subscription
    alert(`Remove ${dog.name} from subscription - API call would go here`)
  }

  const handleCancelSubscription = () => {
    console.log("[v0] Canceling entire subscription")
    // This would call an API to cancel the subscription
    alert("Cancel entire subscription - API call would go here")
  }

  const handleAddDogToSubscription = () => {
    console.log("[v0] Adding new dog to subscription")
    onSelectDog(null)
    onOpenChange(false)
  }

  const getModalTitle = () => {
    if (isSubscriptionManagement) {
      return "Manage Your Subscription"
    }
    if (incompletePlans.length > 1) {
      return "Choose Plan to Continue"
    }
    return "Choose Your Dog"
  }

  const getModalDescription = () => {
    if (isSubscriptionManagement) {
      return "Edit plans, add/remove dogs, or manage your subscription"
    }
    if (incompletePlans.length > 1) {
      return "You have multiple incomplete plans. Choose which one to continue:"
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">{getModalTitle()}</DialogTitle>
          {getModalDescription() && <p className="text-muted-foreground">{getModalDescription()}</p>}
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {dogs.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">
                    {isSubscriptionManagement
                      ? "Your dogs in this subscription:"
                      : incompletePlans.length > 1
                        ? "Incomplete plans:"
                        : "Select an existing dog:"}
                  </h3>
                  <div className="grid gap-3 max-h-60 overflow-y-auto">
                    {dogs
                      .filter((dog) => {
                        if (incompletePlans.length > 1) {
                          return incompletePlans.includes(dog.id)
                        }
                        return true
                      })
                      .map((dog) => (
                        <Card
                          key={dog.id}
                          className="cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => !isSubscriptionManagement && handleSelectExistingDog(dog)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src="/placeholder.svg?height=48&width=48" />
                                <AvatarFallback>
                                  <PawPrint className="h-6 w-6" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-semibold">{dog.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {dog.breed} • {dog.age} years old • {dog.weight} lbs
                                </p>
                                {dog.allergies && dog.allergies.length > 0 && (
                                  <p className="text-xs text-orange-600 mt-1">Allergies: {dog.allergies.join(", ")}</p>
                                )}
                                {incompletePlans.includes(dog.id) && (
                                  <p className="text-xs text-blue-600 mt-1">Plan incomplete - ready for checkout</p>
                                )}
                              </div>
                              {isSubscriptionManagement && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditDogPlan(dog)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveDogFromSubscription(dog)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              {isSubscriptionManagement && (
                <div className="border-t pt-6 space-y-4">
                  <div className="flex gap-3">
                    <Button onClick={handleAddDogToSubscription} className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Dog to Subscription
                    </Button>
                    <Button variant="outline" onClick={handleCancelSubscription} className="flex-1 bg-transparent">
                      <Settings className="h-4 w-4 mr-2" />
                      Cancel Subscription
                    </Button>
                  </div>
                </div>
              )}

              {!isSubscriptionManagement && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Or create a plan for a new dog:</h3>
                  <Card
                    className="cursor-pointer hover:bg-accent transition-colors border-dashed"
                    onClick={handleCreateNewDog}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Add New Dog</h4>
                          <p className="text-sm text-muted-foreground">Start fresh with a new dog profile</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
