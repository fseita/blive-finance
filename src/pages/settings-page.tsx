import { Mail, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '../components/common/page-header'
import { SectionCard } from '../components/common/section-card'
import { listUnidadeEmailConfigs, saveUnidadeEmailConfigs } from '../lib/data'
import type { UnidadeEmailConfig } from '../types/database'

export function SettingsPage() {
  const [configs, setConfigs] = useState<UnidadeEmailConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listUnidadeEmailConfigs()
      .then(setConfigs)
      .finally(() => setLoading(false))
  }, [])

  const hasRows = useMemo(() => configs.length > 0, [configs])

  const handleChange = (unidadeId: string, field: 'novo_pedido_email' | 'pedido_pago_email', value: string) => {
    setConfigs((current) => current.map((item) => (item.unidade_id === unidadeId ? { ...item, [field]: value } : item)))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveUnidadeEmailConfigs(configs)
      toast.success('Configuração de emails guardada.')
    } catch {
      toast.error('Não foi possível guardar a configuração.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuração"
        title="Emails automáticos"
        description="Define para que endereço segue a notificação de novo pedido e a confirmação de pedido pago em cada unidade."
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || !hasRows}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#9FB941] px-5 py-3 font-semibold text-slate-950 transition hover:bg-[#b2cc54] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'A guardar...' : 'Guardar emails'}
          </button>
        }
      />

      <SectionCard>
        <div className="flex items-start gap-3 rounded-3xl border border-[#9FB941]/20 bg-[#9FB941]/8 p-4 text-sm text-slate-200">
          <Mail className="mt-0.5 text-[#9FB941]" size={18} />
          <div>
            <p className="font-medium text-white">Como funciona</p>
            <p className="mt-1 text-slate-400">Quando entra um novo pedido, enviamos email para o endereço configurado em "Novo pedido". Quando marcas esse pedido como pago, enviamos a confirmação para o endereço configurado em "Pedido pago".</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? <p className="text-sm text-slate-400">A carregar configuração...</p> : null}

          {!loading && !hasRows ? <p className="text-sm text-slate-400">Sem unidades disponíveis para configurar.</p> : null}

          {configs.map((item) => (
            <div key={item.unidade_id} className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#9FB941]">Unidade</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{item.unidade?.nome ?? item.unidade_id}</h3>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Email para novo pedido</span>
                  <input
                    type="email"
                    value={item.novo_pedido_email ?? ''}
                    onChange={(event) => handleChange(item.unidade_id, 'novo_pedido_email', event.target.value)}
                    className="input-base"
                    placeholder="ex: gestao@blive.pt"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Email para pedido pago</span>
                  <input
                    type="email"
                    value={item.pedido_pago_email ?? ''}
                    onChange={(event) => handleChange(item.unidade_id, 'pedido_pago_email', event.target.value)}
                    className="input-base"
                    placeholder="ex: beja@blivepilates.com"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
