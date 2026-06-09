import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeEuro } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { createReceita, listUnidades } from '../../lib/data'
import type { Unidade } from '../../types/database'

const revenueMethods = ['Débito direto', 'Multibanco', 'Eupago', 'Transferência', 'Dinheiro']
const revenueCategories = ['Mensalidades', 'Aulas Avulso', 'Merchandising', 'Eventos']

const schema = z.object({
  unidade_id: z.string().min(1, 'Escolhe a unidade'),
  data_transacao: z.string().min(1, 'Escolhe a data'),
  valor: z.coerce.number().positive('Indica um valor válido'),
  metodo: z.string().min(1, 'Escolhe o método'),
  categoria: z.string().min(1, 'Escolhe a categoria'),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function RevenueForm() {
  const [unidades, setUnidades] = useState<Unidade[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      data_transacao: new Date().toISOString().slice(0, 10),
      metodo: revenueMethods[0],
      categoria: revenueCategories[0],
    },
  })

  useEffect(() => {
    listUnidades().then(setUnidades)
  }, [])

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createReceita({
        unidade_id: values.unidade_id,
        data_transacao: values.data_transacao,
        valor: values.valor,
        metodo: values.metodo,
        categoria: values.categoria,
      })

      toast.success('Receita registada com sucesso.')
      reset({
        data_transacao: new Date().toISOString().slice(0, 10),
        metodo: revenueMethods[0],
        categoria: revenueCategories[0],
        unidade_id: '',
        valor: 0,
      })
    } catch {
      toast.error('Não foi possível registar a receita.')
    }
  })

  return (
    <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2">
      <Field label="Unidade" error={errors.unidade_id?.message}>
        <select {...register('unidade_id')} className="input-base text-sm sm:text-base">
          <option value="">Selecciona uma unidade</option>
          {unidades.map((unidade) => (
            <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
          ))}
        </select>
      </Field>

      <Field label="Data" error={errors.data_transacao?.message}>
        <input type="date" {...register('data_transacao')} className="input-base min-w-0 appearance-none text-sm sm:text-base" />
      </Field>

      <Field label="Valor (€)" error={errors.valor?.message}>
        <input type="number" step="0.01" {...register('valor')} className="input-base text-sm sm:text-base" />
      </Field>

      <Field label="Método de pagamento" error={errors.metodo?.message}>
        <select {...register('metodo')} className="input-base text-sm sm:text-base">
          {revenueMethods.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </Field>

      <div className="md:col-span-2">
        <Field label="Categoria de receita" error={errors.categoria?.message}>
          <select {...register('categoria')} className="input-base text-sm sm:text-base">
            {revenueCategories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="md:col-span-2 flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
        <div>
          <p className="text-white">Receita operacional</p>
          <p>Este registo entra directamente na visão mensal do dashboard.</p>
        </div>
        <BadgeEuro className="text-[#9FB941]" size={22} />
      </div>

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-[#9FB941] px-5 py-4 font-semibold text-slate-950 transition hover:bg-[#b2cc54] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? 'A guardar...' : 'Registar receita'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-sm text-rose-300">{error}</span> : null}
    </label>
  )
}
