import type { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 p-8 text-center">
      <Icon className="mx-auto text-slate-500" size={28} />
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  )
}
