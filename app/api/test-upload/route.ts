import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log('Test upload endpoint called')
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check:', { user: user?.id, authError })
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', authError }, { status: 401 })
    }

    // Check if storage buckets exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    console.log('Buckets:', buckets?.map(b => b.name), bucketsError)

    // Check if profile-photos bucket exists
    const profilePhotosBucket = buckets?.find(b => b.name === 'profile-photos')
    console.log('Profile photos bucket:', profilePhotosBucket)

    // Try to list files in the bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('profile-photos')
      .list(user.id, { limit: 10 })
    
    console.log('Files in bucket:', files, filesError)

    return NextResponse.json({ 
      success: true,
      user: user.id,
      buckets: buckets?.map(b => b.name),
      profilePhotosBucket: !!profilePhotosBucket,
      files: files || [],
      errors: {
        authError,
        bucketsError,
        filesError
      }
    })

  } catch (error) {
    console.error('Test upload error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}
