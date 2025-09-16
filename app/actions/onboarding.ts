"use server"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function completeOnboarding(form: {
  full_name: string
  phone?: string
  dog_name: string
  dog_breed?: string
  dog_weight_kg?: number
  picky?: boolean
  address?: { line1: string; line2?: string; city?: string; state?: string; postal_code?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  try {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: form.full_name,
        phone: form.phone,
      })
      .eq("id", user.id)

    if (profileError) throw profileError

    const { data: dog, error: dogError } = await supabase
      .from("dogs")
      .insert({
        user_id: user.id,
        name: form.dog_name,
        breed: form.dog_breed,
        weight: form.dog_weight_kg,
        age: null, // Will be calculated from birthdate if needed
        allergies: [],
        conditions: [],
      })
      .select("id")
      .single()

    if (dogError) throw dogError

    if (form.address?.line1) {
      const { error: addressError } = await supabase.from("addresses").insert({
        user_id: user.id,
        ...form.address,
        is_default: true,
      })

      if (addressError) throw addressError
    }

    return { ok: true, dogId: dog?.id }
  } catch (error) {
    console.error("Onboarding error:", error)
    throw new Error("Failed to complete onboarding")
  }
}
