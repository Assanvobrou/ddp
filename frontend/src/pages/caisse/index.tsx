// ── Imports ───────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  CheckCircle, Printer, X, Receipt, Download,
  TrendingUp, BarChart2, CheckSquare,
  Shield, Clock, ArrowLeftRight, AlertTriangle
} from 'lucide-react'
import { caisseAPI } from '@/services/api'
import TicketRecu from '@/components/TicketRecu'
import { AppLayout, Topbar } from '@/components/layout/AppLayout'
import {
  Button, Card, CardHeader, Input, Textarea,
  Badge, Modal, StatCard, EmptyState, Spinner
} from '@/components/ui'

const fmt = (v: string | number) => Number(v).toLocaleString('fr-FR') + ' FCFA'

// ── REÇU PARTAGÉ ──────────────────────────────────────────────────────────────
export function RecuPaiement({ fiche, onClose }: { fiche: any; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div id="print-ticket" className="border border-surface-200 rounded-xl p-5 text-sm print:border-none">
        <div className="text-center mb-4 pb-3 border-b border-surface-100">
          <h2 className="text-base font-black text-ink">Dossier Du Patient — DDP</h2>
          <p className="text-xs text-ink-faint">Reçu de paiement · {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: fr })}</p>
        </div>
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between"><span className="text-ink-faint">Patient</span><strong>{fiche.patient_nom}</strong></div>
          <div className="flex justify-between"><span className="text-ink-faint">Code DDP</span><code className="text-primary-700 font-bold">{fiche.patient_code || '—'}</code></div>
          {fiche.service_nom && <div className="flex justify-between"><span className="text-ink-faint">Service</span><span>{fiche.service_nom}</span></div>}
          <div className="flex justify-between"><span className="text-ink-faint">Prestation</span><span>{fiche.prestation_nom}</span></div>
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
      {/* Boutons — masqués à l'impression */}
      <div className="flex gap-2 no-print">
        <Button variant="secondary" className="flex-1" onClick={onClose}><X size={15} strokeWidth={1.75} />Fermer</Button>
        <Button className="flex-1" onClick={() => window.print()}><Printer size={15} strokeWidth={1.75} />Imprimer</Button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 2 : Paiements validés
