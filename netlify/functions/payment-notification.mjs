import { sendAgentmailEmail } from './_lib/agentmail.mjs'
import { createSupabaseAdminClient, createSupabaseAuthClient } from './_lib/supabase.mjs'

export default async function handler(event) {
  const method = event?.httpMethod ?? event?.method

  if (method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  try {
    const payload = await readPayload(event)
    const supabaseAdmin = createSupabaseAdminClient()

    if (payload.eventType === 'payment-paid') {
      const authHeader = readAuthorizationHeader(event)
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

      if (!token) return json(401, { error: 'Sessão inválida para envio da confirmação.' })

      const authClient = createSupabaseAuthClient()
      const { data: userData, error: userError } = await authClient.auth.getUser(token)
      if (userError || !userData.user) return json(401, { error: 'Sessão inválida para envio da confirmação.' })
    }

    const { data: config, error: configError } = await supabaseAdmin
      .from('unidade_email_config')
      .select('unidade_id, novo_pedido_email, pedido_pago_email, unidade:unidades(id, nome)')
      .eq('unidade_id', payload.unidadeId)
      .maybeSingle()

    if (configError) throw configError

    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from('pedidos_pagamento')
      .select('id, ficheiro_url, email_submissor, nome_submissor')
      .eq('id', payload.pedidoId)
      .maybeSingle()

    if (pedidoError) throw pedidoError

    const unidade = Array.isArray(config?.unidade) ? config.unidade[0] : config?.unidade
    const unidadeNome = payload.unidadeNome || unidade?.nome || 'Unidade BLIVE'

    const recipient = payload.eventType === 'new-payment-request' ? config?.novo_pedido_email : config?.pedido_pago_email

    if (!recipient && payload.eventType !== 'new-payment-request') {
      return json(422, { error: `Não existe email configurado para ${payload.eventType === 'new-payment-request' ? 'novo pedido' : 'pedido pago'} em ${unidadeNome}.` })
    }

    if (payload.eventType === 'payment-paid' && !config?.novo_pedido_email) {
      return json(422, { error: `Falta configurar o email de novo pedido em ${unidadeNome} para compor a resposta final da confirmação.` })
    }

    const message = buildMessage(payload, unidadeNome, config?.novo_pedido_email)
    const attachments = payload.eventType === 'new-payment-request' && pedido?.ficheiro_url
      ? [await buildAttachmentFromUrl(pedido.ficheiro_url)]
      : undefined

    let delivery = null
    let submitterDelivery = null
    const warnings = []

    if (recipient) {
      try {
        delivery = await sendAgentmailEmail({
          to: recipient,
          subject: message.subject,
          text: message.text,
          html: message.html,
          attachments,
          replyTo: payload.eventType === 'payment-paid' && config?.novo_pedido_email ? [config.novo_pedido_email] : undefined,
          fromName: 'Blive Finance',
        })
      } catch (error) {
        warnings.push(formatDeliveryError({
          error,
          recipient,
          kind: payload.eventType === 'new-payment-request' ? 'novo pedido' : 'pedido pago',
          unidadeNome,
        }))
      }
    }

    if (payload.eventType === 'new-payment-request') {
      const submitterEmail = normalizeEmail(payload.emailSubmissor || pedido?.email_submissor)

      if (!submitterEmail) {
        return json(422, { error: 'Falta o email do submissor para enviar a confirmação de recepção.' })
      }

      const confirmation = buildSubmitterConfirmationMessage(payload, unidadeNome)

      try {
        submitterDelivery = await sendAgentmailEmail({
          to: submitterEmail,
          subject: confirmation.subject,
          text: confirmation.text,
          html: confirmation.html,
          fromName: 'Blive Finance',
        })
      } catch (error) {
        warnings.push(formatDeliveryError({
          error,
          recipient: submitterEmail,
          kind: 'confirmação ao submissor',
          unidadeNome,
        }))
      }
    }

    const notifications = []

    if (recipient && delivery) {
      notifications.push({
        tipo: payload.eventType === 'new-payment-request' ? 'email_novo_pedido_enviado' : 'email_pedido_pago_enviado',
        destino: recipient,
        assunto: message.subject,
        payload: {
          pedido_id: payload.pedidoId,
          unidade_id: payload.unidadeId,
          unidade_nome: unidadeNome,
          agentmail_message_id: delivery?.message_id ?? null,
        },
      })
    }

    if (payload.eventType === 'new-payment-request' && submitterDelivery) {
      notifications.push({
        tipo: 'email_confirmacao_submissor_enviado',
        destino: normalizeEmail(payload.emailSubmissor || pedido?.email_submissor),
        assunto: `Pedido recebido · ${unidadeNome}`,
        payload: {
          pedido_id: payload.pedidoId,
          unidade_id: payload.unidadeId,
          unidade_nome: unidadeNome,
          agentmail_message_id: submitterDelivery?.message_id ?? null,
        },
      })
    }

    if (notifications.length > 0) {
      await supabaseAdmin.from('notificacoes_mock').insert(notifications)
    }

    return json(200, {
      ok: warnings.length === 0,
      warning: warnings[0] ?? null,
      warnings,
    })
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Falha inesperada ao enviar email.' })
  }
}

function buildMessage(payload, unidadeNome, novoPedidoEmail) {
  const valor = formatCurrency(payload.valor)

  if (payload.eventType === 'payment-paid') {
    const subject = `Pagamento confirmado · ${unidadeNome}`
    const text = [
      `Olá,`,
      '',
      `Confirmamos que o pedido submetido por ${payload.nomeSubmissor} para ${unidadeNome} foi marcado como pago.`,
      `Valor: ${valor}`,
      payload.categoria ? `Categoria: ${payload.categoria}` : null,
      '',
      `Se precisares de algum detalhe adicional, responda para ${novoPedidoEmail}.`,
    ].filter(Boolean).join('\n')

    const html = `
      <p>Olá,</p>
      <p>Confirmamos que o pedido submetido por <strong>${escapeHtml(payload.nomeSubmissor)}</strong> para <strong>${escapeHtml(unidadeNome)}</strong> foi marcado como pago.</p>
      <ul>
        <li><strong>Valor:</strong> ${escapeHtml(valor)}</li>
        ${payload.categoria ? `<li><strong>Categoria:</strong> ${escapeHtml(payload.categoria)}</li>` : ''}
      </ul>
      <p>Se precisares de algum detalhe adicional, responda para <strong>${escapeHtml(novoPedidoEmail)}</strong>.</p>
    `

    return { subject, text, html }
  }

  const subject = `Novo pedido de pagamento · ${unidadeNome}`
  const text = [
    `Entrou um novo pedido de pagamento para ${unidadeNome}.`,
    '',
    `Submissor: ${payload.nomeSubmissor}`,
    `Valor: ${valor}`,
    payload.dataLimite ? `Data limite: ${payload.dataLimite}` : null,
    payload.descricao ? `Descrição: ${payload.descricao}` : null,
  ].filter(Boolean).join('\n')

  const html = `
    <p>Entrou um novo pedido de pagamento para <strong>${escapeHtml(unidadeNome)}</strong>.</p>
    <ul>
      <li><strong>Submissor:</strong> ${escapeHtml(payload.nomeSubmissor)}</li>
      <li><strong>Valor:</strong> ${escapeHtml(valor)}</li>
      ${payload.dataLimite ? `<li><strong>Data limite:</strong> ${escapeHtml(payload.dataLimite)}</li>` : ''}
      ${payload.descricao ? `<li><strong>Descrição:</strong> ${escapeHtml(payload.descricao)}</li>` : ''}
    </ul>
  `

  return { subject, text, html }
}

function buildSubmitterConfirmationMessage(payload, unidadeNome) {
  const valor = formatCurrency(payload.valor)
  const subject = `Pedido recebido · ${unidadeNome}`
  const text = [
    `Olá ${payload.nomeSubmissor},`,
    '',
    `Confirmamos que recebemos o teu pedido de pagamento para ${unidadeNome}.`,
    `Valor: ${valor}`,
    payload.dataLimite ? `Data limite: ${payload.dataLimite}` : null,
    payload.descricao ? `Descrição: ${payload.descricao}` : null,
    '',
    'A equipa BLIVE vai agora validar o pedido.',
  ].filter(Boolean).join('\n')

  const html = `
    <p>Olá ${escapeHtml(payload.nomeSubmissor)},</p>
    <p>Confirmamos que recebemos o teu pedido de pagamento para <strong>${escapeHtml(unidadeNome)}</strong>.</p>
    <ul>
      <li><strong>Valor:</strong> ${escapeHtml(valor)}</li>
      ${payload.dataLimite ? `<li><strong>Data limite:</strong> ${escapeHtml(payload.dataLimite)}</li>` : ''}
      ${payload.descricao ? `<li><strong>Descrição:</strong> ${escapeHtml(payload.descricao)}</li>` : ''}
    </ul>
    <p>A equipa BLIVE vai agora validar o pedido.</p>
  `

  return { subject, text, html }
}

async function buildAttachmentFromUrl(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Não foi possível obter o comprovativo para anexar no email.')
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  const normalizedUrl = new URL(url)
  const filename = normalizedUrl.pathname.split('/').pop() || 'comprovativo'
  const contentType = response.headers.get('content-type') || 'application/octet-stream'

  return {
    filename,
    content: bytes.toString('base64'),
    content_type: contentType,
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
}

function normalizeEmail(value) {
  const trimmed = value?.trim()
  return trimmed || null
}

function formatDeliveryError({ error, recipient, kind, unidadeNome }) {
  const message = error instanceof Error ? error.message : String(error || 'Erro desconhecido no envio de email.')
  const normalizedRecipient = normalizeEmail(recipient)
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('suppressed') || lowerMessage.includes('unsubscribed') || lowerMessage.includes('recipient(s) blocked')) {
    return normalizedRecipient
      ? `O email de ${kind} para ${normalizedRecipient} não foi entregue porque esse destinatário está bloqueado/suprimido no AgentMail. O pedido ficou registado na mesma.`
      : `O email de ${kind} de ${unidadeNome} não foi entregue porque o destinatário está bloqueado/suprimido no AgentMail. O pedido ficou registado na mesma.`
  }

  if (normalizedRecipient) {
    return `Falhou o envio do email de ${kind} para ${normalizedRecipient}. ${message}`
  }

  return `Falhou o envio do email de ${kind} de ${unidadeNome}. ${message}`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

async function readPayload(event) {
  if (typeof event?.json === 'function') {
    return await event.json()
  }

  if (typeof event?.body === 'string') {
    return JSON.parse(event.body || '{}')
  }

  if (event?.body && typeof event.body === 'object') {
    return event.body
  }

  return {}
}

function readAuthorizationHeader(event) {
  if (typeof event?.headers?.get === 'function') {
    return event.headers.get('authorization') || event.headers.get('Authorization')
  }

  return event?.headers?.authorization || event?.headers?.Authorization || null
}

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  })
}
