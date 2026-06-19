import type { PedidoPagamento, Transacao, Unidade, UnidadeEmailConfig } from '../types/database'
import { mockPedidosPagamento, mockTransacoes, mockUnidades } from './mock-data'

const KEYS = {
  unidades: 'blive-finance:mock:unidades',
  pedidos: 'blive-finance:mock:pedidos',
  transacoes: 'blive-finance:mock:transacoes',
  auth: 'blive-finance:mock:auth',
  unidadeEmailConfig: 'blive-finance:mock:unidade-email-config',
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
  if (!localStorage.getItem(KEYS.unidadeEmailConfig)) {
    writeJson(
      KEYS.unidadeEmailConfig,
      mockUnidades.map((unidade) => ({
        unidade_id: unidade.id,
        novo_pedido_email: '',
        pedido_pago_email: '',
      })),
    )
  }
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
    email_submissor: pedido.email_submissor ?? '',
    unidade: unidades.find((unit) => unit.id === pedido.unidade_id),
  }))
}

export function getMockTransacoes(): Transacao[] {
  seedMockData()
  return readJson(KEYS.transacoes, mockTransacoes)
}

export function getMockUnidadeEmailConfig(): UnidadeEmailConfig[] {
  seedMockData()
  const unidades = getMockUnidades()
  return readJson<Omit<UnidadeEmailConfig, 'unidade'>[]>(KEYS.unidadeEmailConfig, []).map((item) => ({
    ...item,
    unidade: unidades.find((unit) => unit.id === item.unidade_id),
  }))
}

export function saveMockUnidadeEmailConfig(configs: UnidadeEmailConfig[]) {
  writeJson(
    KEYS.unidadeEmailConfig,
    configs.map((config) => {
      const { unidade, ...item } = config
      void unidade
      return item
    }),
  )
}

export function submitMockPedido(input: Omit<PedidoPagamento, 'criado_em' | 'estado' | 'unidade'>) {
  const pedidos = getMockPedidos().map((pedido) => {
    const { unidade, ...rest } = pedido
    void unidade
    return rest
  })
  const next: PedidoPagamento = {
    ...input,
    criado_em: new Date().toISOString(),
    estado: 'Pendente',
  }
  pedidos.unshift(next)
  writeJson(KEYS.pedidos, pedidos)
  return next
}

export function processMockPedido(pedidoId: string, categoria: string) {
  const pedidos = getMockPedidos().map((pedido) => {
    const { unidade, ...rest } = pedido
    void unidade
    return rest
  })
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

export function deleteMockPedido(pedidoId: string) {
  const pedidos = getMockPedidos().map((pedido) => {
    const { unidade, ...rest } = pedido
    void unidade
    return rest
  })
  const next = pedidos.filter((pedido) => pedido.id !== pedidoId)

  if (next.length === pedidos.length) {
    throw new Error('Pedido não encontrado')
  }

  writeJson(KEYS.pedidos, next)
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
