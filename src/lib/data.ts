import { endOfMonth, startOfMonth } from 'date-fns'
import type { PedidoPagamento, Transacao, Unidade } from '../types/database'
import { isMockMode } from './app-mode'
import { createMockDespesa, createMockReceita, getMockPedidos, getMockTransacoes, getMockUnidades, processMockPedido, submitMockPedido } from './mock-store'
import { supabase } from './supabase'

export async function listUnidades(): Promise<Unidade[]> {
  if (isMockMode) return getMockUnidades()
  const { data, error } = await supabase.from('unidades').select('id, nome, conta_bancaria_nome').order('nome')
  if (error) throw error
  return (data ?? []) as Unidade[]
}

export async function listPendingPedidos(): Promise<PedidoPagamento[]> {
  if (isMockMode) return getMockPedidos().filter((pedido) => pedido.estado === 'Pendente')
  const { data, error } = await supabase
    .from('pedidos_pagamento')
    .select('id, criado_em, unidade_id, nome_submissor, iban, valor, data_limite, descricao, ficheiro_url, estado, unidade:unidades(id, nome, conta_bancaria_nome)')
    .eq('estado', 'Pendente')
    .order('criado_em', { ascending: true })
  if (error) throw error
  return (data ?? []).map((item) => ({ ...item, unidade: Array.isArray(item.unidade) ? item.unidade[0] : item.unidade })) as PedidoPagamento[]
}

export async function createPedidoPagamento(payload: Omit<PedidoPagamento, 'id' | 'criado_em' | 'estado' | 'unidade'>, file?: File) {
  if (isMockMode) {
    submitMockPedido(payload)
    return
  }

  if (!file) throw new Error('Ficheiro em falta')
  const extension = file.name.split('.').pop()
  const filePath = `pedidos/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage.from('comprovativos-pagamento').upload(filePath, file)
  if (uploadError) throw uploadError
  const { data: publicUrlData } = supabase.storage.from('comprovativos-pagamento').getPublicUrl(filePath)
  const { error } = await supabase.from('pedidos_pagamento').insert({ ...payload, ficheiro_url: publicUrlData.publicUrl, estado: 'Pendente' })
  if (error) throw error
}

export async function processPedidoPagamento(pedidoId: string, categoria: string) {
  if (isMockMode) {
    processMockPedido(pedidoId, categoria)
    return
  }
  const { error } = await supabase.rpc('processar_pedido_pagamento', { p_pedido_id: pedidoId, p_categoria: categoria })
  if (error) throw error
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
