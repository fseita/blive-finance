export type PedidoEstado = 'Pendente' | 'Pago' | 'Recusado'
export type TipoTransacao = 'Receita' | 'Despesa'

export interface Unidade {
  id: string
  nome: string
  conta_bancaria_nome: string | null
}

export interface UnidadeEmailConfig {
  unidade_id: string
  novo_pedido_email: string | null
  pedido_pago_email: string | null
  updated_at?: string
  unidade?: Unidade
}

export interface PedidoPagamento {
  id: string
  criado_em: string
  unidade_id: string
  nome_submissor: string
  iban: string
  valor: number
  data_limite: string
  descricao: string
  ficheiro_url: string
  estado: PedidoEstado
  unidade?: Unidade
}

export interface Transacao {
  id: string
  data_transacao: string
  unidade_id: string
  tipo: TipoTransacao
  valor: number
  metodo: string
  categoria: string
  pedido_pagamento_id: string | null
}

export interface DashboardFilters {
  month: number
  year: number
  unidadeId: string
}
