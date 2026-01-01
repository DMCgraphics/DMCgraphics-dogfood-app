"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface InstagramPost {
  id: string
  media_url: string
  caption?: string
  timestamp: string
  permalink: string
}

export default function InstagramMontagePage() {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/instagram/posts")
      if (!response.ok) {
        throw new Error("Failed to fetch posts")
      }
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Control Panel */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Instagram Year in Review 2025</h1>
            <p className="text-muted-foreground">@nouripet montage generator</p>
          </div>
          <Button onClick={fetchPosts} disabled={loading}>
            {loading ? "Loading..." : "Fetch Posts"}
          </Button>
        </div>

        {error && (
          <Card className="p-4 border-destructive bg-destructive/10">
            <p className="text-destructive font-medium">Error: {error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              The Instagram access token may have expired. Check your environment variables.
            </p>
          </Card>
        )}

        {/* Montage Grid (Screenshot this area) */}
        {posts.length > 0 && (
          <div id="montage-area" className="bg-white rounded-2xl p-12 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold mb-4">NouriPet's 2025 🐾</h2>
              <p className="text-xl text-muted-foreground">
                A year of fresh food, happy pups, and healthier lives
              </p>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-3 gap-4 mb-12">
              {posts.slice(0, 9).map((post) => (
                <div
                  key={post.id}
                  className="aspect-square overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                >
                  <img
                    src={post.media_url}
                    alt={post.caption?.slice(0, 50) || "Instagram post"}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-lg font-medium mb-2">
                Thank you for making 2025 amazing! 💚
              </p>
              <p className="text-muted-foreground">
                Here's to even more wagging tails in 2026
              </p>
              <p className="mt-4 text-sm font-semibold">
                @nouripet | Fresh Dog Food • Stamford, CT
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        {posts.length > 0 && (
          <Card className="p-6 bg-primary/5">
            <h3 className="font-semibold mb-2">📸 How to Screenshot</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Scroll up to see the full montage</li>
              <li>Use screenshot tool to capture the white card area</li>
              <li>Post to Instagram with your New Year's caption!</li>
              <li>Recommended dimensions: 1080x1350px (4:5 ratio)</li>
            </ol>
          </Card>
        )}

        {/* Post Details */}
        {posts.length > 0 && (
          <details className="mt-8">
            <summary className="cursor-pointer font-medium text-sm text-muted-foreground">
              View post details ({posts.length} posts loaded)
            </summary>
            <div className="mt-4 grid gap-4">
              {posts.map((post) => (
                <Card key={post.id} className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={post.media_url}
                      alt="thumbnail"
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground truncate">
                        {post.caption || "No caption"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </p>
                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View on Instagram →
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
