"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PhotoUploadProps {
  currentPhotoUrl?: string
  onPhotoUploaded: (photoUrl: string) => void
  uploadEndpoint: string
  additionalData?: Record<string, string>
  className?: string
  size?: "sm" | "md" | "lg"
  shape?: "circle" | "square"
  placeholder?: string
}

export function PhotoUpload({
  currentPhotoUrl,
  onPhotoUploaded,
  uploadEndpoint,
  additionalData = {},
  className,
  size = "md",
  shape = "circle",
  placeholder = "Upload a photo"
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20", 
    lg: "w-32 h-32"
  }

  const shapeClasses = {
    circle: "rounded-full",
    square: "rounded-lg"
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log('File selected:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      hasFile: !!file 
    })
    
    if (!file) {
      console.log('No file selected')
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.log('Invalid file type:', file.type)
      setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.log('File too large:', file.size)
      setError('File too large. Maximum size is 5MB.')
      return
    }

    console.log('File validation passed, proceeding with upload')
    setError(null)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      console.log('Starting file upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadEndpoint,
        additionalData
      })

      const formData = new FormData()
      formData.append('file', file)
      
      // Add any additional data
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
        console.log(`Added form data: ${key} = ${value}`)
      })

      console.log('Sending request to:', uploadEndpoint)
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      const result = await response.json()
      console.log('Response data:', result)

      if (!response.ok) {
        throw new Error(result.error || `Upload failed with status ${response.status}`)
      }

      onPhotoUploaded(result.avatarUrl)
      setPreviewUrl(null)
    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePhoto = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayUrl = previewUrl || currentPhotoUrl

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative inline-block">
        <div
          className={cn(
            "relative overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/25",
            sizeClasses[size],
            shapeClasses[shape],
            "flex items-center justify-center"
          )}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-2">
              <Camera className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{placeholder}</p>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          className={cn(
            "absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-background border-2",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {displayUrl ? (
            <Camera className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>

        {displayUrl && !isUploading && (
          <Button
            size="sm"
            variant="outline"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 bg-background border-2"
            onClick={handleRemovePhoto}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
