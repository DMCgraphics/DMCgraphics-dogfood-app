import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log('Auth test endpoint called')
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Auth result:', { 
      user: user ? { id: user.id, email: user.email } : null, 
      authError 
    })

    if (authError) {
      return NextResponse.json({ 
        error: 'Auth error', 
        details: authError,
        hasUser: false 
      }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ 
        error: 'No user found', 
        hasUser: false 
      }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true,
      user: { id: user.id, email: user.email },
      hasUser: true 
    })

  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
