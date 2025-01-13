// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// For client usage: limited privileges
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
)
