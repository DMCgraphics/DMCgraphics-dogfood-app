import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log('Simple upload test endpoint called')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    console.log('File received:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      hasFile: !!file 
    })
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Create a test filename
    const fileName = `test-${Date.now()}.${file.name.split('.').pop()}`
    
    console.log('Uploading to storage:', { fileName, bucket: 'profile-photos' })
    
    // Upload to Supabase Storage using admin client
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('profile-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    console.log('Storage upload result:', { uploadData, uploadError })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: `Failed to upload file: ${uploadError.message}`,
        details: uploadError 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('profile-photos')
      .getPublicUrl(fileName)

    return NextResponse.json({ 
      success: true, 
      fileName,
      publicUrl,
      message: 'Upload successful' 
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
