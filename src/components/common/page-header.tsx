import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-[#9FB941] sm:text-sm sm:tracking-[0.28em]">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
      {actions}
    </div>
  )
}
