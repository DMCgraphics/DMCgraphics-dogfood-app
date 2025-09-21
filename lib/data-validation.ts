/**
 * Data validation utilities to ensure all required fields are present
 * when creating users and their associated data
 */

export interface DogData {
  name: string
  breed?: string
  age?: number
  weight: number
  weight_unit: 'lb' | 'kg'
  weight_kg?: number
  allergies?: string[]
  conditions?: string[]
  avatar_url?: string
}

export interface PlanData {
  user_id: string
  dog_id: string
  status: 'draft' | 'saved' | 'checkout' | 'active' | 'paused' | 'cancelled'
  current_step?: number
  claim_token?: string
  snapshot?: any
  subtotal_cents: number
  discount_cents?: number
  total_cents: number
  stripe_session_id?: string
  stripe_subscription_id?: string
}

export interface PlanItemData {
  plan_id: string
  dog_id: string
  recipe_id?: string
  qty?: number
  size_g?: number
  billing_interval?: string
}

export interface SubscriptionData {
  user_id: string
  plan_id: string
  status: 'active' | 'paused' | 'cancelled' | 'expired'
  billing_cycle?: string
  next_billing_date?: string
  price_monthly?: number
  stripe_subscription_id?: string
}

export interface OrderData {
  user_id: string
  plan_id?: string
  subscription_id?: string
  status: string
  order_number?: string
  total_cents?: number
}

export class DataValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'DataValidationError'
  }
}

/**
 * Validates dog data before creation
 */
export function validateDogData(dogData: Partial<DogData>): DogData {
  const errors: string[] = []

  // Required fields
  if (!dogData.name || dogData.name.trim().length === 0) {
    errors.push('Dog name is required')
  }

  if (!dogData.weight || dogData.weight <= 0) {
    errors.push('Dog weight must be greater than 0')
  }

  if (!dogData.weight_unit || !['lb', 'kg'].includes(dogData.weight_unit)) {
    errors.push('Weight unit must be either "lb" or "kg"')
  }

  // Optional field validation
  if (dogData.age !== undefined && (dogData.age < 0 || dogData.age > 30)) {
    errors.push('Dog age must be between 0 and 30 years')
  }

  if (dogData.allergies && !Array.isArray(dogData.allergies)) {
    errors.push('Allergies must be an array')
  }

  if (dogData.conditions && !Array.isArray(dogData.conditions)) {
    errors.push('Conditions must be an array')
  }

  if (errors.length > 0) {
    throw new DataValidationError(`Dog validation failed: ${errors.join(', ')}`)
  }

  // Calculate weight_kg if not provided
  const weight_kg = dogData.weight_kg || (dogData.weight_unit === 'lb' ? dogData.weight * 0.453592 : dogData.weight)

  return {
    name: dogData.name!.trim(),
    breed: dogData.breed?.trim(),
    age: dogData.age,
    weight: dogData.weight!,
    weight_unit: dogData.weight_unit!,
    weight_kg,
    allergies: dogData.allergies || [],
    conditions: dogData.conditions || [],
    avatar_url: dogData.avatar_url
  }
}

/**
 * Validates plan data before creation
 */
export function validatePlanData(planData: Partial<PlanData>): PlanData {
  const errors: string[] = []

  // Required fields
  if (!planData.user_id) {
    errors.push('User ID is required')
  }

  if (!planData.dog_id) {
    errors.push('Dog ID is required')
  }

  if (!planData.status || !['draft', 'saved', 'checkout', 'active', 'paused', 'cancelled'].includes(planData.status)) {
    errors.push('Status must be one of: draft, saved, checkout, active, paused, cancelled')
  }

  if (planData.subtotal_cents === undefined || planData.subtotal_cents < 0) {
    errors.push('Subtotal cents must be a non-negative number')
  }

  if (planData.total_cents === undefined || planData.total_cents < 0) {
    errors.push('Total cents must be a non-negative number')
  }

  // Optional field validation
  if (planData.discount_cents !== undefined && planData.discount_cents < 0) {
    errors.push('Discount cents must be non-negative')
  }

  if (planData.current_step !== undefined && (planData.current_step < 0 || planData.current_step > 10)) {
    errors.push('Current step must be between 0 and 10')
  }

  if (errors.length > 0) {
    throw new DataValidationError(`Plan validation failed: ${errors.join(', ')}`)
  }

  return {
    user_id: planData.user_id!,
    dog_id: planData.dog_id!,
    status: planData.status!,
    current_step: planData.current_step || 0,
    claim_token: planData.claim_token,
    snapshot: planData.snapshot,
    subtotal_cents: planData.subtotal_cents!,
    discount_cents: planData.discount_cents || 0,
    total_cents: planData.total_cents!,
    stripe_session_id: planData.stripe_session_id,
    stripe_subscription_id: planData.stripe_subscription_id
  }
}

/**
 * Validates plan item data before creation
 */
