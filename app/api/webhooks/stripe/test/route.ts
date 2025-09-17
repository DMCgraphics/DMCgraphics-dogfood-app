// Test endpoint to verify webhook is accessible
export async function GET() {
  return new Response("Webhook endpoint is accessible", { status: 200 })
}

export async function POST() {
  return new Response("Webhook endpoint accepts POST requests", { status: 200 })
}
