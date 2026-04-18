import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, addHours } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  ClipboardList, CheckCircle, Printer, X,
  Unlock, AlertCircle
} from 'lucide-react'
import { caisseAPI } from '@/services/api'
import TicketRecu from '@/components/TicketRecu'
import { useCaisse } from '@/context/CaisseContext'
import { AppLayout, Topbar } from '@/components/layout/AppLayout'
import { Button, Card, CardHeader, Modal, Badge, EmptyState, Spinner } from '@/components/ui'

const fmt = (v: string | number) => Number(v).toLocaleString('fr-FR') + ' FCFA'

// ── BANNER CAISSE FERMÉE ──────────────────────────────────────────────────────
function CaisseFermeeBanner({ onOuvert }: { onOuvert: () => void }) {
  const [showOuvrir, setShowOuvrir] = useState(false)
  const [heureFin, setHeureFin] = useState(
    format(addHours(new Date(), 8), "yyyy-MM-dd'T'HH:mm")
  )
  const [loading, setLoading] = useState(false)
  const { refresh } = useCaisse()

  const handleOuvrir = async () => {
    setLoading(true)
    try {
      await caisseAPI.ouvrir({ heure_fin_prevue: heureFin || undefined })
      toast.success('Caisse ouverte — vous pouvez maintenant valider')
      await refresh()
      setShowOuvrir(false)
      onOuvert()
    } catch (e: any) {
      toast.error(e?.response?.data?.erreur || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
        <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-bold text-amber-900">Votre caisse est fermée</div>
          <div className="text-xs text-amber-700 mt-0.5">Vous pouvez voir les fiches mais pas les valider.</div>
        </div>
        <Button size="sm" onClick={() => setShowOuvrir(true)}>
          <Unlock size={14} strokeWidth={1.75} />Ouvrir ma caisse
        </Button>
      </div>

      {showOuvrir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowOuvrir(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-ink">Ouvrir ma caisse</h3>
              <button onClick={() => setShowOuvrir(false)} className="p-1.5 rounded-lg text-ink-faint hover:bg-surface-100">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink-muted">Heure de fermeture prévue</label>
                <input type="datetime-local" value={heureFin} onChange={e => setHeureFin(e.target.value)}
                  className="h-11 px-3 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium outline-none focus:border-primary-600" />
              </div>
              <Button onClick={handleOuvrir} loading={loading} className="w-full">
                <Unlock size={15} strokeWidth={1.75} />Ouvrir et valider
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── REÇU ──────────────────────────────────────────────────────────────────────
function RecuPaiement({ fiche, onClose }: { fiche: any; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="border border-surface-200 rounded-xl p-5 text-sm">
        <div className="text-center mb-4 pb-3 border-b border-surface-100">
          <h2 className="text-base font-black text-ink">Dossier Du Patient — DDP</h2>
          <p className="text-xs text-ink-faint">Reçu de paiement · {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: fr })}</p>
        </div>
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between"><span className="text-ink-faint">Patient</span><strong>{fiche.patient_nom}</strong></div>
          <div className="flex justify-between"><span className="text-ink-faint">Code DDP</span><code className="text-primary-700 font-bold">{fiche.patient_code || '—'}</code></div>
          {fiche.service_nom && <div className="flex justify-between"><span className="text-ink-faint">Service</span><span className="font-medium">{fiche.service_nom}</span></div>}
          <div className="flex justify-between"><span className="text-ink-faint">Prestation</span><span className="font-medium">{fiche.prestation_nom}</span></div>
        </div>
        <div className="border-t border-surface-100 pt-3 space-y-1">
          <div className="flex justify-between text-ink-muted"><span>Prix</span><span>{fmt(fiche.prix_unitaire)} × {fiche.quantite}</span></div>
          {Number(fiche.montant_assurance) > 0 && (
            <div className="flex justify-between text-ink-muted"><span>Assurance</span><span>- {fmt(fiche.montant_assurance)}</span></div>
          )}
          <div className="flex justify-between font-black text-base text-ink pt-1 border-t border-surface-100">
            <span>Montant payé</span><span>{fmt(fiche.montant_patient)}</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-surface-100 flex justify-between text-xs text-ink-faint">
          <span>Statut : Payé</span><span>DDP — {format(new Date(), 'dd/MM/yyyy')}</span>
        </div>
      </div>
      <div className="flex gap-2 no-print">
        <Button variant="secondary" className="flex-1" onClick={onClose}><X size={15} strokeWidth={1.75} />Fermer</Button>
        <Button className="flex-1" onClick={() => window.print()}><Printer size={15} strokeWidth={1.75} />Imprimer</Button>
      </div>
    </div>
  )
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────────────────────
export default function PaiementsEnAttente() {
  const { isOuverte } = useCaisse()
  const [ficheToValidate, setFicheToValidate] = useState<any>(null)
  const [fichePrintee, setFichePrintee] = useState<any>(null)
  const qc = useQueryClient()

  const { data: fiches = [], isLoading, refetch } = useQuery({
    queryKey: ['fiches-en-attente'],
    queryFn: () => caisseAPI.fiches.list({ statut: 'en_attente' }).then(r => r.data.data || r.data),
    refetchInterval: 10000,
  })

  const validateMut = useMutation({
    mutationFn: ({ id }: { id: string }) => caisseAPI.fiches.update(id, { statut: 'paye' }),
    onSuccess: (res, { id }) => {
      const f = (fiches as any[]).find(f => f.id === id)
      setFicheToValidate(null)
      // Forcer statut paye sur l'objet passé au reçu — la liste sera rafraîchie après
      const fichePayee = { ...f, statut: 'paye', statut_display: 'Payé' }
      setFichePrintee(fichePayee)
      toast.success('Paiement validé')
      qc.invalidateQueries({ queryKey: ['fiches-en-attente'] })
      qc.invalidateQueries({ queryKey: ['fiches-validees'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.erreur || 'Erreur'),
  })

  return (
    <AppLayout>
      <Topbar title="Paiements" subtitle="Fiches en attente de validation" />
      <div className="p-6">

        {/* Banner caisse fermée */}
        {!isOuverte && <CaisseFermeeBanner onOuvert={() => refetch()} />}

        <Card padding={false}>
          <CardHeader title="En attente" icon={<ClipboardList size={16} strokeWidth={1.75} />}
            subtitle={`${(fiches as any[]).length} fiche(s)`} />
          {isLoading
            ? <div className="flex justify-center py-10"><Spinner size={24} /></div>
            : (fiches as any[]).length === 0
              ? <EmptyState icon={<ClipboardList size={22} strokeWidth={1.5} />} title="Aucune fiche en attente" />
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-50 border-b border-surface-100">
                      <tr>{['Patient','Code DDP','Prestation','Service','Montant','Assurance','Date',''].map((h,i) => (
                        <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-ink-faint uppercase tracking-wide">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {(fiches as any[]).map(f => (
                        <tr key={f.id} className="border-b border-surface-50 hover:bg-surface-50">
                          <td className="px-5 py-3.5 font-bold text-ink">{f.patient_nom || '—'}</td>
                          <td className="px-5 py-3.5">
                            <code className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded text-xs font-bold">{f.patient_code || '—'}</code>
                          </td>
                          <td className="px-5 py-3.5 text-ink-muted">{f.prestation_nom}</td>
                          <td className="px-5 py-3.5 text-ink-muted">{f.service_nom || '—'}</td>
                          <td className="px-5 py-3.5 font-bold">{fmt(f.montant_patient)}</td>
                          <td className="px-5 py-3.5 text-ink-muted">{fmt(f.montant_assurance)}</td>
                          <td className="px-5 py-3.5 text-xs text-ink-faint">{format(new Date(f.date_creation), 'dd/MM HH:mm')}</td>
                          <td className="px-5 py-3.5">
                            {isOuverte
                              ? <Button size="sm" onClick={() => setFicheToValidate(f)}>Valider</Button>
                              : <span className="text-xs text-ink-faint italic">Caisse fermée</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          }
        </Card>
      </div>

      {/* Modal confirmation */}
      <Modal open={!!ficheToValidate} onClose={() => setFicheToValidate(null)} title="Confirmer le paiement">
        {ficheToValidate && (
          <div className="space-y-4">
            <div className="bg-surface-50 rounded-xl p-4 text-sm space-y-1.5">
              <div><span className="text-ink-faint">Patient : </span><strong>{ficheToValidate.patient_nom}</strong></div>
              <div><span className="text-ink-faint">Code DDP : </span><code className="text-primary-700 font-bold">{ficheToValidate.patient_code}</code></div>
              <div><span className="text-ink-faint">Prestation : </span>{ficheToValidate.prestation_nom}</div>
              <div><span className="text-ink-faint">Service : </span>{ficheToValidate.service_nom || '—'}</div>
              <div className="pt-2 text-base font-black text-ink border-t border-surface-200">
                À encaisser : {fmt(ficheToValidate.montant_patient)}
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

      {/* Modal reçu */}
      <Modal open={!!fichePrintee} onClose={() => setFichePrintee(null)} title="Reçu de paiement" size="lg">
        {fichePrintee && <TicketRecu fiche={fichePrintee} onClose={() => setFichePrintee(null)} />}
      </Modal>
    </AppLayout>
  )
}
