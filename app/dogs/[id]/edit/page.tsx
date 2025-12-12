"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DogProfileStep } from "@/components/subscription-customize/dog-profile-step"

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

export default function EditDogProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const dogId = params.id as string

  const [dogProfile, setDogProfile] = useState<DogProfile>({
    name: "",
    weightUnit: "lb",
    ageUnit: "years",
    activityLevel: "moderate",
    allergies: [],
    conditions: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDog = async () => {
      if (!user || !dogId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from("dogs")
          .select("*")
          .eq("id", dogId)
          .eq("user_id", user.id)
          .single()

        if (error) {
          console.error("Error fetching dog:", error)
          setError("Dog not found")
          setLoading(false)
          return
        }

        // Map database fields to form fields
        setDogProfile({
          name: data.name || "",
          breed: data.breed,
          weight: data.weight,
          weightUnit: data.weight_unit || "lb",
          age: data.age,
          ageUnit: data.age_unit || "years",
          sex: data.sex,
          isNeutered: data.is_neutered,
          activityLevel: data.activity_level || "moderate",
          allergies: data.allergies || [],
          conditions: data.conditions || []
        })
      } catch (err) {
        console.error("Exception fetching dog:", err)
        setError("Failed to load dog profile")
      } finally {
        setLoading(false)
      }
    }

    fetchDog()
  }, [user, dogId])

  const handleSave = async () => {
    if (!user || !dogId) return

    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from("dogs")
        .update({
          name: dogProfile.name,
          breed: dogProfile.breed,
          weight: dogProfile.weight,
          weight_unit: dogProfile.weightUnit,
          weight_kg: dogProfile.weightUnit === "lb" ? (dogProfile.weight || 0) / 2.20462 : dogProfile.weight,
          age: dogProfile.age,
          age_unit: dogProfile.ageUnit,
          sex: dogProfile.sex,
          is_neutered: dogProfile.isNeutered,
          activity_level: dogProfile.activityLevel,
          allergies: dogProfile.allergies,
          conditions: dogProfile.conditions,
          updated_at: new Date().toISOString()
        })
        .eq("id", dogId)
        .eq("user_id", user.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Redirect back to view page
      router.push(`/dogs/${dogId}`)
    } catch (err: any) {
      console.error("Error updating dog:", err)
      setError(err.message || "Failed to update dog profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error && !dogProfile.name) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 max-w-md mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive mb-4">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="font-semibold">Error</h2>
              </div>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 max-w-4xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => router.push(`/dogs/${dogId}`)}
            className="mb-6"
            disabled={saving}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">Edit {dogProfile.name}'s Profile</h1>
            <p className="text-muted-foreground">Update your dog's information</p>
          </div>

          {/* Error message */}
          {error && (
            <Card className="mb-6 border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="font-medium">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile form */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <DogProfileStep
                dogProfile={dogProfile}
                onUpdate={setDogProfile}
              />
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/dogs/${dogId}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !dogProfile.name}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
