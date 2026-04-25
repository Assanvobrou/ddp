import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  UserPlus, Search, ChevronRight, ArrowRight,
  Plus, Trash2, ArrowLeft, User, FileText,
  Calendar, Phone, Home, Shield, Loader2
} from 'lucide-react'
import { caisseAPI, configAPI } from '@/services/api'
import { AppLayout, Topbar } from '@/components/layout/AppLayout'
import { Button, Card, CardHeader, Input, Select, Textarea, Badge, EmptyState, Spinner } from '@/components/ui'
import type { Patient, Prestation, Assurance } from '@/types'

const fmt = (v: string | number) => Number(v).toLocaleString('fr-FR') + ' FCFA'

// ── LISTE PATIENTS ─────────────────────────────────────────────────────────────
export function PatientsList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ['patients-bureau'],
    queryFn: () => caisseAPI.patients.list().then(r => r.data.data || r.data),
    refetchInterval: 30000,
  })

  const filtered = patients.filter(p =>
    (p.numero_dossier || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.nom || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.prenom || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.telephone || '').includes(search)
  )

  return (
    <AppLayout>
      <Topbar title="Bureau des entrées" subtitle="Liste des patients"
        actions={<Button size="sm" onClick={() => navigate('/bureau/nouveau')}><UserPlus size={15} strokeWidth={1.75} />Nouveau patient</Button>}
      />
      <div className="p-3 md:p-6 space-y-4">
        <Card>
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par n° dossier, nom, prénom ou téléphone..."
            leftIcon={<Search size={15} strokeWidth={1.75} />} />
        </Card>
        <Card padding={false}>
          <CardHeader title="Patients enregistrés" icon={<User size={16} strokeWidth={1.75} />}
            subtitle={`${filtered.length} patient(s)`}
            action={<Button size="sm" variant="secondary" onClick={() => navigate('/bureau/nouveau')}><UserPlus size={14} strokeWidth={1.75} />Nouveau</Button>} />
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner size={24} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<User size={24} strokeWidth={1.5} />} title="Aucun patient"
              description="Enregistrez le premier patient avec le bouton ci-dessus." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>{['N° Dossier','Patient','Sexe','Age','Téléphone','Assurance','Date',''].map((h,i) => (
                    <th key={i} className="px-3 md:px-5 py-3 text-left text-[10.5px] font-bold text-ink-faint uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} onClick={() => navigate(`/bureau/patients/${p.id}`)}
                      className="border-b border-surface-50 hover:bg-surface-50 cursor-pointer transition-colors">
                      <td className="px-3 md:px-5 py-3.5">
                        <code className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-xs font-bold">{p.numero_dossier}</code>
                      </td>
                      <td className="px-3 md:px-5 py-3 font-bold text-ink">{p.prenom} {p.nom}</td>
                      <td className="px-3 md:px-5 py-3 text-ink-muted">{p.sexe === 'F' ? 'Féminin' : p.sexe === 'M' ? 'Masculin' : 'Autre'}</td>
                      <td className="px-3 md:px-5 py-3 text-ink-muted">{p.age ? `${p.age} ans` : p.date_naissance || '—'}</td>
                      <td className="px-3 md:px-5 py-3 text-ink-muted">{p.telephone || '—'}</td>
                      <td className="px-3 md:px-5 py-3.5">
                        {p.a_assurance
                          ? <Badge variant="info"><Shield size={10} />{p.assurance_nom || 'Assuré'}</Badge>
                          : <Badge variant="neutral">Non assuré</Badge>}
                      </td>
                      <td className="px-3 md:px-5 py-3 text-xs text-ink-faint">
                        {format(new Date(p.date_enregistrement), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </td>
                      <td className="px-3 md:px-5 py-3.5">
                        <span className="flex items-center gap-1 text-xs font-semibold text-primary-600">
                          Fiche<ChevronRight size={13} />
                        </span>
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

// ── NOUVEAU PATIENT ────────────────────────────────────────────────────────────
const patientSchema = z.object({
  nom: z.string().min(1,'Nom requis'),
  prenom: z.string().min(1,'Prénom requis'),
  sexe: z.enum(['M','F','A']).default('M'),
  date_naissance: z.string().optional(),
  age: z.coerce.number().min(0).optional(),
  telephone: z.string().optional(),
  domicile: z.string().optional(),
  a_assurance: z.boolean().default(false),
  assurance: z.string().optional(),
  numero_assurance: z.string().optional(),
}).refine(d => d.date_naissance || d.age, { message:'Date de naissance ou âge requis', path:['age'] })
 .refine(d => !d.a_assurance || d.assurance, { message:'Sélectionner une assurance', path:['assurance'] })
 .refine(d => !d.a_assurance || d.numero_assurance, { message:"Numéro d'assurance requis", path:['numero_assurance'] })
type PatientFormData = z.infer<typeof patientSchema>

export function NouveauPatient() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: assurances = [] } = useQuery<Assurance[]>({
    queryKey: ['assurances'],
    queryFn: () => configAPI.assurances.list().then(r => r.data.data),
  })

  const { register, watch, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: { sexe: 'M', a_assurance: false },
  })
  const aAssurance = watch('a_assurance')

  const createMut = useMutation({
    mutationFn: (data: PatientFormData) => caisseAPI.patients.create({
      nom: data.nom.toUpperCase(), prenom: data.prenom, sexe: data.sexe,
      date_naissance: data.date_naissance || null, age: data.age || null,
      telephone: data.telephone || '', domicile: data.domicile || '',
      a_assurance: data.a_assurance,
      assurance: data.assurance || null,
      numero_assurance: data.numero_assurance || '',
    }),
    onSuccess: (res) => {
      const p = res.data.data || res.data
      toast.success(`Patient enregistré — N° ${p.numero_dossier}`)
      qc.invalidateQueries({ queryKey: ['patients-bureau'] })
      navigate(`/bureau/patients/${p.id}`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.erreur || "Erreur lors de l'enregistrement"),
  })

  return (
    <AppLayout>
      <Topbar title="Nouveau patient" subtitle="Bureau des entrées"
        actions={<Button variant="ghost" size="sm" onClick={() => navigate('/bureau')}><ArrowLeft size={15} />Retour</Button>} />
      <div className="p-4 md:p-6 max-w-2xl">
        <Card>
          <CardHeader title="Informations du patient" icon={<UserPlus size={16} strokeWidth={1.75} />} />
          <form onSubmit={handleSubmit(d => createMut.mutate(d))} className="space-y-4 md:space-y-5">
            <div>
              <p className="text-xs font-bold text-ink-faint uppercase tracking-wider mb-3">Identité</p>
              <div className="grid grid-cols-2 gap-3">
                <Input {...register('nom')} label="Nom *" placeholder="KONÉ" error={errors.nom?.message} />
                <Input {...register('prenom')} label="Prénom *" placeholder="Aminata" error={errors.prenom?.message} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <Select {...register('sexe')} label="Sexe *"
                  options={[{value:'M',label:'Masculin'},{value:'F',label:'Féminin'},{value:'A',label:'Autre'}]} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ink-muted">Date de naissance</label>
                  <input type="date"
                    {...register('date_naissance')}
                    onChange={e => {
                      register('date_naissance').onChange(e)
                      const d = new Date(e.target.value)
                      if (!isNaN(d.getTime())) {
                        const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000))
                        setValue('age', age)
                      }
                    }}
                    className="h-11 px-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:border-primary-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ink-muted">OU Âge (ans)</label>
                  <input type="number" placeholder="34"
                    {...register('age')}
                    onChange={e => {
                      register('age').onChange(e)
                      const age = parseInt(e.target.value)
                      if (!isNaN(age) && age > 0 && age < 130) {
                        const d = new Date()
                        d.setFullYear(d.getFullYear() - age)
                        setValue('date_naissance', d.toISOString().split('T')[0])
                      }
                    }}
                    className="h-11 px-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:border-primary-600" />
                  {errors.age && <p className="text-xs text-red-600">{errors.age.message as string}</p>}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-ink-faint uppercase tracking-wider mb-3">Contacts</p>
              <div className="grid grid-cols-2 gap-3">
                <Input {...register('telephone')} label="Téléphone" leftIcon={<Phone size={14} strokeWidth={1.75} />} placeholder="+225 07 XX XX XX" />
                <Input {...register('domicile')} label="Domicile" leftIcon={<Home size={14} strokeWidth={1.75} />} placeholder="Cocody, Abidjan" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-ink-faint uppercase tracking-wider mb-3">Assurance</p>
              <label className="flex items-center gap-2.5 cursor-pointer mb-3">
                <input type="checkbox" {...register('a_assurance')} className="w-4 h-4 rounded accent-primary-600" />
                <span className="text-sm font-medium text-ink">Le patient est assuré</span>
              </label>
              {aAssurance && (
                <div className="grid grid-cols-2 gap-3 pl-6 border-l-2 border-primary-100">
                  <Select {...register('assurance')} label="Organisme *"
                    options={assurances.map((a: Assurance) => ({value:a.id,label:`${a.nom} (${a.code})`}))}
                    placeholder="Sélectionner..." error={errors.assurance?.message} />
                  <Input {...register('numero_assurance')} label="Numéro d'assurance *"
                    placeholder="ASSUR-12345" error={errors.numero_assurance?.message} />
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={createMut.isPending || isSubmitting} size="lg">
                Enregistrer le patient<ArrowRight size={16} />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  )
}

// ── DÉTAIL PATIENT + FICHE ─────────────────────────────────────────────────────
interface LigneFiche { prestation_id: string; quantite: number; prix: number; nom: string }

export function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [redirecting, setRedirecting] = useState(false)

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ['patient', id],
    queryFn: () => caisseAPI.patients.get(id!).then(r => r.data.data || r.data),
    enabled: !!id,
  })

  if (isLoading) return <AppLayout><Topbar title="Chargement..." /><div className="flex justify-center pt-20"><Spinner size={28} /></div></AppLayout>
  if (!patient) return <AppLayout><Topbar title="Patient introuvable" /></AppLayout>

  if (redirecting) {
    return (
      <AppLayout>
        <Topbar title="Redirection vers la caisse..." />
        <div className="flex flex-col items-center justify-center pt-24 gap-4">
          <Loader2 size={32} className="animate-spin text-primary-600" />
          <p className="text-sm font-semibold text-ink-muted">Fiche envoyée en caisse...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Topbar title={`${patient.prenom} ${patient.nom}`} subtitle={`N° Dossier : ${patient.numero_dossier}`}
        actions={<Button variant="ghost" size="sm" onClick={() => navigate('/bureau')}><ArrowLeft size={15} />Liste patients</Button>} />
      <div className="p-3 md:p-6 max-w-3xl space-y-4">
        <Card>
          <CardHeader title="Dossier patient" icon={<User size={16} strokeWidth={1.75} />} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {[
              { icon: <FileText size={13} />, label: 'N° Dossier', val: <code className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-xs font-bold">{patient.numero_dossier}</code> },
              { icon: <User size={13} />, label: 'Nom complet', val: `${patient.prenom} ${patient.nom}` },
              { icon: <User size={13} />, label: 'Sexe', val: patient.sexe === 'F' ? 'Féminin' : patient.sexe === 'M' ? 'Masculin' : 'Autre' },
              { icon: <Calendar size={13} />, label: 'Age', val: patient.age ? `${patient.age} ans` : patient.date_naissance || '—' },
              { icon: <Phone size={13} />, label: 'Téléphone', val: patient.telephone || '—' },
              { icon: <Shield size={13} />, label: 'Assurance', val: patient.a_assurance ? `${patient.assurance_nom} — ${patient.numero_assurance}` : 'Non assuré' },
            ].map((r, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-ink-faint font-semibold">{r.icon}{r.label}</div>
                <div className="text-sm font-medium text-ink">{r.val}</div>
              </div>
            ))}
          </div>
        </Card>

        <FormulaireFiche
          patient={patient}
          onSuccess={() => {
            setRedirecting(true)
            setTimeout(() => navigate('/caisse/paiements'), 1800)
          }}
        />
      </div>
    </AppLayout>
  )
}

// ── FORMULAIRE FICHE ───────────────────────────────────────────────────────────
function FormulaireFiche({ patient, onSuccess }: { patient: Patient; onSuccess: () => void }) {
  const [serviceId, setServiceId] = useState('')
  const [lignes, setLignes] = useState<LigneFiche[]>([{prestation_id:'',quantite:1,prix:0,nom:''}])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => configAPI.services.list().then(r => r.data.data),
  })

  const { data: prestations = [] } = useQuery<Prestation[]>({
    queryKey: ['prestations', serviceId],
    queryFn: () => configAPI.prestations.list(serviceId ? { service: serviceId } : {}).then(r => r.data.data),
  })

  const handleServiceChange = (id: string) => {
    setServiceId(id)
    setLignes([{prestation_id:'',quantite:1,prix:0,nom:''}])
  }

  const total = lignes.reduce((acc, l) => acc + l.prix * l.quantite, 0)

  const updateLigne = (idx: number, field: keyof LigneFiche, value: string | number) => {
    setLignes(prev => {
      const u = [...prev]
      if (field === 'prestation_id') {
        const p = (prestations as Prestation[]).find(pr => pr.id === value)
        u[idx] = { ...u[idx], prestation_id: value as string, prix: p ? Number(p.prix) : 0, nom: p?.nom || '' }
      } else {
        u[idx] = { ...u[idx], [field]: value }
      }
      return u
    })
  }

  const handleSubmit = async () => {
    if (!serviceId) { toast.error('Sélectionner un service'); return }
    const valid = lignes.filter(l => l.prestation_id)
    if (!valid.length) { toast.error('Ajouter au moins une prestation'); return }

    setLoading(true)
    try {
      for (const l of valid) {
        await caisseAPI.fiches.create({
          patient: patient.id,
          prestation: l.prestation_id,
          service: serviceId,
          quantite: l.quantite,
          statut: 'en_attente',
          notes,
        })
      }
      toast.success('Fiche créée — envoi en caisse...')
      onSuccess()
    } catch (e: any) {
      toast.error(e?.response?.data?.erreur || 'Erreur')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Fiche de paiement" icon={<FileText size={16} strokeWidth={1.75} />} />
      <div className="space-y-4 md:space-y-5">
        <Select label="Service de destination *" value={serviceId}
          onChange={e => handleServiceChange(e.target.value)}
          options={(services as any[]).map(s => ({value:s.id,label:s.nom}))}
          placeholder="Sélectionner le service..." />

        {serviceId && (
          <div>
            <p className="text-xs font-bold text-ink-faint uppercase tracking-wider mb-3">
              Prestation(s) — {(services as any[]).find(s => s.id === serviceId)?.nom}
            </p>
            <div className="space-y-2">
              {lignes.map((l, idx) => (
                <div key={idx} className="grid grid-cols-6 sm:grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <Select label={idx===0?'Prestation':''} value={l.prestation_id}
                      onChange={e => updateLigne(idx,'prestation_id',e.target.value)}
                      options={(prestations as Prestation[]).map(p => ({value:p.id,label:p.nom}))}
                      placeholder="Sélectionner..." />
                  </div>
                  <div className="col-span-2">
                    <Input label={idx===0?'Qté':''} type="number" min={1} value={l.quantite}
                      onChange={e => updateLigne(idx,'quantite',Number(e.target.value))} />
                  </div>
                  <div className="col-span-3">
                    <Input label={idx===0?'Prix (FCFA)':''} value={l.prix>0?l.prix.toLocaleString('fr-FR'):''}
                      readOnly className="bg-surface-100 text-ink-muted cursor-default" placeholder="Auto" />
                  </div>
                  <div className="col-span-1 flex justify-center pb-0.5">
                    {lignes.length > 1 && (
                      <button type="button"
                        onClick={() => setLignes(p => p.filter((_,i) => i!==idx))}
                        className="p-2 rounded-lg text-ink-faint hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={15} strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button type="button"
              onClick={() => setLignes(p => [...p, {prestation_id:'',quantite:1,prix:0,nom:''}])}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              <Plus size={14} />Ajouter une prestation
            </button>
          </div>
        )}

        {total > 0 && (
          <div className="flex items-center justify-between bg-surface-50 rounded-xl px-4 py-3 border border-surface-200">
            <span className="text-sm font-semibold text-ink-muted">Total estimé</span>
            <span className="text-lg font-black text-ink">{fmt(total)}</span>
          </div>
        )}

        <Textarea label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations..." />

        <div className="flex justify-end">
          <Button onClick={handleSubmit} loading={loading} size="lg"
            disabled={!serviceId || lignes.every(l => !l.prestation_id)}>
            Envoyer en caisse
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default PatientsList
