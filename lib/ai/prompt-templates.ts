/**
 * AI Prompt Templates for Meal Recommendations
 *
 * System personality:
 * - Warm and encouraging (like a helpful neighbor)
 * - Science-based but not overly technical
 * - Use the dog's name frequently
 * - Keep explanations to 2-3 sentences
 * - Use emojis sparingly (1 per message max)
 */

export const SYSTEM_PROMPT = `You are a friendly, knowledgeable pet nutrition assistant. Your personality:
- Warm and encouraging (like a helpful neighbor)
- Science-based but not overly technical
- Use the dog's name frequently
- Keep explanations to 2-3 sentences
- Use emojis sparingly (1 per message max)
- Focus on the "why" behind recommendations
- Build trust through transparency`

interface ConfidenceExplanationInput {
  dogName: string
  confidence: number
  topFactors: Array<{
    factor: string
    points: number
    description: string
  }>
  missingData: string[]
}

export function generateConfidenceExplanationPrompt(input: ConfidenceExplanationInput): string {
  return `${SYSTEM_PROMPT}

Task: Explain why we have a ${input.confidence}% confidence in our meal recommendation for ${input.dogName}.

Top contributing factors:
${input.topFactors.map(f => `- ${f.factor}: +${f.points} points (${f.description})`).join('\n')}

Missing data that could improve confidence:
${input.missingData.length > 0 ? input.missingData.map(d => `- ${d}`).join('\n') : '- None'}

Generate a warm, conversational 2-3 sentence explanation that:
1. Uses ${input.dogName}'s name at least once
2. Explains what made us most confident
3. Mentions any missing data that could help (if applicable)
4. Builds trust through transparency

Keep it friendly and science-based. Use ONE emoji maximum.`
}

interface StepGuidanceInput {
  dogName: string
  step: number
  stepName: string
  currentData: {
    age?: number
    ageUnit?: string
    weight?: number
    weightUnit?: string
    activity?: string
    bodyCondition?: number
    breed?: string
  }
}

export function generateStepGuidancePrompt(input: StepGuidanceInput): string {
  const dataList = Object.entries(input.currentData)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')

  return `${SYSTEM_PROMPT}

Task: Generate encouraging guidance for ${input.dogName}'s owner as they move to Step ${input.step}: ${input.stepName}.

Current data we have: ${dataList || 'Just getting started'}

Generate a warm, encouraging 1-2 sentence message that:
1. Uses ${input.dogName}'s name
2. Acknowledges progress so far
3. Gives a preview of what's coming in this step
4. Maintains enthusiasm and momentum

Keep it brief and friendly. Use ONE emoji maximum.`
}

interface WeightGoalValidationInput {
  dogName: string
  currentWeight: number
  targetWeight: number
  weightUnit: string
  weightGoal: 'lose' | 'gain' | 'maintain'
  bodyCondition?: number
}

export function generateWeightGoalValidationPrompt(input: WeightGoalValidationInput): string {
  const difference = Math.abs(input.currentWeight - input.targetWeight)
  const percentChange = (difference / input.currentWeight) * 100

  return `${SYSTEM_PROMPT}

Task: Validate and provide guidance on ${input.dogName}'s weight ${input.weightGoal} goal.

Current: ${input.currentWeight} ${input.weightUnit}
Target: ${input.targetWeight} ${input.weightUnit}
Change: ${difference.toFixed(1)} ${input.weightUnit} (${percentChange.toFixed(1)}%)
Body condition score: ${input.bodyCondition || 'not provided'}

Generate a 2-3 sentence response that:
1. Uses ${input.dogName}'s name
2. Validates if the goal is healthy (safe weight loss/gain is ~1-2% per week)
3. Provides realistic timeline estimate
4. Encourages without being preachy

If the goal seems extreme (>20% change), gently suggest veterinary consultation.
Keep it supportive and science-based. Use ONE emoji maximum.`
}

interface AllergenImpactInput {
  dogName: string
  selectedAllergens: string[]
  totalRecipes: number
  availableRecipes: number
}

export function generateAllergenImpactPrompt(input: AllergenImpactInput): string {
  const filtered = input.totalRecipes - input.availableRecipes

  return `${SYSTEM_PROMPT}

Task: Explain how ${input.dogName}'s allergen restrictions affect meal choices.

Allergens selected: ${input.selectedAllergens.join(', ')}
Total recipes: ${input.totalRecipes}
Available after filtering: ${input.availableRecipes}
Filtered out: ${filtered}

Generate a reassuring 2 sentence message that:
1. Uses ${input.dogName}'s name
2. States how many good options remain
3. Reassures about quality (not just quantity)
4. Stays positive

Keep it brief and encouraging. Use ONE emoji maximum.`
}

interface ServingSizeExplanationInput {
  dogName: string
  dailyCalories: number
  gramsPerDay: number
  mealsPerDay: number
  recipe: {
    name: string
    kcalPer100g: number
    protein: number
    fat: number
  }
}

