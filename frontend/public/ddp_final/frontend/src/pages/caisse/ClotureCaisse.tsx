import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, addHours } from 'date-fns'
import { fr } from 'date-fns/locale'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  Unlock, Lock, CheckCircle, Printer,
  Calendar, CheckSquare, Receipt, User,
  FileText, TrendingUp, Clock
} from 'lucide-react'
import { caisseAPI } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
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
      toast.error(e?.response?.data?.erreur || "Erreur lors de l'ouverture")
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
          <label className="text-xs font-semibold text-ink-muted">Heure de fermeture prévue (modifiable)</label>
          <input type="datetime-local" value={heureFin} onChange={e => setHeureFin(e.target.value)}
            className="h-11 px-3 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium text-ink outline-none focus:border-primary-600" />
          <p className="text-xs text-ink-faint">Par défaut : 8 heures après l'ouverture.</p>
        </div>
        <Button onClick={handleOuvrir} loading={loading} size="lg" className="w-full">
          <Unlock size={16} strokeWidth={1.75} />Ouvrir ma caisse
        </Button>
      </div>
    </Card>
  )
}

// ── FORMULAIRE FERMETURE (pour sa propre session OU celle d'un autre) ─────────
const fermerSchema = z.object({
  montant_compte: z.coerce.number().min(0, 'Montant invalide'),
  justificatif: z.string().optional(),
})
type FermerForm = z.infer<typeof fermerSchema>

