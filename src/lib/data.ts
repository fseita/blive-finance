import { endOfMonth, startOfMonth } from 'date-fns'
import type { PedidoPagamento, Transacao, Unidade, UnidadeEmailConfig } from '../types/database'
import { isMockMode } from './app-mode'
import {
  createMockDespesa,
  createMockReceita,
  getMockPedidos,
  getMockTransacoes,
  getMockUnidadeEmailConfig,
  getMockUnidades,
  processMockPedido,
  saveMockUnidadeEmailConfig,
  submitMockPedido,
  deleteMockPedido,
} from './mock-store'
import { supabase } from './supabase'

interface NotificationResult {
  ok: boolean
  warning?: string
}

interface PaymentEventPayload {
  eventType: 'new-payment-request' | 'payment-paid'
  pedidoId: string
  unidadeId: string
  unidadeNome?: string
  nomeSubmissor: string
  emailSubmissor?: string
  valor: number
  dataLimite?: string
  descricao?: string
  categoria?: string
}

export async function listUnidades(): Promise<Unidade[]> {
  if (isMockMode) return getMockUnidades()
  const { data, error } = await supabase.from('unidades').select('id, nome, conta_bancaria_nome').order('nome')
  if (error) throw error
  return (data ?? []) as Unidade[]
}

export async function listUnidadeEmailConfigs(): Promise<UnidadeEmailConfig[]> {
  if (isMockMode) return getMockUnidadeEmailConfig()

  const [unidadesResult, configResult] = await Promise.all([
    supabase.from('unidades').select('id, nome, conta_bancaria_nome').order('nome'),
    supabase.from('unidade_email_config').select('unidade_id, novo_pedido_email, pedido_pago_email, updated_at'),
  ])

  if (unidadesResult.error) throw unidadesResult.error
  if (configResult.error) throw configResult.error

  const configByUnit = new Map((configResult.data ?? []).map((item) => [item.unidade_id, item]))

  return ((unidadesResult.data ?? []) as Unidade[]).map((unidade) => {
    const config = configByUnit.get(unidade.id)
    return {
      unidade_id: unidade.id,
      novo_pedido_email: config?.novo_pedido_email ?? null,
      pedido_pago_email: config?.pedido_pago_email ?? null,
      updated_at: config?.updated_at,
      unidade,
    }
  })
}

export async function saveUnidadeEmailConfigs(configs: UnidadeEmailConfig[]) {
  if (isMockMode) {
    saveMockUnidadeEmailConfig(configs)
    return
  }

  const payload = configs.map((config) => {
    const { unidade, ...item } = config
    void unidade

    return {
      ...item,
      novo_pedido_email: normalizeNullableEmail(item.novo_pedido_email),
      pedido_pago_email: normalizeNullableEmail(item.pedido_pago_email),
    }
  })

  const { error } = await supabase.from('unidade_email_config').upsert(payload, { onConflict: 'unidade_id' })
  if (error) throw error
}

export async function listPendingPedidos(): Promise<PedidoPagamento[]> {
  if (isMockMode) return getMockPedidos().filter((pedido) => pedido.estado === 'Pendente')
  const { data, error } = await supabase
    .from('pedidos_pagamento')
    .select('id, criado_em, unidade_id, nome_submissor, email_submissor, iban, valor, data_limite, descricao, ficheiro_url, estado, unidade:unidades(id, nome, conta_bancaria_nome)')
    .eq('estado', 'Pendente')
    .order('criado_em', { ascending: true })
  if (error) throw error
  return (data ?? []).map((item) => ({ ...item, unidade: Array.isArray(item.unidade) ? item.unidade[0] : item.unidade })) as PedidoPagamento[]
}

export async function createPedidoPagamento(payload: Omit<PedidoPagamento, 'id' | 'criado_em' | 'estado' | 'unidade'>, file?: File): Promise<NotificationResult> {
  const pedidoId = crypto.randomUUID()

  if (isMockMode) {
    submitMockPedido({ ...payload, id: pedidoId } as Omit<PedidoPagamento, 'criado_em' | 'estado' | 'unidade'>)
    return { ok: true }
  }

  if (!file) throw new Error('Ficheiro em falta')
  const extension = file.name.split('.').pop()
  const filePath = `pedidos/${pedidoId}.${extension}`
  const { error: uploadError } = await supabase.storage.from('comprovativos-pagamento').upload(filePath, file)
  if (uploadError) throw uploadError
  const { data: publicUrlData } = supabase.storage.from('comprovativos-pagamento').getPublicUrl(filePath)
  const { error } = await supabase.from('pedidos_pagamento').insert({ id: pedidoId, ...payload, ficheiro_url: publicUrlData.publicUrl, estado: 'Pendente' })
  if (error) throw error

  return notifyPaymentEvent({
    eventType: 'new-payment-request',
    pedidoId,
    unidadeId: payload.unidade_id,
    nomeSubmissor: payload.nome_submissor,
    emailSubmissor: payload.email_submissor,
    valor: Number(payload.valor),
    dataLimite: payload.data_limite,
    descricao: payload.descricao,
  })
}

