"use client"

import { useState, useEffect, useRef } from "react"
import { WizardLayout } from "@/components/plan-builder/wizard-layout"
import { Step1DogProfile } from "@/components/plan-builder/step-1-dog-profile"
import { Step2HealthGoals } from "@/components/plan-builder/step-2-health-goals"
import { StepMedicalNeeds } from "@/components/plan-builder/step-medical-needs"
import { StepPrescriptionDietSelection } from "@/components/plan-builder/step-prescription-diet-selection"
import { Step3Allergies } from "@/components/plan-builder/step-3-allergies"
import { Step4RecipeSelection } from "@/components/plan-builder/step-4-recipe-selection"
import { PlanReview } from "@/components/plan-builder/plan-review"
import { Header } from "@/components/header"
import { AuthModal } from "@/components/auth/auth-modal"
import type { DogProfile, HealthGoals } from "@/lib/nutrition-calculator"
import { calculateDERFromProfile, calculateDailyGrams, toKg } from "@/lib/nutrition-calculator"
import { useRouter } from "next/navigation"
import { analytics } from "@/lib/analytics"
import { supabase } from "@/lib/supabase/client"
import { waitForSession } from "@/lib/auth/waitForSession"
import { claimGuestPlan } from "@/app/plan-builder/_actions/claimPlan"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockAddOns } from "@/lib/nutrition-calculator"
import { calculateWeeklyPricing, getStripePricingForDog } from "@/lib/stripe-pricing"

interface DogPlanData {
  dogProfile: Partial<DogProfile>
  healthGoals: Partial<HealthGoals>
  selectedAllergens: string[]
  selectedRecipe: string | null
  selectedRecipes: string[]
  allowMultipleSelection: boolean
  mealsPerDay: number
  selectedAddOns: string[]
  medicalNeeds: {
    hasMedicalNeeds: string | null
    email: string
    selectedCondition: string | null
    selectedPrescriptionDiet: string | null
    verificationRequired: boolean
  }
  foodCostPerWeek: number
  addOnsCostPerWeek: number
  totalWeeklyCost: number
  subtotal_cents: number
}

