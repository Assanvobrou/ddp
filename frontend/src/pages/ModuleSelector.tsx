import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  Banknote, Settings, LogOut,
  ChevronRight, Stethoscope, Shield, DoorOpen
} from 'lucide-react'

const MODULE_ICONS: Record<string, React.ReactNode> = {
  bureau_entrees: <DoorOpen size={28} strokeWidth={1.5} />,
  caisse:         <Banknote size={28} strokeWidth={1.5} />,
  configuration:  <Settings size={28} strokeWidth={1.5} />,
}

const MODULE_DESCRIPTIONS: Record<string, string> = {
  bureau_entrees: 'Enregistrement des patients et création des fiches',
  caisse:         'Validation des paiements et gestion de la session',
  configuration:  'Prestations, personnel et paramètres clinique',
}

const MODULE_ENTRY: Record<string, string> = {
  bureau_entrees: '/bureau',
  caisse:         '/caisse',
  configuration:  '/configuration/prestations',
}

export default function ModuleSelector() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    navigate('/connexion')
  }

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-surface-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
            <Stethoscope size={16} strokeWidth={2} />
          </div>
          <div>
            <div className="text-sm font-black text-ink tracking-tight">Dossier Du Patient</div>
            <div className="text-[10px] text-ink-faint font-medium uppercase tracking-widest">DDP</div>
          </div>
        </div>

        {/* Utilisateur connecté */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-ink">{user.nom_complet}</div>
            <div className="text-xs text-ink-faint">{user.role_display}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-black">
            {user.prenom[0]}{user.nom[0]}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-ink-faint hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">

          {/* Titre */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-black text-ink tracking-tight mb-2">
              Bonjour, {user.prenom} 👋
            </h1>
            <p className="text-sm text-ink-faint">
              Sélectionnez un module pour commencer votre session.
            </p>
          </div>

          {/* Grille des modules */}
          {user.modules.length === 0 ? (
            <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-100 flex items-center justify-center text-ink-faint mx-auto mb-4">
                <Shield size={28} strokeWidth={1.5} />
              </div>
              <h2 className="text-base font-bold text-ink mb-2">Aucun module assigné</h2>
              <p className="text-sm text-ink-faint">
                Contactez votre administrateur pour obtenir l'accès aux modules.
              </p>
              <button onClick={handleLogout} className="mt-6 text-sm font-semibold text-primary-600 hover:underline">
                Se déconnecter
              </button>
            </div>
          ) : (
            <div className={`grid gap-4 ${user.modules.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {user.modules.map((module, i) => (
                <button
                  key={module.code}
                  onClick={() => navigate(MODULE_ENTRY[module.code] || `/${module.code}`)}
                  className="group bg-white rounded-2xl border border-surface-200 shadow-card p-6 text-left hover:border-primary-600 hover:shadow-lg transition-all duration-200 animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-200">
                      {MODULE_ICONS[module.code] || <Settings size={28} strokeWidth={1.5} />}
                    </div>
                    <ChevronRight size={18} className="text-ink-faint group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all mt-1" />
                  </div>
                  <div className="text-base font-black text-ink group-hover:text-primary-700 mb-1 tracking-tight">
                    {module.nom}
                  </div>
                  <div className="text-xs text-ink-faint leading-relaxed">
                    {MODULE_DESCRIPTIONS[module.code] || 'Accéder au module'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-[11px] text-ink-faint">
        DDP — Dossier Du Patient · v1.0.0
      </footer>
    </div>
  )
}
