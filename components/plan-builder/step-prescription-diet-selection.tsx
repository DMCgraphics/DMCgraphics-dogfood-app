"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, Shield, CheckCircle, AlertTriangle } from "lucide-react"
import { prescriptionDiets, getMedicalConditionById } from "@/lib/prescription-diets"
import { VetVerificationModal, type VetVerificationData } from "@/components/prescription/vet-verification-modal"
import { createVerificationRequest, sendVerificationEmail } from "@/lib/vet-verification"
import { useState } from "react"

interface PrescriptionDietSelectionProps {
  selectedCondition: string | null
  selectedPrescriptionDiet: string | null
  dogName: string
  onUpdate: (dietId: string | null) => void
  onVerificationRequired: (dietId: string) => void
}

export function StepPrescriptionDietSelection({
  selectedCondition,
  selectedPrescriptionDiet,
  dogName,
  onUpdate,
  onVerificationRequired,
}: PrescriptionDietSelectionProps) {
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [selectedDietForVerification, setSelectedDietForVerification] = useState<string | null>(null)

  const condition = selectedCondition ? getMedicalConditionById(selectedCondition) : null
  const availableDiets = selectedCondition
    ? prescriptionDiets.filter((diet) => diet.conditionId === selectedCondition)
    : []

  const handleDietSelection = (dietId: string) => {
    const diet = prescriptionDiets.find((d) => d.id === dietId)
    if (diet?.prescriptionRequired) {
      setSelectedDietForVerification(dietId)
      setShowVerificationModal(true)
    } else {
      onUpdate(dietId)
    }
  }

  const handleVerificationSubmit = (data: VetVerificationData) => {
    if (!selectedDietForVerification) return

    const diet = prescriptionDiets.find((d) => d.id === selectedDietForVerification)
    if (!diet) return

    // Create verification request
    const request = createVerificationRequest({
      userId: "current-user-id", // This would come from auth context
      dogName,
      prescriptionDietId: selectedDietForVerification,
      prescriptionDietName: diet.name,
      vetInfo: {
        name: data.vetName,
        clinic: data.vetClinic,
        phone: data.vetPhone,
        email: data.vetEmail,
      },
      prescriptionDetails: {
        notes: data.prescriptionNotes,
        fileUrl: data.prescriptionFile ? URL.createObjectURL(data.prescriptionFile) : undefined,
        fileName: data.prescriptionFile?.name,
      },
    })

    // Send verification email
    sendVerificationEmail(request)

    // Update selection and notify parent
    onUpdate(selectedDietForVerification)
    onVerificationRequired(selectedDietForVerification)
    setShowVerificationModal(false)
    setSelectedDietForVerification(null)
  }

  if (!condition) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Medical Condition Required</h3>
          <p className="text-muted-foreground">
            Please select a medical condition in the previous step to view prescription diet options.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Condition Info */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            {condition.name} - Therapeutic Diets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">{condition.description}</p>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Dietary Considerations:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {condition.dietaryRestrictions.map((restriction, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-600"></div>
                  Avoid {restriction}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Available Prescription Diets */}
      <div className="space-y-4">
        <h3 className="font-semibold">Available Prescription Diets</h3>

        {availableDiets.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Diets Available Yet</h3>
              <p className="text-muted-foreground">
                We're still developing prescription diets for this condition. Please check back soon.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {availableDiets.map((diet) => (
              <Card
                key={diet.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPrescriptionDiet === diet.id
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => handleDietSelection(diet.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{diet.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{diet.description}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {diet.vetApproved && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          <Shield className="h-3 w-3 mr-1" />
                          Vet Approved
                        </Badge>
                      )}
                      {diet.prescriptionRequired && (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                          <Stethoscope className="h-3 w-3 mr-1" />
                          Prescription Required
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {diet.availabilityStatus === "coming-soon" ? "Coming Soon" : "Available"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Key Ingredients */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Key Ingredients:</h4>
                    <div className="flex flex-wrap gap-1">
                      {diet.ingredients.slice(0, 4).map((ingredient, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {ingredient.name} ({ingredient.percentage}%)
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Nutritional Highlights */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Protein:</span> {diet.nutritionalProfile.protein}%
                    </div>
                    <div>
                      <span className="font-semibold">Fat:</span> {diet.nutritionalProfile.fat}%
                    </div>
                    <div>
                      <span className="font-semibold">Fiber:</span> {diet.nutritionalProfile.fiber}%
                    </div>
                    <div>
                      <span className="font-semibold">Calories:</span> {diet.nutritionalProfile.calories}/100g
                    </div>
                  </div>

                  {/* Selection Button */}
                  <div className="pt-2">
                    <Button
                      className="w-full"
                      variant={selectedPrescriptionDiet === diet.id ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDietSelection(diet.id)
                      }}
                    >
                      {selectedPrescriptionDiet === diet.id ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Selected
                        </>
                      ) : diet.prescriptionRequired ? (
                        <>
                          <Stethoscope className="h-4 w-4 mr-2" />
                          Select & Get Vet Approval
                        </>
                      ) : (
                        "Select This Diet"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {showVerificationModal && selectedDietForVerification && (
        <VetVerificationModal
          isOpen={showVerificationModal}
          onClose={() => {
            setShowVerificationModal(false)
            setSelectedDietForVerification(null)
          }}
          onVerificationSubmit={handleVerificationSubmit}
          prescriptionDietName={prescriptionDiets.find((d) => d.id === selectedDietForVerification)?.name || ""}
        />
      )}
    </div>
  )
}
