"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Mail, Stethoscope, ArrowRight } from "lucide-react"
import { useState } from "react"

interface MedicalNeedsProps {
  hasMedicalNeeds: string | null
  email: string
  selectedCondition: string | null
  onUpdate: (hasMedicalNeeds: string, email?: string, selectedCondition?: string) => void
}

export function StepMedicalNeeds({ hasMedicalNeeds, email, selectedCondition, onUpdate }: MedicalNeedsProps) {
  const [emailInput, setEmailInput] = useState(email)
  const [conditionInput, setConditionInput] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Track multiple selected conditions (convert from comma-separated string if needed)
  const [selectedConditions, setSelectedConditions] = useState<string[]>(() => {
    if (!selectedCondition) return []
    return selectedCondition.split(',').map(c => c.trim()).filter(Boolean)
  })

  const toggleCondition = (conditionId: string) => {
    setSelectedConditions(prev => {
      const newSelection = prev.includes(conditionId)
        ? prev.filter(id => id !== conditionId)
        : [...prev, conditionId]

      // Update parent with comma-separated string
      onUpdate("yes", email, newSelection.join(','))
      return newSelection
    })
  }

  const isConditionSelected = (conditionId: string) => selectedConditions.includes(conditionId)

  const handleEmailSubmit = async () => {
    if (emailInput && emailInput.includes("@") && conditionInput.trim()) {
      onUpdate(hasMedicalNeeds || "yes", emailInput)

      // Save to database
      try {
        const response = await fetch("/api/medical-condition-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailInput,
            condition_name: conditionInput.trim(),
            notes: "User requested support for a condition not yet available"
          }),
        })

        if (response.ok) {
          console.log("[v0] Medical condition request saved to database:", {
            email: emailInput,
            condition: conditionInput
          })
          setIsSubmitted(true)
        } else {
          console.error("[v0] Failed to save medical condition request")
          // Still mark as submitted for UX
          setIsSubmitted(true)
        }
      } catch (error) {
        console.error("[v0] Error saving medical condition request:", error)
        // Still mark as submitted for UX
        setIsSubmitted(true)
      }
    }
  }

  const medicalConditions = [
    { id: "pancreatitis", name: "Pancreatitis", description: "Pancreatic inflammation requiring low-fat diet" },
    { id: "arthritis", name: "Arthritis", description: "Joint inflammation and mobility support" },
    { id: "other", name: "Other Condition", description: "Other medical condition requiring special diet" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Medical & Prescription Dietary Needs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Does your dog have any medical or prescription dietary needs?
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant={hasMedicalNeeds === "yes" ? "default" : "outline"}
                onClick={() => onUpdate("yes")}
                className="h-auto py-4"
              >
                <div className="text-center">
                  <div className="font-semibold">Yes</div>
                  <div className="text-xs opacity-80">My dog has medical needs</div>
                </div>
              </Button>

              <Button
                variant={hasMedicalNeeds === "no" ? "default" : "outline"}
                onClick={() => onUpdate("no")}
                className="h-auto py-4"
              >
                <div className="text-center">
                  <div className="font-semibold">No</div>
                  <div className="text-xs opacity-80">No special dietary needs</div>
                </div>
              </Button>

              <Button
                variant={hasMedicalNeeds === "not-sure" ? "default" : "outline"}
                onClick={() => onUpdate("not-sure")}
                className="h-auto py-4"
              >
                <div className="text-center">
                  <div className="font-semibold">Not Sure</div>
                  <div className="text-xs opacity-80">I'm unsure about this</div>
                </div>
              </Button>
            </div>
          </div>

          {hasMedicalNeeds === "yes" && (
            <div className="space-y-6">
              {/* Prescription Diet Available Notice */}
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Stethoscope className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Prescription Diets Now Available!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        We now offer veterinary-approved therapeutic diets for specific medical conditions. Select your
                        dog's condition below to explore prescription options.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Condition Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">What medical conditions does your dog have? (Select all that apply)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {medicalConditions.map((condition) => (
                    <Button
                      key={condition.id}
                      variant={isConditionSelected(condition.id) ? "default" : "outline"}
                      onClick={() => toggleCondition(condition.id)}
                      className="h-auto py-4 text-left justify-start"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold">{condition.name}</div>
                        <div className="text-xs opacity-80">{condition.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Next Steps Info */}
              {selectedConditions.length > 0 && !selectedConditions.includes("other") && (
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Prescription Diet Available
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            We'll show you therapeutic diet options that require veterinary approval in the next step.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Other Condition Email Capture */}
              {selectedConditions.includes("other") && (
                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-4 flex-1">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            We're expanding our prescription diet options.
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            Tell us what condition your dog has and we'll notify you when we add support for it.
                          </p>
                        </div>

                        {!isSubmitted ? (
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="condition-name">
                                What condition does your dog have?
                              </Label>
                              <Input
                                id="condition-name"
                                type="text"
                                placeholder="e.g., Kidney disease, Liver disease, Heart disease"
                                value={conditionInput}
                                onChange={(e) => setConditionInput(e.target.value)}
                                className="bg-white dark:bg-gray-900 mt-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Label htmlFor="medical-email" className="sr-only">
                                  Email address
                                </Label>
                                <Input
                                  id="medical-email"
                                  type="email"
                                  placeholder="Enter your email address"
                                  value={emailInput}
                                  onChange={(e) => setEmailInput(e.target.value)}
                                  className="bg-white dark:bg-gray-900"
                                />
                              </div>
                              <Button
                                onClick={handleEmailSubmit}
                                disabled={!emailInput || !emailInput.includes("@") || !conditionInput.trim()}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Notify Me
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                            <div className="w-2 h-2 rounded-full bg-green-600"></div>
                            Thank you! We'll notify you when we support your dog's condition.
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
