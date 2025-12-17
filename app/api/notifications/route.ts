import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NotificationService } from '@/lib/notifications'
import type { PortalType } from '@/lib/notifications/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const portalType = searchParams.get('portal') as PortalType
    const limit = searchParams.get('limit')
    const unreadOnly = searchParams.get('unread') === 'true'

    if (!portalType) {
      return NextResponse.json({ error: 'Portal type required' }, { status: 400 })
    }

    // Fetch notifications
    const result = await NotificationService.getForUser(user.id, portalType, {
      limit: limit ? parseInt(limit) : undefined,
      unreadOnly,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/notifications] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
