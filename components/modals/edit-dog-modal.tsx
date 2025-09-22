"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhotoUpload } from "@/components/ui/photo-upload"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface Dog {
  id: string
  name: string
  breed: string
  age: number
  weight: number
  avatar_url?: string
  allergies?: string[]
  conditions?: string[]
}

interface EditDogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dogId: string | null
  onDogUpdated: () => void
}

export function EditDogModal({ open, onOpenChange, dogId, onDogUpdated }: EditDogModalProps) {
  const { user } = useAuth()
  const [dog, setDog] = useState<Dog | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    age: 1,
    weight: 10,
    allergies: "",
    conditions: "",
  })
  const [dogPhotoUrl, setDogPhotoUrl] = useState("")

  // Fetch dog data when modal opens
  useEffect(() => {
    if (open && dogId && user) {
      fetchDog()
    }
  }, [open, dogId, user])

  const fetchDog = async () => {
    if (!dogId || !user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("dogs")
        .select("*")
        .eq("id", dogId)
        .eq("user_id", user.id)
        .single()

      if (error) {
        console.error("Error fetching dog:", error)
        return
      }

      if (data) {
        setDog(data)
        setFormData({
          name: data.name || "",
          breed: data.breed || "",
          age: data.age || 1,
          weight: Math.round(data.weight * 2.20462), // Convert kg to lbs
          allergies: (data.allergies || []).join(", "),
          conditions: (data.conditions || []).join(", "),
        })
        setDogPhotoUrl(data.avatar_url || "")
      }
    } catch (error) {
      console.error("Error in fetchDog:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dog || !user) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from("dogs")
        .update({
          name: formData.name,
          breed: formData.breed,
          age: formData.age,
          weight: formData.weight / 2.20462, // Convert lbs to kg
          avatar_url: dogPhotoUrl,
          allergies: formData.allergies
            ? formData.allergies
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          conditions: formData.conditions
            ? formData.conditions
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", dog.id)
        .eq("user_id", user.id)

      if (error) throw error

      console.log("[v0] dog_updated", { dogId: dog.id })
      onDogUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating dog:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDogPhotoUpload = (photoUrl: string) => {
    console.log('Dog photo uploaded:', { photoUrl, dogId })
    setDogPhotoUrl(photoUrl)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">Edit Dog Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dog Photo Upload */}
            <div className="flex items-center gap-4">
              <PhotoUpload
                currentPhotoUrl={dogPhotoUrl}
                onPhotoUploaded={handleDogPhotoUpload}
                uploadEndpoint="/api/upload/dog-photo"
                additionalData={dog?.id ? { dogId: dog.id } : {}}
                size="lg"
                shape="circle"
                placeholder="Upload dog photo"
              />
              <div>
                <h3 className="font-medium">Edit {dog?.name || "Dog"}</h3>
                <p className="text-sm text-muted-foreground">Upload a photo of your dog</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dogName">Name</Label>
                <Input
                  id="dogName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dogBreed">Breed</Label>
                <Input
                  id="dogBreed"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dogAge">Age (years)</Label>
                <Input
                  id="dogAge"
                  type="number"
                  min="0"
                  max="30"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number.parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dogWeight">Weight (lbs)</Label>
                <Input
                  id="dogWeight"
                  type="number"
                  min="1"
                  max="300"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: Number.parseInt(e.target.value) || 10 })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dogAllergies">Allergies (comma-separated)</Label>
              <Input
                id="dogAllergies"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="e.g., chicken, beef, wheat"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dogConditions">Medical Conditions (comma-separated)</Label>
              <Input
                id="dogConditions"
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                placeholder="e.g., diabetes, arthritis"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Update Dog"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
