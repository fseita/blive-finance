import type { PedidoPagamento, Transacao, Unidade } from '../types/database'
import { mockPedidosPagamento, mockTransacoes, mockUnidades } from './mock-data'

const KEYS = {
  unidades: 'blive-finance:mock:unidades',
  pedidos: 'blive-finance:mock:pedidos',
  transacoes: 'blive-finance:mock:transacoes',
  auth: 'blive-finance:mock:auth',
}

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function seedMockData() {
  if (!localStorage.getItem(KEYS.unidades)) writeJson(KEYS.unidades, mockUnidades)
  if (!localStorage.getItem(KEYS.pedidos)) writeJson(KEYS.pedidos, mockPedidosPagamento)
  if (!localStorage.getItem(KEYS.transacoes)) writeJson(KEYS.transacoes, mockTransacoes)
}

export function getMockUnidades(): Unidade[] {
  seedMockData()
  return readJson(KEYS.unidades, mockUnidades)
}

export function getMockPedidos(): PedidoPagamento[] {
  seedMockData()
  const unidades = getMockUnidades()
  return readJson(KEYS.pedidos, mockPedidosPagamento).map((pedido) => ({
    ...pedido,
    unidade: unidades.find((unit) => unit.id === pedido.unidade_id),
  }))
}

export function getMockTransacoes(): Transacao[] {
  seedMockData()
  return readJson(KEYS.transacoes, mockTransacoes)
}

export function submitMockPedido(input: Omit<PedidoPagamento, 'id' | 'criado_em' | 'estado' | 'unidade'>) {
  const pedidos = getMockPedidos().map(({ unidade, ...pedido }) => pedido)
  const next: PedidoPagamento = {
    ...input,
    id: crypto.randomUUID(),
    criado_em: new Date().toISOString(),
    estado: 'Pendente',
  }
  pedidos.unshift(next)
  writeJson(KEYS.pedidos, pedidos)
  return next
}

export function processMockPedido(pedidoId: string, categoria: string) {
  const pedidos = getMockPedidos().map(({ unidade, ...pedido }) => pedido)
  const index = pedidos.findIndex((pedido) => pedido.id === pedidoId)
  if (index === -1) throw new Error('Pedido não encontrado')

  const pedido = pedidos[index]
  pedidos[index] = { ...pedido, estado: 'Pago' }
  writeJson(KEYS.pedidos, pedidos)

  const transacoes = getMockTransacoes()
  transacoes.unshift({
    id: crypto.randomUUID(),
    data_transacao: new Date().toISOString().slice(0, 10),
    unidade_id: pedido.unidade_id,
    tipo: 'Despesa',
    valor: Number(pedido.valor),
    metodo: 'Transferência',
    categoria,
    pedido_pagamento_id: pedido.id,
  })
  writeJson(KEYS.transacoes, transacoes)
}

function createMockTransacao(tipo: 'Receita' | 'Despesa', input: Omit<Transacao, 'id' | 'tipo' | 'pedido_pagamento_id'>) {
  const transacoes = getMockTransacoes()
  transacoes.unshift({
    ...input,
    id: crypto.randomUUID(),
    tipo,
    pedido_pagamento_id: null,
  })
  writeJson(KEYS.transacoes, transacoes)
}

export function createMockReceita(input: Omit<Transacao, 'id' | 'tipo' | 'pedido_pagamento_id'>) {
  createMockTransacao('Receita', input)
}

export function createMockDespesa(input: Omit<Transacao, 'id' | 'tipo' | 'pedido_pagamento_id'>) {
  createMockTransacao('Despesa', input)
}

export function isMockLoggedIn() {
  return localStorage.getItem(KEYS.auth) === 'true'
}

export function mockLogin() {
  localStorage.setItem(KEYS.auth, 'true')
}

export function mockLogout() {
  localStorage.removeItem(KEYS.auth)
}
