import {
  Package,
  GitCompare,
  PauseCircle,
  SkipForward,
  Dog,
  Repeat,
  Info,
  MapPin,
} from "lucide-react"

export interface QuickAction {
  id: string
  label: string
  icon: any // Lucide icon component
  prompt: string
  category: "orders" | "subscription" | "profile" | "info"
  requiresAuth: boolean
  contextualTriggers?: string[] // Keywords that should trigger this action to appear
}

/**
 * Library of quick action buttons for common tasks
 */
export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "track-order",
    label: "Track my order",
    icon: Package,
    prompt: "Where is my order? Can you help me track it?",
    category: "orders",
    requiresAuth: true,
    contextualTriggers: ["order", "delivery", "track", "shipped", "arriving"],
  },
  {
    id: "compare-recipes",
    label: "Compare recipes",
    icon: GitCompare,
    prompt: "Can you compare your recipes and help me choose the best one for my dog?",
    category: "info",
    requiresAuth: false,
    contextualTriggers: ["recipe", "ingredient", "protein", "compare", "difference"],
  },
  {
    id: "pause-subscription",
    label: "Pause subscription",
    icon: PauseCircle,
    prompt: "How do I pause my subscription?",
    category: "subscription",
    requiresAuth: true,
    contextualTriggers: ["pause", "subscription", "stop", "hold"],
  },
  {
    id: "skip-delivery",
    label: "Skip next delivery",
    icon: SkipForward,
    prompt: "I want to skip my next delivery. How do I do that?",
    category: "subscription",
    requiresAuth: true,
    contextualTriggers: ["skip", "next delivery", "delay"],
  },
  {
    id: "add-dog-profile",
    label: "Add dog profile",
    icon: Dog,
    prompt: "I want to create a profile for my dog to get personalized recommendations.",
    category: "profile",
    requiresAuth: false,
    contextualTriggers: ["profile", "plan builder", "personalized", "my dog"],
  },
  {
    id: "switch-recipe",
    label: "Switch recipe",
    icon: Repeat,
    prompt: "I want to switch to a different recipe. What are my options?",
    category: "subscription",
    requiresAuth: true,
    contextualTriggers: ["switch", "change recipe", "different recipe"],
  },
  {
    id: "ingredient-sourcing",
    label: "Ingredient sourcing",
    icon: Info,
    prompt: "Tell me about where your ingredients come from and your sourcing practices.",
    category: "info",
    requiresAuth: false,
    contextualTriggers: ["ingredient", "source", "supplier", "quality", "transparency"],
  },
  {
    id: "delivery-areas",
    label: "Delivery areas",
    icon: MapPin,
    prompt: "What areas do you deliver to?",
    category: "info",
    requiresAuth: false,
    contextualTriggers: ["delivery area", "zip code", "location", "deliver to"],
  },
]

/**
 * Get initial quick actions to show after welcome message
 */
export function getInitialQuickActions(isAuthenticated: boolean): QuickAction[] {
  if (isAuthenticated) {
    // Show 4 most useful actions for logged-in users
    return QUICK_ACTIONS.filter((action) =>
      ["track-order", "compare-recipes", "pause-subscription", "switch-recipe"].includes(action.id)
    )
  } else {
    // Show 4 most useful actions for guests
    return QUICK_ACTIONS.filter((action) =>
      ["compare-recipes", "add-dog-profile", "ingredient-sourcing", "delivery-areas"].includes(action.id)
    )
  }
}

/**
 * Get contextual quick actions based on AI response content
 */
export function getContextualQuickActions(
  responseText: string,
  isAuthenticated: boolean,
  maxActions: number = 3
): QuickAction[] {
  const lowerText = responseText.toLowerCase()

  // Find actions whose triggers match the response content
  const matchedActions = QUICK_ACTIONS.filter((action) => {
    // Skip if requires auth but user isn't authenticated
    if (action.requiresAuth && !isAuthenticated) return false

    // Check if any trigger keyword is in the response
    return action.contextualTriggers?.some((trigger) => lowerText.includes(trigger.toLowerCase()))
  })

  // Return up to maxActions
  return matchedActions.slice(0, maxActions)
}
