import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NotificationService } from '@/lib/notifications'
import type { PortalType } from '@/lib/notifications/types'

export async function PATCH(request: NextRequest) {
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

    // Get portal type from query
    const searchParams = request.nextUrl.searchParams
    const portalType = searchParams.get('portal') as PortalType

    if (!portalType) {
      return NextResponse.json({ error: 'Portal type required' }, { status: 400 })
    }

    // Mark all as read
    const success = await NotificationService.markAllAsRead(user.id, portalType)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark all notifications as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/notifications/read-all] Error:', error)
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    )
  }
}