export function validatePlanItemData(planItemData: Partial<PlanItemData>): PlanItemData {
  const errors: string[] = []

  // Required fields
  if (!planItemData.plan_id) {
    errors.push('Plan ID is required')
  }

  if (!planItemData.dog_id) {
    errors.push('Dog ID is required')
  }

  // Optional field validation
  if (planItemData.qty !== undefined && planItemData.qty <= 0) {
    errors.push('Quantity must be greater than 0')
  }

  if (planItemData.size_g !== undefined && planItemData.size_g <= 0) {
    errors.push('Size in grams must be greater than 0')
  }

  if (errors.length > 0) {
    throw new DataValidationError(`Plan item validation failed: ${errors.join(', ')}`)
  }

  return {
    plan_id: planItemData.plan_id!,
    dog_id: planItemData.dog_id!,
    recipe_id: planItemData.recipe_id,
    qty: planItemData.qty || 1,
    size_g: planItemData.size_g,
    billing_interval: planItemData.billing_interval || 'monthly'
  }
}

/**
 * Validates subscription data before creation
 */
export function validateSubscriptionData(subscriptionData: Partial<SubscriptionData>): SubscriptionData {
  const errors: string[] = []

  // Required fields
  if (!subscriptionData.user_id) {
    errors.push('User ID is required')
  }

  if (!subscriptionData.plan_id) {
    errors.push('Plan ID is required')
  }

  if (!subscriptionData.status || !['active', 'paused', 'cancelled', 'expired'].includes(subscriptionData.status)) {
    errors.push('Status must be one of: active, paused, cancelled, expired')
  }

  // Optional field validation
  if (subscriptionData.billing_cycle && !['weekly', 'monthly', 'quarterly'].includes(subscriptionData.billing_cycle)) {
    errors.push('Billing cycle must be one of: weekly, monthly, quarterly')
  }

  if (subscriptionData.price_monthly !== undefined && subscriptionData.price_monthly < 0) {
    errors.push('Price monthly must be non-negative')
  }

  if (errors.length > 0) {
    throw new DataValidationError(`Subscription validation failed: ${errors.join(', ')}`)
  }

  return {
    user_id: subscriptionData.user_id!,
    plan_id: subscriptionData.plan_id!,
    status: subscriptionData.status!,
    billing_cycle: subscriptionData.billing_cycle || 'monthly',
    next_billing_date: subscriptionData.next_billing_date,
    price_monthly: subscriptionData.price_monthly,
    stripe_subscription_id: subscriptionData.stripe_subscription_id
  }
}

/**
 * Validates order data before creation
 */
export function validateOrderData(orderData: Partial<OrderData>): OrderData {
  const errors: string[] = []

  // Required fields
  if (!orderData.user_id) {
    errors.push('User ID is required')
  }

  if (!orderData.status || orderData.status.trim().length === 0) {
    errors.push('Order status is required')
  }

  // Optional field validation
  if (orderData.total_cents !== undefined && orderData.total_cents < 0) {
    errors.push('Total cents must be non-negative')
  }

  if (errors.length > 0) {
    throw new DataValidationError(`Order validation failed: ${errors.join(', ')}`)
  }

  return {
    user_id: orderData.user_id!,
    plan_id: orderData.plan_id,
    subscription_id: orderData.subscription_id,
    status: orderData.status!,
    order_number: orderData.order_number,
    total_cents: orderData.total_cents
  }
}

/**
 * Validates that all required data is present for a complete user setup
 */
export function validateCompleteUserData(userData: {
  user_id: string
  dog?: Partial<DogData>
  plan?: Partial<PlanData>
  planItems?: Partial<PlanItemData>[]
  subscription?: Partial<SubscriptionData>
  order?: Partial<OrderData>
}) {
  const errors: string[] = []

  if (!userData.user_id) {
    errors.push('User ID is required')
  }

  // Validate dog data if provided
  if (userData.dog) {
    try {
      validateDogData(userData.dog)
    } catch (error) {
      if (error instanceof DataValidationError) {
        errors.push(`Dog: ${error.message}`)
      }
    }
  }

  // Validate plan data if provided
  if (userData.plan) {
    try {
      validatePlanData(userData.plan)
    } catch (error) {
      if (error instanceof DataValidationError) {
        errors.push(`Plan: ${error.message}`)
      }
    }
  }

  // Validate plan items if provided
  if (userData.planItems) {
    userData.planItems.forEach((item, index) => {
      try {
        validatePlanItemData(item)
      } catch (error) {
        if (error instanceof DataValidationError) {
          errors.push(`Plan Item ${index + 1}: ${error.message}`)
        }
      }
    })
  }

  // Validate subscription data if provided
  if (userData.subscription) {
    try {
      validateSubscriptionData(userData.subscription)
    } catch (error) {
      if (error instanceof DataValidationError) {
        errors.push(`Subscription: ${error.message}`)
      }
    }
  }

  // Validate order data if provided
  if (userData.order) {
    try {
      validateOrderData(userData.order)
    } catch (error) {
      if (error instanceof DataValidationError) {
        errors.push(`Order: ${error.message}`)
      }
    }
  }

  if (errors.length > 0) {
    throw new DataValidationError(`Complete user data validation failed: ${errors.join('; ')}`)
  }

  return true
}

/**
 * Creates a safe data object with all required fields populated
 */
export function createSafeUserData(userId: string, dogData: Partial<DogData>) {
  const validatedDog = validateDogData(dogData)
  
  const safePlanData: PlanData = {
    user_id: userId,
    dog_id: '', // Will be set after dog creation
    status: 'draft',
    current_step: 0,
    subtotal_cents: 0,
    discount_cents: 0,
    total_cents: 0
  }

  return {
    dog: validatedDog,
    plan: safePlanData
  }
}
