"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Camera, Edit, Trash2, Plus } from "lucide-react"

interface DogProfile {
  id: string
  name: string
  breed: string
  age: number
  weight: number
  weightUnit: "lb" | "kg"
  avatar: string
  activityLevel: "low" | "moderate" | "high"
  allergies: string[]
  medicalConditions: string[]
  notes: string
}

interface DogProfileManagerProps {
  profiles: DogProfile[]
  onUpdate: (profiles: DogProfile[]) => void
}

export function DogProfileManager({ profiles, onUpdate }: DogProfileManagerProps) {
  const [editingDog, setEditingDog] = useState<DogProfile | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSave = (dogData: Partial<DogProfile>) => {
    if (editingDog) {
      // Update existing dog
      const updatedProfiles = profiles.map((dog) => (dog.id === editingDog.id ? { ...dog, ...dogData } : dog))
      onUpdate(updatedProfiles)
    } else {
      // Add new dog
      const newDog: DogProfile = {
        id: Date.now().toString(),
        name: "",
        breed: "",
        age: 1,
        weight: 20,
        weightUnit: "lb",
        avatar: "/placeholder.svg?height=64&width=64",
        activityLevel: "moderate",
        allergies: [],
        medicalConditions: [],
        notes: "",
        ...dogData,
      }
      onUpdate([...profiles, newDog])
    }
    setEditingDog(null)
    setIsDialogOpen(false)
  }

  const handleDelete = (dogId: string) => {
    if (confirm("Are you sure you want to delete this dog profile?")) {
      const updatedProfiles = profiles.filter((dog) => dog.id !== dogId)
      onUpdate(updatedProfiles)
    }
  }

  const openEditDialog = (dog?: DogProfile) => {
    setEditingDog(dog || null)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dog Profiles</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Dog
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingDog ? "Edit Dog Profile" : "Add New Dog"}</DialogTitle>
            </DialogHeader>
            <DogProfileForm dog={editingDog} onSave={handleSave} onCancel={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map((dog) => (
          <Card key={dog.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={dog.avatar || "/placeholder.svg"}
                    alt={dog.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0 bg-transparent"
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{dog.name}</h4>
                      <p className="text-sm text-muted-foreground">{dog.breed}</p>
                      <p className="text-sm text-muted-foreground">
                        {dog.age} years old • {dog.weight} {dog.weightUnit}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(dog)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(dog.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <Badge variant="secondary" className="text-xs">
                      {dog.activityLevel} activity
                    </Badge>
                    {dog.allergies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {dog.allergies.map((allergy) => (
                          <Badge key={allergy} variant="outline" className="text-xs">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function DogProfileForm({
  dog,
  onSave,
  onCancel,
}: {
  dog: DogProfile | null
  onSave: (data: Partial<DogProfile>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: dog?.name || "",
    breed: dog?.breed || "",
    age: dog?.age || 1,
    weight: dog?.weight || 20,
    weightUnit: dog?.weightUnit || ("lb" as const),
    activityLevel: dog?.activityLevel || ("moderate" as const),
    notes: dog?.notes || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="breed">Breed</Label>
          <Input
            id="breed"
            value={formData.breed}
            onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            min="0"
            max="25"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: Number.parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Weight</Label>
          <Input
            id="weight"
            type="number"
            min="1"
            max="200"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: Number.parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weightUnit">Unit</Label>
          <Select
            value={formData.weightUnit}
            onValueChange={(value: "lb" | "kg") => setFormData({ ...formData, weightUnit: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lb">Pounds</SelectItem>
              <SelectItem value="kg">Kilograms</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="activity">Activity Level</Label>
        <Select
          value={formData.activityLevel}
          onValueChange={(value: "low" | "moderate" | "high") => setFormData({ ...formData, activityLevel: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low - Mostly indoor, short walks</SelectItem>
            <SelectItem value="moderate">Moderate - Daily walks, some play</SelectItem>
            <SelectItem value="high">High - Very active, lots of exercise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any additional notes about your dog..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
