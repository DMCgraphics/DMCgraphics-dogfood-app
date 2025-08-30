"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DogCard } from "@/components/dashboard/dog-card"
import { WeightTracker } from "@/components/dashboard/weight-tracker"
import { StoolLog } from "@/components/dashboard/stool-log"
import { SubscriptionControls } from "@/components/dashboard/subscription-controls"
import { Recommendations } from "@/components/dashboard/recommendations"
import { PrescriptionStatusCard } from "@/components/dashboard/prescription-status-card"
import { MedicalConditionTracker } from "@/components/dashboard/medical-condition-tracker"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { mockVerificationRequests } from "@/lib/vet-verification"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, PawPrint } from "lucide-react"

// Mock data - in a real app this would come from an API
const mockDogs = [
  {
    id: "1",
    name: "Max",
    breed: "Golden Retriever",
    age: 4,
    weight: 65,
    weightUnit: "lb" as const,
    avatar: "/placeholder.svg?height=48&width=48",
    currentRecipe: "Chicken & Greens",
    nextDelivery: "Dec 15, 2024",
    subscriptionStatus: "active" as const,
  },
]

const mockWeightEntries = [
  { date: "2024-11-01", weight: 67 },
  { date: "2024-11-08", weight: 66.5 },
  { date: "2024-11-15", weight: 66 },
  { date: "2024-11-22", weight: 65.5 },
  { date: "2024-11-29", weight: 65 },
]

const mockStoolEntries = [
  { date: "2024-12-01", score: 4, notes: "Perfect consistency" },
  { date: "2024-12-02", score: 4 },
  { date: "2024-12-03", score: 3, notes: "Slightly firm" },
  { date: "2024-12-04", score: 4 },
  { date: "2024-12-05", score: 4 },
]

const mockDeliveries = [
  {
    id: "1",
    date: "2024-12-15",
    status: "upcoming" as const,
    items: ["Chicken & Greens (2 weeks)", "Fish Oil"],
  },
  {
    id: "2",
    date: "2024-12-01",
    status: "delivered" as const,
    items: ["Chicken & Greens (2 weeks)", "Fish Oil"],
  },
  {
    id: "3",
    date: "2024-11-17",
    status: "delivered" as const,
    items: ["Chicken & Greens (2 weeks)"],
  },
]

const mockRecommendations = [
  {
    id: "1",
    type: "portion" as const,
    title: "Consider reducing daily portions",
    description: "Max has lost 2 lbs over the past month, which is great progress toward his target weight.",
    action: "Adjust portions",
    priority: "medium" as const,
    reason: "Weight loss trend indicates current portions may be too large for maintenance",
  },
  {
    id: "2",
    type: "supplement" as const,
    title: "Add joint support supplement",
    description: "As a 4-year-old Golden Retriever, Max would benefit from proactive joint care.",
    action: "Add joint blend",
    priority: "low" as const,
    reason: "Large breed dogs benefit from early joint support to prevent future issues",
  },
]

const mockMedicalConditions = [
  {
    id: "1",
    name: "Kidney Disease (Stage 2)",
    diagnosedDate: new Date("2024-06-15"),
    severity: "moderate" as const,
    status: "stable" as const,
    lastCheckup: new Date("2024-11-01"),
    nextCheckup: new Date("2024-12-20"),
    medications: ["Benazepril", "Omega-3 Supplement"],
    dietaryRestrictions: ["low-phosphorus", "reduced-protein"],
    notes: "Responding well to prescription diet. BUN and creatinine levels stable.",
  },
]

