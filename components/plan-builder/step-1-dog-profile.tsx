"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { BreedSelector } from "@/components/ui/breed-selector"
import { ALL_BREEDS } from "@/lib/data/dog-breeds"
import { type DogProfile } from "@/lib/nutrition-calculator"

interface Step1Props {
  profile: Partial<DogProfile>
  onUpdate: (updates: Partial<DogProfile>) => void
}

export function Step1DogProfile({ profile, onUpdate }: Step1Props) {
  const breedOptions = ALL_BREEDS

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tell us about your dog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Dog's Name</Label>
            <Input
              id="name"
              placeholder="Enter your dog's name"
              value={profile.name || ""}
              onChange={(e) => onUpdate({ name: e.target.value })}
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
                value={profile.weight || ""}
                onChange={(e) => onUpdate({ weight: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <div className="flex gap-2">
                <Button
                  variant={profile.weightUnit === "lb" ? "default" : "outline"}
                  onClick={() => onUpdate({ weightUnit: "lb" })}
                  className="flex-1"
                >
                  Pounds (lb)
                </Button>
                <Button
                  variant={profile.weightUnit === "kg" ? "default" : "outline"}
                  onClick={() => onUpdate({ weightUnit: "kg" })}
                  className="flex-1"
                >
                  Kilograms (kg)
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
                value={profile.age || ""}
                onChange={(e) => onUpdate({ age: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Age Unit</Label>
              <Select
                value={profile.ageUnit}
                onValueChange={(value: "months" | "years") => onUpdate({ ageUnit: value })}
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

          {/* Sex and Breed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sex</Label>
              <Select value={profile.sex} onValueChange={(value: "male" | "female") => onUpdate({ sex: value })}>
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
              <Label>Breed</Label>
              <BreedSelector
                options={breedOptions}
                value={profile.breed}
                onValueChange={(value) => onUpdate({ breed: value })}
                placeholder="Search for your dog's breed..."
                searchPlaceholder="Type to search breeds..."
                emptyMessage="No breed found. Try a different search term."
              />
            </div>
          </div>

          {/* Activity Level */}
          <div className="space-y-2">
            <Label>Activity Level</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                variant={profile.activity === "low" ? "default" : "outline"}
                onClick={() => onUpdate({ activity: "low" })}
                className="h-auto py-3 px-4 text-center"
              >
                <div className="space-y-1">
                  <div className="font-semibold">Low</div>
                  <div className="text-xs leading-tight whitespace-normal">Mostly indoor, short walks</div>
                </div>
              </Button>
              <Button
                variant={profile.activity === "moderate" ? "default" : "outline"}
                onClick={() => onUpdate({ activity: "moderate" })}
                className="h-auto py-3 px-4 text-center"
              >
                <div className="space-y-1">
                  <div className="font-semibold">Moderate</div>
                  <div className="text-xs leading-tight whitespace-normal">Daily walks, some play</div>
                </div>
              </Button>
              <Button
                variant={profile.activity === "high" ? "default" : "outline"}
                onClick={() => onUpdate({ activity: "high" })}
                className="h-auto py-3 px-4 text-center"
              >
                <div className="space-y-1">
                  <div className="font-semibold">High</div>
                  <div className="text-xs leading-tight whitespace-normal">Very active, lots of exercise</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Body Condition Score */}
          <div className="space-y-4">
            <Label>Body Condition Score (1-9 scale)</Label>
            <div className="space-y-2">
              <Slider
                value={[profile.bodyCondition || 5]}
                onValueChange={([value]) => onUpdate({ bodyCondition: value })}
                max={9}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 - Very Thin</span>
                <span>5 - Ideal</span>
                <span>9 - Obese</span>
              </div>
              <div className="text-center text-sm">
                Current: <span className="font-semibold">{profile.bodyCondition || 5}</span>
              </div>
            </div>
          </div>

          {/* Neutered Status */}
          <div className="space-y-2">
            <Label>Spayed/Neutered Status</Label>
            <div className="flex gap-2">
              <Button
                variant={profile.isNeutered === true ? "default" : "outline"}
                onClick={() => onUpdate({ isNeutered: true })}
                className="flex-1"
              >
                Yes, spayed/neutered
              </Button>
              <Button
                variant={profile.isNeutered === false ? "default" : "outline"}
                onClick={() => onUpdate({ isNeutered: false })}
                className="flex-1"
              >
                No, intact
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
