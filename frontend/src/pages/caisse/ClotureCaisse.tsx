import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format, addHours } from 'date-fns'
import { fr } from 'date-fns/locale'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  Unlock, Lock, CheckCircle, Printer,
  Calendar, BarChart2, CheckSquare, Receipt,
  FileText, TrendingUp, AlertCircle
} from 'lucide-react'
import { caisseAPI } from '@/services/api'
import { useCaisse } from '@/context/CaisseContext'
import { AppLayout, Topbar } from '@/components/layout/AppLayout'
import {
  Button, Card, CardHeader, Input, Textarea,
  Badge, Modal, StatCard, EmptyState, Spinner
} from '@/components/ui'

const fmt = (v: string | number) => Number(v).toLocaleString('fr-FR') + ' FCFA'

// ── FORMULAIRE OUVERTURE ──────────────────────────────────────────────────────
function FormulaireOuverture({ onSuccess }: { onSuccess: () => void }) {
  const now = new Date()
  const defaultFin = format(addHours(now, 8), "yyyy-MM-dd'T'HH:mm")

  const [heureFin, setHeureFin] = useState(defaultFin)
  const [loading, setLoading] = useState(false)

  const handleOuvrir = async () => {
    setLoading(true)
    try {
      await caisseAPI.ouvrir({ heure_fin_prevue: heureFin || undefined })
      toast.success('Caisse ouverte')
      onSuccess()
    } catch (e: any) {
      toast.error(e?.response?.data?.erreur || 'Erreur lors de l\'ouverture')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Ouvrir ma caisse" icon={<Unlock size={16} strokeWidth={1.75} />} />
      <div className="space-y-4">
        <div className="bg-surface-50 rounded-xl p-4 text-sm text-ink-muted">
          Heure d'ouverture : <strong className="text-ink">{format(now, 'HH:mm', { locale: fr })}</strong>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ink-muted">
            Heure de fermeture prévue (modifiable)
          </label>
          <input
            type="datetime-local"
            value={heureFin}
            onChange={e => setHeureFin(e.target.value)}
            className="h-11 px-3 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium text-ink outline-none focus:border-primary-600 focus:bg-white focus:ring-2 focus:ring-primary-50"
          />
          <p className="text-xs text-ink-faint">Par défaut : 8 heures après l'ouverture.</p>
        </div>
        <Button onClick={handleOuvrir} loading={loading} size="lg" className="w-full">
          <Unlock size={16} strokeWidth={1.75} />
          Ouvrir ma caisse
        </Button>
      </div>
    </Card>
  )
}

// ── FORMULAIRE FERMETURE ──────────────────────────────────────────────────────
const fermerSchema = z.object({
  montant_compte: z.coerce.number().min(0, 'Montant invalide'),
  justificatif: z.string().optional(),
})
type FermerForm = z.infer<typeof fermerSchema>

function FormBilanJournalier({ onClose }: { onClose: () => void }) {
  const { data: recap } = useQuery({
    queryKey: ['recap-session'],
    queryFn: () => caisseAPI.recapitulatif().then(r => r.data.data),
  })
  const { register, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm<FermerForm>({
    resolver: zodResolver(fermerSchema),
  })
  const montantCompte = watch('montant_compte')
  const montantSys = recap ? Number(recap.montant_systeme) : 0
  const ecart = montantCompte !== undefined ? Number(montantCompte) - montantSys : null

  const onSubmit = async (values: FermerForm) => {
    try {
      await caisseAPI.fermer({ montant_compte: values.montant_compte, justificatif: values.justificatif })
      toast.success('Bilan soumis au responsable')
      onClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.erreur || 'Erreur')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {recap && (
        <div className="bg-primary-50 rounded-xl p-4">
          <div className="text-xs font-bold text-primary-700 mb-1">Montant calculé par le système</div>
          <div className="text-2xl font-black text-primary-700">{fmt(recap.montant_systeme)}</div>
          <div className="text-xs text-primary-600 mt-1">{recap.nb_patients} patients · {recap.nb_fiches} fiches</div>
        </div>
      )}
      <Input {...register('montant_compte')} label="Montant compté physiquement (FCFA)"
        type="number" placeholder="0" error={errors.montant_compte?.message} />
      {ecart !== null && (
        <div className={`px-4 py-3 rounded-xl text-sm font-bold border
          ${ecart === 0 ? 'bg-green-50 text-green-700 border-green-200'
            : ecart > 0 ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-red-50 text-red-700 border-red-200'}`}>
          {ecart === 0 ? 'Aucun écart' : ecart > 0 ? `Excédent : +${fmt(ecart)}` : `Déficit : ${fmt(ecart)}`}
        </div>
      )}
      {ecart !== null && ecart !== 0 && (
        <Textarea {...register('justificatif')} label="Justificatif (requis si écart)"
          placeholder="Expliquez l'écart constaté..." />
      )}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">
          <CheckCircle size={15} strokeWidth={1.75} />Soumettre mon bilan
        </Button>
      </div>
    </form>
  )
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────────────────────
export default function ClotureCaisse() {
  const { session, isOuverte, refresh } = useCaisse()
  const [showFermer, setShowFermer] = useState(false)
  const [moisFiltre, setMoisFiltre] = useState(format(new Date(), 'yyyy-MM'))

  const { data: recap } = useQuery({
    queryKey: ['recap-session'],
    queryFn: () => caisseAPI.recapitulatif().then(r => r.data.data),
    enabled: isOuverte,
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ['mes-sessions', moisFiltre],
    queryFn: () => caisseAPI.sessions({
      date_debut: moisFiltre + '-01',
      date_fin: moisFiltre + '-31',
    }).then(r => r.data.data),
  })

  return (
    <AppLayout>
      <Topbar title="Clôture de caisse" subtitle="Bilan journalier et rapport mensuel" />
      <div className="p-6 max-w-3xl space-y-5">

        {/* Statut session */}
        {!isOuverte ? (
          <FormulaireOuverture onSuccess={() => refresh()} />
        ) : (
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <Unlock size={22} strokeWidth={1.75} />
                </div>
                <div>
                  <div className="font-black text-ink">Caisse ouverte</div>
                  {session && (
                    <div className="text-sm text-ink-muted mt-0.5">
                      Depuis {format(new Date(session.ouverte_le), 'HH:mm', { locale: fr })}
                      {session.heure_fin_prevue && (
                        <> · Fermeture prévue à {format(new Date(session.heure_fin_prevue), 'HH:mm', { locale: fr })}</>
                      )}
                      {recap && <> · {fmt(recap.montant_systeme)} encaissés</>}
                    </div>
                  )}
                </div>
              </div>
              <Button variant="danger" onClick={() => setShowFermer(true)}>
                <Lock size={15} strokeWidth={1.75} />Soumettre mon bilan
              </Button>
            </div>
          </Card>
        )}

        {/* Résumé session en cours */}
        {isOuverte && recap && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={<Receipt size={16} strokeWidth={1.75} />} label="Patients" value={recap.nb_patients || 0} color="primary" />
            <StatCard icon={<CheckSquare size={16} strokeWidth={1.75} />} label="Fiches" value={recap.nb_fiches || 0} color="success" />
            <StatCard icon={<TrendingUp size={16} strokeWidth={1.75} />} label="Total" value={fmt(recap.montant_systeme || 0)} color="primary" />
          </div>
        )}

        {/* Historique mensuel */}
        <Card padding={false}>
          <CardHeader
            title="Mes bilans du mois"
            icon={<Calendar size={16} strokeWidth={1.75} />}
            action={
              <div className="flex items-center gap-2">
                <input type="month" value={moisFiltre}
                  onChange={e => setMoisFiltre(e.target.value)}
                  className="h-8 px-2.5 text-xs border border-surface-200 rounded-lg bg-surface-50 outline-none focus:border-primary-600" />
                <Button size="sm" variant="secondary" onClick={() => window.print()}>
                  <Printer size={13} strokeWidth={1.75} />Imprimer
                </Button>
              </div>
            }
          />
          {(sessions as any[]).length === 0 ? (
            <EmptyState icon={<FileText size={22} strokeWidth={1.5} />} title="Aucun bilan ce mois" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>{['Date','Ouverture','Fermeture prévue','Système','Soumis','Écart','Statut'].map((h,i) => (
                    <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-ink-faint uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(sessions as any[]).map(s => (
                    <tr key={s.id} className="border-b border-surface-50 hover:bg-surface-50">
                      <td className="px-5 py-3.5 font-semibold">{s.date_session}</td>
                      <td className="px-5 py-3.5 text-ink-muted">{s.ouverte_le ? format(new Date(s.ouverte_le), 'HH:mm') : '—'}</td>
                      <td className="px-5 py-3.5 text-ink-muted">{s.heure_fin_prevue ? format(new Date(s.heure_fin_prevue), 'HH:mm') : '—'}</td>
                      <td className="px-5 py-3.5 font-bold">{fmt(s.montant_systeme)}</td>
                      <td className="px-5 py-3.5">{s.montant_compte ? fmt(s.montant_compte) : '—'}</td>
                      <td className={`px-5 py-3.5 font-bold ${Number(s.ecart) < 0 ? 'text-red-600' : Number(s.ecart) > 0 ? 'text-green-600' : 'text-ink-faint'}`}>
                        {s.ecart != null ? fmt(s.ecart) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={s.statut === 'validee' ? 'success' : s.statut === 'en_attente' ? 'warning' : 'neutral'}>
                          {s.statut_display}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal open={showFermer} onClose={() => setShowFermer(false)} title="Soumettre mon bilan journalier" size="lg">
        <FormBilanJournalier onClose={() => { setShowFermer(false); refresh() }} />
      </Modal>
    </AppLayout>
  )
}
