import { NextRequest, NextResponse } from "next/server"
import { generateLLMExplanation, type LLMExplanationRequest } from "@/lib/ai/llm-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/ai/generate-explanation
 * 
 * Generate personalized AI explanations using Claude LLM
 */
export async function POST(request: NextRequest) {
  try {
    const body: LLMExplanationRequest = await request.json()

    // Validate request
    if (!body.dogProfile || !body.scoringBreakdown || !body.explanationType) {
      return NextResponse.json(
        { error: "Missing required fields: dogProfile, scoringBreakdown, explanationType" },
        { status: 400 }
      )
    }

    // Check if LLM is enabled (via env var) and has API key
    const llmEnabled = process.env.ENABLE_AI_LLM === "true" && process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "your_anthropic_api_key_here"

    if (!llmEnabled) {
      // Return template-based fallback
      return NextResponse.json({
        explanation: getTemplateFallback(body),
        cached: false,
        llmUsed: false,
      })
    }

    // Generate LLM explanation
    const result = await generateLLMExplanation(body)

    return NextResponse.json({
      ...result,
      llmUsed: true,
    })
  } catch (error) {
    console.error("[API] Generate explanation error:", error)

    return NextResponse.json(
      {
        error: "Failed to generate explanation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * Template-based fallback when LLM is disabled
 */
function getTemplateFallback(request: LLMExplanationRequest): string {
  const { dogProfile, scoringBreakdown, explanationType } = request

  if (explanationType === "reasoning") {
    const factors = scoringBreakdown.factorsConsidered
      .filter(f => f.impact === 'high')
      .slice(0, 2)
      .map(f => f.description.toLowerCase())
      .join(' and ')

    return `Based on ${dogProfile.name}'s profile (age, activity, and health goals), this recipe is recommended because it provides ${factors}.`
  }

  if (explanationType === "confidence") {
    return `I have ${scoringBreakdown.confidence}% confidence in this recommendation for ${dogProfile.name} based on the information provided.`
  }

  return `Great! Let's continue building ${dogProfile.name}'s perfect meal plan.`
}
