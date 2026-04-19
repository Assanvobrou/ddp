import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Login from '@/pages/Login'
import Landing from '@/pages/Landing'
import ModuleSelector from '@/pages/ModuleSelector'
import ChangePassword from '@/pages/ChangePassword'
import { PatientsList, NouveauPatient, PatientDetail } from '@/pages/bureau'
import BureauFiches from '@/pages/bureau/BureauFiches'
import {
  PaiementsEnAttente, PaiementsValides,
  ClotureCaisse, Versements, Rapports
} from '@/pages/caisse'
import {
  Services, Prestations, Assurances, Personnel, ParametresClinique
} from '@/pages/configuration'
import { PersonnelList, Utilisateurs } from '@/pages/configuration/Personnel'

function ProtectedRoute({ children, permission }: { children: JSX.Element; permission?: string }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth()
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-100">
      <div className="w-7 h-7 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/connexion" replace />
  if (permission && !hasPermission(permission)) return <Navigate to="/modules" replace />
  return children
}

/** URL inconnue → redirige vers le premier module si connecté, sinon landing */
function RedirectHome() {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/" replace />
  // Rediriger vers le premier module accessible
  const moduleEntry: Record<string, string> = {
    bureau_entrees: '/bureau',
    caisse: '/caisse/paiements',
    configuration: '/configuration/prestations',
  }
  const premier = user?.modules?.[0]?.code
  const dest = (premier && moduleEntry[premier]) || '/modules'
  return <Navigate to={dest} replace />
}

/** Redirige vers /modules si connecté, sinon affiche la Landing */
function LandingOrApp() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-100">
      <div className="w-7 h-7 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return isAuthenticated ? <Navigate to="/modules" replace /> : <Landing />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingOrApp />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/modules" element={<ProtectedRoute><ModuleSelector /></ProtectedRoute>} />
        <Route path="/changer-mot-de-passe" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

        {/* Bureau des entrées */}
        <Route path="/bureau" element={<ProtectedRoute><PatientsList /></ProtectedRoute>} />
        <Route path="/bureau/nouveau" element={<ProtectedRoute><NouveauPatient /></ProtectedRoute>} />
        <Route path="/bureau/patients/:id" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
        <Route path="/bureau/fiches" element={<ProtectedRoute><BureauFiches /></ProtectedRoute>} />

        {/* Caisse — commun */}
        <Route path="/caisse/paiements" element={<ProtectedRoute><PaiementsEnAttente /></ProtectedRoute>} />
        <Route path="/caisse/paiements-valides" element={<ProtectedRoute><PaiementsValides /></ProtectedRoute>} />

        {/* Caisse — Caissière uniquement */}
        <Route path="/caisse/cloture" element={<ProtectedRoute><ClotureCaisse /></ProtectedRoute>} />

        {/* Caisse — Responsable uniquement */}
        <Route path="/caisse/versements" element={<ProtectedRoute permission="caisse.voir_dashboard_recettes"><Versements /></ProtectedRoute>} />
        <Route path="/caisse/rapports" element={<ProtectedRoute permission="caisse.voir_dashboard_recettes"><Rapports /></ProtectedRoute>} />

        {/* Configuration */}
        <Route path="/configuration/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
        <Route path="/configuration/prestations" element={<ProtectedRoute><Prestations /></ProtectedRoute>} />
        <Route path="/configuration/assurances" element={<ProtectedRoute><Assurances /></ProtectedRoute>} />
        <Route path="/configuration/personnel" element={<ProtectedRoute><PersonnelList /></ProtectedRoute>} />
        <Route path="/configuration/utilisateurs" element={<ProtectedRoute><Utilisateurs /></ProtectedRoute>} />
        <Route path="/configuration/parametres" element={<ProtectedRoute><ParametresClinique /></ProtectedRoute>} />

        <Route path="*" element={<RedirectHome />} />
      </Routes>
    </BrowserRouter>
  )
}
