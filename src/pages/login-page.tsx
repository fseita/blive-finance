import { Lock, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { SectionCard } from '../components/common/section-card'
import { useAuth } from '../hooks/use-auth'
import { isMockMode } from '../lib/app-mode'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState(isMockMode ? 'demo@blive.local' : '')
  const [password, setPassword] = useState(isMockMode ? 'demo1234' : '')
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/admin/pagamentos'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await login(email, password)
      toast.success('Sessão iniciada.')
      navigate(redirectTo, { replace: true })
    } catch {
      toast.error('Credenciais inválidas.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <SectionCard className="hidden min-h-[520px] overflow-hidden lg:block bg-[radial-gradient(circle_at_top_left,rgba(159,185,65,0.18),transparent_35%),rgba(2,6,23,0.75)]">
        <img src="/blive-logo.png" alt="BLIVE" className="h-10 w-auto object-contain" />
        <p className="mt-6 text-sm uppercase tracking-[0.28em] text-[#9FB941]">Backoffice BLIVE</p>
        <h1 className="mt-4 max-w-lg text-5xl font-semibold tracking-tight text-white">Controlo financeiro claro, rápido e sem ruído.</h1>
        <p className="mt-4 max-w-xl text-lg text-slate-300">Pagamentos pendentes, receitas manuais e visão mensal num único painel para uma gestão financeira rápida e clara.</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {[
            'Fila de pagamentos com processamento guiado',
            'Dashboard mensal com KPIs e categorias',
            'Fluxo público para submissão de despesas',
            'Experiência fluida em desktop e mobile',
          ].map((item) => (
            <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">{item}</div>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="w-full max-w-md justify-self-center lg:max-w-none">
        <img src="/blive-logo.png" alt="BLIVE" className="h-10 w-auto object-contain" />
        <div className="mt-5 flex items-center gap-2 text-[#9FB941]">
          <Lock size={18} />
          <p className="text-sm uppercase tracking-[0.28em]">Área reservada</p>
        </div>
        <h2 className="mt-3 text-3xl font-semibold text-white">Entrar no admin</h2>
        <p className="mt-2 text-sm text-slate-400">Acesso reservado a sócios e direcção.</p>

        {isMockMode ? (
          <div className="mt-5 rounded-2xl border border-[#9FB941]/15 bg-[#9FB941]/8 p-4 text-sm text-slate-200">
            <div className="flex items-center gap-2 text-[#9FB941]">
              <Sparkles size={16} />
              Acesso de demonstração
            </div>
            <p className="mt-2 text-slate-400">Podes entrar com as credenciais preenchidas para explorar a plataforma.</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="input-base" required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="input-base" required />
          </label>

          <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-[#9FB941] px-5 py-4 font-semibold text-slate-950 transition hover:bg-[#b2cc54] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
      </SectionCard>
    </main>
  )
}
