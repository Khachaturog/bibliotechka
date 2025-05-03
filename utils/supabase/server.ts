import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// This function creates a new Supabase client for server components
export function createClient() {
  const cookieStore = cookies()

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Missing Supabase environment variables")
    }

    return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
      auth: {
        persistSession: false, // Don't persist the session in server components
      },
    })
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw error
  }
}