export async function processPedidoPagamento(pedido: Pick<PedidoPagamento, 'id' | 'unidade_id' | 'nome_submissor' | 'email_submissor' | 'valor'> & { unidade?: Unidade }, categoria: string): Promise<NotificationResult> {
  if (isMockMode) {
    processMockPedido(pedido.id, categoria)
    return { ok: true }
  }
  const { error } = await supabase.rpc('processar_pedido_pagamento', { p_pedido_id: pedido.id, p_categoria: categoria })
  if (error) throw error

  return notifyPaymentEvent(
    {
      eventType: 'payment-paid',
      pedidoId: pedido.id,
      unidadeId: pedido.unidade_id,
      unidadeNome: pedido.unidade?.nome,
      nomeSubmissor: pedido.nome_submissor,
      emailSubmissor: pedido.email_submissor,
      valor: Number(pedido.valor),
      categoria,
    },
    true,
  )
}

export async function deletePedidoPagamento(pedido: Pick<PedidoPagamento, 'id' | 'ficheiro_url'>) {
  if (isMockMode) {
    deleteMockPedido(pedido.id)
    return
  }

  const { error } = await supabase.from('pedidos_pagamento').delete().eq('id', pedido.id)
  if (error) throw error

  const storagePath = getComprovativoStoragePath(pedido.ficheiro_url)
  if (!storagePath) return

  const { error: storageError } = await supabase.storage.from('comprovativos-pagamento').remove([storagePath])
  if (storageError) {
    console.warn('Não foi possível apagar o comprovativo do storage.', storageError)
  }
}

async function createTransacao(tipo: 'Receita' | 'Despesa', payload: Omit<Transacao, 'id' | 'tipo' | 'pedido_pagamento_id'>) {
  if (isMockMode) {
    if (tipo === 'Receita') createMockReceita(payload)
    else createMockDespesa(payload)
    return
  }
  const { error } = await supabase.from('transacoes').insert({ ...payload, tipo })
  if (error) throw error
}

export async function createReceita(payload: Omit<Transacao, 'id' | 'tipo' | 'pedido_pagamento_id'>) {
  await createTransacao('Receita', payload)
}

export async function createDespesa(payload: Omit<Transacao, 'id' | 'tipo' | 'pedido_pagamento_id'>) {
  await createTransacao('Despesa', payload)
}

export async function listTransacoes(filters: { month: number; year: number; unidadeId: string }): Promise<Transacao[]> {
  if (isMockMode) {
    const start = startOfMonth(new Date(filters.year, filters.month - 1, 1)).toISOString().slice(0, 10)
    const end = endOfMonth(new Date(filters.year, filters.month - 1, 1)).toISOString().slice(0, 10)
    return getMockTransacoes().filter((item) => item.data_transacao >= start && item.data_transacao <= end && (filters.unidadeId === 'all' || item.unidade_id === filters.unidadeId))
  }

  const start = startOfMonth(new Date(filters.year, filters.month - 1, 1)).toISOString().slice(0, 10)
  const end = endOfMonth(new Date(filters.year, filters.month - 1, 1)).toISOString().slice(0, 10)
  let query = supabase.from('transacoes').select('id, data_transacao, unidade_id, tipo, valor, metodo, categoria, pedido_pagamento_id').gte('data_transacao', start).lte('data_transacao', end)
  if (filters.unidadeId !== 'all') query = query.eq('unidade_id', filters.unidadeId)
  const { data, error } = await query.order('data_transacao')
  if (error) throw error
  return (data ?? []) as Transacao[]
}

async function notifyPaymentEvent(payload: PaymentEventPayload, requireAuth = false): Promise<NotificationResult> {
  try {
    const session = requireAuth ? await supabase.auth.getSession() : null
    const token = session?.data.session?.access_token

    const response = await fetch('/.netlify/functions/payment-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = await safeReadJson(response)
      return {
        ok: false,
        warning: body?.error ?? 'O email automático não foi enviado.',
      }
    }

    return { ok: true }
  } catch {
    return {
      ok: false,
      warning: 'O email automático não foi enviado.',
    }
  }
}

async function safeReadJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function normalizeNullableEmail(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function getComprovativoStoragePath(publicUrl: string) {
  try {
    const url = new URL(publicUrl)
    const marker = '/storage/v1/object/public/comprovativos-pagamento/'
    const index = url.pathname.indexOf(marker)

    if (index === -1) return null

    return decodeURIComponent(url.pathname.slice(index + marker.length))
  } catch {
    return null
  }
}
