import type { PropsWithChildren } from 'react'
import { cn } from '../../lib/utils'

interface SectionCardProps extends PropsWithChildren {
  className?: string
}

export function SectionCard({ children, className }: SectionCardProps) {
  return (
    <div className={cn('rounded-3xl border border-white/10 bg-slate-950/50 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:p-6', className)}>
      {children}
    </div>
  )
}
