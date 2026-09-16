import fs from 'node:fs'
import {
  readDotEnvValue,
  readGmailClientId,
  readGmailClientSecret,
  readGmailFrom,
  readGmailRefreshToken,
} from './env.mjs'

const GMAIL_OAUTH_PATH = '/root/.openclaw/workspace/secrets/google_oauth.json'

export async function sendGmailEmail({ to, subject, text, html, attachments = [], replyTo, fromName }) {
  const gmail = readGmailConfig()

  if (!gmail) {
    throw new Error(
      'Falta configurar o Gmail do BLIVE Finance. Define BLIVE_FINANCE_GMAIL_FROM, BLIVE_FINANCE_GMAIL_CLIENT_ID, BLIVE_FINANCE_GMAIL_CLIENT_SECRET e BLIVE_FINANCE_GMAIL_REFRESH_TOKEN, ou disponibiliza /root/.openclaw/workspace/secrets/google_oauth.json.',
    )
  }

  const accessToken = await getGmailAccessToken(gmail)
  const recipients = normalizeRecipients(to)

  if (recipients.length === 0) {
    throw new Error('Falta pelo menos um destinatário para o envio por Gmail.')
  }

  const raw = buildRawGmailMessage({
    from: gmail.from,
    fromName,
    to: recipients,
    replyTo: replyTo?.[0],
    subject,
    text,
    html,
    attachments,
  })

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  })

  const body = await safeReadJson(response)

  if (!response.ok) {
    throw new Error(body?.error?.message ?? body?.message ?? body?.error ?? 'Falha ao enviar email por Gmail.')
  }

  return body
}

function readGmailConfig() {
  const from = normalizeText(readGmailFrom() ?? readDotEnvValue('BLIVE_FINANCE_GMAIL_FROM') ?? readDotEnvValue('GMAIL_FROM') ?? readDotEnvValue('GMAIL_EMAIL'))
  const clientId = normalizeText(readGmailClientId() ?? readDotEnvValue('BLIVE_FINANCE_GMAIL_CLIENT_ID') ?? readDotEnvValue('GMAIL_CLIENT_ID'))
  const clientSecret = normalizeText(
    readGmailClientSecret() ?? readDotEnvValue('BLIVE_FINANCE_GMAIL_CLIENT_SECRET') ?? readDotEnvValue('GMAIL_CLIENT_SECRET'),
  )
  const refreshToken = normalizeText(
    readGmailRefreshToken() ?? readDotEnvValue('BLIVE_FINANCE_GMAIL_REFRESH_TOKEN') ?? readDotEnvValue('GMAIL_REFRESH_TOKEN'),
  )

  if (from && clientId && clientSecret && refreshToken) {
    return { from, clientId, clientSecret, refreshToken }
  }

  try {
    if (!fs.existsSync(GMAIL_OAUTH_PATH)) return null

    const raw = JSON.parse(fs.readFileSync(GMAIL_OAUTH_PATH, 'utf8'))
    const fileFrom = normalizeText(raw.gmail_from || raw.email)
    const fileClientId = normalizeText(raw.client_id)
    const fileClientSecret = normalizeText(raw.gmail_client_secret || raw.client_secret)
    const fileRefreshToken = normalizeText(raw.gmail_refresh_token || raw.refresh_token)

    if (fileFrom && fileClientId && fileClientSecret && fileRefreshToken) {
      return {
        from: fileFrom,
        clientId: fileClientId,
        clientSecret: fileClientSecret,
        refreshToken: fileRefreshToken,
      }
    }
  } catch {
    return null
  }

  return null
}

function normalizeRecipients(value) {
  const input = Array.isArray(value) ? value : [value]

  return input
    .flatMap((item) => String(item || '').split(/[,\n;]+/))
    .map((item) => item.trim())
    .filter(Boolean)
}

async function getGmailAccessToken({ clientId, clientSecret, refreshToken }) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const data = await safeReadJson(response)

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description ?? data?.error ?? 'Não foi possível obter o access token do Gmail.')
  }

  return data.access_token
}

function buildRawGmailMessage({ from, fromName, to, replyTo, subject, text, html, attachments = [] }) {
  const mixedBoundary = `mixed_${Date.now().toString(36)}`
  const altBoundary = `alt_${Math.random().toString(36).slice(2)}`
  const lines = [
    `From: ${formatMailbox(fromName || 'Blive Finance', from)}`,
    `To: ${to.join(', ')}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    '',
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    '',
    `--${altBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
    '',
    `--${altBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    '',
    `--${altBoundary}--`,
  ]

  for (const attachment of attachments) {
    lines.push(
      `--${mixedBoundary}`,
      `Content-Type: ${attachment.content_type || 'application/octet-stream'}; name="${attachment.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      '',
      chunkBase64(attachment.content),
      '',
    )
  }

  lines.push(`--${mixedBoundary}--`, '')

  return Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function formatMailbox(name, email) {
  return `${name} <${email}>`
}

function chunkBase64(value) {
  return String(value || '').match(/.{1,76}/g)?.join('\r\n') || ''
}

function normalizeText(value) {
  return String(value || '').trim()
}

async function safeReadJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}
