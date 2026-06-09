import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string
  accent?: 'default' | 'positive' | 'negative'
}

export function StatCard({ label, value, accent = 'default' }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 sm:p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p
        className={cn('mt-3 text-2xl font-semibold sm:text-3xl', {
          'text-white': accent === 'default',
          'text-[#9FB941]': accent === 'positive',
          'text-rose-400': accent === 'negative',
        })}
      >
        {value}
      </p>
    </div>
  )
}
