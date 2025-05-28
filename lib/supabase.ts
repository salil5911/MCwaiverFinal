import { createClient } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Define a fallback URL and key for development
const FALLBACK_URL = "https://placeholder-project.supabase.co"
const FALLBACK_KEY = "placeholder-key-for-initialization-only"

// Get environment variables with proper validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Check if we have valid environment variables
const hasValidConfig =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-project.supabase.co" &&
  supabaseAnonKey !== "your-anon-key"

// Log warning if environment variables are missing or invalid
if (!hasValidConfig) {
  console.warn(
    "⚠️ Supabase configuration is missing or invalid. Using fallback values for initialization only. " +
      "API calls will fail until proper environment variables are provided.",
  )
}

// Use fallbacks if needed to prevent initialization errors
const finalUrl = hasValidConfig ? supabaseUrl : FALLBACK_URL
const finalKey = hasValidConfig ? supabaseAnonKey : FALLBACK_KEY

// Singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null

// Create a function to get the Supabase client (singleton pattern)
export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance

  try {
    supabaseInstance = createClient(finalUrl, finalKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "supabase-auth-token",
      },
    })
    return supabaseInstance
  } catch (error) {
    console.error("Error initializing Supabase client:", error)
    throw new Error("Failed to initialize Supabase client. Check your environment variables.")
  }
}

// Export the supabase client for backward compatibility
export const supabase = getSupabaseClient()

// Create a wrapper for createClientComponentClient that uses the same config
export function getClientComponentClient() {
  // For client components, we need to explicitly provide the URL and key
  return createClientComponentClient({
    supabaseUrl: finalUrl,
    supabaseKey: finalKey,
  })
}

// Function to refresh the schema cache
export async function refreshSchemaCache() {
  if (!hasValidConfig) {
    console.warn("Cannot refresh schema cache: Invalid Supabase configuration")
    return false
  }

  try {
    // Force a refresh of the schema cache by making a small query to each table
    await supabase.from("repair_waivers").select("id").limit(1)
    await supabase.from("selling_waivers").select("id").limit(1)
    await supabase.from("purchase_waivers").select("id").limit(1)
    console.log("Schema cache refreshed successfully")
    return true
  } catch (error) {
    console.error("Error refreshing schema cache:", error)
    return false
  }
}

// Function to check connection status
export async function checkSupabaseConnection() {
  if (!hasValidConfig) {
    return { connected: false, message: "Invalid configuration" }
  }

  try {
    const { data, error } = await supabase.from("repair_waivers").select("count").limit(0)
    if (error) throw error
    return { connected: true, message: "Connected to Supabase" }
  } catch (error) {
    return {
      connected: false,
      message: `Connection error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Types for our database tables
export type Location = "Augusta" | "Perimeter" | "Cumberland" | "Southlake" | "Lynnhaven" | "Carolina Place"

export interface RepairWaiver {
  id: string
  created_at: string
  location: Location
  device_model: string
  full_name: string
  phone_number: string
  part_being_repaired: string
  technician_name: string
  repair_amount: string
  additional_notes?: string
  signature_url: string
  pdf_url?: string
}

export interface SellingWaiver {
  id: string
  created_at: string
  location: Location
  device_model: string
  full_name: string
  phone_number: string
  imei: string
  price: string
  id_number: string
  additional_notes?: string
  signature_url: string
  pdf_url?: string
}

export interface PurchaseWaiver {
  id: string
  created_at: string
  location: Location
  device_model: string
  full_name: string
  phone_number: string
  imei: string
  price: string
  id_number: string
  sales_representative: string
  additional_notes?: string
  signature_url: string
  pdf_url?: string
}

export interface InvoiceSheet {
  id: string
  created_at: string
  location: Location
  invoice_number: string
  vendor_name: string
  invoice_date: string
  amount: string
  additional_notes?: string
  is_paid: boolean
  payment_mode?: string
}

export interface DeviceInventory {
  id: string
  created_at: string
  location: Location
  purchase_date: string
  device_model: string
  vendor_name: string
  cost_price: string
  additional_notes?: string
  is_sold: boolean
  selling_price?: string
  sold_by?: string
  sold_date?: string
  transfer_status?: string
}
