import fs from 'node:fs'
import path from 'node:path'

const PROJECT_ROOT = path.resolve(process.cwd())

export function readEnv(name, fallback) {
  const value = process.env[name]
  if (value) return value
  return fallback ?? null
}

export function readSupabaseProjectUrl() {
  return readEnv('SUPABASE_URL') ?? readEnv('VITE_SUPABASE_URL') ?? readDotEnvValue('VITE_SUPABASE_URL')
}

export function readSupabaseAnonKey() {
  return readEnv('SUPABASE_ANON_KEY') ?? readEnv('VITE_SUPABASE_ANON_KEY') ?? readDotEnvValue('VITE_SUPABASE_ANON_KEY')
}

export function readGmailFrom() {
  return readEnv('BLIVE_FINANCE_GMAIL_FROM') ?? readEnv('GMAIL_FROM') ?? readEnv('GMAIL_EMAIL')
}

export function readGmailClientId() {
  return readEnv('BLIVE_FINANCE_GMAIL_CLIENT_ID') ?? readEnv('GMAIL_CLIENT_ID')
}

export function readGmailClientSecret() {
  return readEnv('BLIVE_FINANCE_GMAIL_CLIENT_SECRET') ?? readEnv('GMAIL_CLIENT_SECRET')
}

export function readGmailRefreshToken() {
  return readEnv('BLIVE_FINANCE_GMAIL_REFRESH_TOKEN') ?? readEnv('GMAIL_REFRESH_TOKEN')
}

export function readDotEnvValue(key) {
  try {
    const envPath = path.join(PROJECT_ROOT, '.env.local')
    const text = fs.readFileSync(envPath, 'utf8')
    const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'))
    return match?.[1] ?? null
  } catch {
    return null
  }
}
