"use client"
import { supabase } from "@/lib/supabase/client"

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  createdAt?: string
  subscriptionStatus?: "none" | "active" | "paused" | "cancelled"
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("nouripet_user")
  return raw ? (JSON.parse(raw) as User) : null
}

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null
  const m = document.cookie.match(/auth_token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export async function signup(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: { name }, // This is read by the DB trigger
    },
  })
  if (error) throw error
  return data
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  const profile: User = { 
    id: data.user.id, 
    email: data.user.email!, 
    name: (data.user.user_metadata as any)?.name,
    avatar_url: undefined // Will be loaded by auth context
  }
  localStorage.setItem("nouripet_user", JSON.stringify(profile))
  document.cookie = `auth_token=${data.session?.access_token ?? ""}; path=/; SameSite=Lax`
  return profile
}

export async function logout() {
  await supabase.auth.signOut()
  if (typeof window !== "undefined") localStorage.removeItem("nouripet_user")
  document.cookie = "auth_token=; Max-Age=0; path=/; SameSite=Lax"
}

export async function validateSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return !!session
}

export function getApiConfig() {
  // kept for components that read it
  return { baseUrl: "supabase", cookieName: "auth_token", isConfigured: true }
}

export async function checkApiHealth() {
  // report healthy if we can fetch a session
  const { data, error } = await supabase.auth.getSession()
  return !!data && !error
}

export function storeAuthData(user: User, token: string) {
  localStorage.setItem("nouripet_user", JSON.stringify(user))
  document.cookie = `auth_token=${token}; path=/; SameSite=Lax`
}
