import { createServerSupabase, supabaseAdmin } from "@/lib/supabase/server"

/**
 * Check if the current user is an admin
 * Returns user object if admin, null if not admin or not authenticated
 */
export async function getAdminUser() {
  const supabase = createServerSupabase()

  // Get the current user from auth (with user's session)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  // Check if user has admin role using admin client (bypasses RLS)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (profileError || !profile?.is_admin) {
    return null
  }

  return user
}

/**
 * Check if a specific user ID is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  // Use admin client to bypass RLS
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single()

  return !error && profile?.is_admin === true
}
