"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { BreedSelector } from "@/components/ui/breed-selector"
import { ALL_BREEDS } from "@/lib/data/dog-breeds"

interface DogProfile {
  name: string
  breed?: string
  weight?: number
  weightUnit: "lb" | "kg"
  age?: number
  ageUnit: "months" | "years"
  sex?: "male" | "female"
  isNeutered?: boolean
  activityLevel?: "low" | "moderate" | "high"
  allergies?: string[]
  conditions?: string[]
}

interface DogProfileStepProps {
  dogProfile: DogProfile
  onUpdate: (profile: DogProfile) => void
}

export function DogProfileStep({ dogProfile, onUpdate }: DogProfileStepProps) {
  const updateField = (field: keyof DogProfile, value: any) => {
    onUpdate({ ...dogProfile, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Tell us about your dog</h3>
        <p className="text-sm text-muted-foreground">
          This helps us personalize their meal plan
        </p>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Dog's Name *</Label>
        <Input
          id="name"
          placeholder="Enter your dog's name"
          value={dogProfile.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />
      </div>

      {/* Breed */}
      <div className="space-y-2">
        <Label htmlFor="breed">Breed (Optional)</Label>
        <BreedSelector
          options={ALL_BREEDS}
          value={dogProfile.breed || ""}
          onValueChange={(value) => updateField("breed", value)}
        />
      </div>

      {/* Weight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weight">Weight</Label>
          <Input
            id="weight"
            type="number"
            placeholder="Enter weight"
            value={dogProfile.weight || ""}
            onChange={(e) => updateField("weight", Number.parseFloat(e.target.value) || undefined)}
          />
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={dogProfile.weightUnit === "lb" ? "default" : "outline"}
              onClick={() => updateField("weightUnit", "lb")}
              className="flex-1"
            >
              lb
            </Button>
            <Button
              type="button"
              variant={dogProfile.weightUnit === "kg" ? "default" : "outline"}
              onClick={() => updateField("weightUnit", "kg")}
              className="flex-1"
            >
              kg
            </Button>
          </div>
        </div>
      </div>

      {/* Age */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="Enter age"
            value={dogProfile.age || ""}
            onChange={(e) => updateField("age", Number.parseFloat(e.target.value) || undefined)}
          />
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select
            value={dogProfile.ageUnit}
            onValueChange={(value: "months" | "years") => updateField("ageUnit", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="months">Months</SelectItem>
              <SelectItem value="years">Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sex and Neutered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sex</Label>
          <Select
            value={dogProfile.sex || ""}
            onValueChange={(value: "male" | "female") => updateField("sex", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Spayed/Neutered</Label>
          <Select
            value={dogProfile.isNeutered === undefined ? "" : dogProfile.isNeutered ? "yes" : "no"}
            onValueChange={(value) => updateField("isNeutered", value === "yes")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Activity Level */}
      <div className="space-y-2">
        <Label>Activity Level</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={dogProfile.activityLevel === "low" ? "default" : "outline"}
            onClick={() => updateField("activityLevel", "low")}
          >
            Low
          </Button>
          <Button
            type="button"
            variant={dogProfile.activityLevel === "moderate" ? "default" : "outline"}
            onClick={() => updateField("activityLevel", "moderate")}
          >
            Moderate
          </Button>
          <Button
            type="button"
            variant={dogProfile.activityLevel === "high" ? "default" : "outline"}
            onClick={() => updateField("activityLevel", "high")}
          >
            High
          </Button>
        </div>
      </div>
    </div>
  )
}
