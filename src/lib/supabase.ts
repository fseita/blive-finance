import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Variáveis do Supabase em falta. Copia .env.example para .env.local e preenche os valores.')
}

export const supabase = createClient(supabaseUrl ?? 'https://example.supabase.co', supabaseAnonKey ?? 'demo-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
