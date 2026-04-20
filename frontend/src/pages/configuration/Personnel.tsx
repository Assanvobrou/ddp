/**
 * Personnel — Gestion des comptes
 * 
 * Création en 2 étapes :
 *   Étape 1 : Informations personnelles complètes
 *   Étape 2 : Identifiant (matricule) unique vérifié en base + mot de passe
 * 
 * Logique matricule unique :
 *   1. prenom[0].nom → b.assanvo
 *   2. prenom[1].nom → si pris → r.assanvo
 *   3. deuxiemePrenom[0].nom → si pris → a.assanvo
 *   4. deuxiemePrenom[1].nom → si pris → m.assanvo
 *   Vérification en temps réel via API
 * 
 * Rubrique Utilisateurs : changement de mot de passe par l'admin
 */
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  UserPlus, ShieldCheck, CheckCircle, ArrowRight, ArrowLeft,
  X, KeyRound, Eye, EyeOff, UserCog, Users,
  Check, AlertCircle, Loader2
} from 'lucide-react'
import { authAPI } from '@/services/api'
import { AppLayout, Topbar } from '@/components/layout/AppLayout'
import { Button, Card, CardHeader, Badge, Modal, EmptyState, Spinner } from '@/components/ui'

// ── Utilitaires ───────────────────────────────────────────────────────────────
function slug(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Génère les candidats matricule dans l'ordre de priorité.
 * prenom peut contenir plusieurs prénoms séparés par des espaces.
 */
function candidatsMatricule(prenom: string, nom: string): string[] {
  const prenoms = prenom.trim().split(/\s+/).map(slug).filter(Boolean)
  const n = slug(nom)
  if (!n || prenoms.length === 0) return []

  const candidats: string[] = []
  const p1 = prenoms[0]
  const p2 = prenoms[1] || ''

  // Lettres du premier prénom
  for (let i = 0; i < Math.min(p1.length, 3); i++) {
    candidats.push(`${p1[i]}.${n}`)
  }
  // Lettres du deuxième prénom si présent
  if (p2) {
    for (let i = 0; i < Math.min(p2.length, 3); i++) {
      candidats.push(`${p2[i]}.${n}`)
    }
  }
  return [...new Set(candidats)] // dédoublonner
}

async function trouverMatriculeDisponible(prenom: string, nom: string): Promise<string> {
  const candidats = candidatsMatricule(prenom, nom)
  if (candidats.length === 0) return ''
  
  for (const candidat of candidats) {
    try {
      const res = await authAPI.users.checkMatricule(candidat)
      if (res.data.disponible) return candidat
    } catch { /* continuer */ }
  }
  // Fallback avec suffixe numérique
  const base = candidats[0]
  for (let i = 2; i <= 99; i++) {
    const m = `${base}${i}`
    try {
      const res = await authAPI.users.checkMatricule(m)
      if (res.data.disponible) return m
    } catch { /* continuer */ }
  }
  return candidats[0]
}

const ROLES = [
  { value: 'caissiere',  label: 'Caissière',  desc: 'Enregistrement patients, validation paiements, clôture' },
  { value: 'comptable',  label: 'Comptable',  desc: 'Caissière + validation versements, rapports' },
  { value: 'directrice', label: 'Directrice', desc: 'Accès complet + configuration clinique' },
]
const ROLE_COLORS: Record<string, any> = {
  caissiere: 'warning', comptable: 'info', directrice: 'success', super_admin: 'error'
}
const SITUATIONS = [
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'marie',       label: 'Marié(e)' },
  { value: 'divorce',     label: 'Divorcé(e)' },
  { value: 'veuf',        label: 'Veuf / Veuve' },
]

