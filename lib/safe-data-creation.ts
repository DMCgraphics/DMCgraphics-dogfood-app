/**
 * Safe data creation utilities that ensure all required fields are present
 * Use these functions instead of direct database inserts to prevent incomplete data
 */

import { createClient } from '@/lib/supabase/client'
import { 
  validateDogData, 
  validatePlanData, 
  validatePlanItemData, 
  validateSubscriptionData, 
  validateOrderData,
  createSafeUserData,
  type DogData,
  type PlanData,
  type PlanItemData,
  type SubscriptionData,
  type OrderData,
  DataValidationError
} from './data-validation'

const supabase = createClient()

export class SafeDataCreationError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message)
    this.name = 'SafeDataCreationError'
  }
}

/**
 * Safely creates a dog with all required fields validated
 */
export async function createDogSafely(userId: string, dogData: Partial<DogData>) {
  try {
    // Validate the data first
    const validatedDogData = validateDogData(dogData)
    
    // Add user_id to the data
    const completeDogData = {
      ...validatedDogData,
      user_id: userId
    }
    
    // Create the dog
    const { data, error } = await supabase
      .from('dogs')
      .insert(completeDogData)
      .select('id')
      .single()
    
    if (error) {
      throw new SafeDataCreationError(`Failed to create dog: ${error.message}`, error)
    }
    
    return data
  } catch (error) {
    if (error instanceof DataValidationError) {
      throw new SafeDataCreationError(`Dog validation failed: ${error.message}`, error)
    }
    throw error
  }
}

/**
 * Safely creates a plan with all required fields validated
 */
export async function createPlanSafely(planData: Partial<PlanData>) {
  try {
    // Validate the data first
    const validatedPlanData = validatePlanData(planData)
    
    // Create the plan
    const { data, error } = await supabase
      .from('plans')
      .insert(validatedPlanData)
      .select('id, user_id')
      .single()
    
    if (error) {
      throw new SafeDataCreationError(`Failed to create plan: ${error.message}`, error)
    }
    
    return data
  } catch (error) {
    if (error instanceof DataValidationError) {
      throw new SafeDataCreationError(`Plan validation failed: ${error.message}`, error)
    }
    throw error
  }
}

/**
 * Safely creates a plan item with all required fields validated
 */
export async function createPlanItemSafely(planItemData: Partial<PlanItemData>) {
  try {
    // Validate the data first
    const validatedPlanItemData = validatePlanItemData(planItemData)
    
    // Create the plan item
    const { data, error } = await supabase
      .from('plan_items')
      .insert(validatedPlanItemData)
      .select('id')
      .single()
    
    if (error) {
      throw new SafeDataCreationError(`Failed to create plan item: ${error.message}`, error)
    }
    
    return data
  } catch (error) {
    if (error instanceof DataValidationError) {
      throw new SafeDataCreationError(`Plan item validation failed: ${error.message}`, error)
    }
    throw error
  }
}

/**
 * Safely creates a subscription with all required fields validated
 */
export async function createSubscriptionSafely(subscriptionData: Partial<SubscriptionData>) {
  try {
    // Validate the data first
    const validatedSubscriptionData = validateSubscriptionData(subscriptionData)
    
    // Create the subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(validatedSubscriptionData)
      .select('id')
      .single()
    
    if (error) {
      throw new SafeDataCreationError(`Failed to create subscription: ${error.message}`, error)
    }
    
    return data
  } catch (error) {
    if (error instanceof DataValidationError) {
      throw new SafeDataCreationError(`Subscription validation failed: ${error.message}`, error)
    }
    throw error
  }
}

/**
 * Safely creates an order with all required fields validated
 */
export async function createOrderSafely(orderData: Partial<OrderData>) {
  try {
    // Validate the data first
    const validatedOrderData = validateOrderData(orderData)
    
    // Create the order
    const { data, error } = await supabase
      .from('orders')
      .insert(validatedOrderData)
      .select('id')
      .single()
    
    if (error) {
      throw new SafeDataCreationError(`Failed to create order: ${error.message}`, error)
    }
    
    return data
  } catch (error) {
    if (error instanceof DataValidationError) {
      throw new SafeDataCreationError(`Order validation failed: ${error.message}`, error)
    }
    throw error
  }
}

