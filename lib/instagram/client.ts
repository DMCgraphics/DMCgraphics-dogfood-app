/**
 * Instagram Basic Display API Client
 *
 * Setup instructions:
 * 1. Create a Facebook Developer App at https://developers.facebook.com
 * 2. Add Instagram Basic Display product
 * 3. Create an Instagram Test User or use your Instagram Business/Creator account
 * 4. Get a long-lived access token (valid for 60 days)
 * 5. Set INSTAGRAM_ACCESS_TOKEN in your environment variables
 *
 * Token refresh:
 * - Tokens expire after 60 days
 * - Auto-refresh when token is within 7 days of expiration
 * - Store new token in environment variable or database
 */

export interface InstagramMedia {
  id: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url: string
  permalink: string
  caption?: string
  timestamp: string
  thumbnail_url?: string
}

export interface InstagramApiResponse {
  data: InstagramMedia[]
  paging?: {
    cursors: {
      before: string
      after: string
    }
    next?: string
  }
}

const INSTAGRAM_API_BASE = 'https://graph.instagram.com'
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

/**
 * Fetch recent Instagram posts
 * @param limit Number of posts to fetch (default: 12, max: 25)
 */
export async function fetchInstagramPosts(limit = 12): Promise<InstagramMedia[]> {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    console.warn('INSTAGRAM_ACCESS_TOKEN not configured')
    return []
  }

  try {
    const fields = 'id,media_type,media_url,permalink,caption,timestamp,thumbnail_url'
    const url = `${INSTAGRAM_API_BASE}/me/media?fields=${fields}&limit=${limit}&access_token=${INSTAGRAM_ACCESS_TOKEN}`

    const response = await fetch(url, {
      next: { revalidate: 21600 }, // Cache for 6 hours
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Instagram API error:', error)
      throw new Error(`Instagram API error: ${error.error?.message || response.statusText}`)
    }

    const data: InstagramApiResponse = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Failed to fetch Instagram posts:', error)
    throw error
  }
}

/**
 * Refresh long-lived access token
 * Long-lived tokens are valid for 60 days
 * This endpoint exchanges them for a new token with a fresh 60-day validity
 */
export async function refreshAccessToken(): Promise<{
  access_token: string
  token_type: string
  expires_in: number
}> {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN not configured')
  }

  try {
    const url = `${INSTAGRAM_API_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${INSTAGRAM_ACCESS_TOKEN}`

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Token refresh failed: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()

    console.log('Instagram token refreshed successfully. Update INSTAGRAM_ACCESS_TOKEN with:', data.access_token)

    return data
  } catch (error) {
    console.error('Failed to refresh Instagram token:', error)
    throw error
  }
}

/**
 * Get information about the current access token
 * Useful for checking expiration
 */
export async function getTokenInfo(): Promise<{
  app_id: string
  type: string
  application: string
  expires_at: number
  is_valid: boolean
  scopes: string[]
  user_id: string
}> {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN not configured')
  }

  try {
    const url = `${INSTAGRAM_API_BASE}/access_token?access_token=${INSTAGRAM_ACCESS_TOKEN}`

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Token info failed: ${error.error?.message || response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to get token info:', error)
    throw error
  }
}
