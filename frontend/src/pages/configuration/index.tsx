import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { configAPI, authAPI } from '@/services/api'
import { AppLayout, Topbar } from '@/components/layout/AppLayout'
import {
  Button, Card, CardHeader, Input, Select, Textarea,
  Badge, Modal, EmptyState, Spinner
} from '@/components/ui'
import type { Prestation, Assurance, UtilisateurPersonnel } from '@/types'

// ══════════════════════════════════════════════════════════════════════════════
// PAGE : Prestations
// ══════════════════════════════════════════════════════════════════════════════
const prestationSchema = z.object({
  nom: z.string().min(1, 'Libellé requis'),
  emoji: z.string().min(1, 'Emoji requis').max(4),
  prix: z.coerce.number().min(0, 'Prix invalide'),
  prise_en_charge_assurance: z.boolean().default(false),
  taux_assurance: z.coerce.number().min(0).max(100).default(0),
  ordre: z.coerce.number().default(0),
})
type PrestationForm = z.infer<typeof prestationSchema>

export function Prestations() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Prestation | null>(null)
  const [showAll, setShowAll] = useState(false)

  const { data: prestations = [], isLoading } = useQuery<Prestation[]>({
    queryKey: ['prestations-all', showAll],
    queryFn: () => configAPI.prestations.list(showAll ? { actif: 'all' } : {}).then(r => r.data.data),
  })

  const { register, watch, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<PrestationForm>({
    resolver: zodResolver(prestationSchema),
  })

  const pAssurance = watch('prise_en_charge_assurance')

  const saveMut = useMutation({
    mutationFn: (data: PrestationForm) =>
      editing
        ? configAPI.prestations.update(editing.id, data)
        : configAPI.prestations.create(data),
    onSuccess: () => {
      toast.success(editing ? 'Prestation mise à jour' : 'Prestation créée')
      reset(); setShowForm(false); setEditing(null)
      qc.invalidateQueries({ queryKey: ['prestations'] })
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
    setValue('nom', p.nom); setValue('emoji', p.emoji)
    setValue('prix', Number(p.prix))
    setValue('prise_en_charge_assurance', p.prise_en_charge_assurance)
    setValue('taux_assurance', Number(p.taux_assurance))
    setValue('ordre', p.ordre)
    setShowForm(true)
  }

  return (
    <AppLayout>
      <Topbar title="Prestations" subtitle="Gestion des actes médicaux"
        actions={
          <Button size="sm" onClick={() => { setEditing(null); reset(); setShowForm(true) }}>
            ➕ Nouvelle prestation
          </Button>
        }
      />
      <div className="p-6">
        <Card padding={false}>
          <CardHeader title="Liste des prestations" emoji="🩺"
            action={
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 cursor-pointer">
                <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="accent-teal" />
                Afficher inactives
              </label>
            }
          />
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner size={24} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Prestation', 'Prix', 'Assurance', 'Taux', 'Ordre', 'Statut', ''].map((h, i) => (
                      <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prestations.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{p.emoji}</span>
                          <span className="font-bold text-gray-900">{p.nom}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-bold">{Number(p.prix).toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-5 py-3.5">
                        {p.prise_en_charge_assurance ? <Badge variant="info">🛡️ Oui</Badge> : <Badge>Non</Badge>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{p.taux_assurance}%</td>
                      <td className="px-5 py-3.5 text-gray-400">{p.ordre}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={p.actif ? 'success' : 'error'}>{p.actif ? '✅ Active' : '❌ Inactive'}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(p)} className="text-xs font-bold text-teal hover:text-teal-dark px-2 py-1 rounded hover:bg-teal-light">✏️</button>
                          {p.actif && (
                            <button onClick={() => deleteMut.mutate(p.id)} className="text-xs font-bold text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {prestations.length === 0 && <EmptyState emoji="🩺" title="Aucune prestation" />}
            </div>
          )}
        </Card>

        <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }}
          title={editing ? '✏️ Modifier la prestation' : '➕ Nouvelle prestation'}>
          <form onSubmit={handleSubmit(d => saveMut.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <Input {...register('emoji')} label="Emoji" placeholder="🩺" error={errors.emoji?.message} className="col-span-1" />
              <div className="col-span-3"><Input {...register('nom')} label="Libellé *" placeholder="Consultation générale" error={errors.nom?.message} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input {...register('prix')} label="Prix (FCFA) *" type="number" error={errors.prix?.message} />
              <Input {...register('ordre')} label="Ordre affichage" type="number" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('prise_en_charge_assurance')} className="accent-teal" />
              <span className="text-sm font-semibold text-gray-700">🛡️ Prise en charge assurance</span>
            </label>
            {pAssurance && (
              <Input {...register('taux_assurance')} label="Taux assurance (%)" type="number" placeholder="70" error={errors.taux_assurance?.message} />
            )}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowForm(false); setEditing(null) }}>Annuler</Button>
              <Button type="submit" loading={isSubmitting} className="flex-1">💾 Enregistrer</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE : Assurances
// ══════════════════════════════════════════════════════════════════════════════
const assuranceSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  code: z.string().min(1, 'Code requis').max(20),
  taux_defaut: z.coerce.number().min(0).max(100),
})
type AssuranceForm = z.infer<typeof assuranceSchema>