export default function PlanBuilderPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const TOTAL_STEPS = 5
  const [showAuthModal, setShowAuthModal] = useState(false)

  const [currentDogIndex, setCurrentDogIndex] = useState(0)
  const [totalDogs, setTotalDogs] = useState(1)
  const [allDogsData, setAllDogsData] = useState<DogPlanData[]>([])
  const [showDogCountSelector, setShowDogCountSelector] = useState(false)

  const [isUpdatingFromAllDogsData, setIsUpdatingFromAllDogsData] = useState(false)

  const getDefaultDogData = (): DogPlanData => ({
    dogProfile: { weightUnit: "lb", ageUnit: "years", bodyCondition: 5, activity: "moderate" },
    healthGoals: { stoolScore: 4 },
    selectedAllergens: [],
    selectedRecipe: null,
    selectedRecipes: [],
    allowMultipleSelection: false,
    mealsPerDay: 2,
    selectedAddOns: [],
    medicalNeeds: {
      hasMedicalNeeds: null,
      email: "",
      selectedCondition: null,
      selectedPrescriptionDiet: null,
      verificationRequired: false,
    },
    foodCostPerWeek: 0,
    addOnsCostPerWeek: 0,
    totalWeeklyCost: 0,
    subtotal_cents: 0,
  })

  useEffect(() => {
    if (allDogsData.length === 0) {
      setAllDogsData([getDefaultDogData()])
    }
  }, [])

  // Check for add-dog-mode parameters
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return
    
    const isAddDogMode = localStorage.getItem("nouripet-add-dog-mode") === "true"
    const totalDogsFromStorage = localStorage.getItem("nouripet-total-dogs")
    
    if (isAddDogMode && totalDogsFromStorage) {
      const dogCount = parseInt(totalDogsFromStorage)
      setTotalDogs(dogCount)
      setShowDogCountSelector(false)
      setCurrentStep(1) // Skip to step 1 (Dog Basics)
      
      // Fetch existing dog data from database
      const fetchExistingDogs = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const { data: existingDogs, error } = await supabase
            .from('dogs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })

          if (error) {
            console.error('Error fetching existing dogs:', error)
            return
          }

          // Initialize with existing dog data + new dog
          const newDogsData = Array.from({ length: dogCount }, (_, index) => {
            if (existingDogs && existingDogs.length > index) {
              // Use existing dog data for this position
              const existingDog = existingDogs[index]
              return {
                dogProfile: {
                  name: existingDog.name,
                  weight: existingDog.weight,
                  weightUnit: existingDog.weight_unit || "lb",
                  age: existingDog.age,
                  ageUnit: existingDog.age_unit || "years",
                  sex: existingDog.sex,
                  breed: existingDog.breed,
                  activity: existingDog.activity_level || "moderate",
                  bodyCondition: existingDog.body_condition_score || 5,
                  isNeutered: existingDog.is_neutered,
                },
                healthGoals: { stoolScore: 4 },
                selectedAllergens: [],
                selectedRecipe: null,
                selectedRecipes: [],
                allowMultipleSelection: false,
                mealsPerDay: 2,
                selectedAddOns: [],
                medicalNeeds: {
                  hasMedicalNeeds: null,
                  email: "",
                  selectedCondition: null,
                  selectedPrescriptionDiet: null,
                  verificationRequired: false,
                },
                foodCostPerWeek: 0,
                addOnsCostPerWeek: 0,
                totalWeeklyCost: 0,
                subtotal_cents: 0,
              }
            }
            return getDefaultDogData()
          })
          
          setAllDogsData(newDogsData)
          setCurrentDogIndex(dogCount - 1) // Start with the new dog (last index)
        } catch (error) {
          console.error('Error in fetchExistingDogs:', error)
        }
      }

      fetchExistingDogs()
      
      // Clean up localStorage
      localStorage.removeItem("nouripet-add-dog-mode")
      localStorage.removeItem("nouripet-total-dogs")
    }
  }, [])

  // Current dog's data (derived from allDogsData)
  const currentDogData = allDogsData[currentDogIndex] || getDefaultDogData()

  const [dogProfile, setDogProfile] = useState<Partial<DogProfile>>(currentDogData.dogProfile)
  const [healthGoals, setHealthGoals] = useState<Partial<HealthGoals>>(currentDogData.healthGoals)
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(currentDogData.selectedAllergens)
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(currentDogData.selectedRecipe)
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>(currentDogData.selectedRecipes)
  const [allowMultipleSelection, setAllowMultipleSelection] = useState(currentDogData.allowMultipleSelection)
  const [mealsPerDay, setMealsPerDay] = useState(currentDogData.mealsPerDay)
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(currentDogData.selectedAddOns)
  const [medicalNeeds, setMedicalNeeds] = useState(currentDogData.medicalNeeds)
  const [foodCostPerWeek, setFoodCostPerWeek] = useState(currentDogData.foodCostPerWeek)
  const [addOnsCostPerWeek, setAddOnsCostPerWeek] = useState(currentDogData.addOnsCostPerWeek)
  const [totalWeeklyCost, setTotalWeeklyCost] = useState(currentDogData.totalWeeklyCost)
  const [subtotal_cents, setSubtotal_cents] = useState(currentDogData.subtotal_cents)

  useEffect(() => {
    const selectedDogData = localStorage.getItem("nouripet-selected-dog")
    if (selectedDogData) {
      try {
        const selectedDog = JSON.parse(selectedDogData)
        console.log("[v0] Pre-filling plan builder with selected dog:", selectedDog)

        const preFilledProfile: Partial<DogProfile> = {
          name: selectedDog.name,
          breed: selectedDog.breed,
          age: selectedDog.age,
          weight: selectedDog.weight,
          weightUnit: "lb",
          ageUnit: "years",
          bodyCondition: 5,
          activity: "moderate",
        }

        const preFilledData: DogPlanData = {
          dogProfile: preFilledProfile,
          healthGoals: { stoolScore: 4 },
          selectedAllergens: selectedDog.allergies || [],
          selectedRecipe: null,
          selectedRecipes: [],
          allowMultipleSelection: false,
          mealsPerDay: 2,
          selectedAddOns: [],
          medicalNeeds: {
            hasMedicalNeeds: selectedDog.conditions && selectedDog.conditions.length > 0 ? "yes" : null,
            email: "",
            selectedCondition:
              selectedDog.conditions && selectedDog.conditions.length > 0 ? selectedDog.conditions[0] : null,
            selectedPrescriptionDiet: null,
            verificationRequired: false,
          },
          foodCostPerWeek: 0,
          addOnsCostPerWeek: 0,
          totalWeeklyCost: 0,
          subtotal_cents: 0,
        }

        setIsUpdatingFromAllDogsData(true)
        setAllDogsData([preFilledData])
        setDogProfile(preFilledProfile)
        setHealthGoals({ stoolScore: 4 })
        setSelectedAllergens(selectedDog.allergies || [])
        setMedicalNeeds(preFilledData.medicalNeeds)
        setCurrentStep(1)

        localStorage.removeItem("nouripet-selected-dog")

        // Reset flag after a brief delay
        setTimeout(() => setIsUpdatingFromAllDogsData(false), 100)
      } catch (error) {
        console.error("[v0] Error parsing selected dog data:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (isUpdatingFromAllDogsData) return

    const data = allDogsData[currentDogIndex]
    if (data) {
      setIsUpdatingFromAllDogsData(true)
      setDogProfile(data.dogProfile)
      setHealthGoals(data.healthGoals)
      setSelectedAllergens(data.selectedAllergens)
      setSelectedRecipe(data.selectedRecipe)
      setSelectedRecipes(data.selectedRecipes)
      setAllowMultipleSelection(data.allowMultipleSelection)
      setMealsPerDay(data.mealsPerDay)
      setSelectedAddOns(data.selectedAddOns)
      setMedicalNeeds(data.medicalNeeds)
      setFoodCostPerWeek(data.foodCostPerWeek)
      setAddOnsCostPerWeek(data.addOnsCostPerWeek)
      setTotalWeeklyCost(data.totalWeeklyCost)
      setSubtotal_cents(data.subtotal_cents)
      setTimeout(() => setIsUpdatingFromAllDogsData(false), 50)
    }
  }, [currentDogIndex]) // Only depend on currentDogIndex, not allDogsData

  useEffect(() => {
    if (isUpdatingFromAllDogsData) return

    const timeoutId = setTimeout(() => {
      const currentData: DogPlanData = {
        dogProfile,
        healthGoals,
        selectedAllergens,
        selectedRecipe,
        selectedRecipes,
        allowMultipleSelection,
        mealsPerDay,
        selectedAddOns,
        medicalNeeds,
        foodCostPerWeek,
        addOnsCostPerWeek,
        totalWeeklyCost,
        subtotal_cents,
      }

      setAllDogsData((prev) => {
        const newData = [...prev]
        newData[currentDogIndex] = currentData
        return newData
      })
    }, 100) // Debounce updates to prevent rapid firing

    return () => clearTimeout(timeoutId)
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
    currentDogIndex,
    isUpdatingFromAllDogsData,
    foodCostPerWeek,
    addOnsCostPerWeek,
    totalWeeklyCost,
    subtotal_cents,
  ])

  useEffect(() => {
    const planData = {
      currentDogIndex,
      totalDogs,
      allDogsData,
      currentStep,
    }
    localStorage.setItem("nouripet-plan-builder", JSON.stringify(planData))
  }, [currentDogIndex, totalDogs, allDogsData, currentStep])

  useEffect(() => {
    const saved = localStorage.getItem("nouripet-plan-builder")
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.allDogsData && data.allDogsData.length > 0) {
          setCurrentDogIndex(data.currentDogIndex || 0)
          setTotalDogs(data.totalDogs || 1)
          setAllDogsData(data.allDogsData)
          setCurrentStep(data.currentStep >= 1 ? data.currentStep : 1)
        }
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

  const handleDogCountChange = (count: number) => {
    setTotalDogs(count)
    const newDogsData = Array.from({ length: count }, (_, index) => {
      if (allDogsData[index] && allDogsData[index].dogProfile.name) {
        return allDogsData[index]
      }
      return getDefaultDogData()
    })
    setAllDogsData(newDogsData)
    
    // If we're adding dogs (count > previous total), set currentDogIndex to the last dog
    if (count > allDogsData.length) {
      setCurrentDogIndex(count - 1)
    }
    
    setCurrentStep(1)
  }

  const switchToDog = (index: number) => {
    if (index >= 0 && index < totalDogs) {
      setCurrentDogIndex(index)
      if (!allDogsData[index] || !allDogsData[index].dogProfile.name) {
        setAllDogsData((prev) => {
          const newData = [...prev]
          newData[index] = getDefaultDogData()
          return newData
        })
      }
      setCurrentStep(1)
    }
  }

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return totalDogs > 0
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
        return !!medicalNeeds.hasMedicalNeeds
      case 3:
        if (medicalNeeds.selectedPrescriptionDiet) {
          return true
        }
        return !!(selectedRecipe || selectedRecipes.length > 0)
      case 4:
        // For the final step, require authentication if this is the last dog
        if (currentDogIndex === totalDogs - 1) {
          return !!user
        }
        return true
      default:
        return true
    }
  }

  const createAnonymousPlan = async () => {
    try {
      // Check if we already have a plan token
      const existingToken = localStorage.getItem("x-plan-token")
      if (existingToken) {
        console.log("[v0] Using existing plan token:", existingToken)
        return
      }

      const claimToken = crypto.randomUUID()
      localStorage.setItem("x-plan-token", claimToken)

      const { data: plans, error } = await supabase.from("current_user_plan").select("id, claim_token, status")

      if (error) {
        console.error("[v0] Error getting/creating anonymous plan:", error)
        // Remove the token if plan creation failed
        localStorage.removeItem("x-plan-token")
        return
      }

      const plan = plans && plans.length > 0 ? plans[0] : null

      if (plan) {
        console.log("[v0] Retrieved anonymous plan:", plan)
        // Update localStorage with the actual claim token from the database
        if (plan.claim_token && plan.claim_token !== claimToken) {
          localStorage.setItem("x-plan-token", plan.claim_token)
        }
      } else {
        console.log("[v0] No plan found, will create one during checkout")
      }
    } catch (error) {
      console.error("[v0] Error in createAnonymousPlan:", error)
      // Remove the token if there was an error
      localStorage.removeItem("x-plan-token")
    }
  }

  const handleProceedToCheckout = async () => {
    if (currentDogIndex < totalDogs - 1) {
      const nextDogIndex = currentDogIndex + 1
      if (!allDogsData[nextDogIndex] || !allDogsData[nextDogIndex].dogProfile.name) {
        setAllDogsData((prev) => {
          const newData = [...prev]
          newData[nextDogIndex] = getDefaultDogData()
          return newData
        })
      }
      setCurrentDogIndex(nextDogIndex)
      setCurrentStep(1)
      return
    }

    // If this is the last dog and user is not authenticated, show auth modal
    if (!user) {
      setShowAuthModal(true)
      return
    }

    const calculateDogPricing = (dogData: DogPlanData) => {
      const { weeklyAmountCents } = calculateWeeklyPricing(dogData)

      const selectedAddOnItems = mockAddOns.filter((a) => dogData.selectedAddOns.includes(a.id))
      const addOnsCostPerWeek = selectedAddOnItems.reduce((total, addOn) => total + addOn.pricePerMonth / 4, 0) // Convert monthly add-ons to weekly

      const weeklyFoodCost = weeklyAmountCents / 100
      const totalWeeklyCost = weeklyFoodCost + addOnsCostPerWeek

      return {
        foodCostPerWeek: weeklyFoodCost,
        addOnsCostPerWeek,
        totalWeeklyCost,
        subtotal_cents: Math.round(totalWeeklyCost * 100),
      }
    }

    const allDogsPlans = allDogsData.map((dogData, index) => {
      const pricing = calculateDogPricing(dogData)

      return {
        name: dogData.dogProfile.name,
        age: dogData.dogProfile.age,
        weight: dogData.dogProfile.weight,
        weightUnit: dogData.dogProfile.weightUnit,
        activity: dogData.dogProfile.activity,
        bodyCondition: dogData.dogProfile.bodyCondition,
        breed: dogData.dogProfile.breed,
        recipes:
          dogData.selectedRecipes.length > 0 ? dogData.selectedRecipes : [dogData.selectedRecipe].filter(Boolean),
        prescriptionDiet: dogData.medicalNeeds.selectedPrescriptionDiet,
        mealsPerDay: dogData.mealsPerDay,
        addOns: dogData.selectedAddOns,
        healthGoals: dogData.healthGoals,
        selectedAllergens: dogData.selectedAllergens,
        subtotal_cents: pricing.subtotal_cents,
        foodCostPerWeek: pricing.foodCostPerWeek,
        addOnsCostPerWeek: pricing.addOnsCostPerWeek,
        totalWeeklyCost: pricing.totalWeeklyCost,
      }
    })

    analytics.proceedToCheckoutClicked({
      planId: `plan_${Date.now()}`,
      dogs: allDogsPlans,
      recipes: allDogsPlans.flatMap((dog) => dog.recipes || []).filter((recipe): recipe is string => Boolean(recipe)),
      prescriptionDiet: allDogsPlans.find((dog) => dog.prescriptionDiet)?.prescriptionDiet,
      mealsPerDay: allDogsPlans[0]?.mealsPerDay || 2,
      planType: "full",
      priceMonthly: allDogsPlans.reduce((total, dog) => total + dog.totalWeeklyCost, 0),
      addOns: allDogsPlans.flatMap((dog) => dog.addOns),
    })

    console.log("[v0] proceed_to_checkout_clicked")

    // Prevent multiple simultaneous calls
    if (isProcessingAuth) {
      console.log("[v0] Checkout already processing, skipping duplicate call")
      return
    }

    const subtotal_cents = allDogsPlans.reduce((total, dog) => total + dog.subtotal_cents, 0)
    const discount_cents = 0 // plug your discounts here if any
    const total_cents = Math.max(0, subtotal_cents - discount_cents)

    // existing payload + NEW fields for checkout
    const planPayload = {
      planId: `plan_${Date.now()}`,
      dogs: allDogsPlans,
      totalDogs: allDogsPlans.length,
      planType: "full",

      // keep both flattened + per-dog lists for compatibility
      recipes: allDogsPlans.flatMap((dog) => dog.recipes).filter(Boolean),
      addOns: allDogsPlans.flatMap((dog) => dog.addOns).filter(Boolean),

      totals: { subtotal_cents, discount_cents, total_cents },
    }

    localStorage.setItem("nouripet-checkout-plan", JSON.stringify(planPayload))

    console.log("[v0] Checking authentication state:", { user: !!user, isLoading })

    // Check if user is authenticated via direct session check as well
    const { data: { session: directSession } } = await supabase.auth.getSession()
    const isAuthenticatedViaSession = !!directSession?.user
    console.log("[v0] Direct session check:", { isAuthenticatedViaSession, userId: directSession?.user?.id })

    // No need to create anonymous plan - we'll go directly to checkout after auth

    if (isLoading && !isAuthenticatedViaSession) {
      console.log("[v0] Auth still loading, waiting...")
      // Wait a bit for auth to initialize, then check again
      setTimeout(() => {
        if (user && !isProcessingAuth) {
          console.log("[v0] User authenticated after loading, proceeding to save plan")
          handleAuthSuccess()
        } else if (!user && !isProcessingAuth) {
          console.log("[v0] User not authenticated after loading, showing auth modal")
          setShowAuthModal(true)
        } else {
          console.log("[v0] Auth already processing, skipping duplicate call")
        }
      }, 500)
      return
    }

    if ((user || isAuthenticatedViaSession) && !isProcessingAuth) {
      console.log("[v0] User already authenticated, proceeding directly to save plan")
      handleAuthSuccess()
    } else if (!user && !isAuthenticatedViaSession) {
      console.log("[v0] User not authenticated, showing auth modal")
      setShowAuthModal(true)
    } else {
      console.log("[v0] Auth already processing, skipping duplicate call")
    }
  }

  const handleCreateAccount = () => {
    setShowAuthModal(true)
  }

  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const authSuccessRef = useRef(false)

  const handleAuthSuccess = async () => {
    // Prevent multiple simultaneous executions using both state and ref
    if (isProcessingAuth || authSuccessRef.current) {
      console.log("[v0] Auth success already processing, skipping duplicate call")
      return
    }
    
    setIsProcessingAuth(true)
    authSuccessRef.current = true
    console.log("[v0] Auth success - starting reliable session handling")
    
    // Clear any existing timeout to prevent multiple executions
    if ((window as any).authSuccessTimeout) {
      clearTimeout((window as any).authSuccessTimeout)
      delete (window as any).authSuccessTimeout
    }
    
    // Set a timeout to close the modal if it gets stuck
    const timeoutId = setTimeout(() => {
      console.log("[v0] Auth success timeout - closing modal to prevent stuck state")
      setShowAuthModal(false)
      setIsProcessingAuth(false)
      authSuccessRef.current = false
    }, 10000) // Reduced timeout to 10 seconds
    
    try {
      console.log("[v0] Waiting for authenticated session...")
      
      // First, try to get the current session directly
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      
      let session
      if (currentSession?.user && !sessionError) {
        console.log("[v0] Session already available:", currentSession.user.id)
        session = currentSession
        clearTimeout(timeoutId)
      } else {
        console.log("[v0] No current session, waiting for session...")
        // Use shorter timeout for waitForSession since we have a global timeout
        session = await waitForSession(5000, 250) // Reduced timeout and interval
        console.log("[v0] Session confirmed:", session.user.id)
        clearTimeout(timeoutId)
      }
      
      // Validate session user ID
      if (!session?.user?.id) {
        throw new Error("No valid user ID found in session")
      }

      console.log("[v0] User authenticated successfully, proceeding to checkout")
      
      // Close the modal after successful authentication
      setShowAuthModal(false)
      setIsProcessingAuth(false)
      authSuccessRef.current = false
      
      // Redirect to checkout - the plan data is already saved in localStorage
      router.push("/checkout")
      return
    } catch (error) {
      console.error("[v0] Error in handleAuthSuccess:", error)
      
      // Clear the timeout since we're handling the error
      clearTimeout(timeoutId)
      
      // Show specific error message for debugging
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Check if it's a session-related error
      if (errorMessage.includes("No authenticated user") || errorMessage.includes("session")) {
        console.log("[v0] Session error detected, redirecting to login")
        setShowAuthModal(true)
        setIsProcessingAuth(false)
        return
      }
      
      // For other errors, show alert and close modal
      alert(`Error authenticating: ${errorMessage}`)
      setShowAuthModal(false)
      setIsProcessingAuth(false)
      authSuccessRef.current = false
    }
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
    // Check if we're in add-dog-mode and skip step 0 (only on client side)
    if (typeof window !== "undefined") {
      const isAddDogMode = localStorage.getItem("nouripet-add-dog-mode") === "true"
      if (currentStep === 0 && isAddDogMode) {
        return null // Skip the dog count selector
      }
    }

    switch (currentStep) {
      case 0:
        return (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>How many dogs do you have?</CardTitle>
                <p className="text-muted-foreground">We'll create personalized plans for each of your dogs.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((count) => (
                    <Button
                      key={count}
                      variant={totalDogs === count ? "default" : "outline"}
                      className={`h-16 text-lg ${
                        totalDogs === count
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-transparent"
                      }`}
                      onClick={() => setTotalDogs(count)}
                    >
                      {count} {count === 1 ? "Dog" : "Dogs"}
                    </Button>
                  ))}
                </div>
                {totalDogs > 4 && (
                  <div className="text-center text-sm text-muted-foreground">
                    Need plans for more than 4 dogs? Contact us for custom pricing.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      case 1:
        return <Step1DogProfile profile={dogProfile} onUpdate={updateDogProfile} />
      case 2:
        return (
          <div className="space-y-6">
            <Step2HealthGoals goals={healthGoals} onUpdate={updateHealthGoals} dogProfile={dogProfile} />
            <StepMedicalNeeds
              hasMedicalNeeds={medicalNeeds.hasMedicalNeeds}
              email={medicalNeeds.email}
              selectedCondition={medicalNeeds.selectedCondition}
              onUpdate={updateMedicalNeeds}
            />
            <Step3Allergies selectedAllergens={selectedAllergens} onUpdate={setSelectedAllergens} />
            {medicalNeeds.hasMedicalNeeds === "yes" &&
              medicalNeeds.selectedCondition &&
              medicalNeeds.selectedCondition !== "other" && (
                <StepPrescriptionDietSelection
                  selectedCondition={medicalNeeds.selectedCondition}
                  selectedPrescriptionDiet={medicalNeeds.selectedPrescriptionDiet}
                  dogName={dogProfile.name || ""}
                  onUpdate={updatePrescriptionDiet}
                  onVerificationRequired={handleVerificationRequired}
                />
              )}
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <Step4RecipeSelection
              selectedRecipe={selectedRecipe}
              selectedRecipes={selectedRecipes}
              onUpdate={updateSelectedRecipe}
              onUpdateMultiple={updateSelectedRecipes}
              excludedAllergens={selectedAllergens}
              dogProfile={dogProfile}
              allowMultipleSelection={true}
            />
          </div>
        )
      case 4:
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
            onMealsPerDayUpdate={setMealsPerDay}
            onAddOnsUpdate={setSelectedAddOns}
            onProceedToCheckout={handleProceedToCheckout}
            onCreateAccount={handleCreateAccount}
            isAuthenticated={!!user}
            currentDogIndex={currentDogIndex}
            totalDogs={totalDogs}
            isLastDog={currentDogIndex === totalDogs - 1}
          />
        )
      default:
        return <div>Step {currentStep} - Coming soon!</div>
    }
  }

  const getStepInfo = () => {
    switch (currentStep) {
      case 0:
        return {
          title: "Getting Started",
          description: "Let's start by learning about your dogs.",
        }
      case 1:
        return {
          title: "Dog Basics",
          description: `Tell us about ${totalDogs > 1 ? `dog ${currentDogIndex + 1} of ${totalDogs}` : "your pup"}.`,
        }
      case 2:
        return {
          title: "Goals & Sensitivities",
          description: "Share goals, medical needs, and allergies.",
        }
      case 3:
        return {
          title: "Meal Selection",
          description: "Review AI suggestions and pick your recipe.",
        }
      case 4:
        return {
          title: "Plan Preview",
          description:
            totalDogs > 1 && currentDogIndex < totalDogs - 1
              ? `Review ${dogProfile.name}'s plan and continue to next dog.`
              : user 
                ? "Review your plan and purchase your subscription to get started."
                : "Review your plan and sign in to purchase your subscription.",
        }
      default:
        return { title: "", description: "" }
    }
  }

  const stepInfo = getStepInfo()

  const handleNext = () => {
    if (canGoNext()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {totalDogs > 1 && currentStep > 0 && (
        <div className="border-b bg-muted/30">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="font-semibold">
                  {dogProfile.name || `Dog ${currentDogIndex + 1}`}
                  <span className="text-muted-foreground ml-2">
                    ({currentDogIndex + 1} of {totalDogs})
                  </span>
                </h2>
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(0)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Change Dog Count
                </Button>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: totalDogs }, (_, index) => (
                  <Button
                    key={index}
                    variant={index === currentDogIndex ? "default" : "outline"}
                    size="sm"
                    onClick={() => switchToDog(index)}
                    disabled={index === currentDogIndex}
                  >
                    {allDogsData[index]?.dogProfile.name || `Dog ${index + 1}`}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <WizardLayout
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        stepTitle={stepInfo.title}
        stepDescription={stepInfo.description}
        onNext={currentStep === TOTAL_STEPS - 1 ? handleProceedToCheckout : handleNext}
        onPrevious={handlePrevious}
        canGoNext={canGoNext()}
        canGoPrevious={currentStep > 0}
        nextLabel={
          currentStep === 0
            ? "Start Building Plans"
            : currentStep === TOTAL_STEPS - 1
              ? totalDogs > 1 && currentDogIndex < totalDogs - 1
                ? `Continue to ${allDogsData[currentDogIndex + 1]?.dogProfile.name || `Dog ${currentDogIndex + 2}`}`
                : user 
                  ? "Purchase Subscription"
                  : "Sign In to Purchase"
              : "Continue"
        }
      >
        {getStepContent()}
      </WizardLayout>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="signup"
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}