export function generateServingSizeExplanationPrompt(input: ServingSizeExplanationInput): string {
  const gramsPerMeal = input.gramsPerDay / input.mealsPerDay

  return `${SYSTEM_PROMPT}

Task: Explain ${input.dogName}'s serving sizes in a clear, helpful way.

Daily needs: ${input.dailyCalories} kcal
Daily amount: ${input.gramsPerDay}g
Meals per day: ${input.mealsPerDay}
Per meal: ${gramsPerMeal.toFixed(0)}g
Recipe: ${input.recipe.name} (${input.recipe.kcalPer100g} kcal/100g, ${input.recipe.protein}% protein, ${input.recipe.fat}% fat)

Generate a 2-3 sentence explanation that:
1. Uses ${input.dogName}'s name
2. Explains portion sizes in practical terms (cups, visual comparisons if helpful)
3. Connects to their nutritional needs
4. Stays warm and helpful

Keep it conversational and practical. Use ONE emoji maximum.`
}

interface MultiDogComplexityInput {
  dogs: Array<{
    name: string
    hasSpecialNeeds: boolean
    allergens: string[]
    weightGoal?: string
  }>
  sharedRecipesCount: number
  individualRecipesNeeded: number
}

export function generateMultiDogGuidancePrompt(input: MultiDogComplexityInput): string {
  return `${SYSTEM_PROMPT}

Task: Guide the owner through multi-dog meal planning complexity.

Dogs: ${input.dogs.map(d => d.name).join(', ')}
Shared recipes available: ${input.sharedRecipesCount}
Individual recipes needed: ${input.individualRecipesNeeded}

Dog details:
${input.dogs.map(d => `- ${d.name}: ${d.hasSpecialNeeds ? 'Special needs' : 'Standard'}, ${d.allergens.length} allergen(s), ${d.weightGoal || 'no weight goal'}`).join('\n')}

Generate a 2-3 sentence recommendation that:
1. Uses all dogs' names
2. Recommends either shared meals or individual meals
3. Explains the reasoning briefly
4. Stays encouraging about either approach

Keep it practical and friendly. Use ONE emoji maximum.`
}

interface BodyConditionGuidanceInput {
  dogName: string
  bodyCondition: number
}

export function generateBodyConditionGuidancePrompt(input: BodyConditionGuidanceInput): string {
  let category: string
  if (input.bodyCondition <= 3) category = 'underweight'
  else if (input.bodyCondition <= 5) category = 'ideal'
  else if (input.bodyCondition <= 7) category = 'overweight'
  else category = 'significantly overweight'

  return `${SYSTEM_PROMPT}

Task: Provide helpful guidance on ${input.dogName}'s body condition score of ${input.bodyCondition}/9.

Body condition category: ${category}

Generate a supportive 2 sentence message that:
1. Uses ${input.dogName}'s name
2. Explains what this score means practically
3. Hints at what type of nutrition might help
4. Stays non-judgmental and encouraging

Keep it warm and educational. Use ONE emoji maximum.`
}

// Template-based fallbacks for when LLM is unavailable
export const TEMPLATE_FALLBACKS = {
  confidenceExplanation: (confidence: number, dogName: string): string => {
    if (confidence >= 85) {
      return `I'm very confident in this recommendation for ${dogName}! I've considered their age, activity level, weight goals, and health needs to find the perfect match. ✨`
    } else if (confidence >= 70) {
      return `I have a good recommendation for ${dogName} based on their profile. With a bit more information about their breed or specific health concerns, I could fine-tune this further.`
    } else {
      return `I've made a recommendation for ${dogName}, but I'd love more information to be more confident. Consider adding breed details or specific health goals to help me find the perfect recipe.`
    }
  },

  stepGuidance: (step: number, dogName: string): string => {
    const guidance: Record<number, string> = {
      1: `Let's build ${dogName}'s nutrition profile! I'll ask about their basic info to understand their needs. 🐕`,
      2: `Great! Now let's set health goals for ${dogName}. This helps me recommend the perfect recipe.`,
      3: `I'll help identify any ingredients ${dogName} should avoid. This ensures they only get what's best for them.`,
      4: `Based on everything you've told me about ${dogName}, here are my top recommendations!`,
      5: `Your plan is ready! Let's review ${dogName}'s portions and schedule.`,
      6: `Almost done! Just a few final details to complete ${dogName}'s meal plan.`,
    }
    return guidance[step] || `Let's continue building ${dogName}'s perfect meal plan!`
  },

  weightGoalValidation: (percentChange: number, dogName: string, goal: string): string => {
    if (percentChange > 20) {
      return `That's a significant weight ${goal} goal for ${dogName}. I recommend consulting with your vet to ensure we approach this safely. A gradual change is usually healthiest!`
    } else if (percentChange > 10) {
      return `${dogName}'s weight ${goal} goal looks achievable! This will take about 3-4 months with the right nutrition plan. Let's find a recipe that supports this journey. 💪`
    } else {
      return `Perfect! ${dogName}'s weight ${goal} goal is realistic and healthy. We'll find a recipe that helps them reach it safely.`
    }
  },

  allergenImpact: (availableRecipes: number, dogName: string): string => {
    if (availableRecipes >= 3) {
      return `Good news! ${dogName} still has ${availableRecipes} excellent recipes to choose from after filtering allergens. Quality over quantity! ✨`
    } else if (availableRecipes >= 1) {
      return `${dogName} has ${availableRecipes} great recipe option(s) that avoid their allergens. Each one is nutritionally complete and delicious!`
    } else {
      return `I'm having trouble finding recipes that avoid all of ${dogName}'s allergens. Let's review the allergen list to make sure it's accurate.`
    }
  },
}
