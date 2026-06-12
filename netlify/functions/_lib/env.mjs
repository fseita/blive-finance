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

export function readAgentmailInbox() {
  return readEnv('AGENTMAIL_INBOX')
}

export function readAgentmailApiKey() {
  return readEnv('AGENTMAIL_API_KEY') ?? readOpenClawAgentmailKey()
}

function readDotEnvValue(key) {
  try {
    const envPath = path.join(PROJECT_ROOT, '.env.local')
    const text = fs.readFileSync(envPath, 'utf8')
    const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'))
    return match?.[1] ?? null
  } catch {
    return null
  }
}

function readOpenClawAgentmailKey() {
  try {
    const configPath = path.resolve(PROJECT_ROOT, '..', 'openclaw.json')
    const raw = fs.readFileSync(configPath, 'utf8')
    const config = JSON.parse(raw)
    return config?.skills?.entries?.agentmail?.env?.AGENTMAIL_API_KEY ?? null
  } catch {
    return null
  }
}