/**
 * Safely creates a complete user setup with dog and plan
 * This is the main function to use for user onboarding
 */
export async function createUserSetupSafely(userId: string, dogData: Partial<DogData>) {
  try {
    // Create safe user data
    const { dog: validatedDogData, plan: safePlanData } = createSafeUserData(userId, dogData)
    
    // Create the dog first
    const dog = await createDogSafely(userId, validatedDogData)
    
    // Update the plan with the dog ID
    const planData = {
      ...safePlanData,
      dog_id: dog.id
    }
    
    // Create the plan
    const plan = await createPlanSafely(planData)
    
    return {
      dog,
      plan,
      success: true
    }
  } catch (error) {
    console.error('Failed to create user setup:', error)
    throw error
  }
}

/**
 * Safely updates a plan with validated data
 */
export async function updatePlanSafely(planId: string, updateData: Partial<PlanData>) {
  try {
    // Get the existing plan to merge with updates
    const { data: existingPlan, error: fetchError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()
    
    if (fetchError) {
      throw new SafeDataCreationError(`Failed to fetch existing plan: ${fetchError.message}`, fetchError)
    }
    
    // Merge existing data with updates
    const mergedData = { ...existingPlan, ...updateData }
    
    // Validate the merged data
    const validatedData = validatePlanData(mergedData)
    
    // Update the plan
    const { data, error } = await supabase
      .from('plans')
      .update(validatedData)
      .eq('id', planId)
      .select('*')
      .single()
    
    if (error) {
      throw new SafeDataCreationError(`Failed to update plan: ${error.message}`, error)
    }
    
    return data
  } catch (error) {
    if (error instanceof DataValidationError) {
      throw new SafeDataCreationError(`Plan validation failed: ${error.message}`, error)
    }
    throw error
  }
}

/**
 * Safely updates a dog with validated data
 */
export async function updateDogSafely(dogId: string, updateData: Partial<DogData>) {
  try {
    // Get the existing dog to merge with updates
    const { data: existingDog, error: fetchError } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', dogId)
      .single()
    
    if (fetchError) {
      throw new SafeDataCreationError(`Failed to fetch existing dog: ${fetchError.message}`, fetchError)
    }
    
    // Merge existing data with updates
    const mergedData = { ...existingDog, ...updateData }
    
    // Validate the merged data
    const validatedData = validateDogData(mergedData)
    
    // Update the dog
    const { data, error } = await supabase
      .from('dogs')
      .update(validatedData)
      .eq('id', dogId)
      .select('*')
      .single()
    
    if (error) {
      throw new SafeDataCreationError(`Failed to update dog: ${error.message}`, error)
    }
    
    return data
  } catch (error) {
    if (error instanceof DataValidationError) {
      throw new SafeDataCreationError(`Dog validation failed: ${error.message}`, error)
    }
    throw error
  }
}

/**
 * Validates that a user's data is complete and can be safely deleted
 */
export async function validateUserDataForDeletion(userId: string): Promise<{
  canDelete: boolean
  issues: string[]
}> {
  const issues: string[] = []
  
  try {
    // Check for incomplete plans
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
    
    if (plansError) {
      issues.push(`Error checking plans: ${plansError.message}`)
    } else if (plans && plans.length > 0) {
      plans.forEach((plan, index) => {
        if (plan.status === 'checkout' && !plan.stripe_session_id) {
          issues.push(`Plan ${index + 1}: Incomplete checkout (missing stripe_session_id)`)
        }
        if (plan.status === 'active' && !plan.stripe_subscription_id) {
          issues.push(`Plan ${index + 1}: Incomplete subscription (missing stripe_subscription_id)`)
        }
      })
    }
    
    // Check for incomplete subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
    
    if (subscriptionsError) {
      issues.push(`Error checking subscriptions: ${subscriptionsError.message}`)
    } else if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach((sub, index) => {
        if (sub.status === 'active' && !sub.stripe_subscription_id) {
          issues.push(`Subscription ${index + 1}: Missing stripe_subscription_id`)
        }
      })
    }
    
    return {
      canDelete: issues.length === 0,
      issues
    }
  } catch (error) {
    issues.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      canDelete: false,
      issues
    }
  }
}
