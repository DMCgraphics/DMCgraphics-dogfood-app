"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"

interface AddDogProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDogCreated?: () => void
}

export function AddDogProfileModal({ open, onOpenChange, onDogCreated }: AddDogProfileModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    weight: "",
    age: "",
    sex: "male" as "male" | "female",
    is_neutered: "yes" as "yes" | "no",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("Not authenticated")
      }

      // Create dog in database
      const { data: dogData, error: dogError } = await supabase
        .from("dogs")
        .insert({
          user_id: user.id,
          name: formData.name,
          breed: formData.breed,
          weight: parseFloat(formData.weight),
          weight_unit: "lb",
          age: parseInt(formData.age),
          age_unit: "years",
          sex: formData.sex,
          is_neutered: formData.is_neutered === "yes",
        })
        .select()
        .single()

      if (dogError) {
        console.error("Error creating dog:", dogError)
        throw new Error("Failed to create dog profile")
      }

      console.log("[AddDogProfileModal] Dog created:", dogData)

      // Now update the user's subscriptions with the dog information
      const response = await fetch("/api/subscriptions/link-dog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dogId: dogData.id,
          dogName: formData.name,
          dogWeight: parseFloat(formData.weight),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error linking dog to subscription:", errorData)
        // Don't throw here - the dog was created successfully, just log the error
        console.warn("Dog created but failed to link to subscription - admin may need to manually fix")
      } else {
        console.log("[AddDogProfileModal] Successfully linked dog to subscription")
      }

      // Close modal and trigger refresh
      onOpenChange(false)
      if (onDogCreated) {
        onDogCreated()
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error)
      alert(error instanceof Error ? error.message : "Failed to create dog profile")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Tell us about your dog so we can personalize your subscription and track their health.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Dog's Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Max"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breed">Breed *</Label>
              <Input
                id="breed"
                required
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                placeholder="e.g., Labrador"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                required
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="e.g., 65"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age (years) *</Label>
              <Input
                id="age"
                type="number"
                required
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="e.g., 5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Sex *</Label>
              <Select value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value as "male" | "female" })}>
                <SelectTrigger id="sex">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_neutered">Spayed/Neutered *</Label>
            <Select value={formData.is_neutered} onValueChange={(value) => setFormData({ ...formData, is_neutered: value as "yes" | "no" })}>
              <SelectTrigger id="is_neutered">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Dog Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
