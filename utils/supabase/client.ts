"use client"

import { createBrowserClient } from "@supabase/ssr"

// Global variable to store the client instance
let browserClient = null

// This function creates a singleton Supabase client for client components
export function createClientComponentClient() {
  if (typeof window === "undefined") {
    throw new Error("createClientComponentClient can only be used in client components")
  }

  if (!browserClient) {
    browserClient = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  }

  return browserClient
}
