import { zodResolver } from '@hookform/resolvers/zod'
import { Paperclip, SendHorizonal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { isMockMode } from '../../lib/app-mode'
import { createPedidoPagamento, listUnidades } from '../../lib/data'
import type { Unidade } from '../../types/database'

const schema = z.object({
  unidade_id: z.string().min(1, 'Escolhe a unidade'),
  nome_submissor: z.string().min(2, 'Indica o teu nome'),
  iban: z.string().min(15, 'Indica um IBAN válido'),
  valor: z.coerce.number().positive('O valor tem de ser superior a zero'),
  data_limite: z.string().min(1, 'Escolhe a data limite'),
  descricao: z.string().min(5, 'Descreve a despesa'),
  ficheiro: z
    .any()
    .refine((files) => files?.length === 1, 'Anexa um PDF ou imagem'),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function PublicPaymentForm() {
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    listUnidades().then(setUnidades)
  }, [])

  const selectedFile = watch('ficheiro')?.[0] as File | undefined

  const onSubmit = handleSubmit(async (values) => {
    const file = values.ficheiro?.[0] as File | undefined

    if (!file) {
      toast.error('Anexa um PDF ou imagem.')
      return
    }

    setSubmitting(true)

    try {
      await createPedidoPagamento({
        unidade_id: values.unidade_id,
        nome_submissor: values.nome_submissor,
        iban: values.iban,
        valor: values.valor,
        data_limite: values.data_limite,
        descricao: values.descricao,
        ficheiro_url: isMockMode ? '#mock-file' : '',
      }, file)

      toast.success('Pedido submetido com sucesso.')
      reset()
    } catch {
      toast.error('Não foi possível submeter o pedido.')
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="Unidade" required error={errors.unidade_id?.message}>
          <select {...register('unidade_id')} className="input-base" required aria-required="true">
            <option value="">Selecciona uma unidade</option>
            {unidades.map((unidade) => (
              <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
            ))}
          </select>
        </Field>
        <Field label="Nome do submissor" required error={errors.nome_submissor?.message}>
          <input {...register('nome_submissor')} className="input-base" placeholder="Nome completo" required aria-required="true" />
        </Field>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Field label="IBAN" required error={errors.iban?.message}>
            <input {...register('iban')} className="input-base" placeholder="PT50..." required aria-required="true" />
          </Field>
        </div>
        <div className="lg:col-span-3">
          <Field label="Valor (€)" required error={errors.valor?.message}>
            <input type="number" step="0.01" {...register('valor')} className="input-base" placeholder="0,00" required aria-required="true" />
          </Field>
        </div>
        <div className="lg:col-span-3">
          <Field label="Data limite" required error={errors.data_limite?.message}>
            <input type="date" {...register('data_limite')} className="input-base" required aria-required="true" />
          </Field>
        </div>
      </div>

      <Field label="Descrição" required error={errors.descricao?.message}>
        <textarea {...register('descricao')} className="input-base min-h-32" placeholder="Explica a despesa e o contexto." required aria-required="true" />
      </Field>

      <label className="block rounded-[1.75rem] border border-dashed border-white/15 bg-slate-900/55 p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-200"><Paperclip size={16} /> Ficheiro (PDF ou imagem) <span className="text-rose-300">*</span></span>
            <p className="text-sm text-slate-500">1 ficheiro por pedido. Idealmente factura, recibo ou comprovativo.</p>
          </div>
          {selectedFile ? <span className="max-w-full truncate rounded-full bg-[#9FB941]/15 px-3 py-1 text-xs text-[#9FB941] md:max-w-56">{selectedFile.name}</span> : null}
        </div>
        <input
          type="file"
          accept="application/pdf,image/*"
          {...register('ficheiro')}
          required
          aria-required="true"
          className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-[#9FB941] file:px-4 file:py-2 file:font-medium file:text-slate-950"
        />
        {errors.ficheiro?.message ? <span className="mt-2 block text-sm text-rose-300">{String(errors.ficheiro.message)}</span> : null}
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#9FB941] px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-[#b2cc54] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:text-base"
      >
        <SendHorizonal size={18} />
        {submitting ? 'A submeter...' : 'Submeter pedido'}
      </button>
    </form>
  )
}

function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label} {required ? <span className="text-rose-300">*</span> : null}
      </span>
      {children}
      {error ? <span className="mt-2 block text-sm text-rose-300">{error}</span> : null}
    </label>
  )
}
