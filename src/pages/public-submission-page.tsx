import { ArrowRight, CheckCircle2, FileText, Landmark, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PublicPaymentForm } from '../components/forms/public-payment-form'
import { SectionCard } from '../components/common/section-card'

export function PublicSubmissionPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8 lg:py-10">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-stretch">
        <SectionCard className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(159,185,65,0.18),transparent_35%),rgba(2,6,23,0.75)] xl:min-h-full">
          <div className="max-w-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <img src="/blive-logo.png" alt="BLIVE" className="h-10 w-auto object-contain sm:h-12" />
              <Link
                to="/login"
                className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-[#9FB941]/40 hover:bg-white/10"
              >
                Login backoffice
                <ArrowRight size={16} />
              </Link>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">Submissão de despesas do Grupo BLIVE</h1>
            <p className="mt-3 text-base text-slate-300 sm:text-lg">
              Formulário simples, seguro e directo para enviar pedidos de pagamento com comprovativo anexado.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              { icon: Landmark, title: 'Unidade certa', text: 'Cada pedido fica associado à unidade correspondente.' },
              { icon: FileText, title: 'Comprovativo anexo', text: 'PDF ou imagem associados ao pedido para validação.' },
              { icon: ShieldCheck, title: 'Fluxo controlado', text: 'A gestão trata depois o processamento no backoffice.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-3 sm:p-4">
                <Icon className="text-[#9FB941]" size={20} />
                <h2 className="mt-3 text-lg font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="xl:min-h-full xl:self-stretch">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Estado do processo</p>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <p>1. O pedido entra com estado <strong className="text-amber-300">Pendente</strong>.</p>
            <p>2. A equipa de gestão é alertada para revisão.</p>
            <p>3. Após validação, o pagamento é processado e registado.</p>
          </div>

          <div className="mt-6 rounded-2xl border border-[#9FB941]/20 bg-[#9FB941]/8 p-4 text-sm text-slate-200">
            <div className="flex items-center gap-2 text-[#9FB941]">
              <CheckCircle2 size={16} />
              Processo simples e seguro
            </div>
            <p className="mt-2 text-slate-400">Submete os dados essenciais e acompanha um fluxo pensado para validação rápida pela gestão.</p>
          </div>
        </SectionCard>
      </section>

      <SectionCard className="w-full">
        <div className="mb-6 flex flex-col gap-2 border-b border-white/8 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[#9FB941]">Novo pedido</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Submeter pagamento</h2>
          </div>
          <p className="text-sm text-slate-500 md:text-right">Resposta rápida, sem login obrigatório.</p>
        </div>
        <PublicPaymentForm />
      </SectionCard>
    </main>
  )
}
