import { cn } from '../../lib/utils'
import type { PedidoEstado } from '../../types/database'

export function StatusBadge({ status }: { status: PedidoEstado }) {
  return (
    <span
      className={cn('inline-flex rounded-full px-3 py-1 text-xs font-medium', {
        'bg-amber-500/15 text-amber-300': status === 'Pendente',
        'bg-[#9FB941]/15 text-[#9FB941]': status === 'Pago',
        'bg-rose-500/15 text-rose-300': status === 'Recusado',
      })}
    >
      {status}
    </span>
  )
}
