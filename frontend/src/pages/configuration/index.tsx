import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Stethoscope, Shield, UserCog, SlidersHorizontal,
  Plus, Pencil, Trash2, ChevronRight, CheckCircle,
  User, Mail, KeyRound, Hash, Building2,
  UserPlus, Layers, ShieldCheck, ArrowRight, ArrowLeft,
  ToggleLeft, ToggleRight, Package, X
} from 'lucide-react'
import { configAPI, authAPI } from '@/services/api'
import { AppLayout, Topbar } from '@/components/layout/AppLayout'
import {
  Button, Card, CardHeader, Input, Select, Textarea,
  Badge, Modal, EmptyState, Spinner
} from '@/components/ui'
import type { Prestation, Assurance } from '@/types'

// ══════════════════════════════════════════════════════════════════════════════
// PAGE : Prestations
// ══════════════════════════════════════════════════════════════════════════════
const prestationSchema = z.object({
  nom: z.string().min(1, 'Libellé requis'),
  prix: z.coerce.number().min(0, 'Prix invalide'),
  service: z.string().optional(),
  prise_en_charge_assurance: z.boolean().default(false),
  ordre: z.coerce.number().default(0),
})
type PrestationForm = z.infer<typeof prestationSchema>

export function Prestations() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Prestation | null>(null)

  const { data: prestations = [], isLoading } = useQuery<Prestation[]>({
    queryKey: ['prestations-all'],
    queryFn: () => configAPI.prestations.list().then(r => r.data.data),
  })
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => configAPI.services.list().then(r => r.data.data),
  })

  const { register, watch, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<PrestationForm>({
    resolver: zodResolver(prestationSchema),
  })
  const pAssurance = watch('prise_en_charge_assurance')

  const saveMut = useMutation({
    mutationFn: (data: PrestationForm) =>
      editing ? configAPI.prestations.update(editing.id, data) : configAPI.prestations.create(data),
    onSuccess: () => {
      toast.success(editing ? 'Prestation modifiée' : 'Prestation créée')
      reset(); setShowForm(false); setEditing(null)
      qc.invalidateQueries({ queryKey: ['prestations-all'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.erreur || 'Erreur'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => configAPI.prestations.delete(id),
    onSuccess: () => { toast.success('Prestation désactivée'); qc.invalidateQueries({ queryKey: ['prestations-all'] }) },
  })

  const openEdit = (p: Prestation) => {
    setEditing(p)
    setValue('nom', p.nom)
    setValue('prix', Number(p.prix))
    setValue('prise_en_charge_assurance', p.prise_en_charge_assurance)
    setValue('ordre', p.ordre)
    setShowForm(true)
  }

  return (
    <AppLayout>
      <Topbar title="Prestations" subtitle="Catalogue des actes médicaux"
        actions={
          <Button size="sm" onClick={() => { reset(); setEditing(null); setShowForm(true) }}>
            <Plus size={15} strokeWidth={1.75} />Nouvelle prestation
          </Button>
        }
      />
      <div className="p-6">
        <Card padding={false}>
          <CardHeader title="Catalogue" icon={<Stethoscope size={16} strokeWidth={1.75} />}
            subtitle={`${(prestations as Prestation[]).length} prestation(s)`} />
          {isLoading ? <div className="flex justify-center py-8"><Spinner size={24} /></div>
          : (prestations as Prestation[]).length === 0
            ? <EmptyState icon={<Stethoscope size={22} strokeWidth={1.5} />} title="Aucune prestation"
                action={<Button size="sm" onClick={() => setShowForm(true)}><Plus size={14} />Ajouter</Button>} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>{['Prestation','Service','Prix','Assurance','Taux','Ordre',''].map((h,i) => (
                    <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-ink-faint uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(prestations as Prestation[]).map(p => (
                    <tr key={p.id} className="border-b border-surface-50 hover:bg-surface-50">
                      <td className="px-5 py-3.5 font-semibold text-ink">{p.nom}</td>
                      <td className="px-5 py-3.5 text-ink-muted">{(p as any).service_nom || '—'}</td>
                      <td className="px-5 py-3.5 font-bold">{Number(p.prix).toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={p.prise_en_charge_assurance ? 'success' : 'neutral'}>
                          {p.prise_en_charge_assurance ? 'Oui' : 'Non'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-ink-muted">{p.prise_en_charge_assurance ? 'Selon assurance' : '—'}</td>
                      <td className="px-5 py-3.5 text-ink-faint">{p.ordre}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-ink-faint hover:text-primary-600 hover:bg-primary-50 transition-colors">
                            <Pencil size={14} strokeWidth={1.75} />
                          </button>
                          <button onClick={() => deleteMut.mutate(p.id)}
                            className="p-1.5 rounded-lg text-ink-faint hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); reset() }}
        title={editing ? 'Modifier la prestation' : 'Nouvelle prestation'}>
        <form onSubmit={handleSubmit(d => saveMut.mutate(d))} className="space-y-4">
          <Input {...register('nom')} label="Libellé *" placeholder="Consultation générale" error={errors.nom?.message} />
          <Select {...register('service')} label="Service"
            options={(services as any[]).map(s => ({ value: s.id, label: s.nom }))}
            placeholder="Aucun service" />
          <div className="grid grid-cols-2 gap-3">
            <Input {...register('prix')} label="Prix (FCFA) *" type="number" error={errors.prix?.message} />
            <Input {...register('ordre')} label="Ordre" type="number" placeholder="0" />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" {...register('prise_en_charge_assurance')} className="w-4 h-4 rounded accent-primary-600" />
            <span className="text-sm font-medium text-ink">Prise en charge assurance</span>
          </label>
          {pAssurance && (
            <div className="bg-primary-50 border border-primary-100 rounded-xl px-3 py-2.5 text-xs text-primary-700 font-medium">
              Le taux de prise en charge sera celui de l'assurance du patient, défini dans Configuration → Assurances.
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowForm(false); setEditing(null); reset() }}>Annuler</Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">
              <CheckCircle size={15} strokeWidth={1.75} />{editing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE : Assurances
// ══════════════════════════════════════════════════════════════════════════════
const assuranceSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  code: z.string().min(1, 'Code requis'),
  taux_defaut: z.coerce.number().min(0).max(100).default(70),
  description: z.string().optional(),
})
type AssuranceForm = z.infer<typeof assuranceSchema>

export function Assurances() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Assurance | null>(null)

  const { data: assurances = [], isLoading } = useQuery<Assurance[]>({
    queryKey: ['assurances-all'],
    queryFn: () => configAPI.assurances.list().then(r => r.data.data),
  })

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<AssuranceForm>({
    resolver: zodResolver(assuranceSchema),
  })

  const saveMut = useMutation({
    mutationFn: (data: AssuranceForm) =>
      editing ? configAPI.assurances.update(editing.id, data) : configAPI.assurances.create(data),
    onSuccess: () => {
      toast.success(editing ? 'Assurance modifiée' : 'Assurance créée')
      reset(); setShowForm(false); setEditing(null)
      qc.invalidateQueries({ queryKey: ['assurances-all'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.erreur || 'Erreur'),
  })

  const openEdit = (a: Assurance) => {
    setEditing(a)
    setValue('nom', a.nom)
    setValue('code', a.code)
    setValue('taux_defaut', a.taux_defaut)
    setShowForm(true)
  }

  return (
    <AppLayout>
      <Topbar title="Assurances" subtitle="Organismes partenaires"
        actions={
          <Button size="sm" onClick={() => { reset(); setEditing(null); setShowForm(true) }}>
            <Plus size={15} strokeWidth={1.75} />Nouvelle assurance
          </Button>
        }
      />
      <div className="p-6">
        <Card padding={false}>
          <CardHeader title="Organismes" icon={<Shield size={16} strokeWidth={1.75} />}
            subtitle={`${(assurances as Assurance[]).length} organisme(s)`} />
          {isLoading ? <div className="flex justify-center py-8"><Spinner size={24} /></div>
          : (assurances as Assurance[]).length === 0
            ? <EmptyState icon={<Shield size={22} strokeWidth={1.5} />} title="Aucune assurance"
                action={<Button size="sm" onClick={() => setShowForm(true)}><Plus size={14} />Ajouter</Button>} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>{['Organisme','Code','Taux par défaut',''].map((h,i) => (
                    <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-ink-faint uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(assurances as Assurance[]).map(a => (
                    <tr key={a.id} className="border-b border-surface-50 hover:bg-surface-50">
                      <td className="px-5 py-3.5 font-semibold text-ink">{a.nom}</td>
                      <td className="px-5 py-3.5"><code className="bg-surface-100 px-2 py-0.5 rounded text-xs font-bold">{a.code}</code></td>
                      <td className="px-5 py-3.5 font-bold text-primary-600">{a.taux_defaut}%</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => openEdit(a)}
                          className="p-1.5 rounded-lg text-ink-faint hover:text-primary-600 hover:bg-primary-50 transition-colors">
                          <Pencil size={14} strokeWidth={1.75} />
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

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); reset() }}
        title={editing ? "Modifier l'assurance" : 'Nouvelle assurance'}>
        <form onSubmit={handleSubmit(d => saveMut.mutate(d))} className="space-y-4">
          <Input {...register('nom')} label="Nom de l'organisme *" placeholder="CNPS" error={errors.nom?.message} />
          <div className="grid grid-cols-2 gap-3">
            <Input {...register('code')} label="Code *" placeholder="CNPS" error={errors.code?.message} />
            <Input {...register('taux_defaut')} label="Taux par défaut (%)" type="number" placeholder="70" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowForm(false); setEditing(null); reset() }}>Annuler</Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">
              <CheckCircle size={15} strokeWidth={1.75} />{editing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE : Personnel — Flow 3 étapes
// ══════════════════════════════════════════════════════════════════════════════

const ROLES_OPTIONS = [
  { value: 'caissiere',  label: 'Caissière',     desc: 'Enregistrement patients, validation paiements, clôture de caisse' },
  { value: 'comptable',  label: 'Comptable',      desc: 'Caissière + validation versements, rapports financiers' },
  { value: 'directrice', label: 'Directrice',     desc: 'Comptable + configuration complète de la clinique' },
]

const ROLE_COLORS: Record<string, any> = {
  caissiere: 'warning', comptable: 'info', directrice: 'success', super_admin: 'error'
}

// Étape 1 : compte
const step1Schema = z.object({
  prenom: z.string().min(1, 'Prénom requis'),
  nom: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  matricule: z.string().optional(),
  mot_de_passe: z.string().min(8, 'Minimum 8 caractères'),
})
type Step1Form = z.infer<typeof step1Schema>

function StepIndicator({ step }: { step: number }) {
  const steps = [
    { num: 1, label: 'Compte', icon: <User size={14} strokeWidth={1.75} /> },
    { num: 2, label: 'Modules', icon: <Layers size={14} strokeWidth={1.75} /> },
    { num: 3, label: 'Rôle', icon: <ShieldCheck size={14} strokeWidth={1.75} /> },
  ]
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
            ${step === s.num ? 'bg-primary-600 text-white border-primary-600'
              : step > s.num ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-surface-100 text-ink-faint border-surface-200'}`}>
            {step > s.num ? <CheckCircle size={12} /> : s.icon}
            {s.label}
          </div>
          {i < steps.length - 1 && <ChevronRight size={14} className="text-ink-faint flex-shrink-0" />}
        </div>
      ))}
    </div>
  )
}

function NouveauCompteModal({ open, onClose, onSuccess }: {
  open: boolean; onClose: () => void; onSuccess: () => void
}) {
  const qc = useQueryClient()
  const [step, setStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null)
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: modulesData = [] } = useQuery({
    queryKey: ['modules-config'],
    queryFn: () => authAPI.modules().then(r => r.data.data),
    enabled: open,
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
  })

  const handleClose = () => {
    setStep(1); setStep1Data(null); setSelectedModules([]); setSelectedRole(''); reset()
    onClose()
  }

  const onStep1 = (data: Step1Form) => {
    setStep1Data(data)
    setStep(2)
  }

  const onStep2 = () => {
    if (selectedModules.length === 0) { toast.error('Sélectionner au moins un module'); return }
    setStep(3)
  }

  const onStep3 = async () => {
    if (!selectedRole) { toast.error('Sélectionner un rôle'); return }
    if (!step1Data) return

    setLoading(true)
    try {
      // Créer le compte (sans rôle défini dans le payload — on assigne après)
      const res = await authAPI.users.create({
        ...step1Data,
        role: selectedRole,
        modules_ids: selectedModules,
      })
      const user = res.data.data || res.data

      toast.success(`Compte créé — ${user.prenom} ${user.nom} · ${ROLES_OPTIONS.find(r => r.value === selectedRole)?.label}`)
      qc.invalidateQueries({ queryKey: ['personnel'] })
      onSuccess()
      handleClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.erreur || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = (code: string) => {
    setSelectedModules(prev =>
      prev.includes(code) ? prev.filter(m => m !== code) : [...prev, code]
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nouveau compte" size="md">
      <StepIndicator step={step} />

      {/* ÉTAPE 1 : Compte */}
      {step === 1 && (
        <form onSubmit={handleSubmit(onStep1)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input {...register('prenom')} label="Prénom *" leftIcon={<User size={14} strokeWidth={1.75} />}
              placeholder="Aminata" error={errors.prenom?.message} />
            <Input {...register('nom')} label="Nom *" placeholder="KONÉ" error={errors.nom?.message} />
          </div>
          <Input {...register('email')} label="Email *" type="email"
            leftIcon={<Mail size={14} strokeWidth={1.75} />}
            placeholder="a.kone@clinique.ci" error={errors.email?.message} />
          <div className="grid grid-cols-2 gap-3">
            <Input {...register('matricule')} label="Matricule"
              leftIcon={<Hash size={14} strokeWidth={1.75} />} placeholder="EMP-001" />
            <Input {...register('mot_de_passe')} label="Mot de passe provisoire *"
              type="password" leftIcon={<KeyRound size={14} strokeWidth={1.75} />}
              error={errors.mot_de_passe?.message} />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={isSubmitting}>
              Suivant <ArrowRight size={15} />
            </Button>
          </div>
        </form>
      )}

      {/* ÉTAPE 2 : Modules */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Sélectionnez les modules accessibles à <strong>{step1Data?.prenom} {step1Data?.nom}</strong>.
          </p>
          <div className="space-y-2">
            {(modulesData as any[]).map(m => (
              <label key={m.code}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                  ${selectedModules.includes(m.code)
                    ? 'bg-primary-50 border-primary-200'
                    : 'bg-surface-50 border-surface-200 hover:border-surface-300'}`}
                onClick={() => toggleModule(m.code)}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${selectedModules.includes(m.code) ? 'bg-primary-600 text-white' : 'bg-surface-200 text-ink-faint'}`}>
                  <Package size={15} strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-ink">{m.nom}</div>
                </div>
                {selectedModules.includes(m.code) && <CheckCircle size={16} className="text-primary-600 flex-shrink-0" />}
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft size={15} />Retour
            </Button>
            <Button className="flex-1" onClick={onStep2}>
              Suivant <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 : Rôle */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Choisissez le rôle de <strong>{step1Data?.prenom} {step1Data?.nom}</strong>.
            Les permissions seront assignées automatiquement.
          </p>
          <div className="space-y-2">
            {ROLES_OPTIONS.map(r => (
              <label key={r.value}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all
                  ${selectedRole === r.value
                    ? 'bg-primary-50 border-primary-200'
                    : 'bg-surface-50 border-surface-200 hover:border-surface-300'}`}
                onClick={() => setSelectedRole(r.value)}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                  ${selectedRole === r.value ? 'bg-primary-600 text-white' : 'bg-surface-200 text-ink-faint'}`}>
                  <ShieldCheck size={16} strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-ink">{r.label}</div>
                  <div className="text-xs text-ink-faint mt-0.5">{r.desc}</div>
                </div>
                {selectedRole === r.value && <CheckCircle size={16} className="text-primary-600 flex-shrink-0 mt-1" />}
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft size={15} />Retour
            </Button>
            <Button className="flex-1" loading={loading} onClick={onStep3}
              disabled={!selectedRole}>
              <CheckCircle size={15} strokeWidth={1.75} />Créer le compte
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export function Personnel() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [newRole, setNewRole] = useState('')
  const [loadingRole, setLoadingRole] = useState(false)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['personnel'],
    queryFn: () => authAPI.users.list().then(r => r.data.data),
  })

  const deactivateMut = useMutation({
    mutationFn: (id: string) => authAPI.users.deactivate(id),
    onSuccess: () => { toast.success('Compte désactivé'); qc.invalidateQueries({ queryKey: ['personnel'] }) },
  })

  const handleChangeRole = async () => {
    if (!newRole || !editingRole) return
    setLoadingRole(true)
    try {
      await authAPI.users.assignerRole(editingRole.id, newRole)
      toast.success(`Rôle mis à jour — ${editingRole.prenom} est maintenant ${ROLES_OPTIONS.find(r => r.value === newRole)?.label}`)
      qc.invalidateQueries({ queryKey: ['personnel'] })
      setEditingRole(null); setNewRole('')
    } catch (e: any) {
      toast.error(e?.response?.data?.erreur || 'Erreur')
    } finally {
      setLoadingRole(false)
    }
  }

  return (
    <AppLayout>
      <Topbar title="Personnel" subtitle="Gestion des comptes et rôles"
        actions={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <UserPlus size={15} strokeWidth={1.75} />Nouveau compte
          </Button>
        }
      />
      <div className="p-6">
        <Card padding={false}>
          <CardHeader title="Équipe" icon={<UserCog size={16} strokeWidth={1.75} />}
            subtitle={`${(users as any[]).length} compte(s)`} />
          {isLoading ? <div className="flex justify-center py-8"><Spinner size={24} /></div>
          : (users as any[]).length === 0
            ? <EmptyState icon={<UserCog size={22} strokeWidth={1.5} />} title="Aucun compte"
                action={<Button size="sm" onClick={() => setShowForm(true)}><UserPlus size={14} />Ajouter</Button>} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>{['Utilisateur','Rôle','Modules','Statut','Créé le',''].map((h,i) => (
                    <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-ink-faint uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(users as any[]).map(u => (
                    <tr key={u.id} className="border-b border-surface-50 hover:bg-surface-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                            {u.prenom[0]}{u.nom[0]}
                          </div>
                          <div>
                            <div className="font-bold text-ink">{u.prenom} {u.nom}</div>
                            <div className="text-xs text-ink-faint">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={ROLE_COLORS[u.role] || 'neutral'}>{u.role_display}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1 flex-wrap">
                          {u.modules?.map((m: any) => (
                            <span key={m.code} className="text-xs bg-surface-100 text-ink-muted px-2 py-0.5 rounded-full font-medium">
                              {m.nom}
                            </span>
                          ))}
                          {(!u.modules || u.modules.length === 0) && <span className="text-xs text-ink-faint">Aucun</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={u.is_active ? 'success' : 'error'}>
                          {u.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-ink-faint">
                        {format(new Date(u.date_creation), 'dd/MM/yyyy', { locale: fr })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingRole(u); setNewRole(u.role) }}
                            className="p-1.5 rounded-lg text-ink-faint hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Changer le rôle">
                            <ShieldCheck size={14} strokeWidth={1.75} />
                          </button>
                          {u.is_active && u.role !== 'super_admin' && (
                            <button onClick={() => deactivateMut.mutate(u.id)}
                              className="p-1.5 rounded-lg text-ink-faint hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Désactiver">
                              <X size={14} strokeWidth={1.75} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modal création 3 étapes */}
      <NouveauCompteModal open={showForm} onClose={() => setShowForm(false)} onSuccess={() => {}} />

      {/* Modal changement de rôle */}
      <Modal open={!!editingRole} onClose={() => { setEditingRole(null); setNewRole('') }}
        title="Modifier le rôle" size="sm">
        {editingRole && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-surface-50 rounded-xl p-3">
              <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-black">
                {editingRole.prenom[0]}{editingRole.nom[0]}
              </div>
              <div>
                <div className="font-bold text-sm text-ink">{editingRole.prenom} {editingRole.nom}</div>
                <div className="text-xs text-ink-faint">Rôle actuel : {editingRole.role_display}</div>
              </div>
            </div>
            <div className="space-y-2">
              {ROLES_OPTIONS.map(r => (
                <label key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                    ${newRole === r.value ? 'bg-primary-50 border-primary-200' : 'bg-surface-50 border-surface-200 hover:border-surface-300'}`}
                  onClick={() => setNewRole(r.value)}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                    ${newRole === r.value ? 'bg-primary-600 text-white' : 'bg-surface-200 text-ink-faint'}`}>
                    <ShieldCheck size={13} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-ink">{r.label}</div>
                    <div className="text-xs text-ink-faint">{r.desc}</div>
                  </div>
                  {newRole === r.value && <CheckCircle size={14} className="text-primary-600" />}
                </label>
              ))}
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Les permissions seront recalculées automatiquement selon le nouveau rôle.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => { setEditingRole(null); setNewRole('') }}>Annuler</Button>
              <Button className="flex-1" loading={loadingRole} onClick={handleChangeRole}
                disabled={newRole === editingRole.role}>
                <CheckCircle size={15} strokeWidth={1.75} />Appliquer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE : Paramètres clinique
// ══════════════════════════════════════════════════════════════════════════════
export function ParametresClinique() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['parametres'],
    queryFn: () => configAPI.parametres.get().then(r => r.data.data),
  })

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    values: data || {},
  })

  const saveMut = useMutation({
    mutationFn: (d: any) => configAPI.parametres.update(d),
    onSuccess: () => { toast.success('Paramètres enregistrés'); qc.invalidateQueries({ queryKey: ['parametres'] }) },
    onError: (e: any) => toast.error(e?.response?.data?.erreur || 'Erreur'),
  })

  return (
    <AppLayout>
      <Topbar title="Paramètres" subtitle="Configuration de la clinique" />
      <div className="p-6 max-w-2xl">
        {isLoading ? <div className="flex justify-center py-8"><Spinner size={24} /></div> : (
          <Card>
            <CardHeader title="Informations de la clinique" icon={<SlidersHorizontal size={16} strokeWidth={1.75} />} />
            <form onSubmit={handleSubmit(d => saveMut.mutate(d))} className="space-y-4">
              <Input {...register('nom_clinique')} label="Nom de la clinique" placeholder="Clinique Sainte-Marie" />
              <div className="grid grid-cols-2 gap-3">
                <Input {...register('telephone')} label="Téléphone" placeholder="+225 27 XX XX XX" />
                <Input {...register('email')} label="Email" type="email" placeholder="contact@clinique.ci" />
              </div>
              <Input {...register('adresse')} label="Adresse" placeholder="Cocody, Abidjan" />
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={isSubmitting}>
                  <CheckCircle size={15} strokeWidth={1.75} />Enregistrer
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
