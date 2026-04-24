/**
 * TicketRecu — Reçu de paiement DDP
 * 2 souches identiques sur A5 paysage séparées par un trait pointillé.
 * À utiliser dans une Modal. Le bouton Imprimer n'imprime QUE les souches.
 */
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Printer, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { configAPI } from '@/services/api'
import { Button } from '@/components/ui'

const fmt = (v: string | number) => Number(v).toLocaleString('fr-FR')

interface TicketRecuProps {
  fiche: any
  onClose: () => void
}

function Souche({ fiche, clinique }: { fiche: any; clinique: any }) {
  const dateEdit = fiche.date_creation
    ? format(new Date(fiche.date_creation), 'dd MMMM yyyy à HH:mm', { locale: fr })
    : '—'

  return (
    <div className="souche" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', lineHeight: '1.4' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        {/* Clinique */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}>
            {clinique?.nom || 'MATERNITÉ RAHAMA'}
          </div>
          {clinique?.email && <div style={{ color: '#555' }}>{clinique.email}</div>}
          {clinique?.telephone && <div style={{ color: '#555' }}>{clinique.telephone}</div>}
          {clinique?.adresse && <div style={{ color: '#555', fontSize: '9px' }}>{clinique.adresse}</div>}
        </div>
        {/* N° Reçu + Patient */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
            Reçu N°: {fiche.reference || fiche.id?.slice(-8).toUpperCase() || '—'}
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
            {fiche.patient_nom || '—'}
          </div>
        </div>
      </div>

      {/* Ligne info patient */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ccc', borderBottom: '1px solid #ccc', padding: '3px 0', marginBottom: '5px' }}>
        <span><strong>CODE PATIENT :</strong> {fiche.patient_code || '—'}</span>
        <span><strong>SEXE :</strong> {fiche.patient_sexe === 'F' ? 'F' : fiche.patient_sexe === 'M' ? 'M' : '—'}</span>
        <span><strong>ÂGE :</strong> {fiche.patient_age ? `${fiche.patient_age} an(s)` : '—'}</span>
        <span><strong>ÉDITÉE LE :</strong> {dateEdit}</span>
      </div>

      {/* Tableau prestations */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px', fontSize: '9px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            {['SERVICE','PRESTATION','MONTANT ACTE','QTÉ','TAUX ASSUR. (%)','MONTANT TOTAL'].map((h, i) => (
              <th key={i} style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: i >= 2 ? 'right' : 'left', fontWeight: 'bold' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '3px 4px' }}>{fiche.service_nom || '—'}</td>
            <td style={{ border: '1px solid #ccc', padding: '3px 4px' }}>{fiche.prestation_nom || '—'}</td>
            <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'right' }}>{fmt(fiche.prix_unitaire)} {clinique?.monnaie || 'FCFA'}</td>
            <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'right' }}>{fiche.quantite || 1}</td>
            <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'right' }}>{fiche.taux_assurance || 0}</td>
            <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'right', fontWeight: 'bold' }}>{fmt(fiche.montant_total)} {clinique?.monnaie || 'FCFA'}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'right', fontWeight: 'bold' }}>TOTAL À PAYER :</td>
            <td style={{ border: '1px solid #ccc', padding: '3px 4px', textAlign: 'right', fontWeight: 'bold' }}>
              {fmt(fiche.montant_patient)} {clinique?.monnaie || 'F cfa'}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Pied */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4px' }}>
        <div style={{ fontSize: '8px', color: '#666' }}>
          {Number(fiche.montant_assurance) > 0 && (
            <span>Assurance : -{fmt(fiche.montant_assurance)} {clinique?.monnaie || 'FCFA'} · </span>
          )}
          {clinique?.informations_legales && <span>{clinique.informations_legales}</span>}
        </div>
        <div style={{ textAlign: 'right', fontSize: '9px' }}>
          <div>
            <strong>Statut : </strong>
            <span style={{ color: fiche.statut === 'paye' ? '#166534' : '#b45309', fontWeight: 'bold' }}>
              {fiche.statut === 'paye' ? 'RÉGLÉ' : 'EN ATTENTE'}
            </span>
          </div>
          {fiche.creee_par_nom && <div style={{ color: '#555' }}>Édité par : {fiche.creee_par_nom}</div>}
        </div>
      </div>
    </div>
  )
}

export default function TicketRecu({ fiche, onClose }: TicketRecuProps) {
  const { data: clinique } = useQuery({
    queryKey: ['parametres-clinique'],
    queryFn: () => configAPI.parametres.get().then(r => r.data.data),
    staleTime: 300_000,
  })

  const handlePrint = () => {
    const el = document.getElementById('ddp-ticket')
    if (!el) return
    const win = window.open('', '_blank', 'width=800,height=500')
    if (!win) return
    win.document.write(`
      <html>
      <head>
        <title>Reçu DDP</title>
        <style>
          @page { size: A5 landscape; margin: 6mm; }
          body { margin: 0; font-family: Arial, sans-serif; }
          #ddp-ticket { display: flex; flex-direction: row; width: 100%; height: 100%; }
          .souche { flex: 1; padding: 4mm; }
          .coupe {
            width: 1px;
            flex-shrink: 0;
            margin: 4mm 2mm;
            background: repeating-linear-gradient(to bottom, #aaa 0px, #aaa 4px, transparent 4px, transparent 9px);
          }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 2px 4px; font-size: 9px; }
        </style>
      </head>
      <body>${el.innerHTML}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  return (
    <div className="space-y-4">
      {/* Aperçu (non imprimé directement) */}
      <div id="ddp-ticket" style={{ display: 'flex', flexDirection: 'row', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
        <Souche fiche={fiche} clinique={clinique} />
        {/* Trait de coupe */}
        <div className="coupe" style={{
          width: '1px', flexShrink: 0, margin: '8px 6px',
          background: 'repeating-linear-gradient(to bottom, #aaa 0px, #aaa 4px, transparent 4px, transparent 9px)'
        }} />
        <Souche fiche={fiche} clinique={clinique} />
      </div>

      {/* Boutons — masqués à l'impression */}
      <div className="flex gap-2 no-print">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          <X size={15} strokeWidth={1.75} />Fermer
        </Button>
        <Button className="flex-1" onClick={handlePrint}>
          <Printer size={15} strokeWidth={1.75} />Imprimer (2 souches A5)
        </Button>
      </div>
    </div>
  )
}