export default function DashboardPage() {
  const { user, hasSubscription } = useAuth()
  const [dogs] = useState(mockDogs)
  const [weightEntries, setWeightEntries] = useState(mockWeightEntries)
  const [stoolEntries, setStoolEntries] = useState(mockStoolEntries)
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "paused" | "cancelled">("active")

  const [medicalConditions] = useState(mockMedicalConditions)
  const currentVerificationRequest = mockVerificationRequests.find((req) => req.userId === "user-123")

  const handleEditDog = (dogId: string) => {
    alert(`Edit dog profile for ${dogId} - this would open an edit modal`)
  }

  const handleAddWeightEntry = (entry: { weight: number; notes?: string }) => {
    const newEntry = {
      date: new Date().toISOString().split("T")[0],
      weight: entry.weight,
      notes: entry.notes,
    }
    setWeightEntries([...weightEntries, newEntry])
  }

  const handleAddStoolEntry = (entry: { score: number; notes?: string }) => {
    const newEntry = {
      date: new Date().toISOString().split("T")[0],
      score: entry.score,
      notes: entry.notes,
    }
    setStoolEntries([...stoolEntries, newEntry])
  }

  const handlePauseResume = () => {
    setSubscriptionStatus(subscriptionStatus === "active" ? "paused" : "active")
  }

  const handleSkipDelivery = (deliveryId: string) => {
    alert(`Skip delivery ${deliveryId} - this would update the delivery schedule`)
  }

  const handleManageSubscription = () => {
    alert("Manage subscription - this would open subscription settings")
  }

  const handleTakeAction = (recommendationId: string) => {
    alert(`Take action on recommendation ${recommendationId} - this would navigate to the appropriate page`)
  }

  const handleAddDog = () => {
    alert("Add new dog - this would open the dog profile wizard")
  }

  const handleContactVet = () => {
    alert("Contact veterinarian - this would open email/phone contact options")
  }

  const handleRenewPrescription = () => {
    alert("Renew prescription - this would start the renewal process")
  }

  const handleScheduleCheckup = (conditionId: string) => {
    alert(`Schedule checkup for condition ${conditionId} - this would open scheduling interface`)
  }

  const handleUpdateCondition = (conditionId: string) => {
    alert(`Update condition ${conditionId} - this would open condition update form`)
  }

  const EmptyDashboardState = () => (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-manrope text-2xl lg:text-3xl font-bold">Welcome back, {user?.name || "there"}!</h1>
            <p className="text-muted-foreground">Start a subscription to track your dog's health and nutrition</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <PawPrint className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Ready to get started?</CardTitle>
              <CardDescription className="text-lg">
                Create a personalized nutrition plan for your dog and start tracking their health journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Health Tracking</h3>
                  <p className="text-sm text-muted-foreground">Monitor weight, stool quality, and overall wellness</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Custom Nutrition</h3>
                  <p className="text-sm text-muted-foreground">Personalized recipes based on your dog's needs</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Delivery Management</h3>
                  <p className="text-sm text-muted-foreground">Flexible scheduling and portion control</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Expert Recommendations</h3>
                  <p className="text-sm text-muted-foreground">AI-powered insights for optimal health</p>
                </div>
              </div>
              <div className="space-y-3">
                <Button size="lg" className="w-full" onClick={() => (window.location.href = "/plan-builder")}>
                  Build Your Dog's Plan
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-sm text-muted-foreground">
                  Start with our personalized plan builder to create the perfect nutrition plan for your dog.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )

  if (!hasSubscription) {
    return <EmptyDashboardState />
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-manrope text-2xl lg:text-3xl font-bold">Welcome back, {user?.name || "there"}!</h1>
              <p className="text-muted-foreground">Track your dog's health and manage your subscription</p>
            </div>
            <Button onClick={handleAddDog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Dog
            </Button>
          </div>

          {/* Dogs Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {dogs.map((dog) => (
              <DogCard key={dog.id} dog={dog} onEdit={handleEditDog} />
            ))}
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Health Tracking */}
            <div className="lg:col-span-2 space-y-8">
              <WeightTracker
                dogName={dogs[0].name}
                currentWeight={dogs[0].weight}
                weightUnit={dogs[0].weightUnit}
                entries={weightEntries}
                onAddEntry={handleAddWeightEntry}
              />

              <StoolLog dogName={dogs[0].name} entries={stoolEntries} onAddEntry={handleAddStoolEntry} />

              <MedicalConditionTracker
                conditions={medicalConditions}
                onScheduleCheckup={handleScheduleCheckup}
                onUpdateCondition={handleUpdateCondition}
              />
            </div>

            {/* Right Column - Subscription & Recommendations */}
            <div className="space-y-8">
              <PrescriptionStatusCard
                verificationRequest={currentVerificationRequest}
                prescriptionDietName="Renal Support Formula"
                expirationDate={currentVerificationRequest?.expiresAt}
                onContactVet={handleContactVet}
                onRenewPrescription={handleRenewPrescription}
              />

              <SubscriptionControls
                subscriptionStatus={subscriptionStatus}
                nextDelivery={dogs[0].nextDelivery}
                deliveries={mockDeliveries}
                onPauseResume={handlePauseResume}
                onSkipDelivery={handleSkipDelivery}
                onManageSubscription={handleManageSubscription}
              />

              <Recommendations
                dogName={dogs[0].name}
                recommendations={mockRecommendations}
                onTakeAction={handleTakeAction}
              />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  )
}
