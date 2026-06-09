import { useEffect, useMemo, useState } from 'react'
import { FinanceCategoryChart } from '../components/charts/finance-category-chart'
import { PageHeader } from '../components/common/page-header'
import { SectionCard } from '../components/common/section-card'
import { StatCard } from '../components/common/stat-card'
import { listTransacoes, listUnidades } from '../lib/data'
import { formatCurrency } from '../lib/format'
import type { DashboardFilters, Transacao, Unidade } from '../types/database'

export function DashboardPage() {
  const now = new Date()
  const [filters, setFilters] = useState<DashboardFilters>({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    unidadeId: 'all',
  })
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [transacoes, setTransacoes] = useState<Transacao[]>([])

  useEffect(() => {
    listUnidades().then(setUnidades)
  }, [])

  useEffect(() => {
    listTransacoes(filters).then(setTransacoes)
  }, [filters])

  const receitas = transacoes.filter((item) => item.tipo === 'Receita')
  const despesas = transacoes.filter((item) => item.tipo === 'Despesa')
  const totalReceitas = receitas.reduce((sum, item) => sum + Number(item.valor), 0)
  const totalDespesas = despesas.reduce((sum, item) => sum + Number(item.valor), 0)
  const saldo = totalReceitas - totalDespesas

  const receitasPorCategoria = useMemo(() => aggregateByCategory(receitas), [receitas])
  const despesasPorCategoria = useMemo(() => aggregateByCategory(despesas), [despesas])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard financeiro"
        title="Resumo mensal"
        description="Visão consolidada de entradas e saídas por período e por unidade."
        actions={
          <div className="grid gap-3 md:grid-cols-3">
            <select value={filters.month} onChange={(event) => setFilters((prev) => ({ ...prev, month: Number(event.target.value) }))} className="input-base min-w-36">
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={month}>{month.toString().padStart(2, '0')}</option>
              ))}
            </select>

            <select value={filters.year} onChange={(event) => setFilters((prev) => ({ ...prev, year: Number(event.target.value) }))} className="input-base min-w-36">
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select value={filters.unidadeId} onChange={(event) => setFilters((prev) => ({ ...prev, unidadeId: event.target.value }))} className="input-base min-w-48">
              <option value="all">Todas as unidades</option>
              {unidades.map((unidade) => (
                <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total de receitas" value={formatCurrency(totalReceitas)} accent="positive" />
        <StatCard label="Total de despesas" value={formatCurrency(totalDespesas)} accent="negative" />
        <StatCard label="Saldo final" value={formatCurrency(saldo)} accent={saldo >= 0 ? 'positive' : 'negative'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <FinanceCategoryChart title="Receitas por categoria" data={receitasPorCategoria} />
        <FinanceCategoryChart title="Despesas por categoria" data={despesasPorCategoria} />
      </div>

      <SectionCard>
        <h3 className="text-lg font-semibold text-white">Movimentos do período</h3>

        <div className="mt-4 grid gap-3 sm:hidden">
          {transacoes.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{item.data_transacao}</p>
                  <p className="mt-1 font-medium text-white">{item.categoria}</p>
                </div>
                <p className="text-right font-semibold text-white">{formatCurrency(Number(item.valor))}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-full bg-white/8 px-3 py-1">{item.tipo}</span>
                <span className="rounded-full bg-white/8 px-3 py-1">{item.metodo}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 hidden overflow-x-auto sm:block">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3">Data</th>
                <th className="pb-3">Tipo</th>
                <th className="pb-3">Categoria</th>
                <th className="pb-3">Método</th>
                <th className="pb-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transacoes.map((item) => (
                <tr key={item.id} className="border-t border-white/5">
                  <td className="py-3">{item.data_transacao}</td>
                  <td className="py-3">{item.tipo}</td>
                  <td className="py-3">{item.categoria}</td>
                  <td className="py-3">{item.metodo}</td>
                  <td className="py-3 text-right">{formatCurrency(Number(item.valor))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}

function aggregateByCategory(items: Transacao[]) {
  const bucket = new Map<string, number>()

  items.forEach((item) => {
    bucket.set(item.categoria, (bucket.get(item.categoria) ?? 0) + Number(item.valor))
  })

  return Array.from(bucket.entries()).map(([name, value]) => ({ name, value }))
}