// ── Composant champ ───────────────────────────────────────────────────────────
function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-ink-muted">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
function TextInput({ value, onChange, placeholder, type = 'text', className = '' }: any) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder}
      className={`h-11 px-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:border-primary-600 focus:bg-white transition-colors ${className}`} />
  )
}
function SelectInput({ value, onChange, options, placeholder }: any) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-11 px-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:border-primary-600 focus:bg-white transition-colors">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL CRÉATION — 2 ÉTAPES
// ══════════════════════════════════════════════════════════════════════════════
function ModalCreation({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Étape 1 — infos personnelles
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [role, setRole] = useState('')
  const [rolesSupp, setRolesSupp] = useState<string[]>([])

  const toggleRoleSupp = (r: string) => setRolesSupp(prev =>
    prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
  )
  const [telephone, setTelephone] = useState('')
  const [telephone2, setTelephone2] = useState('')
  const [ville, setVille] = useState('')
  const [quartier, setQuartier] = useState('')
  const [dateNaissance, setDateNaissance] = useState('')
  const [situation, setSituation] = useState('')

  // Étape 2 — connexion
  const [matricule, setMatricule] = useState('')
  const [matriculeStatus, setMatriculeStatus] = useState<'idle'|'checking'|'ok'|'taken'>('idle')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const reset = () => {
    setStep(1); setErrors({})
    setPrenom(''); setNom(''); setRole(''); setRolesSupp([]); setTelephone(''); setTelephone2('')
    setVille(''); setQuartier(''); setDateNaissance(''); setSituation('')
    setMatricule(''); setMatriculeStatus('idle'); setPassword('')
  }

  const handleClose = () => { reset(); onClose() }

  // Vérification matricule en temps réel
  const checkMatricule = useCallback(async (m: string) => {
    if (!m) { setMatriculeStatus('idle'); return }
    setMatriculeStatus('checking')
    try {
      const res = await authAPI.users.checkMatricule(m)
      setMatriculeStatus(res.data.disponible ? 'ok' : 'taken')
    } catch {
      setMatriculeStatus('idle')
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => checkMatricule(matricule), 400)
    return () => clearTimeout(t)
  }, [matricule, checkMatricule])

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!prenom.trim()) e.prenom = 'Prénom requis'
    if (!nom.trim()) e.nom = 'Nom requis'
    if (!role) e.role = 'Rôle requis'
    if (!telephone.trim()) e.telephone = 'Téléphone requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleStep1 = async () => {
    if (!validateStep1()) return
    setLoading(true)
    try {
      const suggested = await trouverMatriculeDisponible(prenom, nom)
      setMatricule(suggested)
      setMatriculeStatus('ok')
    } finally {
      setLoading(false)
    }
    setStep(2)
  }

  const handleCreate = async () => {
    const e: Record<string, string> = {}
    if (!matricule.trim()) e.matricule = 'Identifiant requis'
    if (matriculeStatus === 'taken') e.matricule = 'Identifiant déjà utilisé'
    if (!password || password.length < 4) e.password = 'Minimum 4 caractères'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setLoading(true)
    try {
      await authAPI.users.create({
        prenom, nom, role,
        matricule: matricule.toLowerCase().trim(),
        mot_de_passe: password,
        roles_supplementaires: rolesSupp,
        telephone, telephone2, ville, quartier,
        date_naissance: dateNaissance || null,
        situation_matrimoniale: situation,
      })
      toast.success(`Compte créé — ${prenom} ${nom} · ${matricule}`)
      qc.invalidateQueries({ queryKey: ['personnel'] })
      handleClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.erreur || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-fade-up">

        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-ink">{step === 1 ? 'Nouveau compte' : 'Identifiant de connexion'}</h3>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-ink-faint hover:bg-surface-100"><X size={15} /></button>
        </div>

        {/* Indicateur étapes */}
        <div className="flex items-center gap-2 mb-5">
          {[{n:1,l:'Informations'},{n:2,l:'Connexion'}].map((s,i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                ${step===s.n ? 'bg-primary-600 text-white border-primary-600'
                  : step>s.n ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-surface-100 text-ink-faint border-surface-200'}`}>
                {step>s.n && <CheckCircle size={11} />}{s.l}
              </div>
              {i<1 && <ArrowRight size={13} className="text-ink-faint" />}
            </div>
          ))}
        </div>

        {/* ── ÉTAPE 1 ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom(s)" required error={errors.prenom}>
                <TextInput value={prenom} onChange={setPrenom} placeholder="Aminata Marie" />
              </Field>
              <Field label="Nom" required error={errors.nom}>
                <TextInput value={nom} onChange={setNom} placeholder="KONÉ" />
              </Field>
            </div>

            <Field label="Rôle" required error={errors.role}>
              <div className="space-y-2">
                {ROLES.map(r => (
                  <label key={r.value}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all
                      ${role===r.value ? 'bg-primary-50 border-primary-200' : 'bg-surface-50 border-surface-200 hover:border-surface-300'}`}
                    onClick={() => setRole(r.value)}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0
                      ${role===r.value ? 'bg-primary-600 text-white' : 'bg-surface-200 text-ink-faint'}`}>
                      <ShieldCheck size={12} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-ink">{r.label}</div>
                      <div className="text-xs text-ink-faint truncate">{r.desc}</div>
                    </div>
                    {role===r.value && <CheckCircle size={13} className="text-primary-600 flex-shrink-0" />}
                  </label>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Téléphone" required error={errors.telephone}>
                <TextInput value={telephone} onChange={setTelephone} placeholder="+225 07 XX XX XX" />
              </Field>
              <Field label="Téléphone 2 (optionnel)">
                <TextInput value={telephone2} onChange={setTelephone2} placeholder="+225 05 XX XX XX" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ville de résidence">
                <TextInput value={ville} onChange={setVille} placeholder="Abidjan" />
              </Field>
              <Field label="Quartier">
                <TextInput value={quartier} onChange={setQuartier} placeholder="Cocody" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date de naissance">
                <TextInput value={dateNaissance} onChange={setDateNaissance} type="date" />
              </Field>
              <Field label="Situation matrimoniale">
                <SelectInput value={situation} onChange={setSituation}
                  options={SITUATIONS} placeholder="Sélectionner..." />
              </Field>

            <Field label="Rôles supplémentaires (optionnel)">
              <div className="space-y-2">
                {ROLES.filter(r => r.value !== role).map(r => (
                  <label key={r.value}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all
                      ${rolesSupp.includes(r.value) ? 'bg-primary-50 border-primary-200' : 'bg-surface-50 border-surface-200 hover:border-surface-300'}`}
                    onClick={() => toggleRoleSupp(r.value)}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${rolesSupp.includes(r.value) ? 'bg-primary-600 border-primary-600' : 'border-surface-300'}`}>
                      {rolesSupp.includes(r.value) && <CheckCircle size={12} className="text-white" strokeWidth={2.5} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-ink">{r.label}</div>
                      <div className="text-xs text-ink-faint truncate">{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-ink-faint mt-1">Les droits de chaque rôle sélectionné sont cumulés.</p>
            </Field>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleStep1} loading={loading}>
                Suivant <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-surface-50 rounded-xl p-3 text-sm">
              <span className="text-ink-faint">Personnel : </span>
              <strong className="text-ink">{prenom} {nom}</strong>
              <span className="ml-2 text-xs text-ink-faint">· {ROLES.find(r=>r.value===role)?.label}</span>
            </div>

            <Field label="Identifiant de connexion" required error={errors.matricule}>
              <div className="relative">
                <input value={matricule}
                  onChange={e => setMatricule(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ''))}
                  className={`h-11 w-full px-3 pr-10 bg-surface-50 border rounded-xl text-sm font-mono outline-none transition-colors
                    ${matriculeStatus==='ok' ? 'border-green-400 bg-green-50'
                      : matriculeStatus==='taken' ? 'border-red-400 bg-red-50'
                      : 'border-surface-200 focus:border-primary-600'}`}
                  placeholder="b.assanvo" />
                <div className="absolute right-3 top-3">
                  {matriculeStatus==='checking' && <Loader2 size={15} className="animate-spin text-ink-faint" />}
                  {matriculeStatus==='ok' && <Check size={15} className="text-green-600" />}
                  {matriculeStatus==='taken' && <AlertCircle size={15} className="text-red-600" />}
                </div>
              </div>
              <p className="text-xs text-ink-faint">
                Format : première lettre du prénom + point + nom.
                {matriculeStatus==='ok' && <span className="text-green-600 font-medium"> Disponible</span>}
                {matriculeStatus==='taken' && <span className="text-red-600 font-medium"> Déjà utilisé — modifiez l'identifiant</span>}
              </p>
            </Field>

            <Field label="Mot de passe" required error={errors.password}>
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)}
                  type={showPwd ? 'text' : 'password'}
                  className="h-11 w-full px-3 pr-10 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:border-primary-600"
                  placeholder="Minimum 4 caractères" autoFocus />
                <button type="button" onClick={() => setShowPwd(v=>!v)}
                  className="absolute right-3 top-3 text-ink-faint hover:text-ink">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-xs text-ink-faint">Tout caractère accepté, 4 caractères minimum.</p>
            </Field>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft size={15} />Retour
              </Button>
              <Button className="flex-1" loading={loading}
                onClick={handleCreate} disabled={matriculeStatus==='taken'||matriculeStatus==='checking'}>
                <CheckCircle size={15} strokeWidth={1.75} />Créer le compte
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL CHANGER MOT DE PASSE
// ══════════════════════════════════════════════════════════════════════════════
function ModalChangerMdp({ user, onClose }: { user: any; onClose: () => void }) {
  const [pwd, setPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (pwd.length < 4) { toast.error('Minimum 4 caractères'); return }
    setLoading(true)
    try {
      await authAPI.users.changerMotDePasse(user.id, pwd)
      toast.success(`Mot de passe mis à jour — ${user.prenom} ${user.nom}`)
      onClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.erreur || 'Erreur')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface-50 rounded-xl p-3 text-sm">
        <span className="text-ink-faint">Utilisateur : </span>
        <strong className="text-ink">{user.prenom} {user.nom}</strong>
        <code className="ml-2 text-primary-700 text-xs font-bold">{user.matricule}</code>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink-muted">Nouveau mot de passe</label>
        <div className="relative">
          <input value={pwd} onChange={e => setPwd(e.target.value)}
            type={showPwd ? 'text' : 'password'}
            className="h-11 w-full px-3 pr-10 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:border-primary-600"
            placeholder="Minimum 4 caractères" autoFocus />
          <button type="button" onClick={() => setShowPwd(v=>!v)}
            className="absolute right-3 top-3 text-ink-faint hover:text-ink">
            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <p className="text-xs text-ink-faint">Tout caractère accepté, 4 caractères minimum.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
        <Button className="flex-1" loading={loading} onClick={handleSave}>
          <KeyRound size={15} strokeWidth={1.75} />Enregistrer
        </Button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE : PERSONNEL
// ══════════════════════════════════════════════════════════════════════════════
export function PersonnelList() {
  const [showCreate, setShowCreate] = useState(false)
  const qc = useQueryClient()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['personnel'],
    queryFn: () => authAPI.users.list().then(r => r.data.data),
  })

  const deactivateMut = useMutation({
    mutationFn: (id: string) => authAPI.users.deactivate(id),
    onSuccess: () => { toast.success('Compte désactivé'); qc.invalidateQueries({ queryKey: ['personnel'] }) },
  })

  return (
    <AppLayout>
      <Topbar title="Personnel" subtitle="Comptes de la clinique"
        actions={<Button size="sm" onClick={() => setShowCreate(true)}><UserPlus size={15} strokeWidth={1.75} />Nouveau compte</Button>} />
      <div className="p-6">
        <Card padding={false}>
          <CardHeader title="Équipe" icon={<UserCog size={16} strokeWidth={1.75} />}
            subtitle={`${(users as any[]).length} compte(s)`} />
          {isLoading ? <div className="flex justify-center py-8"><Spinner size={24} /></div>
          : (users as any[]).length === 0
            ? <EmptyState icon={<UserCog size={22} strokeWidth={1.5} />} title="Aucun compte"
                action={<Button size="sm" onClick={() => setShowCreate(true)}><UserPlus size={14} />Ajouter</Button>} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>{['Nom','Identifiant','Rôle','Modules','Statut','Créé le',''].map((h,i) => (
                    <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-ink-faint uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(users as any[]).map(u => (
                    <tr key={u.id} className="border-b border-surface-50 hover:bg-surface-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                            {u.prenom?.[0]}{u.nom?.[0]}
                          </div>
                          <div className="font-bold text-ink">{u.prenom} {u.nom}</div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><code className="text-xs bg-surface-100 text-primary-700 px-2 py-0.5 rounded font-bold">{u.matricule||'—'}</code></td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={ROLE_COLORS[u.role]||'neutral'}>{u.role_display}</Badge>
                          {(u.tous_roles_display || []).slice(1).map((r: string) => (
                            <Badge key={r} variant="neutral">{r}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1 flex-wrap">
                          {u.modules?.map((m: any) => (
                            <span key={m.code} className="text-xs bg-surface-100 text-ink-muted px-2 py-0.5 rounded-full font-medium">{m.nom}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><Badge variant={u.is_active?'success':'error'}>{u.is_active?'Actif':'Inactif'}</Badge></td>
                      <td className="px-5 py-3.5 text-xs text-ink-faint">{format(new Date(u.date_creation),'dd/MM/yyyy',{locale:fr})}</td>
                      <td className="px-5 py-3.5">
                        {u.is_active && u.role!=='super_admin' && (
                          <button onClick={() => deactivateMut.mutate(u.id)}
                            className="p-1.5 rounded-lg text-ink-faint hover:text-red-600 hover:bg-red-50">
                            <X size={14} strokeWidth={1.75} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      <ModalCreation open={showCreate} onClose={() => setShowCreate(false)} />
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE : UTILISATEURS — GESTION DES MOTS DE PASSE
// ══════════════════════════════════════════════════════════════════════════════
export function Utilisateurs() {
  const [editingMdp, setEditingMdp] = useState<any>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['personnel'],
    queryFn: () => authAPI.users.list().then(r => r.data.data),
  })

  return (
    <AppLayout>
      <Topbar title="Utilisateurs" subtitle="Gestion des accès et mots de passe" />
      <div className="p-6">
        <Card padding={false}>
          <CardHeader title="Comptes et accès" icon={<Users size={16} strokeWidth={1.75} />}
            subtitle={`${(users as any[]).length} utilisateur(s)`} />
          {isLoading ? <div className="flex justify-center py-8"><Spinner size={24} /></div>
          : (users as any[]).length === 0
            ? <EmptyState icon={<Users size={22} strokeWidth={1.5} />} title="Aucun utilisateur" />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>{['Utilisateur','Identifiant','Rôle','Statut','Mot de passe',''].map((h,i) => (
                    <th key={i} className="px-5 py-3 text-left text-[10.5px] font-bold text-ink-faint uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(users as any[]).map(u => (
                    <tr key={u.id} className="border-b border-surface-50 hover:bg-surface-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                            {u.prenom?.[0]}{u.nom?.[0]}
                          </div>
                          <span className="font-bold text-ink">{u.prenom} {u.nom}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><code className="text-xs bg-surface-100 text-primary-700 px-2 py-0.5 rounded font-bold">{u.matricule||'—'}</code></td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={ROLE_COLORS[u.role]||'neutral'}>{u.role_display}</Badge>
                          {(u.tous_roles_display || []).slice(1).map((r: string) => (
                            <Badge key={r} variant="neutral">{r}</Badge>
                          ))}
                        </div>
                          {(u.tous_roles_display || []).slice(1).map((r: string) => (
                            <Badge key={r} variant="neutral">{r}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><Badge variant={u.is_active?'success':'error'}>{u.is_active?'Actif':'Inactif'}</Badge></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 text-xs text-ink-faint">
                          <span className="tracking-widest">••••</span>
                          {u.mot_de_passe_provisoire && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold">Provisoire</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.role !== 'super_admin' && (
                          <button onClick={() => setEditingMdp(u)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors">
                            <KeyRound size={13} strokeWidth={1.75} />Modifier
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal open={!!editingMdp} onClose={() => setEditingMdp(null)} title="Modifier le mot de passe">
        {editingMdp && <ModalChangerMdp user={editingMdp} onClose={() => setEditingMdp(null)} />}
      </Modal>
    </AppLayout>
  )
}
