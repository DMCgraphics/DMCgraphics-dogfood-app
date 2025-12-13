import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import type { MultiDogProfile, AIRecommendation } from "@/lib/multi-dog-types"
import { mockRecipes } from "@/lib/nutrition-calculator"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface ChatRequest {
  dogProfile: MultiDogProfile
  recommendation: AIRecommendation
  messages: ChatMessage[]
  question: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { dogProfile, recommendation, messages, question } = body

    // Check if LLM is enabled
    const llmEnabled =
      process.env.ENABLE_AI_LLM === "true" &&
      process.env.ANTHROPIC_API_KEY &&
      process.env.ANTHROPIC_API_KEY !== "your_anthropic_api_key_here"

    if (!llmEnabled) {
      return NextResponse.json({
        answer: getFallbackAnswer(question, dogProfile),
      })
    }

    // Build context about the dog and recommendation
    const context = buildContext(dogProfile, recommendation)

    // Convert messages to Anthropic format
    const anthropicMessages: any[] = []

    // Add conversation history
    messages.forEach(msg => {
      anthropicMessages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })
    })

    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 400,
      temperature: 0.7,
      system: `You are a friendly, knowledgeable pet nutrition assistant. You're having a conversation with a dog owner about their dog's meal plan.

${context}

Guidelines:
- Be warm and conversational, use the dog's name
- Keep answers to 2-3 sentences
- Focus on practical, helpful advice
- Reference specific details from their dog's profile when relevant
- If asked about medical concerns, remind them to consult their vet
- Stay positive and encouraging!`,
      messages: anthropicMessages,
    })

    const answer = message.content[0].type === "text" ? message.content[0].text : ""

    return NextResponse.json({
      answer,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
    })
  } catch (error) {
    console.error("[AI Chat] Error:", error)

    return NextResponse.json(
      {
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

function buildContext(dogProfile: MultiDogProfile, recommendation: AIRecommendation): string {
  const parts = [
    `Dog Profile:`,
    `- Name: ${dogProfile.name}`,
    `- Age: ${dogProfile.age} ${dogProfile.ageUnit}`,
    `- Weight: ${dogProfile.weight} ${dogProfile.weightUnit}`,
    `- Breed: ${dogProfile.breed || "Not specified"}`,
    `- Activity Level: ${dogProfile.activity}`,
    `- Body Condition: ${dogProfile.bodyCondition ? `${dogProfile.bodyCondition}/9` : "Not specified"}`,
  ]

  if (dogProfile.healthGoals?.weightGoal) {
    parts.push(`- Weight Goal: ${dogProfile.healthGoals.weightGoal}`)
  }

  if (dogProfile.healthGoals?.concerns && dogProfile.healthGoals.concerns.length > 0) {
    parts.push(`- Health Concerns: ${dogProfile.healthGoals.concerns.join(", ")}`)
  }

  parts.push(``)
  parts.push(`Recommended Recipe: ${recommendation.recommendedRecipes[0]}`)
  parts.push(`Confidence: ${recommendation.confidence}%`)
  parts.push(`Nutritional Focus: ${recommendation.nutritionalFocus.join(", ")}`)
  parts.push(`Reasoning: ${recommendation.reasoning}`)

  // Look up the actual recipe to get ingredients
  const recipeName = recommendation.recommendedRecipes[0]
  const recipe = mockRecipes.find(r => r.name === recipeName)

  if (recipe) {
    parts.push(``)
    parts.push(`Recipe Details for ${recipe.name}:`)
    parts.push(`- Ingredients: ${recipe.ingredients.join(", ")}`)
    parts.push(`- Calories: ${recipe.kcalPer100g} kcal per 100g`)
    parts.push(`- Protein: ${recipe.protein}%`)
    parts.push(`- Fat: ${recipe.fat}%`)
    parts.push(`- Carbs: ${recipe.carbs}%`)
    parts.push(`- Fiber: ${recipe.fiber}%`)
  }

  return parts.join('\n')
}

function getFallbackAnswer(question: string, dogProfile: MultiDogProfile): string {
  const lowerQuestion = question.toLowerCase()

  if (lowerQuestion.includes("portion") || lowerQuestion.includes("how much")) {
    return `Great question! ${dogProfile.name}'s portion size depends on their specific calorie needs. The recommended recipe will include detailed feeding guidelines based on ${dogProfile.name}'s weight and activity level.`
  }

  if (lowerQuestion.includes("ingredient") || lowerQuestion.includes("what's in")) {
    return `The recipe includes high-quality, whole-food ingredients specifically selected for ${dogProfile.name}'s nutritional needs. You'll see the full ingredient list on the recipe page!`
  }

  if (lowerQuestion.includes("switch") || lowerQuestion.includes("change")) {
    return `If you'd like to try a different recipe for ${dogProfile.name}, you can always switch! Just make any transitions gradually over 7-10 days to avoid digestive upset.`
  }

  return `That's a great question about ${dogProfile.name}'s nutrition! While I'm currently in simplified mode, I'd recommend checking our feeding guide or contacting our nutrition team for detailed advice.`
}
