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
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleEmailSubmit = () => {
    if (emailInput && emailInput.includes("@")) {
      onUpdate(hasMedicalNeeds || "yes", emailInput)
      setIsSubmitted(true)
      // Track validation/demand
      console.log("[v0] Medical needs email captured:", emailInput)
    }
  }

  const medicalConditions = [
    { id: "kidney-disease", name: "Kidney Disease", description: "Chronic kidney disease or renal issues" },
    { id: "liver-disease", name: "Liver Disease", description: "Hepatic conditions or liver dysfunction" },
    { id: "heart-disease", name: "Heart Disease", description: "Cardiac conditions requiring dietary management" },
    { id: "diabetes", name: "Diabetes", description: "Blood sugar management and glucose control" },
    { id: "pancreatitis", name: "Pancreatitis", description: "Pancreatic inflammation requiring low-fat diet" },
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
                <Label className="text-base font-semibold">What medical condition does your dog have?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {medicalConditions.map((condition) => (
                    <Button
                      key={condition.id}
                      variant={selectedCondition === condition.id ? "default" : "outline"}
                      onClick={() => onUpdate("yes", email, condition.id)}
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
              {selectedCondition && selectedCondition !== "other" && (
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
              {selectedCondition === "other" && (
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
                            Enter your email to be notified when we add support for your dog's specific condition.
                          </p>
                        </div>

                        {!isSubmitted ? (
                          <div className="space-y-3">
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
                                disabled={!emailInput || !emailInput.includes("@")}
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