export function Assurances() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Assurance | null>(null)

  const { data: assurances = [], isLoading } = useQuery<Assurance[]>({
    queryKey: ['assurances-all'],
    queryFn: () => configAPI.assurances.list({ actif: 'all' }).then(r => r.data.data),
  })

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<AssuranceForm>({
    resolver: zodResolver(assuranceSchema),
  })

  const saveMut = useMutation({
    mutationFn: (data: AssuranceForm) =>
      editing ? configAPI.assurances.update(editing.id, data) : configAPI.assurances.create(data),
    onSuccess: () => {
      toast.success(editing ? 'Assurance mise à jour' : 'Assurance créée')
      reset(); setShowForm(false); setEditing(null)
      qc.invalidateQueries({ queryKey: ['assurances-all'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.erreur || 'Erreur'),
  })

  const openEdit = (a: Assurance) => {
    setEditing(a)
    setValue('nom', a.nom); setValue('code', a.code); setValue('taux_defaut', Number(a.taux_defaut))
    setShowForm(true)
  }

  return (
    <AppLayout>
      <Topbar title="Assurances" subtitle="Organismes partenaires"
        actions={<Button size="sm" onClick={() => { setEditing(null); reset(); setShowForm(true) }}>➕ Nouvelle assurance</Button>}
      />
      <div className="p-6">
        <Card padding={false}>
          <CardHeader title="Organismes d'assurance" emoji="🛡️" />
          {isLoading ? <div className="flex justify-center py-8"><Spinner /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Nom', 'Code', 'Taux par défaut', 'Statut', ''].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {assurances.map((a) => (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-bold">{a.nom}</td>
                      <td className="px-5 py-3.5"><code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{a.code}</code></td>
                      <td className="px-5 py-3.5 font-semibold text-violet-700">{a.taux_defaut}%</td>
                      <td className="px-5 py-3.5"><Badge variant={a.actif ? 'success' : 'error'}>{a.actif ? '✅ Active' : '❌ Inactive'}</Badge></td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => openEdit(a)} className="text-xs font-bold text-teal hover:text-teal-dark px-2 py-1 rounded hover:bg-teal-light">✏️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {assurances.length === 0 && <EmptyState emoji="🛡️" title="Aucune assurance" />}
            </div>
          )}
        </Card>

        <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }}
          title={editing ? '✏️ Modifier' : '➕ Nouvelle assurance'}>
          <form onSubmit={handleSubmit(d => saveMut.mutate(d))} className="space-y-4">
            <Input {...register('nom')} label="Nom *" placeholder="CNPS" error={errors.nom?.message} />
            <div className="grid grid-cols-2 gap-3">
              <Input {...register('code')} label="Code *" placeholder="CNPS-CI" error={errors.code?.message} />
              <Input {...register('taux_defaut')} label="Taux par défaut (%)" type="number" placeholder="80" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowForm(false); setEditing(null) }}>Annuler</Button>
              <Button type="submit" loading={isSubmitting} className="flex-1">💾 Enregistrer</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE : Personnel
// ══════════════════════════════════════════════════════════════════════════════
const personnelSchema = z.object({
  nom: z.string().min(1), prenom: z.string().min(1),
  email: z.string().email('Email invalide'),
  matricule: z.string().optional(),
  role: z.enum(['caissiere', 'comptable', 'directrice', 'super_admin']),
  mot_de_passe: z.string().min(8, 'Min 8 caractères'),
  modules_ids: z.array(z.string()).default([]),
  permissions_codes: z.array(z.string()).default([]),
})
type PersonnelForm = z.infer<typeof personnelSchema>

