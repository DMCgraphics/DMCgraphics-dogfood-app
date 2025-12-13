import Anthropic from "@anthropic-ai/sdk"
import type { MultiDogProfile, ConfidenceBreakdown, ScoringFactor } from "@/lib/multi-dog-types"

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

export interface LLMExplanationRequest {
  dogProfile: MultiDogProfile
  scoringBreakdown: {
    topRecipe: string
    confidence: number
    factorsConsidered: ScoringFactor[]
  }
  explanationType: "confidence" | "reasoning" | "step-guidance"
}

export interface LLMExplanationResponse {
  explanation: string
  cached: boolean
  tokensUsed?: number
  error?: string
}

/**
 * Generate personalized AI explanation using Claude
 */
export async function generateLLMExplanation(
  request: LLMExplanationRequest
): Promise<LLMExplanationResponse> {
  try {
    const { dogProfile, scoringBreakdown, explanationType } = request

    // Build the prompt based on explanation type
    let prompt = ""

    if (explanationType === "confidence") {
      prompt = buildConfidencePrompt(dogProfile, scoringBreakdown)
    } else if (explanationType === "reasoning") {
      prompt = buildReasoningPrompt(dogProfile, scoringBreakdown)
    } else if (explanationType === "step-guidance") {
      prompt = buildStepGuidancePrompt(dogProfile, scoringBreakdown)
    }

    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 300,
      temperature: 0.7,
      system: getSystemPrompt(),
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const explanation = message.content[0].type === "text" ? message.content[0].text : ""

    return {
      explanation,
      cached: false,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
    }
  } catch (error) {
    console.error("[LLM Service] Error generating explanation:", error)

    // Return fallback template-based explanation
    return {
      explanation: getFallbackExplanation(request),
      cached: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * System prompt that defines Claude's personality and style
 */
function getSystemPrompt(): string {
  return `You are a friendly, knowledgeable pet nutrition assistant helping dog owners choose the best meal plan for their pets. Your personality:

- Warm and encouraging (like a helpful neighbor who loves dogs)
- Science-based but not overly technical
- Use the dog's name frequently to make it personal
- Keep explanations to 2-3 sentences maximum
- Use emojis sparingly (max 1 per message)
- Focus on why this recommendation makes sense for THIS specific dog
- Be conversational and natural, not robotic

When explaining recommendations:
- Lead with the dog's specific needs (age, activity, health goals)
- Connect those needs to the recipe features
- Build trust by being transparent about the reasoning
- If confidence is lower, acknowledge what additional info would help`
}

/**
 * Build prompt for confidence explanation
 */
function buildConfidencePrompt(
  dogProfile: MultiDogProfile,
  scoringBreakdown: { topRecipe: string; confidence: number; factorsConsidered: ScoringFactor[] }
): string {
  const topFactors = scoringBreakdown.factorsConsidered
    .filter(f => f.impact === 'high' || f.impact === 'medium')
    .slice(0, 3)
    .map(f => `- ${f.factor}: ${f.description}`)
    .join('\n')

  return `Explain in a warm, personalized way why we have ${scoringBreakdown.confidence}% confidence in recommending ${scoringBreakdown.topRecipe} for ${dogProfile.name}.

Dog Profile:
- Name: ${dogProfile.name}
- Age: ${dogProfile.age} ${dogProfile.ageUnit}
- Weight: ${dogProfile.weight} ${dogProfile.weightUnit}
- Activity: ${dogProfile.activity}
${dogProfile.bodyCondition ? `- Body Condition: ${dogProfile.bodyCondition}/9` : ''}
${dogProfile.healthGoals?.weightGoal ? `- Weight Goal: ${dogProfile.healthGoals.weightGoal}` : ''}

Top Scoring Factors:
${topFactors}

Write 2-3 sentences explaining why this confidence level makes sense for ${dogProfile.name}. Be warm and personal.`
}

/**
 * Build prompt for recommendation reasoning
 */
function buildReasoningPrompt(
  dogProfile: MultiDogProfile,
  scoringBreakdown: { topRecipe: string; confidence: number; factorsConsidered: ScoringFactor[] }
): string {
  const topFactors = scoringBreakdown.factorsConsidered
    .filter(f => f.impact === 'high')
    .slice(0, 3)
    .map(f => f.description)
    .join(', ')

  return `Write a personalized, warm explanation for why ${scoringBreakdown.topRecipe} is the best choice for ${dogProfile.name}.

Dog Profile:
- Name: ${dogProfile.name}
- Age: ${dogProfile.age} ${dogProfile.ageUnit}
- Weight: ${dogProfile.weight} ${dogProfile.weightUnit}
- Activity: ${dogProfile.activity}
${dogProfile.bodyCondition ? `- Body Condition: ${dogProfile.bodyCondition}/9` : ''}
${dogProfile.healthGoals?.weightGoal ? `- Weight Goal: ${dogProfile.healthGoals.weightGoal}` : ''}
${dogProfile.healthGoals?.concerns && dogProfile.healthGoals.concerns.length > 0 ? `- Health Focus: ${dogProfile.healthGoals.concerns.join(', ')}` : ''}

Key Reasons: ${topFactors}

Write 2-3 sentences that feel personal and specific to ${dogProfile.name}. Use their name and reference their specific needs.`
}

/**
 * Build prompt for step-by-step guidance
 */
function buildStepGuidancePrompt(
  dogProfile: MultiDogProfile,
  scoringBreakdown: { topRecipe: string; confidence: number }
): string {
  return `Write a brief, encouraging message for a dog owner who just added information about ${dogProfile.name}.

Current Info:
- Name: ${dogProfile.name}
${dogProfile.age ? `- Age: ${dogProfile.age} ${dogProfile.ageUnit}` : ''}
${dogProfile.weight ? `- Weight: ${dogProfile.weight} ${dogProfile.weightUnit}` : ''}
${dogProfile.activity ? `- Activity: ${dogProfile.activity}` : ''}

Write 1-2 sentences that:
1. Acknowledge what they just shared
2. Briefly mention what's coming next (if applicable)
3. Make them feel they're on the right track

Be warm and encouraging. Use ${dogProfile.name}'s name.`
}

/**
 * Fallback to template-based explanation if LLM fails
 */
function getFallbackExplanation(request: LLMExplanationRequest): string {
  const { dogProfile, scoringBreakdown, explanationType } = request

  if (explanationType === "reasoning") {
    const factors = scoringBreakdown.factorsConsidered
      .filter(f => f.impact === 'high')
      .slice(0, 2)
      .map(f => f.description.toLowerCase())
      .join(' and ')

    return `Based on ${dogProfile.name}'s profile, this recipe is recommended because it provides ${factors}.`
  }

  if (explanationType === "confidence") {
    return `I have ${scoringBreakdown.confidence}% confidence in this recommendation for ${dogProfile.name} based on the information provided.`
  }

  return `Great! Let's continue building ${dogProfile.name}'s perfect meal plan.`
}
