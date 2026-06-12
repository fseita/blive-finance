import { createClient } from '@supabase/supabase-js'
import { readSupabaseAnonKey, readSupabaseProjectUrl } from './env.mjs'

export function createSupabaseAdminClient() {
  const url = readSupabaseProjectUrl()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Faltam SUPABASE_URL/VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.')
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

export function createSupabaseAuthClient() {
  const url = readSupabaseProjectUrl()
  const anonKey = readSupabaseAnonKey()

  if (!url || !anonKey) {
    throw new Error('Faltam SUPABASE_URL/VITE_SUPABASE_URL ou SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY.')
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  })
}
