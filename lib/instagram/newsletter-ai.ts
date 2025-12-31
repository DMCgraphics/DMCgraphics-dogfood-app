import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

export interface InstagramPost {
  id: string
  instagram_id: string
  media_type: string
  media_url: string
  permalink: string
  caption: string | null
  timestamp: string
  thumbnail_url: string | null
  like_count?: number
  comments_count?: number
}

export interface NewsletterSummaryRequest {
  posts: InstagramPost[]
  monthName: string // "December 2025"
}

export interface NewsletterSummaryResponse {
  summary: string // HTML-formatted summary
  tokensUsed: number
  estimatedCost: number
  error?: string
}

/**
 * Generate AI summary of Instagram posts for newsletter
 * Uses Claude Haiku for cost-effective generation
 */
export async function generateNewsletterSummary(
  request: NewsletterSummaryRequest
): Promise<NewsletterSummaryResponse> {
  try {
    const { posts, monthName } = request

    if (posts.length === 0) {
      throw new Error("No posts provided for summary generation")
    }

    // Build prompt with post data
    const prompt = buildNewsletterPrompt(posts, monthName)

    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 800,
      temperature: 0.7,
      system: getNewsletterSystemPrompt(),
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const summary = message.content[0].type === "text" ? message.content[0].text : ""

    const inputTokens = message.usage.input_tokens
    const outputTokens = message.usage.output_tokens

    // Calculate cost (Haiku pricing)
    const HAIKU_INPUT_PRICE_PER_1M = 0.25
    const HAIKU_OUTPUT_PRICE_PER_1M = 1.25
    const estimatedCost =
      (inputTokens / 1_000_000) * HAIKU_INPUT_PRICE_PER_1M +
      (outputTokens / 1_000_000) * HAIKU_OUTPUT_PRICE_PER_1M

    // Track costs (fire and forget)
    trackNewsletterCost(inputTokens, outputTokens, estimatedCost).catch((err) => {
      console.error("[Newsletter AI] Failed to track costs:", err)
    })

    return {
      summary,
      tokensUsed: inputTokens + outputTokens,
      estimatedCost,
    }
  } catch (error) {
    console.error("[Newsletter AI] Error generating summary:", error)

    // Return fallback summary
    return {
      summary: getFallbackSummary(request.monthName, request.posts.length),
      tokensUsed: 0,
      estimatedCost: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * System prompt defining Claude's style for newsletters
 */
function getNewsletterSystemPrompt(): string {
  return `You are writing a friendly monthly newsletter summary for NouriPet, a fresh dog food subscription service. Your writing style:

- Warm and enthusiastic (we love dogs!)
- Conversational but professional
- Focus on value to dog owners
- 3-4 short paragraphs maximum
- Highlight key themes from the posts (nutrition tips, customer stories, product updates, dog health)
- Use emojis sparingly (2-3 total)
- Write in second person ("we shared", "you might have seen")
- End with a call to follow for more tips

PRIVACY & ACCURACY RULES:
- NEVER mention customer names unless they are explicitly tagged (with @) in the Instagram post caption
- You CAN mention dog names when visible in captions or tags
- When referring to customers without names, use location-based references like "one of our Stamford customers" or "a NouriPet family"
- Do NOT mention Instagram handles like @doodlelife unless they are confirmed NouriPet customers
- Be vague about customer identity but specific about dog names and locations when appropriate

Do NOT:
- List every single post
- Use overly promotional language
- Make claims not supported by the posts
- Write more than 250 words
- Share customer names unless they're tagged in the post`
}

/**
 * Build the prompt with post data
 */
function buildNewsletterPrompt(posts: InstagramPost[], monthName: string): string {
  // Extract post captions and metadata
  const postSummaries = posts
    .map((post, idx) => {
      const caption = post.caption || "No caption"
      const truncatedCaption = caption.length > 200 ? caption.substring(0, 200) + "..." : caption

      return `Post ${idx + 1} (${post.media_type}, ${post.timestamp}):
${truncatedCaption}
Engagement: ${post.like_count || 0} likes, ${post.comments_count || 0} comments`
    })
    .join("\n\n")

  return `Write a warm, engaging summary of NouriPet's Instagram activity for ${monthName} based on these ${posts.length} posts:

${postSummaries}

Generate a 3-4 paragraph newsletter summary that:
1. Opens with a friendly greeting about the month
2. Highlights 2-3 main themes or topics we covered
3. Mentions any standout posts or popular content
4. Closes with encouragement to follow for more tips

Keep it under 250 words. Make it feel personal and valuable to dog owners.`
}

/**
 * Fallback summary if AI generation fails
 */
function getFallbackSummary(monthName: string, postCount: number): string {
  return `<p>This ${monthName}, we shared ${postCount} posts on Instagram covering nutrition tips, customer success stories, and helpful advice for dog parents like you. 🐾</p>

<p>From meal prep tips to health insights, we've been busy sharing content to help you give your pup the best care possible. Check out the posts below to see what you might have missed!</p>

<p>Follow us on Instagram for daily tips, cute pup photos, and the latest NouriPet updates. We'd love to see you there! ✨</p>`
}

/**
 * Track AI costs to database
 */
async function trackNewsletterCost(
  inputTokens: number,
  outputTokens: number,
  estimatedCost: number
): Promise<void> {
  // Only track in production
  if (process.env.NODE_ENV !== "production") {
    return
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    await fetch(`${baseUrl}/api/ai/track-cost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feature: "instagram_newsletter",
        inputTokens,
        outputTokens,
        estimatedCost,
        llmUsed: true,
        cached: false,
      }),
    })
  } catch (error) {
    console.error("[Newsletter AI] Cost tracking failed:", error)
  }
}
