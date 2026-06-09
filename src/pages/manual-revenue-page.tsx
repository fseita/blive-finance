import { PageHeader } from '../components/common/page-header'
import { SectionCard } from '../components/common/section-card'
import { RevenueForm } from '../components/forms/revenue-form'

export function ManualRevenuePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registo manual"
        title="Receitas"
        description="Lança movimentos de entrada que não vieram de uma integração automática e reflecte-os logo no dashboard mensal."
      />

      <SectionCard>
        <RevenueForm />
      </SectionCard>
    </div>
  )
}
