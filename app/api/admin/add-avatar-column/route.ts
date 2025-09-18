import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Add avatar_url column to dogs table
    const { error } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE dogs ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
    })
    
    if (error) {
      console.error('Error adding avatar_url column:', error)
      return NextResponse.json({ error: 'Failed to add avatar_url column' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: 'Avatar column added successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
