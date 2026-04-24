import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Receipt, Shield, ChevronRight } from 'lucide-react'
import { caisseAPI } from '@/services/api'
import { AppLayout, Topbar } from '@/components/layout/AppLayout'
import { Card, CardHeader, Badge, EmptyState, Spinner } from '@/components/ui'

const fmt = (v: string | number) => Number(v).toLocaleString('fr-FR') + ' FCFA'

export default function BureauFiches() {
  const navigate = useNavigate()

  const { data: fiches = [], isLoading } = useQuery({
    queryKey: ['bureau-fiches'],
    queryFn: () => caisseAPI.fiches.list({ statut: 'en_attente' }).then(r => r.data.data || r.data),
    refetchInterval: 15000,
  })

  return (
    <AppLayout>
      <Topbar title="Fiches de paiement" subtitle="Fiches créées — en attente de paiement en caisse" />
      <div className="p-6">
        <Card padding={false}>
          <CardHeader title="Fiches en attente" icon={<Receipt size={16} strokeWidth={1.75} />}
            subtitle={`${(fiches as any[]).length} fiche(s) en attente`} />
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner size={24} /></div>
          ) : (fiches as any[]).length === 0 ? (
            <EmptyState icon={<Receipt size={22} strokeWidth={1.5} />}
              title="Aucune fiche en attente"
              description="Les fiches apparaissent ici après enregistrement du patient." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>{['Patient','N° Dossier','Prestation','Service','Montant','Assurance','Créée le'].map((h,i) => (
                    <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-ink-faint uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(fiches as any[]).map(f => (
                    <tr key={f.id} className="border-b border-surface-50 hover:bg-surface-50">
                      <td className="px-5 py-3.5 font-bold text-ink">{f.patient_nom || '—'}</td>
                      <td className="px-5 py-3.5">
                        <code className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded text-xs font-bold cursor-pointer"
                          onClick={() => navigate(`/bureau/patients/${f.patient}`)}>
                          {f.patient_code || '—'}
                        </code>
                      </td>
                      <td className="px-5 py-3.5 text-ink-muted">{f.prestation_nom}</td>
                      <td className="px-5 py-3.5 text-ink-muted">{f.service_nom || '—'}</td>
                      <td className="px-5 py-3.5 font-bold">{fmt(f.montant_total)}</td>
                      <td className="px-5 py-3.5">
                        {Number(f.montant_assurance) > 0
                          ? <Badge variant="info"><Shield size={10} />{fmt(f.montant_assurance)}</Badge>
                          : <Badge variant="neutral">—</Badge>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-ink-faint">
                        {format(new Date(f.date_creation), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