export function Personnel() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: users = [], isLoading } = useQuery<UtilisateurPersonnel[]>({
    queryKey: ['personnel'],
    queryFn: () => authAPI.users.list().then(r => r.data.data),
  })

  const { data: modulesData } = useQuery({
    queryKey: ['modules-config'],
    queryFn: () => authAPI.modules().then(r => r.data.data),
  })

  const { register, watch, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PersonnelForm>({
    resolver: zodResolver(personnelSchema),
    defaultValues: { modules_ids: [], permissions_codes: [] },
  })

  const createMut = useMutation({
    mutationFn: (data: PersonnelForm) => authAPI.users.create(data),
    onSuccess: () => {
      toast.success('Utilisateur créé')
      reset(); setShowForm(false)
      qc.invalidateQueries({ queryKey: ['personnel'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.erreur || 'Erreur'),
  })

  const deactivateMut = useMutation({
    mutationFn: (id: string) => authAPI.users.deactivate(id),
    onSuccess: () => { toast.success('Compte désactivé'); qc.invalidateQueries({ queryKey: ['personnel'] }) },
  })

  const roleColor: Record<string, any> = {
    caissiere: 'warning', comptable: 'info', directrice: 'success', super_admin: 'error'
  }

  return (
    <AppLayout>
      <Topbar title="Personnel" subtitle="Gestion des comptes utilisateurs"
        actions={<Button size="sm" onClick={() => { reset(); setShowForm(true) }}>➕ Nouveau compte</Button>}
      />
      <div className="p-6">
        <Card padding={false}>
          <CardHeader title="Équipe" emoji="👔" />
          {isLoading ? <div className="flex justify-center py-8"><Spinner /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Utilisateur', 'Rôle', 'Modules', 'Statut', 'Créé le', ''].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-dark to-teal flex items-center justify-center text-white text-xs font-black">
                            {u.prenom[0]}{u.nom[0]}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{u.prenom} {u.nom}</div>
                            <div className="text-xs text-gray-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={roleColor[u.role] || 'neutral'}>{u.role_display}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1 flex-wrap">
                          {u.modules.map((m) => (
                            <span key={m.code} className="text-base" title={m.nom}>{m.emoji}</span>
                          ))}
                          {u.modules.length === 0 && <span className="text-xs text-gray-400">Aucun</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={u.is_active ? 'success' : 'error'}>{u.is_active ? '✅ Actif' : '❌ Inactif'}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">
                        {new Date(u.date_creation).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-5 py-3.5">
                        {u.is_active && (
                          <button onClick={() => deactivateMut.mutate(u.id)}
                            className="text-xs font-bold text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">
                            Désactiver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <EmptyState emoji="👔" title="Aucun utilisateur" />}
            </div>
          )}
        </Card>

        <Modal open={showForm} onClose={() => setShowForm(false)} title="➕ Nouveau compte" size="lg">
          <form onSubmit={handleSubmit(d => createMut.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input {...register('prenom')} label="Prénom *" error={errors.prenom?.message} />
              <Input {...register('nom')} label="Nom *" error={errors.nom?.message} />
            </div>
            <Input {...register('email')} label="Email *" type="email" error={errors.email?.message} />
            <div className="grid grid-cols-2 gap-3">
              <Input {...register('matricule')} label="Matricule" placeholder="EMP-001" />
              <Select {...register('role')} label="Rôle *"
                options={[
                  { value: 'caissiere', label: '💰 Caissière' },
                  { value: 'comptable', label: '📊 Comptable' },
                  { value: 'directrice', label: '👑 Directrice' },
                ]}
                error={errors.role?.message}
              />
            </div>
            <Input {...register('mot_de_passe')} label="Mot de passe provisoire *" type="password" error={errors.mot_de_passe?.message} />

            {modulesData && (
              <div>
                <label className="text-xs font-bold text-gray-600 tracking-wide mb-2 block">Modules autorisés</label>
                <div className="space-y-2">
                  {modulesData.map((m: any) => (
                    <label key={m.code} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                      <input type="checkbox" value={m.code} {...register('modules_ids')} className="accent-teal" />
                      <span>{m.emoji} {m.nom}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" loading={isSubmitting} className="flex-1">✅ Créer le compte</Button>
            </div>
          </form>
        </Modal>
      </div>
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
    values: data,
  })

  const saveMut = useMutation({
    mutationFn: (d: any) => configAPI.parametres.update(d),
    onSuccess: () => { toast.success('Paramètres sauvegardés'); qc.invalidateQueries({ queryKey: ['parametres'] }) },
    onError: (e: any) => toast.error(e?.response?.data?.erreur || 'Erreur'),
  })

  if (isLoading) return <AppLayout><Topbar title="Paramètres" /><div className="flex justify-center pt-16"><Spinner size={28} /></div></AppLayout>

  return (
    <AppLayout>
      <Topbar title="Paramètres clinique" subtitle="Informations générales" />
      <div className="p-6">
        <form onSubmit={handleSubmit(d => saveMut.mutate(d))} className="space-y-5 max-w-2xl">
          <Card>
            <CardHeader title="Identité" emoji="🏥" />
            <div className="space-y-4">
              <Input {...register('nom')} label="Nom de la clinique *" placeholder="Ma Clinique" />
              <Input {...register('slogan')} label="Slogan" placeholder="Votre santé, notre priorité" />
              <Textarea {...register('adresse')} label="Adresse" placeholder="Cocody, Abidjan, Côte d'Ivoire" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Contact" emoji="📞" />
            <div className="grid grid-cols-2 gap-4">
              <Input {...register('telephone')} label="Téléphone" placeholder="+225 27 XX XX XX" />
              <Input {...register('email')} label="Email" type="email" />
              <Input {...register('site_web')} label="Site web" placeholder="https://..." />
              <Input {...register('monnaie')} label="Monnaie" defaultValue="FCFA" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Informations légales" emoji="📋" />
            <Textarea {...register('informations_legales')} rows={4} placeholder="RCCM, NCC, mentions légales..." />
          </Card>
          <Button type="submit" loading={isSubmitting} size="lg">💾 Sauvegarder</Button>
        </form>
      </div>
    </AppLayout>
  )
}
