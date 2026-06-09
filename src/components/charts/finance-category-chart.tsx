import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '../../lib/format'
import { SectionCard } from '../common/section-card'

const colors = ['#10b981', '#34d399', '#f59e0b', '#8b5cf6', '#3b82f6', '#f43f5e', '#14b8a6']

interface CategoryDatum {
  name: string
  value: number
}

interface FinanceCategoryChartProps {
  title: string
  data: CategoryDatum[]
}

export function FinanceCategoryChart({ title, data }: FinanceCategoryChartProps) {
  return (
    <SectionCard>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="text-sm text-slate-400">Tempo real</span>
      </div>

      <div className="h-64 sm:h-72 lg:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-300">
        {data.length === 0 ? (
          <p className="text-slate-500">Sem dados para o filtro actual.</p>
        ) : (
          data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                {item.name}
              </div>
              <span>{formatCurrency(item.value)}</span>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  )
}
