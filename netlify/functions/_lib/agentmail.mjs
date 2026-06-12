import { readAgentmailApiKey, readAgentmailInbox } from './env.mjs'

export async function sendAgentmailEmail({ to, subject, text, html, attachments, replyTo }) {
  const apiKey = readAgentmailApiKey()
  const inbox = readAgentmailInbox()

  if (!apiKey || !inbox) {
    throw new Error('Faltam AGENTMAIL_API_KEY ou AGENTMAIL_INBOX no ambiente do servidor.')
  }

  const response = await fetch(`https://api.agentmail.to/v0/inboxes/${encodeURIComponent(inbox)}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: [to],
      subject,
      text,
      html,
      attachments,
      reply_to: replyTo,
    }),
  })

  const body = await safeReadJson(response)

  if (!response.ok) {
    throw new Error(body?.message ?? body?.error ?? 'Falha ao enviar email por AgentMail.')
  }

  return body
}

async function safeReadJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}
