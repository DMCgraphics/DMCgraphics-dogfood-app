import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication and admin status
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get user IDs from request body
    const body = await request.json()
    const { userIds } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Limit bulk delete to 100 users at a time
    if (userIds.length > 100) {
      return NextResponse.json(
        { error: 'Cannot delete more than 100 users at once' },
        { status: 400 }
      )
    }

    // Delete users one by one
    const results = await Promise.allSettled(
      userIds.map(async (userId: string) => {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (error) throw error
        return userId
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      message: `Deleted ${successful} user(s)${failed > 0 ? `, ${failed} failed` : ''}`,
      deleted: successful,
      failed,
    })
  } catch (error) {
    console.error('[POST /api/admin/users/bulk-delete] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete users' },
      { status: 500 }
    )
  }
}
