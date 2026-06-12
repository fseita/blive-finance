import { BarChart3, CreditCard, DatabaseZap, LogOut, Mail, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/use-auth'

const links = [
  { to: '/admin/pagamentos', label: 'Pagamentos', mobileLabel: 'Pagamentos', icon: CreditCard },
  { to: '/admin/dashboard', label: 'Dashboard', mobileLabel: 'Dashboard', icon: BarChart3 },
  { to: '/admin/receitas', label: 'Receitas', mobileLabel: 'Receitas', icon: Wallet },
  { to: '/admin/configuracoes', label: 'Configuração', mobileLabel: 'Config', icon: Mail },
]

export function Sidebar() {
  const { logout, session } = useAuth()

  return (
    <aside className="flex w-full flex-col rounded-[2rem] border border-white/10 bg-slate-950/60 p-4 backdrop-blur sm:p-5 xl:max-w-xs xl:min-h-[calc(100vh-4rem)]">
      <div className="flex items-start justify-between gap-4 xl:block">
        <div>
          <img src="/blive-logo.png" alt="BLIVE" className="h-9 w-auto object-contain sm:h-10" />
          <p className="mt-3 text-xs uppercase tracking-[0.25em] text-[#9FB941]">BLIVE Finance</p>
          <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Gestão Financeira</h1>
          <p className="mt-1 hidden text-sm text-slate-400 sm:block">Portal interno para pagamentos, receitas e conciliação.</p>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-rose-400/50 hover:text-white xl:hidden"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-[#9FB941]/15 bg-[#9FB941]/8 p-3 text-sm text-slate-200 sm:p-4">
        <div className="flex items-center gap-2 text-[#9FB941]">
          <DatabaseZap size={16} />
          <span>Centro de gestão</span>
        </div>
        <p className="mt-2 hidden text-xs text-slate-400 sm:block">Acompanha pedidos, receitas, emails automáticos e movimentos financeiros num único lugar.</p>
      </div>

      <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 xl:mt-8 xl:block xl:space-y-2 xl:overflow-visible xl:pb-0">
        {links.map(({ to, label, mobileLabel, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm transition xl:w-full ${isActive ? 'bg-[#9FB941]/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
            }
          >
            <Icon size={18} />
            <span className="whitespace-nowrap sm:hidden">{mobileLabel}</span>
            <span className="hidden whitespace-nowrap sm:inline">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300 sm:p-4 xl:mt-auto">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sessão</p>
        <p className="mt-2 truncate text-white">{session?.user?.email ?? 'Utilizador autenticado'}</p>
      </div>

      <button
        type="button"
        onClick={() => logout()}
        className="mt-4 hidden items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:border-rose-400/50 hover:text-white xl:inline-flex"
      >
        <LogOut size={16} />
        Terminar sessão
      </button>
    </aside>
  )
}
