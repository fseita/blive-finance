import { useState } from 'react'
import { toast } from 'sonner'
import { processPedidoPagamento } from '../../lib/data'
import { formatCurrency } from '../../lib/format'
import type { PedidoPagamento } from '../../types/database'

const expenseCategories = ['Ordenados', 'Notas de crédito', 'Fornecedores', 'Renda', 'Limpeza', 'Consumíveis']

interface ProcessPaymentModalProps {
  pedido: PedidoPagamento | null
  onClose: () => void
  onProcessed: () => Promise<void>
}

export function ProcessPaymentModal({ pedido, onClose, onProcessed }: ProcessPaymentModalProps) {
  const [categoria, setCategoria] = useState(expenseCategories[0])
  const [submitting, setSubmitting] = useState(false)

  if (!pedido) return null

  const handleConfirm = async () => {
    setSubmitting(true)

    try {
      await processPedidoPagamento(pedido.id, categoria)
      toast.success('Pagamento processado com sucesso.')
      await onProcessed()
      onClose()
    } catch {
      toast.error('Não foi possível processar o pagamento.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[#9FB941]">Processar pagamento</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{pedido.nome_submissor}</h3>
            <p className="mt-2 text-sm text-slate-400">Confirmar esta saída e converter em despesa registada.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">Fechar</button>
        </div>

        <div className="mt-6 grid gap-4 rounded-3xl bg-white/5 p-4 text-sm text-slate-300 md:grid-cols-2">
          <div>
            <p className="text-slate-400">Conta de saída da unidade</p>
            <p className="mt-1 text-base text-white">{pedido.unidade?.conta_bancaria_nome ?? 'Conta não definida'}</p>
          </div>
          <div>
            <p className="text-slate-400">Valor</p>
            <p className="mt-1 text-base text-white">{formatCurrency(Number(pedido.valor))}</p>
          </div>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-slate-400">Categoria da despesa</span>
            <select
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-[#9FB941]"
            >
              {expenseCategories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 px-4 py-3 text-slate-300 hover:text-white">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-2xl bg-[#9FB941] px-5 py-3 font-medium text-slate-950 transition hover:bg-[#b2cc54] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'A processar...' : 'Confirmar e pagar'}
          </button>
        </div>
      </div>
    </div>
  )
}
