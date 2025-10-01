"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  }, [currentDogIndex, allDogsData]) // Add allDogsData as dependency to ensure proper sync

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
      // Save current dog's data before switching
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

      // Update allDogsData with current dog's data
      setAllDogsData((prev) => {
        const newData = [...prev]
        newData[currentDogIndex] = currentData
        return newData
      })

      // Switch to the new dog
      setCurrentDogIndex(index)
      
      // Ensure the new dog has data
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

    if (!user && !isLoading && !isAuthenticatedViaSession) {
      console.log("[v0] Creating anonymous plan before authentication...")
      await createAnonymousPlan()
    }

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

  const handleAuthSuccess = useCallback(async () => {
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

      console.log("[v0] Claiming guest plan...")
      await claimGuestPlan()

      localStorage.removeItem("x-plan-token")

      // Check for existing active plan directly instead of using the broken view
      const { data: existingPlans, error: planFetchError } = await supabase
        .from("plans")
        .select("id, status")
        .eq("user_id", session.user.id)
        .in("status", ["draft", "active", "checkout_in_progress"])
        .order("created_at", { ascending: false })
      
      // Clean up any duplicate plans first
      if (existingPlans && existingPlans.length > 1) {
        console.log("[v0] Found multiple plans, cleaning up duplicates...")
        const plansToDelete = existingPlans.slice(1) // Keep the first one, delete the rest
        for (const plan of plansToDelete) {
          console.log("[v0] Deleting duplicate plan:", plan.id)
          await supabase.from("plans").delete().eq("id", plan.id)
        }
      }
      
      const existingPlan = existingPlans && existingPlans.length > 0 ? existingPlans[0] : null

      let planId
      let firstDogDbData = null // Declare outside the if/else block
      
      if (existingPlan) {
        planId = existingPlan.id
        console.log("[v0] Using existing plan:", planId)
        
        // Clean up any existing plan items to prevent duplicates
        console.log("[v0] Cleaning up existing plan items...")
        const { error: deleteItemsError } = await supabase
          .from("plan_items")
          .delete()
          .eq("plan_id", planId)
        
        if (deleteItemsError) {
          console.error("[v0] Error deleting existing plan items:", deleteItemsError)
          // Don't return here, continue with plan creation
        } else {
          console.log("[v0] Existing plan items cleaned up")
        }
        
        // Update plan status to checkout_in_progress
        const { error: updateStatusError } = await supabase
          .from("plans")
          .update({ status: "checkout_in_progress" })
          .eq("id", planId)
        
        if (updateStatusError) {
          console.error("[v0] Error updating plan status:", updateStatusError)
        } else {
          console.log("[v0] Plan status updated to checkout_in_progress")
        }
      } else {
        // Get the first dog's ID to link to the plan
        const firstDogData = allDogsData[0]
        if (!firstDogData || !firstDogData.dogProfile.name) {
          console.error("[v0] No dog data available for plan creation")
          return
        }

        // Create the first dog first to get its ID
        const weight = firstDogData.dogProfile.weight || 0
        const weightUnit = firstDogData.dogProfile.weightUnit || "lb"

        // Check for existing dog with same name to prevent duplicates
        const { data: existingFirstDogs, error: checkFirstError } = await supabase
          .from("dogs")
          .select("id, name, user_id")
          .eq("user_id", session.user.id)
          .eq("name", firstDogData.dogProfile.name)
          .limit(1)
          
        const existingFirstDog = existingFirstDogs?.[0]
        if (existingFirstDog) {
          console.log(`[v0] ⚠️ First dog with name "${firstDogData.dogProfile.name}" already exists, using existing dog:`, existingFirstDog.id)
          firstDogDbData = existingFirstDog
        } else {
          const { data: firstDogDataResult, error: firstDogError } = await supabase
            .from("dogs")
            .insert({
              user_id: session.user.id,
              name: firstDogData.dogProfile.name,
              breed: firstDogData.dogProfile.breed,
              age: firstDogData.dogProfile.age,
              weight: weight,
              weight_unit: weightUnit,
              weight_kg: toKg(weight, weightUnit),
              allergies: firstDogData.selectedAllergens,
              conditions: firstDogData.medicalNeeds.selectedCondition ? [firstDogData.medicalNeeds.selectedCondition] : [],
            })
            .select("id, user_id")
            .single()

          if (firstDogError) {
            console.error("[v0] Error creating first dog:", firstDogError)
            return
          }

          firstDogDbData = firstDogDataResult // Assign to the scoped variable
          console.log("[v0] Created first dog with ID:", firstDogDbData.id, "user_id:", firstDogDbData.user_id)
        }
        
        // Validate that the dog was created with the correct user_id
        if (!firstDogDbData.user_id || firstDogDbData.user_id !== session.user.id) {
          throw new Error(`Dog created with incorrect user_id. Expected: ${session.user.id}, Got: ${firstDogDbData.user_id}`)
        }

        console.log("[v0] Creating plan with user_id:", session.user.id, "and dog_id:", firstDogDbData.id)
        
        const { data: planData, error: planError } = await supabase
          .from("plans")
          .insert({
            user_id: session.user.id,
            dog_id: firstDogDbData.id, // CRITICAL: Link plan to the first dog
            status: "draft",
            current_step: 4,
            subtotal_cents: 0,
            discount_cents: 0,
            total_cents: 0,
            delivery_zipcode: null,
          })
          .select("id, user_id")
          .single()

        if (planError) {
          console.error("[v0] Error creating plan:", planError)
          alert(`Error creating plan: ${planError.message}`)
          return
        }
        planId = planData.id
        console.log("[v0] Created new plan with UUID:", planId, "linked to dog:", firstDogDbData.id, "user_id:", planData.user_id)
        
        // Validate that the plan was created with the correct user_id
        if (!planData.user_id || planData.user_id !== session.user.id) {
          throw new Error(`Plan created with incorrect user_id. Expected: ${session.user.id}, Got: ${planData.user_id}`)
        }

        // Create plan-dog relationship for the first dog
        const { error: firstPlanDogError } = await supabase.rpc("upsert_plan_dog", {
          p_plan_id: planId,
          p_dog_id: firstDogDbData.id,
          p_position: 1,
          p_snapshot: null,
          p_meals_per_day: firstDogData.mealsPerDay,
          p_prescription: firstDogData.medicalNeeds.selectedPrescriptionDiet,
          p_verify: false,
        })

        if (firstPlanDogError) {
          console.error("[v0] Error creating plan_dog relationship for first dog:", firstPlanDogError)
          
          // Log specific error details for debugging
          if (firstPlanDogError.code === 'PGRST202') {
            console.log("[v0] 🚨 RPC function 'upsert_plan_dog' not found")
          } else if (firstPlanDogError.code === 'PGRST301') {
            console.log("[v0] 🚨 Invalid parameters for 'upsert_plan_dog'")
          } else {
            console.log("[v0] 🚨 Unexpected RPC error:", {
              code: firstPlanDogError.code,
              message: firstPlanDogError.message,
              details: firstPlanDogError.details
            })
          }
          
          alert(`Error creating plan-dog relationship: ${firstPlanDogError.message}`)
          return
        } else {
          console.log("[v0] Plan-dog relationship created for first dog")
        }
      }

      console.log("[v0] Saving all dogs data...")

      // Start from index 0 to process all dogs (including the first one we created above)
      const startIndex = 0
      let firstDogId = null

      if (!existingPlan && firstDogDbData) {
        // We already created the first dog above, get its ID
        firstDogId = firstDogDbData.id
        console.log(`[v0] First dog already created with ID: ${firstDogId}`)
      }

      console.log(`[v0] Processing ${allDogsData.length} dogs, starting from index ${startIndex}`)
      for (let i = startIndex; i < allDogsData.length; i++) {
        const dogData = allDogsData[i]
        console.log(`[v0] Processing dog ${i + 1}: ${dogData.dogProfile.name}`)

        // Define weight and weightUnit at the top level for use throughout the loop
        const weight = dogData.dogProfile.weight || 0
        const weightUnit = dogData.dogProfile.weightUnit || "lb"

        // Skip dog creation if this is the first dog and it was already created above
        let dogDbData
        if (i === 0 && !existingPlan && firstDogDbData) {
          console.log(`[v0] Using already created first dog: ${firstDogDbData.id}`)
          dogDbData = firstDogDbData
        } else {
          // Create new dog

          console.log(`[v0] Creating new dog ${i + 1}: ${dogData.dogProfile.name}`)
          
          // Check for existing dog with same name to prevent duplicates
          const { data: existingDogs, error: checkError } = await supabase
            .from("dogs")
            .select("id, name")
            .eq("user_id", session.user.id)
            .eq("name", dogData.dogProfile.name)
            .limit(1)
            
          const existingDog = existingDogs?.[0]
          if (existingDog) {
            console.log(`[v0] ⚠️ Dog with name "${dogData.dogProfile.name}" already exists, using existing dog:`, existingDog.id)
            dogDbData = existingDog
          } else {
            const { data: newDogData, error: dogError } = await supabase
              .from("dogs")
              .insert({
                user_id: session.user.id,
                name: dogData.dogProfile.name,
                breed: dogData.dogProfile.breed,
                age: dogData.dogProfile.age,
                weight: weight, // Store in original unit
                weight_unit: weightUnit, // Store the unit
                weight_kg: toKg(weight, weightUnit), // Also store converted weight
                allergies: dogData.selectedAllergens,
                conditions: dogData.medicalNeeds.selectedCondition ? [dogData.medicalNeeds.selectedCondition] : [],
              })
              .select("id, user_id")
              .single()

            if (dogError) {
              console.error(`[v0] Error saving dog ${i + 1}:`, dogError)
              alert(`Error saving dog ${i + 1}: ${dogError.message}`)
              continue
            }

            dogDbData = newDogData
            console.log(`[v0] Dog ${i + 1} saved successfully:`, dogDbData)

            // Validate that the dog was created with the correct user_id
            if (!dogDbData.user_id || dogDbData.user_id !== session.user.id) {
              console.error(`[v0] Dog ${i + 1} created with incorrect user_id. Expected: ${session.user.id}, Got: ${dogDbData.user_id}`)
              alert(`Error: Dog created with incorrect user ID`)
              continue
            }
          }
        }

        // Skip plan-dog relationship creation for the first dog since it was already created above
        if (!(i === 0 && !existingPlan)) {
          const { error: planDogError } = await supabase.rpc("upsert_plan_dog", {
            p_plan_id: planId,
            p_dog_id: dogDbData.id,
            p_position: i + 1,
            p_snapshot: null,
            p_meals_per_day: dogData.mealsPerDay,
            p_prescription: dogData.medicalNeeds.selectedPrescriptionDiet,
            p_verify: false,
          })

          if (planDogError) {
            console.error(`[v0] Error creating plan_dog relationship for dog ${i + 1}:`, planDogError)
            
            // Log specific error details for debugging
            if (planDogError.code === 'PGRST202') {
              console.log("[v0] 🚨 RPC function 'upsert_plan_dog' not found")
            } else if (planDogError.code === 'PGRST301') {
              console.log("[v0] 🚨 Invalid parameters for 'upsert_plan_dog'")
            } else {
              console.log("[v0] 🚨 Unexpected RPC error:", {
                code: planDogError.code,
                message: planDogError.message,
                details: planDogError.details
              })
            }
            
            alert(`Error creating plan-dog relationship for dog ${i + 1}: ${planDogError.message}`)
            continue
          }

          console.log(`[v0] Plan-dog relationship created for dog ${i + 1}`)
        } else {
          console.log(`[v0] Skipping plan-dog relationship for first dog (already created above)`)
        }

        console.log(`[v0] Dog data for recipe selection:`, {
          selectedRecipes: dogData.selectedRecipes,
          selectedRecipe: dogData.selectedRecipe,
          hasSelectedRecipes: dogData.selectedRecipes?.length > 0,
          hasSelectedRecipe: !!dogData.selectedRecipe
        })

        const recipes =
          dogData.selectedRecipes.length > 0 ? dogData.selectedRecipes : [dogData.selectedRecipe].filter(Boolean)
        
        console.log(`[v0] Recipes to process for dog ${i + 1}:`, recipes)

        // Get all available recipes from database
        const { data: availableRecipes, error: recipesError } = await supabase
          .from("recipes")
          .select("id, name, slug")
          .eq("is_active", true)

        if (recipesError) {
          console.error("[v0] Error fetching recipes:", recipesError)
          continue
        }

        console.log("[v0] Available recipes:", availableRecipes)

        if (recipes.length === 0) {
          console.log(`[v0] ⚠️ No recipes found for dog ${i + 1}, skipping plan item creation`)
        } else {
          console.log(`[v0] Starting recipe processing loop for dog ${i + 1} with ${recipes.length} recipes`)
        }

        for (const recipeId of recipes) {
          console.log(`[v0] Processing recipe for dog ${i + 1}:`, recipeId)

          const recipeData = availableRecipes?.find(
            (r) => r.slug === recipeId || r.id === recipeId || r.name === recipeId,
          )

          if (!recipeData) {
            console.error(`[v0] Recipe not found in database: ${recipeId}`)
            alert(`Recipe not found in database: ${recipeId}`)
            continue
          }

          const weightLbs = weightUnit === "kg" ? weight * 2.20462 : weight
          const stripePricing = getStripePricingForDog(recipeData.slug, weightLbs)

          if (!stripePricing) {
            console.error(`[v0] No Stripe pricing found for recipe ${recipeId}`)
            alert(`No Stripe pricing found for recipe ${recipeId}`)
            continue
          }

          // Calculate DER using canonical formula
          const dogProfile = {
            weight: weight,
            weightUnit: weightUnit,
            age: dogData.dogProfile.age || 4,
            ageUnit: "years" as const,
            sex: dogData.dogProfile.sex || "male" as const,
            breed: dogData.dogProfile.breed || "mixed-breed",
            activity: dogData.dogProfile.activity || "moderate" as const,
            bodyCondition: dogData.dogProfile.bodyCondition || 5,
            isNeutered: dogData.dogProfile.isNeutered ?? true,
            lifeStage: dogData.dogProfile.lifeStage || "adult" as const
          }
          const der = calculateDERFromProfile(dogProfile)
          const caloriesPer100g = 175 // Realistic calories per 100g of fresh dog food
          const dailyGrams = calculateDailyGrams(der, caloriesPer100g)

          // Calculate monthly grams (30 days)
          const monthlyGrams = dailyGrams * 30

          // Round up to nearest 100g pack size for shipping efficiency
          const sizeG = Math.ceil(monthlyGrams / 100) * 100

          console.log(
            `[v0] Calculated portions for ${dogData.dogProfile.name}: ${dailyGrams}g/day, ${monthlyGrams}g/month, ${sizeG}g package size`,
          )

          console.log(`[v0] Creating plan item for dog ${i + 1}, recipe ${recipeId}...`)
          
          // Insert new plan item
          const { data: planItem, error: planItemError } = await supabase
            .from("plan_items")
            .insert({
              plan_id: planId,
              dog_id: dogDbData.id,
              recipe_id: recipeData.id, // Use recipe UUID instead of slug
              qty: 1,
              size_g: sizeG,
              billing_interval: "week",
              stripe_price_id: stripePricing?.priceId,
              unit_price_cents: stripePricing?.amountCents || 2100,
              amount_cents: stripePricing?.amountCents || 2100,
              meta: {
                source: "wizard",
                dog_weight: weight,
                weight_unit: weightUnit,
                daily_grams: dailyGrams,
                monthly_grams: monthlyGrams,
                activity_level: dogData.dogProfile.activity,
                calculated_calories: Math.round(der),
                stripe_product_name: stripePricing?.productName,
              },
            })
            .select("id")
            .single()
          
          if (planItemError) {
            console.error(`[v0] Error creating plan item for dog ${i + 1}:`, planItemError)
            continue
          }

          console.log(`[v0] ✅ Plan item saved for dog ${i + 1}, recipe ${recipeId}:`, planItem.id)
          console.log(`[v0] Weekly price: $${((stripePricing?.amountCents || 2100) / 100).toFixed(2)}`)

          // The RPC function was causing issues and we have the correct Stripe pricing
        }

        const weightInKg = toKg(weight, weightUnit)
        const targetWeight = dogData.healthGoals.targetWeight
        const targetWeightInKg = targetWeight ? (weightUnit === "kg" ? targetWeight * 0.453592 : targetWeight) : null

        if (dogData.dogProfile.weight && dogDbData) {
          const metricsData = {
            weight_kg: weightInKg,
            body_condition_score: dogData.dogProfile.bodyCondition,
            notes: `Initial weight from plan builder${targetWeightInKg ? `. Target: ${targetWeightInKg.toFixed(1)}kg` : ""}`
          }
          
          // Use improved error handling for dog metrics
          const { error: metricsError } = await supabase.from("dog_metrics").upsert({
            dog_id: dogDbData.id,
            ...metricsData,
            measured_at: new Date().toISOString().split("T")[0]
          }, {
            onConflict: 'dog_id,measured_at'
          })

          if (metricsError) {
            console.error(`[v0] Error saving dog metrics for dog ${i + 1}:`, metricsError)
            
            // Log specific error details for debugging
            if (metricsError.code === '23505') {
              console.log(`[v0] 💡 Dog metrics already exist for today, this is expected behavior`)
            } else {
              console.log(`[v0] 🚨 Unexpected dog metrics error:`, {
                code: metricsError.code,
                message: metricsError.message,
                details: metricsError.details
              })
            }
          } else {
            console.log(`[v0] ✅ Dog metrics saved for dog ${i + 1}`)
          }
        }
      }

      try {
        const { error: totalsError } = await supabase.rpc("recalc_plan_totals", {
          p_plan_id: planId,
        })

        if (totalsError) {
          console.error("[v0] RPC totals error:", totalsError)
          
          // Log specific error details for debugging
          if (totalsError.code === 'PGRST202') {
            console.log("[v0] 🚨 RPC function 'recalc_plan_totals' not found")
          } else if (totalsError.code === 'PGRST301') {
            console.log("[v0] 🚨 Invalid parameters for 'recalc_plan_totals'")
          } else {
            console.log("[v0] 🚨 Unexpected RPC error:", {
              code: totalsError.code,
              message: totalsError.message,
              details: totalsError.details
            })
          }
          const { data: planItems, error: itemsError } = await supabase
            .from("plan_items")
            .select("amount_cents")
            .eq("plan_id", planId)

          if (!itemsError && planItems) {
            const subtotalCents = planItems.reduce((sum, item) => sum + (item.amount_cents || 0), 0)
            const discountCents = 0 // No discounts for now
            const totalCents = Math.max(0, subtotalCents - discountCents)

            const { error: updateError } = await supabase
              .from("plans")
              .update({
                subtotal_cents: subtotalCents,
                discount_cents: discountCents,
                total_cents: totalCents,
                status: "active",
              })
              .eq("id", planId)

            if (updateError) {
              console.error("[v0] Error updating plan totals manually:", updateError)
            } else {
              console.log(`[v0] Plan totals calculated manually: $${(totalCents / 100).toFixed(2)}`)
            }
          }
        } else {
          console.log("[v0] RPC plan totals recalculated successfully")
          // Update plan status to ready for checkout
          await supabase.from("plans").update({ status: "active" }).eq("id", planId)
        }
      } catch (error) {
        console.error("[v0] Error recalculating totals:", error)
      }

      // Verify plan items were created
      const { data: finalPlanItems, error: finalItemsError } = await supabase
        .from("plan_items")
        .select("id, recipe_id, unit_price_cents")
        .eq("plan_id", planId)

      if (finalItemsError) {
        console.error("[v0] Error verifying plan items:", finalItemsError)
      } else {
        console.log(`[v0] ✅ Plan creation completed! Created ${finalPlanItems.length} plan items`)
        finalPlanItems.forEach((item, index) => {
          console.log(`   ${index + 1}. Plan item ${item.id} - $${(item.unit_price_cents / 100).toFixed(2)}`)
        })
      }

      console.log("[v0] Proceeding to checkout...")
      
      // Close the modal after successful completion
      setShowAuthModal(false)
      setIsProcessingAuth(false)
      authSuccessRef.current = false
      
      router.push("/checkout")
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
      alert(`Error saving plan: ${errorMessage}`)
      setShowAuthModal(false)
      setIsProcessingAuth(false)
      authSuccessRef.current = false
    }
  }, [router])

  const handleCloseAuthModal = useCallback(() => {
    setShowAuthModal(false)
  }, [])

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
              : "Confirm portions, schedule, add-ons, and save.",
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
                : "Continue to Checkout"
              : "Continue"
        }
      >
        {getStepContent()}
      </WizardLayout>

      <AuthModal
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        defaultMode="signup"
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}
