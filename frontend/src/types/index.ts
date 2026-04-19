// ── Authentification ─────────────────────────────────────────────────────────
export interface Module {
  code: string
  nom: string
  emoji: string
  ordre: number
}

export interface Utilisateur {
  id: string
  email: string
  nom_complet: string
  nom: string
  prenom: string
  role: 'caissiere' | 'comptable' | 'directrice' | 'super_admin'
  role_display: string
  mot_de_passe_provisoire: boolean
  modules: Module[]
  permissions: string[]
}

export interface AuthTokens {
  access: string
  refresh: string
  utilisateur: Utilisateur
}

// ── Session Caisse ────────────────────────────────────────────────────────────
export type StatutSession = 'ouverte' | 'en_attente' | 'validee'

export interface SessionCaisse {
  id: string
  date_session: string
  statut: StatutSession
  statut_display: string
  ouverte_par: string
  ouverte_par_nom: string
  ouverte_le: string
  heure_fin_prevue: string | null
  fermee_le: string | null
  montant_systeme: string
  montant_compte: string | null
  ecart: string | null
  justificatif_caissiere: string
  valide_par: string | null
  valide_par_nom: string | null
  valide_le: string | null
  montant_recu_comptable: string | null
  ecart_comptable: string | null
  note_comptable: string
  nb_patients: number
  nb_fiches: number
}

// ── Patient ───────────────────────────────────────────────────────────────────
export interface Patient {
  id: string
  numero_dossier: string
  nom: string
  prenom: string
  sexe: 'M' | 'F' | 'A'
  date_naissance: string | null
  age: number | null
  telephone: string
  domicile: string
  a_assurance: boolean
  assurance: string | null
  assurance_nom: string | null
  numero_assurance: string
  enregistre_par: string
  enregistre_par_nom: string
  date_enregistrement: string
}

export interface PatientForm {
  nom: string
  prenom: string
  date_naissance?: string
  age?: number
  telephone?: string
  domicile?: string
  a_assurance: boolean
  assurance?: string
  numero_assurance?: string
}

// ── Fiche Paiement ────────────────────────────────────────────────────────────
export type StatutFiche = 'paye' | 'en_attente' | 'assurance'

export interface FichePaiement {
  id: string
  patient: string
  patient_nom: string
  prestation: string
  prestation_nom: string
  prestation_emoji: string
  prix_unitaire: string
  quantite: number
  montant_total: string
  taux_assurance: string
  montant_assurance: string
  montant_patient: string
  statut: StatutFiche
  statut_display: string
  notes: string
  date_creation: string
}

// ── Configuration ─────────────────────────────────────────────────────────────
export interface Prestation {
  id: string
  nom: string
  emoji: string
  prix: string
  prise_en_charge_assurance: boolean
  taux_assurance: string
  ordre: number
  actif: boolean
}

export interface Assurance {
  id: string
  nom: string
  code: string
  taux_defaut: string
  actif: boolean
}

export interface ParametresClinique {
  nom: string
  slogan: string
  adresse: string
  telephone: string
  email: string
  site_web: string
  logo: string | null
  monnaie: string
  informations_legales: string
}

export interface UtilisateurPersonnel {
  id: string
  email: string
  matricule: string | null
  nom: string
  prenom: string
  role: string
  role_display: string
  is_active: boolean
  mot_de_passe_provisoire: boolean
  date_creation: string
  modules: Module[]
}

// ── API Response ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data?: T
  erreur?: string
  message?: string
  count?: number
}

export interface DashboardRecettes {
  total_recettes: string
  total_patient: string
  total_assurance: string
  nb_patients: number
  nb_fiches: number
  par_prestation: Array<{
    nom_prestation: string
    emoji_prestation: string
    nb: number
    total: string
    total_patient: string
    total_assurance: string
  }>
  par_jour: Array<{ jour: string; total: string; nb: number }>
  sessions: SessionCaisse[]
}
