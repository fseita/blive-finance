import type { PedidoPagamento, Transacao, Unidade } from '../types/database'

export const mockUnidades: Unidade[] = [
  { id: 'u-beja', nome: 'Blive Pilates Beja', conta_bancaria_nome: 'Conta Operacional Beja' },
  { id: 'u-evora', nome: 'Blive Pilates Évora', conta_bancaria_nome: 'Conta Operacional Évora' },
  { id: 'u-areeiro', nome: 'Blive Pilates Areeiro', conta_bancaria_nome: 'Conta Operacional Areeiro' },
  { id: 'u-principe-real', nome: 'Blive Pilates Príncipe Real', conta_bancaria_nome: 'Conta Operacional Príncipe Real' },
  { id: 'u-telheiras', nome: 'Blive Pilates Telheiras', conta_bancaria_nome: 'Conta Operacional Telheiras' },
  { id: 'u-padel', nome: 'Blive Padel', conta_bancaria_nome: 'Conta Operacional Padel' },
]

export const mockPedidosPagamento: PedidoPagamento[] = [
  {
    id: 'p1',
    criado_em: '2026-06-05T10:30:00Z',
    unidade_id: 'u-areeiro',
    nome_submissor: 'Mariana Costa',
    iban: 'PT50000201231234567890154',
    valor: 248.5,
    data_limite: '2026-06-12',
    descricao: 'Pagamento de fornecedor de toalhas e material de apoio ao estúdio.',
    ficheiro_url: '#',
    estado: 'Pendente',
  },
  {
    id: 'p2',
    criado_em: '2026-06-06T08:15:00Z',
    unidade_id: 'u-beja',
    nome_submissor: 'João Ribeiro',
    iban: 'PT50003506551239876543210',
    valor: 920,
    data_limite: '2026-06-10',
    descricao: 'Renda mensal do espaço referente a Junho.',
    ficheiro_url: '#',
    estado: 'Pendente',
  },
  {
    id: 'p3',
    criado_em: '2026-06-07T15:40:00Z',
    unidade_id: 'u-padel',
    nome_submissor: 'Ana Martins',
    iban: 'MB|12345|123 456 789',
    valor: 137.9,
    data_limite: '2026-06-14',
    descricao: 'Compra de consumíveis e produtos de limpeza para recepção e balneários.',
    ficheiro_url: '#',
    estado: 'Pendente',
  },
]

export const mockTransacoes: Transacao[] = [
  { id: 't1', data_transacao: '2026-06-01', unidade_id: 'u-areeiro', tipo: 'Receita', valor: 6420, metodo: 'Débito direto', categoria: 'Mensalidades', pedido_pagamento_id: null },
  { id: 't2', data_transacao: '2026-06-02', unidade_id: 'u-areeiro', tipo: 'Receita', valor: 280, metodo: 'Multibanco', categoria: 'Aulas Avulso', pedido_pagamento_id: null },
  { id: 't3', data_transacao: '2026-06-03', unidade_id: 'u-beja', tipo: 'Receita', valor: 4120, metodo: 'Eupago', categoria: 'Mensalidades', pedido_pagamento_id: null },
  { id: 't4', data_transacao: '2026-06-04', unidade_id: 'u-padel', tipo: 'Receita', valor: 920, metodo: 'Transferência', categoria: 'Eventos', pedido_pagamento_id: null },
  { id: 't5', data_transacao: '2026-06-02', unidade_id: 'u-evora', tipo: 'Despesa', valor: 1850, metodo: 'Transferência', categoria: 'Ordenados', pedido_pagamento_id: null },
  { id: 't6', data_transacao: '2026-06-05', unidade_id: 'u-beja', tipo: 'Despesa', valor: 700, metodo: 'Transferência', categoria: 'Renda', pedido_pagamento_id: null },
  { id: 't7', data_transacao: '2026-06-06', unidade_id: 'u-principe-real', tipo: 'Receita', valor: 5100, metodo: 'Débito direto', categoria: 'Mensalidades', pedido_pagamento_id: null },
  { id: 't8', data_transacao: '2026-06-06', unidade_id: 'u-telheiras', tipo: 'Despesa', valor: 210, metodo: 'Transferência', categoria: 'Limpeza', pedido_pagamento_id: null },
  { id: 't9', data_transacao: '2026-06-07', unidade_id: 'u-padel', tipo: 'Despesa', valor: 340, metodo: 'Transferência', categoria: 'Fornecedores', pedido_pagamento_id: null },
  { id: 't10', data_transacao: '2026-06-08', unidade_id: 'u-principe-real', tipo: 'Receita', valor: 180, metodo: 'Dinheiro', categoria: 'Merchandising', pedido_pagamento_id: null },
]
