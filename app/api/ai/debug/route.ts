import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Debug endpoint to check environment variables
 * Remove this in production after debugging
 */
export async function GET() {
  const enableAiLlm = process.env.ENABLE_AI_LLM
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY
  const apiKeyPrefix = process.env.ANTHROPIC_API_KEY?.substring(0, 15) || "not set"

  const llmEnabled =
    process.env.ENABLE_AI_LLM === "true" &&
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== "your_anthropic_api_key_here"

  return NextResponse.json({
    enableAiLlm,
    hasApiKey,
    apiKeyPrefix,
    llmEnabled,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  })
}
