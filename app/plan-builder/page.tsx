"use client"

import { useState, useEffect } from "react"
import { WizardLayout } from "@/components/plan-builder/wizard-layout"
import { Step1DogProfile } from "@/components/plan-builder/step-1-dog-profile"
import { Step2HealthGoals } from "@/components/plan-builder/step-2-health-goals"
import { StepMedicalNeeds } from "@/components/plan-builder/step-medical-needs"
import { StepPrescriptionDietSelection } from "@/components/plan-builder/step-prescription-diet-selection"
import { Step3Allergies } from "@/components/plan-builder/step-3-allergies"
import { Step4RecipeSelection } from "@/components/plan-builder/step-4-recipe-selection"
import { Step5Portions } from "@/components/plan-builder/step-5-portions"
import { Step6AddOns } from "@/components/plan-builder/step-6-addons"
import { PlanReview } from "@/components/plan-builder/plan-review"
import { Header } from "@/components/header"
import type { DogProfile, HealthGoals } from "@/lib/nutrition-calculator"
import { useRouter } from "next/navigation"
import { analytics } from "@/lib/analytics"

export default function PlanBuilderPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [dogProfile, setDogProfile] = useState<Partial<DogProfile>>({
    weightUnit: "lb",
    ageUnit: "years",
    bodyCondition: 5,
    activity: "moderate",
  })
  const [healthGoals, setHealthGoals] = useState<Partial<HealthGoals>>({
    stoolScore: 4,
  })
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null)
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([])
  const [allowMultipleSelection, setAllowMultipleSelection] = useState(false)
  const [mealsPerDay, setMealsPerDay] = useState(2)
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [medicalNeeds, setMedicalNeeds] = useState<{
    hasMedicalNeeds: string | null
    email: string
    selectedCondition: string | null
    selectedPrescriptionDiet: string | null
    verificationRequired: boolean
  }>({
    hasMedicalNeeds: null,
    email: "",
    selectedCondition: null,
    selectedPrescriptionDiet: null,
    verificationRequired: false,
  })

  useEffect(() => {
    const planData = {
      dogProfile,
      healthGoals,
      selectedAllergens,
      selectedRecipe,
      selectedRecipes,
      allowMultipleSelection,
      mealsPerDay,
      selectedAddOns,
      medicalNeeds,
      currentStep,
    }
    localStorage.setItem("nouripet-plan-builder", JSON.stringify(planData))
  }, [
    dogProfile,
    healthGoals,
    selectedAllergens,
    selectedRecipe,
    selectedRecipes,
    allowMultipleSelection,
    mealsPerDay,
    selectedAddOns,
    medicalNeeds,
    currentStep,
  ])

  useEffect(() => {
    const saved = localStorage.getItem("nouripet-plan-builder")
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setDogProfile(data.dogProfile || {})
        setHealthGoals(data.healthGoals || {})
        setSelectedAllergens(data.selectedAllergens || [])
        setSelectedRecipe(data.selectedRecipe || null)
        setSelectedRecipes(data.selectedRecipes || [])
        setAllowMultipleSelection(data.allowMultipleSelection || false)
        setMealsPerDay(data.mealsPerDay || 2)
        setSelectedAddOns(data.selectedAddOns || [])
        setMedicalNeeds(
          data.medicalNeeds || {
            hasMedicalNeeds: null,
            email: "",
            selectedCondition: null,
            selectedPrescriptionDiet: null,
            verificationRequired: false,
          },
        )
        setCurrentStep(data.currentStep || 1)
      } catch (error) {
        console.error("Failed to load saved plan data:", error)
      }
    }
  }, [])

  useEffect(() => {
    const stepInfo = getStepInfo()
    analytics.stepViewed(currentStep, stepInfo.title)
  }, [currentStep])

  const updateDogProfile = (updates: Partial<DogProfile>) => {
    setDogProfile((prev) => ({ ...prev, ...updates }))
  }

  const updateHealthGoals = (updates: Partial<HealthGoals>) => {
    setHealthGoals((prev) => ({ ...prev, ...updates }))
  }

  const updateMedicalNeeds = (hasMedicalNeeds: string, email?: string, selectedCondition?: string) => {
    setMedicalNeeds((prev) => ({
      ...prev,
      hasMedicalNeeds,
      email: email || prev.email,
      selectedCondition: selectedCondition || prev.selectedCondition,
    }))
    if (hasMedicalNeeds === "yes") {
      console.log("[v0] User indicated medical needs - tracking demand")
    }
  }

  const updatePrescriptionDiet = (dietId: string | null) => {
    setMedicalNeeds((prev) => ({
      ...prev,
      selectedPrescriptionDiet: dietId,
    }))
  }

  const handleVerificationRequired = (dietId: string) => {
    setMedicalNeeds((prev) => ({
      ...prev,
      selectedPrescriptionDiet: dietId,
      verificationRequired: true,
    }))
  }

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return !!(
          dogProfile.name &&
          dogProfile.weight &&
          dogProfile.age &&
          dogProfile.sex &&
          dogProfile.breed &&
          dogProfile.activity &&
          dogProfile.bodyCondition &&
          dogProfile.isNeutered !== undefined
        )
      case 2:
        return true
      case 3:
        return !!medicalNeeds.hasMedicalNeeds
      case 4:
        return true // Allergies step - always can proceed
      case 5:
        if (
          medicalNeeds.hasMedicalNeeds === "yes" &&
          medicalNeeds.selectedCondition &&
          medicalNeeds.selectedCondition !== "other"
        ) {
          return !!medicalNeeds.selectedPrescriptionDiet
        }
        return true
      case 6:
        if (medicalNeeds.selectedPrescriptionDiet) {
          return true
        }
        return !!(selectedRecipe || selectedRecipes.length > 0)
      case 7:
        return true
      case 8:
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (currentStep === 4 && medicalNeeds.hasMedicalNeeds === "no") {
      setCurrentStep(6) // Skip prescription diet selection, go to recipe selection
    } else if (currentStep === 5 && medicalNeeds.selectedPrescriptionDiet) {
      setCurrentStep(7) // Skip recipe selection, go to portions
    } else if (currentStep < 9) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep === 6 && medicalNeeds.hasMedicalNeeds === "no") {
      setCurrentStep(4) // Skip prescription diet step going back
    } else if (currentStep === 7 && medicalNeeds.selectedPrescriptionDiet) {
      setCurrentStep(5) // Go back to prescription diet step
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleProceedToCheckout = () => {
    analytics.proceedToCheckoutClicked({
      planId: `plan_${Date.now()}`,
      dogs: [
        {
          name: dogProfile.name,
          age: dogProfile.age,
          weight: dogProfile.weight,
          weightUnit: dogProfile.weightUnit,
          activity: dogProfile.activity,
          bodyCondition: dogProfile.bodyCondition,
        },
      ],
      recipes: selectedRecipes.length > 0 ? selectedRecipes : [selectedRecipe].filter(Boolean),
      prescriptionDiet: medicalNeeds.selectedPrescriptionDiet,
      mealsPerDay,
      planType: "full",
      priceMonthly: 0,
      addOns: selectedAddOns,
      healthGoals,
      selectedAllergens,
    })

    // Track analytics event
    console.log("[v0] proceed_to_checkout_clicked")

    // Prepare plan payload for checkout
    const planPayload = {
      planId: `plan_${Date.now()}`,
      dogs: [
        {
          name: dogProfile.name,
          age: dogProfile.age,
          weight: dogProfile.weight,
          weightUnit: dogProfile.weightUnit,
          activity: dogProfile.activity,
          bodyCondition: dogProfile.bodyCondition,
        },
      ],
      recipes: selectedRecipes.length > 0 ? selectedRecipes : [selectedRecipe].filter(Boolean),
      prescriptionDiet: medicalNeeds.selectedPrescriptionDiet,
      mealsPerDay,
      planType: "full", // TODO: Add topper support
      priceMonthly: 0, // Will be calculated in checkout
      addOns: selectedAddOns,
      healthGoals,
      selectedAllergens,
    }

    // Store plan payload for checkout
    localStorage.setItem("nouripet-checkout-plan", JSON.stringify(planPayload))

    // Navigate to checkout
    router.push("/checkout")
  }

  const handleCreateAccount = () => {
    alert("Account creation - this would open a signup modal or redirect to registration")
    router.push("/dashboard")
  }

  const handleGoBackToEdit = () => {
    setCurrentStep(8) // Go back to the last editable step (Add-ons)
  }

  const updateSelectedRecipes = (recipes: string[]) => {
    setSelectedRecipes(recipes)
    if (recipes.length > 0) {
      setSelectedRecipe(null)
    }
  }

  const updateSelectedRecipe = (recipeId: string) => {
    setSelectedRecipe(recipeId)
    setSelectedRecipes([])
  }

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1DogProfile profile={dogProfile} onUpdate={updateDogProfile} />
      case 2:
        return <Step2HealthGoals goals={healthGoals} onUpdate={updateHealthGoals} />
      case 3:
        return (
          <StepMedicalNeeds
            hasMedicalNeeds={medicalNeeds.hasMedicalNeeds}
            email={medicalNeeds.email}
            selectedCondition={medicalNeeds.selectedCondition}
            onUpdate={updateMedicalNeeds}
          />
        )
      case 4:
        return <Step3Allergies selectedAllergens={selectedAllergens} onUpdate={setSelectedAllergens} />
      case 5:
        if (
          medicalNeeds.hasMedicalNeeds === "yes" &&
          medicalNeeds.selectedCondition &&
          medicalNeeds.selectedCondition !== "other"
        ) {
          return (
            <StepPrescriptionDietSelection
              selectedCondition={medicalNeeds.selectedCondition}
              selectedPrescriptionDiet={medicalNeeds.selectedPrescriptionDiet}
              dogName={dogProfile.name || ""}
              onUpdate={updatePrescriptionDiet}
              onVerificationRequired={handleVerificationRequired}
            />
          )
        }
        // Skip this step if no medical needs
        return null
      case 6:
        return (
          <Step4RecipeSelection
            selectedRecipe={selectedRecipe}
            selectedRecipes={selectedRecipes}
            onUpdate={updateSelectedRecipe}
            onUpdateMultiple={updateSelectedRecipes}
            excludedAllergens={selectedAllergens}
            dogProfile={dogProfile}
            allowMultipleSelection={true}
          />
        )
      case 7:
        return (
          <Step5Portions
            dogProfile={dogProfile}
            selectedRecipeId={medicalNeeds.selectedPrescriptionDiet || selectedRecipe}
            selectedRecipes={selectedRecipes}
            selectedPrescriptionDiet={medicalNeeds.selectedPrescriptionDiet}
            selectedCondition={medicalNeeds.selectedCondition}
            mealsPerDay={mealsPerDay}
            onUpdate={setMealsPerDay}
          />
        )
      case 8:
        return <Step6AddOns dogProfile={dogProfile} selectedAddOns={selectedAddOns} onUpdate={setSelectedAddOns} />
      case 9:
        return (
          <PlanReview
            dogProfile={dogProfile}
            healthGoals={healthGoals}
            selectedAllergens={selectedAllergens}
            selectedRecipeId={selectedRecipe}
            selectedRecipes={selectedRecipes}
            selectedPrescriptionDiet={medicalNeeds.selectedPrescriptionDiet}
            mealsPerDay={mealsPerDay}
            selectedAddOns={selectedAddOns}
            onProceedToCheckout={handleProceedToCheckout}
            onCreateAccount={handleCreateAccount}
            isAuthenticated={false} // TODO: Add real auth state
          />
        )
      default:
        return <div>Step {currentStep} - Coming soon!</div>
    }
  }

  const getStepInfo = () => {
    switch (currentStep) {
      case 1:
        return {
          title: "Tell us about your dog",
          description: "We'll use this information to calculate the perfect nutrition plan.",
        }
      case 2:
        return {
          title: "Health & wellness goals",
          description: "Help us understand what you'd like to focus on for your dog's health.",
        }
      case 3:
        return {
          title: "Medical & dietary needs",
          description: "Let us know if your dog has any special medical or prescription dietary requirements.",
        }
      case 4:
        return {
          title: "Allergies & exclusions",
          description: "Let us know about any ingredients to avoid so we can filter recipes safely.",
        }
      case 5:
        if (
          medicalNeeds.hasMedicalNeeds === "yes" &&
          medicalNeeds.selectedCondition &&
          medicalNeeds.selectedCondition !== "other"
        ) {
          return {
            title: "Select prescription diet",
            description: "Choose from veterinary-approved therapeutic diets for your dog's condition.",
          }
        }
        return { title: "", description: "" }
      case 6:
        return {
          title: "Choose your recipes",
          description: "Select from our nutritionally complete recipes that match your dog's needs.",
        }
      case 7:
        return {
          title: "Portions & schedule",
          description: "We'll calculate exact portions and help you plan feeding times.",
        }
      case 8:
        return {
          title: "Add-ons & supplements",
          description: "Enhance your dog's nutrition with targeted supplements.",
        }
      case 9:
        return {
          title: "Review your plan",
          description: "Everything looks good? Let's get your dog started on their personalized nutrition journey.",
        }
      default:
        return { title: "", description: "" }
    }
  }

  const stepInfo = getStepInfo()

  // Moved the useEffect inside the component body to ensure it's called at the top level
  useEffect(() => {
    if (currentStep === 9) {
      analytics.reviewPlanViewed({
        dogProfile,
        selectedRecipes,
        selectedRecipeId: selectedRecipe,
        selectedPrescriptionDiet: medicalNeeds.selectedPrescriptionDiet,
        mealsPerDay,
        selectedAddOns,
      })
    }
  }, [currentStep, dogProfile, selectedRecipes, selectedRecipe, medicalNeeds, mealsPerDay, selectedAddOns])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WizardLayout
        currentStep={currentStep}
        totalSteps={9}
        stepTitle={stepInfo.title}
        stepDescription={stepInfo.description}
        onNext={currentStep === 9 ? handleProceedToCheckout : handleNext}
        onPrevious={handlePrevious}
        canGoNext={canGoNext()}
        canGoPrevious={currentStep > 1}
        nextLabel={currentStep === 9 ? "Proceed to Checkout" : "Continue"}
      >
        {getStepContent()}
      </WizardLayout>
    </div>
  )
}
