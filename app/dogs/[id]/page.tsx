"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Cake, Weight, Activity, Heart, AlertCircle } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"

interface Dog {
  id: string
  name: string
  breed?: string
  weight?: number
  weight_unit?: string
  age?: number
  age_unit?: string
  sex?: string
  is_neutered?: boolean
  activity_level?: string
  allergies?: string[]
  conditions?: string[]
  photo_url?: string
}

export default function DogProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const dogId = params.id as string

  const [dog, setDog] = useState<Dog | null>(null)
  const [loading, setLoading] = useState(true)

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
          router.push("/dashboard")
          return
        }

        setDog(data)
      } catch (err) {
        console.error("Exception fetching dog:", err)
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchDog()
  }, [user, dogId, router])

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

  if (!dog) {
    return null
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 max-w-4xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Dog header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {dog.photo_url ? (
                <img
                  src={dog.photo_url}
                  alt={dog.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-3xl">{dog.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{dog.name}'s Profile</h1>
                <p className="text-muted-foreground">View your dog's information</p>
              </div>
            </div>
            <Button onClick={() => router.push(`/dogs/${dog.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          {/* Basic Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label>Name</Label>
                <p className="text-lg font-medium">{dog.name}</p>
              </div>

              {dog.breed && (
                <div className="space-y-1">
                  <Label>Breed</Label>
                  <p className="text-lg font-medium">{dog.breed}</p>
                </div>
              )}

              {dog.weight && (
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Weight className="h-4 w-4" />
                    Weight
                  </Label>
                  <p className="text-lg font-medium">
                    {dog.weight} {dog.weight_unit || "lb"}
                  </p>
                </div>
              )}

              {dog.age && (
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Cake className="h-4 w-4" />
                    Age
                  </Label>
                  <p className="text-lg font-medium">
                    {dog.age} {dog.age_unit || "years"}
                  </p>
                </div>
              )}

              {dog.sex && (
                <div className="space-y-1">
                  <Label>Sex</Label>
                  <p className="text-lg font-medium capitalize">
                    {dog.sex}
                    {dog.is_neutered !== undefined && ` (${dog.is_neutered ? "Neutered" : "Intact"})`}
                  </p>
                </div>
              )}

              {dog.activity_level && (
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Activity Level
                  </Label>
                  <p className="text-lg font-medium capitalize">{dog.activity_level}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Info Card */}
          {(dog.allergies && dog.allergies.length > 0) || (dog.conditions && dog.conditions.length > 0) ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Health Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {dog.allergies && dog.allergies.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Allergies
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {dog.allergies.map((allergy) => (
                        <Badge key={allergy} variant="outline" className="capitalize">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {dog.conditions && dog.conditions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Medical Conditions</Label>
                    <div className="flex flex-wrap gap-2">
                      {dog.conditions.map((condition) => (
                        <Badge key={condition} variant="outline" className="capitalize">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium text-muted-foreground ${className}`}>{children}</div>
}
