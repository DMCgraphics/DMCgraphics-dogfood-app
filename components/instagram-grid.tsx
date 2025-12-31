"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"

interface InstagramPost {
  id: string
  instagram_id: string
  media_type: string
  media_url: string
  permalink: string
  caption: string | null
  timestamp: string
  thumbnail_url: string | null
}

interface InstagramGridProps {
  limit?: number
  showFollowButton?: boolean
}

export function InstagramGrid({ limit = 6, showFollowButton = true }: InstagramGridProps) {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true)
        const response = await fetch(`/api/instagram/posts?limit=${limit}`, {
          cache: 'no-store',
          next: { revalidate: 0 },
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch Instagram posts")
        }

        setPosts(data.posts || [])
      } catch (err: any) {
        console.error("Error fetching Instagram posts:", err)
        setError(err.message || "Failed to load Instagram posts")
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [limit])

  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-200 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error || posts.length === 0) {
    return null // Silently fail - don't show error to users
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Instagram className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Follow Our Journey
          </h2>
        </div>
        {showFollowButton && (
          <Link
            href="https://www.instagram.com/nouripet/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2">
              <Instagram className="h-4 w-4" />
              Follow @nouripet
            </Button>
          </Link>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 hover:opacity-90 transition-opacity"
          >
            <Image
              src={post.media_type === "VIDEO" && post.thumbnail_url
                ? post.thumbnail_url
                : post.media_url}
              alt={post.caption?.slice(0, 100) || "NouriPet Instagram post"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Instagram className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Video indicator */}
            {post.media_type === "VIDEO" && (
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                VIDEO
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* View More Link */}
      <div className="text-center pt-4">
        <Link
          href="https://www.instagram.com/nouripet/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-2"
        >
          View more on Instagram
          <Instagram className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
