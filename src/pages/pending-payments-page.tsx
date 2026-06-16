import { AlertCircle, ArrowUpRight, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '../components/common/empty-state'
import { ManualPaymentForm } from '../components/forms/manual-payment-form'
import { PageHeader } from '../components/common/page-header'
import { SectionCard } from '../components/common/section-card'
import { StatusBadge } from '../components/common/status-badge'
import { ProcessPaymentModal } from '../components/payments/process-payment-modal'
import { deletePedidoPagamento, listPendingPedidos } from '../lib/data'
import { formatCurrency, formatDate } from '../lib/format'
import { parsePaymentDestination } from '../lib/payment-destination'
import type { PedidoPagamento } from '../types/database'

export function PendingPaymentsPage() {
  const [pedidos, setPedidos] = useState<PedidoPagamento[]>([])
  const [selectedPedido, setSelectedPedido] = useState<PedidoPagamento | null>(null)
  const [deletingPedidoId, setDeletingPedidoId] = useState<string | null>(null)

  const loadPedidos = async () => {
    const data = await listPendingPedidos()
    setPedidos(data)
  }

  useEffect(() => {
    let isActive = true

    void (async () => {
      const data = await listPendingPedidos()
      if (isActive) setPedidos(data)
    })()

    return () => {
      isActive = false
    }
  }, [])

  const handleDeletePedido = async (pedido: PedidoPagamento) => {
    const confirmed = window.confirm(`Apagar o pedido de pagamento de ${pedido.nome_submissor} no valor de ${formatCurrency(Number(pedido.valor))}?`)
    if (!confirmed) return

    setDeletingPedidoId(pedido.id)

    try {
      await deletePedidoPagamento(pedido)
      if (selectedPedido?.id === pedido.id) setSelectedPedido(null)
      await loadPedidos()
      toast.success('Pedido apagado com sucesso.')
    } catch {
      toast.error('Não foi possível apagar o pedido.')
    } finally {
      setDeletingPedidoId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pagamentos"
        title="Gestão de pagamentos"
        description="Revê pedidos pendentes da equipa e lança pagamentos manuais quando necessário."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <SectionCard>
          <p className="text-sm text-slate-400">Pedidos por tratar</p>
          <p className="mt-3 text-3xl font-semibold text-white">{pedidos.length}</p>
        </SectionCard>
        <SectionCard>
          <p className="text-sm text-slate-400">Montante pendente</p>
          <p className="mt-3 text-3xl font-semibold text-white">{formatCurrency(pedidos.reduce((sum, item) => sum + Number(item.valor), 0))}</p>
        </SectionCard>
        <SectionCard>
          <p className="text-sm text-slate-400">Mais urgente</p>
          <p className="mt-3 text-lg font-semibold text-white">{pedidos[0] ? formatDate(pedidos[0].data_limite) : 'Sem pedidos'}</p>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard>
          <div className="mb-5">
            <p className="text-sm uppercase tracking-[0.22em] text-[#9FB941]">Novo pagamento</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Lançamento manual</h3>
            <p className="mt-2 text-sm text-slate-400">Regista uma despesa directamente sem depender de um pedido submetido pela equipa.</p>
          </div>
          <ManualPaymentForm onCreated={loadPedidos} />
        </SectionCard>

        <div className="grid gap-4">
        {pedidos.length === 0 ? (
          <EmptyState icon={AlertCircle} title="Sem pedidos pendentes" text="Quando entrarem novas submissões, aparecem aqui para validação e pagamento." />
        ) : (
          pedidos.map((pedido) => {
            const paymentDestination = parsePaymentDestination(pedido.iban)

            return (
            <SectionCard key={pedido.id} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-semibold text-white">{pedido.nome_submissor}</h3>
                  <StatusBadge status={pedido.estado} />
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                  <p><span className="text-slate-500">Unidade:</span> {pedido.unidade?.nome}</p>
                  <p><span className="text-slate-500">Valor:</span> {formatCurrency(Number(pedido.valor))}</p>
                  <p><span className="text-slate-500">Data limite:</span> {formatDate(pedido.data_limite)}</p>
                  {paymentDestination.method === 'multibanco' ? (
                    <>
                      <p><span className="text-slate-500">Método:</span> Referência Multibanco</p>
                      <p><span className="text-slate-500">Entidade:</span> {paymentDestination.entidade}</p>
                      <p className="break-all"><span className="text-slate-500">Referência:</span> {paymentDestination.referencia}</p>
                    </>
                  ) : (
                    <>
                      <p><span className="text-slate-500">Método:</span> Transferência bancária</p>
                      <p className="break-all md:col-span-2"><span className="text-slate-500">IBAN:</span> {paymentDestination.iban}</p>
                    </>
                  )}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{pedido.descricao}</p>
                <a href={pedido.ficheiro_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-[#9FB941] hover:text-[#b2cc54]">
                  Ver comprovativo <ArrowUpRight size={15} />
                </a>
              </div>

              <div className="flex w-full flex-col gap-3 lg:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedPedido(pedido)}
                  className="w-full rounded-2xl bg-[#9FB941] px-5 py-3 font-medium text-slate-950 transition hover:bg-[#b2cc54] lg:w-auto"
                >
                  Processar pagamento
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePedido(pedido)}
                  disabled={deletingPedidoId === pedido.id}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 px-5 py-3 font-medium text-red-200 transition hover:border-red-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
                >
                  <Trash2 size={16} />
                  {deletingPedidoId === pedido.id ? 'A apagar...' : 'Apagar pedido'}
                </button>
              </div>
            </SectionCard>
          )})
        )}
        </div>
      </div>

      <ProcessPaymentModal pedido={selectedPedido} onClose={() => setSelectedPedido(null)} onProcessed={loadPedidos} />
    </div>
  )
}