// ══════════════════════════════════════════════════════════════════════════════
export function PaiementsValides() {
  const [fichePrintee, setFichePrintee] = useState<any>(null)
  const { data: fiches = [], isLoading } = useQuery({
    queryKey: ['fiches-validees'],
    queryFn: () => caisseAPI.fiches.list({ statut: 'paye' }).then(r => r.data.data || r.data),
    refetchInterval: 30000,
  })
  return (
    <AppLayout>
      <Topbar title="Paiements validés" subtitle="Historique des paiements encaissés" />
      <div className="p-6">
        <Card padding={false}>
          <CardHeader title="Encaissés" icon={<CheckSquare size={16} strokeWidth={1.75} />}
            subtitle={`${(fiches as any[]).length} fiche(s)`} />
          {isLoading ? <div className="flex justify-center py-10"><Spinner size={24} /></div>
          : (fiches as any[]).length === 0 ? <EmptyState icon={<Receipt size={22} strokeWidth={1.5} />} title="Aucun paiement validé" />
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
                      <td className="px-5 py-3.5"><code className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded text-xs font-bold">{f.patient_code || '—'}</code></td>
                      <td className="px-5 py-3.5 text-ink-muted">{f.prestation_nom}</td>
                      <td className="px-5 py-3.5 text-ink-muted">{f.service_nom || '—'}</td>
                      <td className="px-5 py-3.5 font-bold">{fmt(f.montant_patient)}</td>
                      <td className="px-5 py-3.5 text-ink-muted">{fmt(f.montant_assurance)}</td>
                      <td className="px-5 py-3.5 text-xs text-ink-faint">{format(new Date(f.date_creation), 'dd/MM HH:mm')}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setFichePrintee(f)} className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink">
                          <Printer size={13} strokeWidth={1.75} />Reçu
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      <Modal open={!!fichePrintee} onClose={() => setFichePrintee(null)} title="Reçu de paiement" size="lg">
        {fichePrintee && <TicketRecu fiche={fichePrintee} onClose={() => setFichePrintee(null)} />}
      </Modal>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 4 : Versements (Responsable)
// ══════════════════════════════════════════════════════════════════════════════
export function Versements() {
  const [showValidate, setShowValidate] = useState<string | null>(null)
  const qc = useQueryClient()
  const { data: versements = [] } = useQuery({ queryKey: ['versements'], queryFn: () => caisseAPI.versements().then(r => r.data.data), refetchInterval: 30000 })
  const { data: sessions = [] } = useQuery({ queryKey: ['sessions-validees'], queryFn: () => caisseAPI.sessions({ statut: 'validee' }).then(r => r.data.data) })

  return (
    <AppLayout>
      <Topbar title="Versements" subtitle="Validation des bilans journaliers" />
      <div className="p-6 space-y-5">
        <Card padding={false}>
          <CardHeader title="Bilans en attente" icon={<Clock size={16} strokeWidth={1.75} />} subtitle={`${(versements as any[]).length} bilan(s)`} />
          {(versements as any[]).length === 0 ? <EmptyState icon={<CheckCircle size={22} strokeWidth={1.5} />} title="Aucun bilan en attente" /> : (
            <div className="divide-y divide-surface-50">
              {(versements as any[]).map(v => (
                <div key={v.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1">
                    <div className="font-bold text-sm text-ink">{v.ouverte_par_nom}</div>
                    <div className="text-xs text-ink-faint">{v.date_session} · {v.nb_fiches} fiche(s)</div>
                    {v.justificatif_caissiere && <div className="text-xs text-amber-700 mt-0.5 flex items-center gap-1"><AlertTriangle size={10} />{v.justificatif_caissiere}</div>}
                  </div>
                  <div className="text-right mr-4">
                    <div className="font-black text-sm">{fmt(v.montant_compte || 0)}</div>
                    {v.ecart && Number(v.ecart) !== 0 && <div className={`text-xs font-bold ${Number(v.ecart) < 0 ? 'text-red-600' : 'text-green-600'}`}>Écart : {fmt(v.ecart)}</div>}
                  </div>
                  <Button size="sm" onClick={() => setShowValidate(v.id)}><CheckCircle size={13} strokeWidth={1.75} />Valider</Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {(sessions as any[]).length > 0 && (
          <Card padding={false}>
            <CardHeader title="Versements validés" icon={<CheckSquare size={16} strokeWidth={1.75} />} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>{['Date','Caissière','Système','Soumis','Reçu','Écart','Validé par'].map((h,i) => (
                    <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-ink-faint uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(sessions as any[]).map(s => (
                    <tr key={s.id} className="border-b border-surface-50 hover:bg-surface-50">
                      <td className="px-5 py-3.5 font-semibold">{s.date_session}</td>
                      <td className="px-5 py-3.5">{s.ouverte_par_nom}</td>
                      <td className="px-5 py-3.5 font-bold">{fmt(s.montant_systeme)}</td>
                      <td className="px-5 py-3.5">{s.montant_compte ? fmt(s.montant_compte) : '—'}</td>
                      <td className="px-5 py-3.5">{s.montant_recu_comptable ? fmt(s.montant_recu_comptable) : '—'}</td>
                      <td className={`px-5 py-3.5 font-bold ${Number(s.ecart_comptable) < 0 ? 'text-red-600' : Number(s.ecart_comptable) > 0 ? 'text-green-600' : 'text-ink-faint'}`}>
                        {s.ecart_comptable != null ? fmt(s.ecart_comptable) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-ink-muted">{s.valide_par_nom || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Modal open={!!showValidate} onClose={() => setShowValidate(null)} title="Valider le versement">
          {showValidate && (
            <FormulaireValidation sessionId={showValidate} session={(versements as any[]).find(v => v.id === showValidate)}
              onClose={() => { setShowValidate(null); qc.invalidateQueries({ queryKey: ['versements'] }); qc.invalidateQueries({ queryKey: ['sessions-validees'] }) }} />
          )}
        </Modal>
      </div>
    </AppLayout>
  )
}

function FormulaireValidation({ sessionId, session, onClose }: { sessionId: string; session: any; onClose: () => void }) {
  const [montantRecu, setMontantRecu] = useState(session?.montant_compte || '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const ecart = montantRecu !== '' ? Number(montantRecu) - Number(session?.montant_compte || 0) : null
  const onSubmit = async () => {
    setLoading(true)
    try { await caisseAPI.validerVersement(sessionId, { montant_recu: Number(montantRecu), note }); toast.success('Versement validé'); onClose() }
    catch (e: any) { toast.error(e?.response?.data?.erreur || 'Erreur') }
    finally { setLoading(false) }
  }
  return (
    <div className="space-y-4">
      {session && (
        <div className="bg-surface-50 rounded-xl p-4 text-sm space-y-1.5">
          <div><span className="text-ink-faint">Caissière : </span><strong>{session.ouverte_par_nom}</strong></div>
          <div><span className="text-ink-faint">Date : </span>{session.date_session}</div>
          <div><span className="text-ink-faint">Montant soumis : </span><strong>{fmt(session.montant_compte || 0)}</strong></div>
          {session.justificatif_caissiere && <div className="text-amber-700 text-xs flex items-start gap-1 pt-1 border-t border-surface-200"><AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />{session.justificatif_caissiere}</div>}
        </div>
      )}
      <Input label="Montant reçu physiquement (FCFA)" type="number" value={montantRecu} onChange={(e: any) => setMontantRecu(e.target.value)} />
      {ecart !== null && (
        <div className={`px-3 py-2 rounded-lg text-xs font-bold border ${ecart === 0 ? 'bg-green-50 text-green-700 border-green-200' : ecart > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {ecart === 0 ? 'Aucun écart' : ecart > 0 ? `Excédent : +${fmt(ecart)}` : `Manquant : ${fmt(ecart)}`}
        </div>
      )}
      <Textarea label="Note" value={note} onChange={(e: any) => setNote(e.target.value)} placeholder="Observations..." />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
        <Button className="flex-1" loading={loading} onClick={onSubmit}><CheckCircle size={15} strokeWidth={1.75} />Confirmer</Button>
      </div>
    </div>
  )
}


// ── EXPORT EXCEL ──────────────────────────────────────────────────────────────
function exportExcel(data: any, mois: string) {
  if (!data) return
  const rows: string[][] = []

  // En-tête
  rows.push(['RAPPORT FINANCIER MENSUEL — DDP'])
  rows.push([`Période : ${mois}`])
  rows.push([`Généré le : ${new Date().toLocaleDateString('fr-FR')}`])
  rows.push([])

  // Totaux
  rows.push(['SYNTHÈSE'])
  rows.push(['Recettes totales', String(data.total_recettes || 0)])
  rows.push(['Part patients', String(data.total_patient || 0)])
  rows.push(['Part assurances', String(data.total_assurance || 0)])
  rows.push(['Nombre de patients', String(data.nb_patients || 0)])
  rows.push([])

  // Par prestation
  if (data.par_prestation?.length) {
    rows.push(['DÉTAIL PAR PRESTATION'])
    rows.push(['Prestation', 'Nb actes', 'Total (FCFA)', 'Part patient (FCFA)', 'Part assurance (FCFA)'])
    data.par_prestation.forEach((p: any) => {
      rows.push([p.nom_prestation, String(p.nb), String(p.total), String(p.total_patient), String(p.total_assurance || 0)])
    })
    rows.push([])
  }

  // Sessions
  if (data.sessions?.length) {
    rows.push(['SESSIONS DU MOIS'])
    rows.push(['Date', 'Caissière', 'Système (FCFA)', 'Soumis (FCFA)', 'Statut'])
    data.sessions.forEach((s: any) => {
      rows.push([s.date_session, s.ouverte_par_nom, String(s.montant_systeme), s.montant_compte ? String(s.montant_compte) : '—', s.statut_display])
    })
  }

  // Génération CSV
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n')
  const bom = '\uFEFF' // UTF-8 BOM pour Excel
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rapport-ddp-${mois}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── IMPRESSION RAPPORT ────────────────────────────────────────────────────────
function printRapport(data: any, mois: string) {
  if (!data) return
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return

  const fmt = (v: any) => Number(v || 0).toLocaleString('fr-FR')

  const prestation_rows = (data.par_prestation || []).map((p: any) => `
    <tr>
      <td>${p.nom_prestation}</td>
      <td style="text-align:right">${p.nb}</td>
      <td style="text-align:right">${fmt(p.total)}</td>
      <td style="text-align:right">${fmt(p.total_patient)}</td>
      <td style="text-align:right">${fmt(p.total_assurance || 0)}</td>
    </tr>`).join('')

  const session_rows = (data.sessions || []).map((s: any) => `
    <tr>
      <td>${s.date_session}</td>
      <td>${s.ouverte_par_nom}</td>
      <td style="text-align:right">${fmt(s.montant_systeme)}</td>
      <td style="text-align:right">${s.montant_compte ? fmt(s.montant_compte) : '—'}</td>
      <td>${s.statut_display}</td>
    </tr>`).join('')

  win.document.write(`
    <html><head><title>Rapport DDP ${mois}</title>
    <style>
      @page { size: A4; margin: 15mm; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #111; }
      h1 { font-size: 16px; margin-bottom: 4px; }
      h2 { font-size: 12px; margin: 12px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
      th { background: #f0f0f0; border: 1px solid #ccc; padding: 4px 6px; text-align: left; font-size: 10px; text-transform: uppercase; }
      td { border: 1px solid #ddd; padding: 4px 6px; }
      .totaux { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 16px; }
      .stat { border: 1px solid #ddd; padding: 8px; border-radius: 4px; }
      .stat .val { font-size: 16px; font-weight: bold; }
      .stat .lbl { font-size: 9px; color: #666; text-transform: uppercase; }
      .footer { margin-top: 20px; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
    </style></head><body>
    <h1>Rapport Financier Mensuel — DDP</h1>
    <p style="color:#555;font-size:10px">Période : ${mois} · Généré le ${new Date().toLocaleDateString('fr-FR')}</p>

    <div class="totaux">
      <div class="stat"><div class="val">${fmt(data.total_recettes)} FCFA</div><div class="lbl">Recettes totales</div></div>
      <div class="stat"><div class="val">${fmt(data.total_patient)} FCFA</div><div class="lbl">Part patients</div></div>
      <div class="stat"><div class="val">${fmt(data.total_assurance)} FCFA</div><div class="lbl">Part assurances</div></div>
      <div class="stat"><div class="val">${data.nb_patients || 0}</div><div class="lbl">Patients</div></div>
    </div>

    <h2>Détail par prestation</h2>
    <table>
      <thead><tr><th>Prestation</th><th>Actes</th><th>Total (FCFA)</th><th>Part patient</th><th>Part assurance</th></tr></thead>
      <tbody>${prestation_rows || '<tr><td colspan="5" style="color:#999">Aucune donnée</td></tr>'}</tbody>
    </table>

    <h2>Sessions du mois</h2>
    <table>
      <thead><tr><th>Date</th><th>Caissière</th><th>Système (FCFA)</th><th>Soumis (FCFA)</th><th>Statut</th></tr></thead>
      <tbody>${session_rows || '<tr><td colspan="5" style="color:#999">Aucune session</td></tr>'}</tbody>
    </table>

    <div class="footer">DDP — Dossier Du Patient · Rapport confidentiel</div>
    </body></html>
  `)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 5 : Rapports
// ══════════════════════════════════════════════════════════════════════════════
export function Rapports() {
  const [moisFiltre, setMoisFiltre] = useState(format(new Date(), 'yyyy-MM'))
  const { data, isLoading } = useQuery({
    queryKey: ['rapports', moisFiltre],
    queryFn: () => {
      const [y, m] = moisFiltre.split('-').map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      return caisseAPI.dashboard({ date_debut: moisFiltre + '-01', date_fin: `${moisFiltre}-${String(lastDay).padStart(2,'0')}` }).then(r => r.data.data)
    },
  })
  return (
    <AppLayout>
      <Topbar title="Rapports" subtitle="Analyse financière mensuelle"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => exportExcel(data, moisFiltre)}>
              <Download size={14} strokeWidth={1.75} />Exporter Excel
            </Button>
            <Button size="sm" variant="secondary" onClick={() => printRapport(data, moisFiltre)}>
              <Printer size={14} strokeWidth={1.75} />Imprimer
            </Button>
          </div>
        } />
      <div className="p-6 space-y-5">
        <Card>
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-ink-muted">Mois</label>
              <input type="month" value={moisFiltre} onChange={e => setMoisFiltre(e.target.value)}
                className="h-11 px-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:border-primary-600" />
            </div>
          </div>
        </Card>
        {isLoading ? <div className="flex justify-center py-8"><Spinner size={28} /></div>
        : data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<TrendingUp size={16} strokeWidth={1.75} />} label="Recettes totales" value={fmt(data.total_recettes || 0)} color="primary" />
              <StatCard icon={<CheckCircle size={16} strokeWidth={1.75} />} label="Part patients" value={fmt(data.total_patient || 0)} color="success" />
              <StatCard icon={<Shield size={16} strokeWidth={1.75} />} label="Part assurances" value={fmt(data.total_assurance || 0)} color="warning" />
              <StatCard icon={<Receipt size={16} strokeWidth={1.75} />} label="Patients" value={data.nb_patients || 0} color="primary" />
            </div>
            {data.par_prestation?.length > 0 && (
              <Card padding={false}>
                <CardHeader title="Par prestation" icon={<BarChart2 size={16} strokeWidth={1.75} />} />
                <div className="divide-y divide-surface-50">
                  {data.par_prestation.map((p: any) => (
                    <div key={p.nom_prestation} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="flex-1"><div className="font-bold text-sm text-ink">{p.nom_prestation}</div><div className="text-xs text-ink-faint">{p.nb} acte(s)</div></div>
                      <div className="text-right"><div className="font-black text-sm">{fmt(p.total)}</div><div className="text-xs text-ink-faint">Patient : {fmt(p.total_patient)}</div></div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {data.sessions?.length > 0 && (
              <Card padding={false}>
                <CardHeader title="Sessions du mois" icon={<ArrowLeftRight size={16} strokeWidth={1.75} />} />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-50 border-b border-surface-100">
                      <tr>{['Date','Caissière','Système','Soumis','Statut'].map((h,i) => (
                        <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-ink-faint uppercase tracking-wide">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {data.sessions.map((s: any) => (
                        <tr key={s.id} className="border-b border-surface-50">
                          <td className="px-5 py-3.5 font-semibold">{s.date_session}</td>
                          <td className="px-5 py-3.5">{s.ouverte_par_nom}</td>
                          <td className="px-5 py-3.5 font-bold">{fmt(s.montant_systeme)}</td>
                          <td className="px-5 py-3.5">{s.montant_compte ? fmt(s.montant_compte) : '—'}</td>
                          <td className="px-5 py-3.5"><Badge variant={s.statut==='validee'?'success':s.statut==='en_attente'?'warning':'neutral'}>{s.statut_display}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}

// ── Aliases compatibilité router ──────────────────────────────────────────────
export { default as PaiementsEnAttente } from './PaiementsEnAttente'
export { default as ClotureCaisse } from './ClotureCaisse'
export function GestionCaisse() { const C = require('./ClotureCaisse').default; return <C /> }
export function FichesPaiement() { const P = require('./PaiementsEnAttente').default; return <P /> }
export function DashboardRecettes() { return <Rapports /> }
