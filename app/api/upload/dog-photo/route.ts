import { NextRequest, NextResponse } from "next/server"
import { createClient, supabaseAdmin } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const dogId = formData.get('dogId') as string
    
    console.log('Dog photo upload:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      hasFile: !!file,
      dogId 
    })
    
    if (!file) {
      console.log('No file provided in request')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // For new dogs, dogId might be empty - we'll handle this case
    if (!dogId) {
      console.log('No dogId provided - this might be a new dog')
      // We'll still allow the upload but won't update any dog record
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    // Verify the dog belongs to the user (only if dogId is provided)
    let dog = null
    if (dogId) {
      const { data: dogData, error: dogError } = await supabase
        .from('dogs')
        .select('id, name')
        .eq('id', dogId)
        .eq('user_id', user.id)
        .single()

      if (dogError || !dogData) {
        console.log('Dog not found or access denied:', dogError)
        return NextResponse.json({ error: 'Dog not found or access denied' }, { status: 404 })
      }
      dog = dogData
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${dogId || 'new'}-${Date.now()}.${fileExt}`
    
    // Upload to Supabase Storage using admin client
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('dog-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('dog-photos')
      .getPublicUrl(fileName)

    // Update dog profile with new avatar URL (only if dogId is provided)
    if (dogId && dog) {
      const { error: updateError } = await supabase
        .from('dogs')
        .update({ avatar_url: publicUrl })
        .eq('id', dogId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({ error: 'Failed to update dog profile' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      avatarUrl: publicUrl,
      dogName: dog?.name || 'New Dog',
      message: dogId ? 'Dog photo uploaded successfully' : 'Photo uploaded successfully (will be saved when dog is created)'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
