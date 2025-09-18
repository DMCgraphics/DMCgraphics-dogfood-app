import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...')
    
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
    }

    console.log('Environment variables:', envCheck)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ 
        error: 'Supabase environment variables not configured',
        envCheck 
      }, { status: 500 })
    }

    // Test Supabase connection
    const supabase = createClient()
    
    // Try to get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session check:', { hasSession: !!session, error: sessionError })

    // Try to query a simple table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    console.log('Profiles query:', { count: profiles?.length, error: profilesError })

    return NextResponse.json({ 
      success: true,
      envCheck,
      session: !!session,
      profilesQuery: {
        success: !profilesError,
        count: profiles?.length || 0,
        error: profilesError?.message
      }
    })

  } catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
