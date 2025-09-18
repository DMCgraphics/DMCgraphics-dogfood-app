import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildRecommendations } from "@/lib/recommendations-engine"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const dogId = params.id

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching recommendations for dog:', dogId)

    // Fetch data in parallel
    const [
      { data: dog, error: dogError },
      { data: weights, error: weightsError },
      { data: stools, error: stoolsError },
      { data: plan, error: planError }
    ] = await Promise.all([
      // Get dog data
      supabase
        .from("dogs")
        .select("*")
        .eq("id", dogId)
        .eq("user_id", user.id)
        .single(),
      
      // Get last 90 days of weight logs
      supabase
        .from("weight_logs")
        .select("date, weight")
        .eq("dog_id", dogId)
        .eq("user_id", user.id)
        .gte("date", new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10))
        .order("date", { ascending: true }),
      
      // Get last 14 days of stool logs
      supabase
        .from("stool_logs")
        .select("date, score")
        .eq("dog_id", dogId)
        .eq("user_id", user.id)
        .gte("date", new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10))
        .order("date", { ascending: true }),
      
      // Get current plan for the dog
      supabase
        .from("plans")
        .select("*")
        .eq("dog_id", dogId)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ])

    // Check for dog access error
    if (dogError || !dog) {
      console.log('Dog not found or access denied:', dogError)
      return NextResponse.json({ error: 'Dog not found or access denied' }, { status: 404 })
    }

    // Log any data fetch errors (but don't fail the request)
    if (weightsError) console.log('Error fetching weight logs:', weightsError.message)
    if (stoolsError) console.log('Error fetching stool logs:', stoolsError.message)
    if (planError) console.log('Error fetching plan:', planError.message)

    console.log('Data fetched:', {
      dog: dog.name,
      weightLogs: weights?.length || 0,
      stoolLogs: stools?.length || 0,
      hasPlan: !!plan
    })

    // Build recommendations
    const recommendations = buildRecommendations({
      dog,
      weights: weights ?? [],
      stools: stools ?? [],
      plan: plan ?? null
    })

    console.log('Generated recommendations:', recommendations.length)

    return NextResponse.json(recommendations)

  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