function FormBilanJournalier({ sessionId, onClose }: { sessionId?: string; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: recap } = useQuery({
    queryKey: ['recap-session', sessionId],
    queryFn: () =>
      sessionId
        ? caisseAPI.recapitulatifSession(sessionId).then((r: any) => r.data.data)
        : caisseAPI.recapitulatif().then((r: any) => r.data.data),
  })
  const { register, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm<FermerForm>({
    resolver: zodResolver(fermerSchema),
  })
  const montantCompte = watch('montant_compte')
  const montantSys = recap ? Number(recap.montant_systeme) : 0
  const ecart = montantCompte !== undefined ? Number(montantCompte) - montantSys : null

  const onSubmit = async (values: FermerForm) => {
    try {
      const body: any = { montant_compte: values.montant_compte, justificatif: values.justificatif }
      if (sessionId) body.session_id = sessionId
      await caisseAPI.fermer(body)
      toast.success('Bilan soumis')
      qc.invalidateQueries({ queryKey: ['toutes-sessions'] })
      qc.invalidateQueries({ queryKey: ['recap-session'] })
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
          <CheckCircle size={15} strokeWidth={1.75} />Soumettre le bilan
        </Button>
      </div>
    </form>
  )
}

// ── CARTE SESSION (pour l'admin) ──────────────────────────────────────────────
function SessionCard({ session, onFermer }: { session: any; onFermer: (s: any) => void }) {
  const ouverteLe = session.ouverte_le ? format(new Date(session.ouverte_le), 'HH:mm', { locale: fr }) : '—'
  const finPrevue = session.heure_fin_prevue ? format(new Date(session.heure_fin_prevue), 'HH:mm', { locale: fr }) : '—'
  const initiales = (session.ouverte_par_nom || '??').split(' ').map((w: string) => w[0]).join('').slice(0, 2)

  return (
    <div className="bg-white border border-surface-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-black text-sm flex-shrink-0">
          {initiales}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-ink text-sm truncate">{session.ouverte_par_nom}</div>
          <div className="text-xs text-ink-faint">Session du {session.date_session}</div>
        </div>
        <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0 animate-pulse" title="En cours" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-surface-50 rounded-lg px-3 py-2">
          <div className="text-ink-faint">Ouverture</div>
          <div className="font-bold text-ink flex items-center gap-1"><Clock size={11} />{ouverteLe}</div>
        </div>
        <div className="bg-surface-50 rounded-lg px-3 py-2">
          <div className="text-ink-faint">Fin prévue</div>
          <div className="font-bold text-ink flex items-center gap-1"><Clock size={11} />{finPrevue}</div>
        </div>
      </div>

      <div className="bg-primary-50 rounded-lg px-3 py-2 text-center">
        <div className="text-[10px] text-primary-600 font-semibold">Total encaissé</div>
        <div className="text-lg font-black text-primary-700">{fmt(session.montant_systeme || 0)}</div>
      </div>

      <Button size="sm" variant="danger" className="w-full" onClick={() => onFermer(session)}>
        <Lock size={13} strokeWidth={1.75} />Clôturer cette caisse
      </Button>
    </div>
  )
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────────────────────
export default function ClotureCaisse() {
  const { hasPermission } = useAuth()
  const { session, isOuverte, refresh } = useCaisse()
  const isAdmin = hasPermission('caisse.voir_rapports')
  const qc = useQueryClient()

  const [showFermer, setShowFermer] = useState(false)
  const [sessionToClose, setSessionToClose] = useState<any>(null)
  const [moisFiltre, setMoisFiltre] = useState(format(new Date(), 'yyyy-MM'))

  // Admin : toutes les sessions ouvertes
  const { data: toutesSessionsData, isLoading: loadingAll } = useQuery({
    queryKey: ['toutes-sessions'],
    queryFn: () => caisseAPI.statutAll().then((r: any) => r.data.toutes_sessions || []),
    enabled: isAdmin,
    refetchInterval: 30000,
  })
  const toutesSessionsOuvertes = (toutesSessionsData || []) as any[]

  const { data: recap } = useQuery({
    queryKey: ['recap-session'],
    queryFn: () => caisseAPI.recapitulatif().then((r: any) => r.data.data),
    enabled: isOuverte,
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ['mes-sessions', moisFiltre],
    queryFn: () => caisseAPI.sessions({
      date_debut: moisFiltre + '-01',
      date_fin: moisFiltre + '-31',
    }).then((r: any) => r.data.data),
  })

  const handleFermerAutre = (s: any) => {
    setSessionToClose(s)
    setShowFermer(true)
  }

  const handleFermerMoi = () => {
    setSessionToClose(null)
    setShowFermer(true)
  }

  return (
    <AppLayout>
      <Topbar title="Clôture de caisse" subtitle="Bilan journalier et gestion des sessions" />
      <div className="p-4 md:p-6 max-w-5xl space-y-4 md:space-y-5">

        {/* ── ADMIN : toutes les caisses ouvertes ── */}
        {isAdmin && (
          <Card padding={false}>
            <CardHeader title="Sessions ouvertes" icon={<Unlock size={16} strokeWidth={1.75} />}
              subtitle={`${toutesSessionsOuvertes.length} caisse(s) active(s)`} />
            <div className="p-4">
              {loadingAll ? (
                <div className="flex justify-center py-6"><Spinner size={24} /></div>
              ) : toutesSessionsOuvertes.length === 0 ? (
                <div className="text-center py-8 text-sm text-ink-faint">Aucune caisse ouverte en ce moment.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {toutesSessionsOuvertes.map((s: any) => (
                    <SessionCard key={s.id} session={s} onFermer={handleFermerAutre} />
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ── MA SESSION ── */}
        {!isOuverte ? (
          <FormulaireOuverture onSuccess={() => { refresh(); qc.invalidateQueries({ queryKey: ['toutes-sessions'] }) }} />
        ) : (
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <Unlock size={22} strokeWidth={1.75} />
                </div>
                <div>
                  <div className="font-black text-ink">Ma caisse est ouverte</div>
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
              <Button variant="danger" onClick={handleFermerMoi}>
                <Lock size={15} strokeWidth={1.75} />Soumettre mon bilan
              </Button>
            </div>
          </Card>
        )}

        {/* Résumé session en cours */}
        {isOuverte && recap && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <StatCard icon={<Receipt size={16} strokeWidth={1.75} />} label="Patients" value={recap.nb_patients || 0} color="primary" />
            <StatCard icon={<CheckSquare size={16} strokeWidth={1.75} />} label="Fiches" value={recap.nb_fiches || 0} color="success" />
            <StatCard icon={<TrendingUp size={16} strokeWidth={1.75} />} label="Total" value={fmt(recap.montant_systeme || 0)} color="primary" />
          </div>
        )}

        {/* Historique mensuel */}
        <Card padding={false}>
          <CardHeader title="Historique des sessions" icon={<Calendar size={16} strokeWidth={1.75} />}
            action={
              <div className="flex items-center gap-2">
                <input type="month" value={moisFiltre} onChange={e => setMoisFiltre(e.target.value)}
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
                  <tr>{['Date','Caissière','Ouverture','Fin prévue','Système','Soumis','Écart','Statut'].map((h,i) => (
                    <th key={i} className="px-4 py-3 text-left text-[10.5px] font-bold text-ink-faint uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(sessions as any[]).map((s: any) => (
                    <tr key={s.id} className="border-b border-surface-50 hover:bg-surface-50">
                      <td className="px-4 py-3.5 font-semibold">{s.date_session}</td>
                      <td className="px-4 py-3.5">{s.ouverte_par_nom || '—'}</td>
                      <td className="px-4 py-3.5 text-ink-muted">{s.ouverte_le ? format(new Date(s.ouverte_le), 'HH:mm') : '—'}</td>
                      <td className="px-4 py-3.5 text-ink-muted">{s.heure_fin_prevue ? format(new Date(s.heure_fin_prevue), 'HH:mm') : '—'}</td>
                      <td className="px-4 py-3.5 font-bold">{fmt(s.montant_systeme)}</td>
                      <td className="px-4 py-3.5">{s.montant_compte ? fmt(s.montant_compte) : '—'}</td>
                      <td className={`px-4 py-3.5 font-bold ${Number(s.ecart) < 0 ? 'text-red-600' : Number(s.ecart) > 0 ? 'text-green-600' : 'text-ink-faint'}`}>
                        {s.ecart != null ? fmt(s.ecart) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
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

      <Modal open={showFermer} onClose={() => { setShowFermer(false); setSessionToClose(null) }}
        title={sessionToClose ? `Clôturer la caisse de ${sessionToClose.ouverte_par_nom}` : 'Soumettre mon bilan journalier'}
        size="lg">
        <FormBilanJournalier
          sessionId={sessionToClose?.id}
          onClose={() => { setShowFermer(false); setSessionToClose(null); refresh() }}
        />
      </Modal>
    </AppLayout>
  )
}
