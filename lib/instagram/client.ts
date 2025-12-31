/**
 * Instagram Graph API Client
 *
 * Setup instructions:
 * 1. Create a Facebook Developer App at https://developers.facebook.com
 * 2. Connect a Facebook Page to your Instagram Business Account
 * 3. Get a long-lived user access token with instagram_basic permissions
 * 4. Set INSTAGRAM_ACCESS_TOKEN in your environment variables
 * 5. Set INSTAGRAM_BUSINESS_ACCOUNT_ID in your environment variables
 *
 * Token refresh:
 * - Tokens expire after 60 days
 * - Use Facebook Graph API to exchange tokens
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
  like_count?: number
  comments_count?: number
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

const FACEBOOK_GRAPH_API_BASE = 'https://graph.facebook.com/v24.0'
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN
const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '17841476193485976'

/**
 * Fetch recent Instagram posts
 * @param limit Number of posts to fetch (default: 12, max: 25)
 */
export async function fetchInstagramPosts(limit = 12): Promise<InstagramMedia[]> {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    console.warn('INSTAGRAM_ACCESS_TOKEN not configured')
    return []
  }

  if (!INSTAGRAM_BUSINESS_ACCOUNT_ID) {
    console.warn('INSTAGRAM_BUSINESS_ACCOUNT_ID not configured')
    return []
  }

  try {
    const fields = 'id,media_type,media_url,permalink,caption,timestamp,thumbnail_url,like_count,comments_count'
    const url = `${FACEBOOK_GRAPH_API_BASE}/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media?fields=${fields}&limit=${limit}&access_token=${INSTAGRAM_ACCESS_TOKEN}`

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
 * Refresh long-lived access token via Facebook Graph API
 * Long-lived tokens are valid for 60 days
 * Requires client_id and client_secret to exchange for a new token
 */
export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  currentToken: string = INSTAGRAM_ACCESS_TOKEN || ''
): Promise<{
  access_token: string
  token_type: string
  expires_in: number
}> {
  if (!currentToken) {
    throw new Error('Access token is required')
  }

  try {
    const url = `${FACEBOOK_GRAPH_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${currentToken}`

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
    const url = `${FACEBOOK_GRAPH_API_BASE}/debug_token?input_token=${INSTAGRAM_ACCESS_TOKEN}&access_token=${INSTAGRAM_ACCESS_TOKEN}`

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Token info failed: ${error.error?.message || response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Failed to get token info:', error)
    throw error
  }
}
