import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Unlock, Lock, Clock, CheckCircle, Printer,
  BarChart2, Receipt, X, AlertTriangle, Calendar, Shield
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

// ── STATUT BADGE ──────────────────────────────────────────────────────────────
function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; variant: any }> = {
    paye:      { label: 'Payé',      variant: 'success' },
    en_attente:{ label: 'En attente',variant: 'warning' },
    assurance: { label: 'Assurance', variant: 'info' },
  }
  const cfg = map[statut] || { label: statut, variant: 'neutral' }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE : Gestion session caisse
// ══════════════════════════════════════════════════════════════════════════════
export function GestionCaisse() {
  const { session, isOuverte, refresh } = useCaisse()
  const { hasPermission } = useAuth()
  const [showFermer, setShowFermer] = useState(false)
  const [showRecap, setShowRecap] = useState(false)
  const canGerer = hasPermission('caisse.gerer_session_caisse')

  const ouvrirMut = useMutation({
    mutationFn: () => caisseAPI.ouvrir(),
    onSuccess: () => { toast.success('Caisse ouverte'); refresh() },
    onError: (e: any) => toast.error(e?.response?.data?.erreur || 'Erreur'),
  })

  const { data: recapData, isLoading: recapLoading } = useQuery({
    queryKey: ['recapitulatif'],
    queryFn: () => caisseAPI.recapitulatif().then(r => r.data.data),
    enabled: showRecap,
  })

  return (
    <AppLayout>
      <Topbar title="Caisse" subtitle="Gestion de la session journalière" />
      <div className="p-6 space-y-5">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOuverte ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {isOuverte ? <Unlock size={22} strokeWidth={1.75} /> : <Lock size={22} strokeWidth={1.75} />}
              </div>
              <div>
                <div className="text-base font-black text-ink">Caisse {isOuverte ? 'ouverte' : 'fermée'}</div>
                {isOuverte && session && (
                  <div className="text-sm text-ink-muted mt-0.5">
                    Ouverte par <strong>{session.ouverte_par_nom}</strong> à{' '}
                    {format(new Date(session.ouverte_le), 'HH:mm', { locale: fr })} —{' '}
                    {session.nb_patients} patient(s)
                  </div>
                )}
                {!isOuverte && <div className="text-sm text-ink-faint mt-0.5">Aucune session active aujourd'hui.</div>}
              </div>
            </div>
            {canGerer && (
              <div className="flex gap-2">
                {!isOuverte ? (
                  <Button onClick={() => ouvrirMut.mutate()} loading={ouvrirMut.isPending}>
                    <Unlock size={15} strokeWidth={1.75} />Ouvrir la caisse
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => setShowRecap(true)}>
                      <BarChart2 size={15} strokeWidth={1.75} />Récapitulatif
                    </Button>
                    <Button variant="danger" onClick={() => setShowFermer(true)}>
                      <Lock size={15} strokeWidth={1.75} />Fermer la caisse
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>

        <SessionsRecentes />

        <Modal open={showRecap} onClose={() => setShowRecap(false)} title="Récapitulatif de session" size="xl">
          {recapLoading ? <div className="flex justify-center py-8"><Spinner size={32} /></div>
            : recapData ? <RecapDetail data={recapData} onFermer={() => { setShowRecap(false); setShowFermer(true) }} />
            : null}
        </Modal>

        <Modal open={showFermer} onClose={() => setShowFermer(false)} title="Fermeture de caisse" size="lg">
          <FormFermeture onClose={() => { setShowFermer(false); refresh() }} />
        </Modal>
      </div>
    </AppLayout>
  )
}

function SessionsRecentes() {
  const { data } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => caisseAPI.sessions().then(r => r.data.data),
  })
  return (
    <Card padding={false}>
      <CardHeader title="Sessions récentes" icon={<Calendar size={16} strokeWidth={1.75} />} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 border-b border-surface-100">
            <tr>{['Date','Ouverte par','Montant système','Montant compté','Écart','Statut'].map((h,i) => (
              <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-ink-faint uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {(data||[]).map((s: any) => (
              <tr key={s.id} className="border-b border-surface-50 hover:bg-surface-50">
                <td className="px-5 py-3.5 font-semibold">{s.date_session}</td>
                <td className="px-5 py-3.5 text-ink-muted">{s.ouverte_par_nom}</td>
                <td className="px-5 py-3.5 font-bold">{fmt(s.montant_systeme)}</td>
                <td className="px-5 py-3.5">{s.montant_compte ? fmt(s.montant_compte) : '—'}</td>
                <td className={`px-5 py-3.5 font-bold ${Number(s.ecart)<0?'text-red-600':Number(s.ecart)>0?'text-green-600':'text-ink-faint'}`}>
                  {s.ecart != null ? fmt(s.ecart) : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={s.statut==='validee'?'success':s.statut==='en_attente'?'warning':'neutral'}>
                    {s.statut_display}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data||data.length===0) && <EmptyState icon={<Calendar size={20} strokeWidth={1.5} />} title="Aucune session" />}
      </div>
    </Card>
  )
}

function RecapDetail({ data, onFermer }: { data: any; onFermer: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Receipt size={16} strokeWidth={1.75} />} label="Total" value={fmt(data.montant_systeme)} color="primary" />
        <StatCard icon={<CheckCircle size={16} strokeWidth={1.75} />} label="Patients" value={data.nb_patients||0} color="success" />
        <StatCard icon={<Receipt size={16} strokeWidth={1.75} />} label="Fiches" value={data.nb_fiches||0} color="warning" />
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-2">
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
        Comptez physiquement la caisse avant de fermer.
      </div>
      <Button onClick={onFermer} className="w-full">
        <Lock size={15} strokeWidth={1.75} />Procéder à la fermeture
      </Button>
    </div>
  )
}

const fermerSchema = z.object({
  montant_compte: z.coerce.number().min(0,'Montant invalide'),
  justificatif: z.string().optional(),
})
type FermerForm = z.infer<typeof fermerSchema>

function FormFermeture({ onClose }: { onClose: () => void }) {
  const { data: recap } = useQuery({
    queryKey: ['recapitulatif'],
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
      toast.success('Caisse fermée — en attente de validation comptable')
      onClose()
    } catch (e: any) { toast.error(e?.response?.data?.erreur || 'Erreur') }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {recap && (
        <div className="bg-primary-50 rounded-xl p-4">
          <div className="text-xs font-bold text-primary-700 mb-1">Montant calculé par le système</div>
          <div className="text-2xl font-black text-primary-700">{fmt(recap.montant_systeme)}</div>
        </div>
      )}
      <Input {...register('montant_compte')} label="Montant compté physiquement (FCFA)"
        type="number" placeholder="0" error={errors.montant_compte?.message} />
      {ecart !== null && (
        <div className={`px-4 py-3 rounded-xl text-sm font-bold border
          ${ecart===0?'bg-green-50 text-green-700 border-green-200':ecart>0?'bg-blue-50 text-blue-700 border-blue-200':'bg-red-50 text-red-700 border-red-200'}`}>
          {ecart===0?'Aucun écart':ecart>0?`Excédent : +${fmt(ecart)}`:`Déficit : ${fmt(ecart)}`}
        </div>
      )}
      {ecart !== null && ecart !== 0 && (
        <Textarea {...register('justificatif')} label="Justificatif (obligatoire si écart)"
          placeholder="Expliquez l'écart..." />
      )}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">
          <CheckCircle size={15} strokeWidth={1.75} />Confirmer la fermeture
        </Button>
      </div>
    </form>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE : Fiches de paiement (En attente + Validées)
// ══════════════════════════════════════════════════════════════════════════════
export function FichesPaiement() {
  const { isOuverte } = useCaisse()
  const { hasPermission } = useAuth()
  const [tab, setTab] = useState<'en_attente'|'paye'>('en_attente')
  const [ficheToValidate, setFicheToValidate] = useState<any>(null)
  const [fichePrintee, setFichePrintee] = useState<any>(null)
  const qc = useQueryClient()

  const { data: fiches = [], isLoading } = useQuery({
    queryKey: ['fiches', tab],
    queryFn: () => caisseAPI.fiches.list({ statut: tab === 'paye' ? 'paye' : 'en_attente' }).then(r => r.data.data || r.data),
    refetchInterval: 10000,
  })

  const validateMut = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      caisseAPI.fiches.update(id, { statut: 'paye' }),
    onSuccess: (res, { id }) => {
      toast.success('Paiement validé')
      const fiche = (fiches as any[]).find(f => f.id === id)
      setFicheToValidate(null)
      setFichePrintee(fiche)
      qc.invalidateQueries({ queryKey: ['fiches'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.erreur || 'Erreur'),
  })

  return (
    <AppLayout>
      <Topbar title="Paiements" subtitle="Validation des fiches de paiement" />
      <div className="p-6 space-y-4">

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-100 rounded-xl p-1 w-fit">
          {([['en_attente','En attente'],['paye','Validés']] as const).map(([key,label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${tab===key?'bg-white text-ink shadow-sm':'text-ink-muted hover:text-ink'}`}>
              {label}
            </button>
          ))}
        </div>

        <Card padding={false}>
          <CardHeader
            title={tab === 'en_attente' ? 'Paiements en attente' : 'Paiements validés'}
            icon={<Receipt size={16} strokeWidth={1.75} />}
            subtitle={`${(fiches as any[]).length} fiche(s)`}
          />
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner size={24} /></div>
          ) : (fiches as any[]).length === 0 ? (
            <EmptyState icon={<Receipt size={22} strokeWidth={1.5} />}
              title={tab==='en_attente'?'Aucune fiche en attente':'Aucun paiement validé'} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>{['Patient','Code DDP','Prestation','Service','Montant patient','Assurance','Statut','Date',tab==='en_attente'?'Action':''].map((h,i) => (
                    <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-ink-faint uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(fiches as any[]).map(f => (
                    <tr key={f.id} className="border-b border-surface-50 hover:bg-surface-50">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-ink">{f.patient_nom || '—'}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <code className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded text-xs font-bold">
                          {f.patient_code || '—'}
                        </code>
                      </td>
                      <td className="px-5 py-3.5 text-ink-muted">{f.prestation_nom}</td>
                      <td className="px-5 py-3.5 text-ink-muted">{f.service_nom || '—'}</td>
                      <td className="px-5 py-3.5 font-bold text-ink">{fmt(f.montant_patient)}</td>
                      <td className="px-5 py-3.5 text-ink-muted">{fmt(f.montant_assurance)}</td>
                      <td className="px-5 py-3.5"><StatutBadge statut={f.statut} /></td>
                      <td className="px-5 py-3.5 text-xs text-ink-faint">
                        {format(new Date(f.date_creation),'dd/MM HH:mm')}
                      </td>
                      {tab === 'en_attente' && (
                        <td className="px-5 py-3.5">
                          <Button size="sm" onClick={() => setFicheToValidate(f)} disabled={!isOuverte}>
                            Valider
                          </Button>
                        </td>
                      )}
                      {tab === 'paye' && (
                        <td className="px-5 py-3.5">
                          <button onClick={() => setFichePrintee(f)}
                            className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink transition-colors">
                            <Printer size={13} strokeWidth={1.75} />Reçu
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Modal confirmation paiement */}
        <Modal open={!!ficheToValidate} onClose={() => setFicheToValidate(null)} title="Valider le paiement">
          {ficheToValidate && (
            <div className="space-y-4">
              <div className="bg-surface-50 rounded-xl p-4 text-sm space-y-1">
                <div><span className="text-ink-faint">Patient : </span><strong>{ficheToValidate.patient_nom}</strong></div>
                <div><span className="text-ink-faint">Prestation : </span>{ficheToValidate.prestation_nom}</div>
                <div><span className="text-ink-faint">Service : </span>{ficheToValidate.service_nom || '—'}</div>
                <div className="pt-2 text-base font-black text-ink">
                  Total à encaisser : {fmt(ficheToValidate.montant_patient)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setFicheToValidate(null)}>Annuler</Button>
                <Button className="flex-1" loading={validateMut.isPending}
                  onClick={() => validateMut.mutate({ id: ficheToValidate.id })}>
                  <CheckCircle size={15} strokeWidth={1.75} />Confirmer le paiement
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal reçu d'impression */}
        <Modal open={!!fichePrintee} onClose={() => setFichePrintee(null)} title="Reçu de paiement" size="md">
          {fichePrintee && <RecuPaiement fiche={fichePrintee} onClose={() => setFichePrintee(null)} />}
        </Modal>
      </div>
    </AppLayout>
  )
}

// ── REÇU DE PAIEMENT ──────────────────────────────────────────────────────────
function RecuPaiement({ fiche, onClose }: { fiche: any; onClose: () => void }) {
  return (
    <div className="space-y-4">
      {/* Zone imprimable */}
      <div id="recu-print" className="border border-surface-200 rounded-xl p-5 text-sm print:border-none">
        <div className="text-center mb-4 pb-3 border-b border-surface-100">
          <h2 className="text-base font-black text-ink">Dossier Du Patient — DDP</h2>
          <p className="text-xs text-ink-faint mt-0.5">Reçu de paiement</p>
          <p className="text-xs text-ink-faint">{format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
        </div>

        <div className="space-y-1 mb-4">
          <div className="flex justify-between">
            <span className="text-ink-faint">Patient</span>
            <strong className="text-ink">{fiche.patient_nom}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-faint">Code DDP</span>
            <code className="text-primary-700 font-bold">{fiche.patient_code || '—'}</code>
          </div>
          {fiche.service_nom && (
            <div className="flex justify-between">
              <span className="text-ink-faint">Service</span>
              <span className="font-medium">{fiche.service_nom}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink-faint">Prestation</span>
            <span className="font-medium">{fiche.prestation_nom}</span>
          </div>
        </div>

        <div className="border-t border-surface-100 pt-3 space-y-1">
          <div className="flex justify-between text-ink-muted">
            <span>Prix unitaire</span>
            <span>{fmt(fiche.prix_unitaire)} × {fiche.quantite}</span>
          </div>
          {Number(fiche.montant_assurance) > 0 && (
            <div className="flex justify-between text-ink-muted">
              <span>Prise en charge assurance</span>
              <span>- {fmt(fiche.montant_assurance)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-base text-ink pt-1 border-t border-surface-100">
            <span>Montant payé</span>
            <span>{fmt(fiche.montant_patient)}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-surface-100 flex justify-between text-xs text-ink-faint">
          <span>Statut : Payé</span>
          <span>DDP — {format(new Date(), 'dd/MM/yyyy')}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          <X size={15} strokeWidth={1.75} />Fermer
        </Button>
        <Button className="flex-1" onClick={() => window.print()}>
          <Printer size={15} strokeWidth={1.75} />Imprimer le reçu
        </Button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE : Dashboard Recettes
// ══════════════════════════════════════════════════════════════════════════════
export function DashboardRecettes() {
  const [filters, setFilters] = useState({ date_debut:'', date_fin:'' })
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', filters],
    queryFn: () => caisseAPI.dashboard(
      Object.fromEntries(Object.entries(filters).filter(([,v]) => v))
    ).then(r => r.data.data),
  })

  const { data: versements = [] } = useQuery({
    queryKey: ['versements'],
    queryFn: () => caisseAPI.versements().then(r => r.data.data),
  })

  const qc = useQueryClient()
  const [showValidate, setShowValidate] = useState<string|null>(null)

  return (
    <AppLayout>
      <Topbar title="Tableau de bord — Recettes" subtitle="Analyse et suivi financier" />
      <div className="p-6 space-y-5">
        <Card>
          <div className="flex flex-wrap gap-3 items-end">
            <Input label="Date début" type="date" value={filters.date_debut}
              onChange={e => setFilters(f => ({...f, date_debut: e.target.value}))} />
            <Input label="Date fin" type="date" value={filters.date_fin}
              onChange={e => setFilters(f => ({...f, date_fin: e.target.value}))} />
            <Button variant="ghost" onClick={() => setFilters({date_debut:'',date_fin:''})}>
              Réinitialiser
            </Button>
          </div>
        </Card>

        {isLoading ? <div className="flex justify-center py-8"><Spinner size={28} /></div>
        : data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Receipt size={16} strokeWidth={1.75} />} label="Recettes totales" value={fmt(data.total_recettes)} color="primary" />
            <StatCard icon={<CheckCircle size={16} strokeWidth={1.75} />} label="Part patients" value={fmt(data.total_patient)} color="success" />
            <StatCard icon={<Shield size={16} strokeWidth={1.75} />} label="Part assurances" value={fmt(data.total_assurance)} color="warning" />
            <StatCard icon={<BarChart2 size={16} strokeWidth={1.75} />} label="Patients" value={data.nb_patients} color="primary" />
          </div>
        )}

        {versements.length > 0 && (
          <Card padding={false}>
            <CardHeader title="Versements en attente" icon={<Clock size={16} strokeWidth={1.75} />}
              subtitle={`${versements.length} versement(s)`} />
            <div className="divide-y divide-surface-50">
              {(versements as any[]).map(v => (
                <div key={v.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1">
                    <div className="font-bold text-sm text-ink">{v.ouverte_par_nom}</div>
                    <div className="text-xs text-ink-faint">{v.date_session}</div>
                  </div>
                  <div className="text-right mr-4">
                    <div className="font-black text-sm">{fmt(v.montant_compte||0)}</div>
                    {v.ecart && Number(v.ecart)!==0 && (
                      <div className={`text-xs font-bold ${Number(v.ecart)<0?'text-red-600':'text-green-600'}`}>
                        Écart : {fmt(v.ecart)}
                      </div>
                    )}
                  </div>
                  <Button size="sm" onClick={() => setShowValidate(v.id)}>Valider</Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Modal open={!!showValidate} onClose={() => setShowValidate(null)} title="Valider le versement">
          {showValidate && (
            <ValidationForm sessionId={showValidate}
              session={(versements as any[]).find(v => v.id === showValidate)}
              onClose={() => { setShowValidate(null); qc.invalidateQueries({queryKey:['versements']}); qc.invalidateQueries({queryKey:['dashboard']}) }} />
          )}
        </Modal>
      </div>
    </AppLayout>
  )
}


function ValidationForm({ sessionId, session, onClose }: { sessionId: string; session: any; onClose: () => void }) {
  const [montantRecu, setMontantRecu] = useState(session?.montant_compte||'')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const onSubmit = async () => {
    setLoading(true)
    try {
      await caisseAPI.validerVersement(sessionId, { montant_recu: Number(montantRecu), note })
      toast.success('Versement validé')
      onClose()
    } catch (e: any) { toast.error(e?.response?.data?.erreur||'Erreur') }
    finally { setLoading(false) }
  }
  return (
    <div className="space-y-4">
      {session && (
        <div className="bg-amber-50 rounded-xl p-4 text-sm">
          <div className="font-bold text-amber-900">{session.ouverte_par_nom} — {session.date_session}</div>
          <div className="text-amber-700 mt-1">Montant déclaré : <strong>{fmt(session.montant_compte||0)}</strong></div>
        </div>
      )}
      <Input label="Montant reçu (FCFA)" type="number" value={montantRecu} onChange={e => setMontantRecu(e.target.value)} />
      <Textarea label="Note" value={note} onChange={e => setNote(e.target.value)} />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
        <Button className="flex-1" loading={loading} onClick={onSubmit}>
          <CheckCircle size={15} strokeWidth={1.75} />Confirmer
        </Button>
      </div>
    </div>
  )
}
