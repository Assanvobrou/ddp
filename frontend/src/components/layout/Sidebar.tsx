import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Banknote, Settings, LayoutGrid, LogOut,
  Receipt, BarChart2, Stethoscope, Users,
  Shield, UserCog, SlidersHorizontal, ChevronLeft,
  Lock, Unlock, DoorOpen, UserPlus, Building2
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCaisse } from '@/context/CaisseContext'
import toast from 'react-hot-toast'

const MODULE_SUBITEMS: Record<string, Array<{ path: string; label: string; icon: React.ReactNode; permission?: string }>> = {
  bureau: [
    { path: '/bureau', label: 'Patients', icon: <Users size={16} strokeWidth={1.75} />, permission: 'bureau.enregistrer_patient' },
    { path: '/bureau/nouveau', label: 'Nouveau patient', icon: <UserPlus size={16} strokeWidth={1.75} />, permission: 'bureau.enregistrer_patient' },
  ],
  caisse: [
    { path: '/caisse',           label: 'Session',   icon: <Banknote size={16} strokeWidth={1.75} />,   permission: 'caisse.gerer_session_caisse' },
    { path: '/caisse/fiches',    label: 'Paiements', icon: <Receipt size={16} strokeWidth={1.75} /> },
    { path: '/caisse/dashboard', label: 'Recettes',  icon: <BarChart2 size={16} strokeWidth={1.75} />,  permission: 'caisse.voir_dashboard_recettes' },
  ],
  configuration: [
    { path: '/configuration/prestations', label: 'Prestations', icon: <Stethoscope size={16} strokeWidth={1.75} /> },
    { path: '/configuration/assurances',  label: 'Assurances',  icon: <Shield size={16} strokeWidth={1.75} /> },
    { path: '/configuration/personnel',   label: 'Personnel',   icon: <UserCog size={16} strokeWidth={1.75} /> },
    { path: '/configuration/parametres',  label: 'Paramètres',  icon: <SlidersHorizontal size={16} strokeWidth={1.75} /> },
  ],
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  bureau_entrees: <DoorOpen size={18} strokeWidth={1.75} />,
  caisse:         <Banknote size={18} strokeWidth={1.75} />,
  configuration:  <Settings size={18} strokeWidth={1.75} />,
}

const MODULE_ENTRY: Record<string, string> = {
  bureau_entrees: '/bureau',
  caisse:         '/caisse',
  configuration:  '/configuration/prestations',
}

export default function Sidebar() {
  const { user, logout, hasPermission } = useAuth()
  const { isOuverte, session } = useCaisse()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return null

  const activeModule = location.pathname.split('/')[1] || null
  const subItems = activeModule ? MODULE_SUBITEMS[activeModule] || [] : []
  const showCaisseStatus = hasPermission('caisse.gerer_session_caisse') && activeModule

  const handleLogout = async () => {
    await logout()
    navigate('/connexion')
    toast.success('Déconnexion réussie')
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-white flex flex-col h-screen sticky top-0 overflow-hidden border-r border-surface-200 shadow-sidebar">

      {/* Logo + Utilisateur */}
      <div className="px-4 py-4 border-b border-surface-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white flex-shrink-0">
            <Stethoscope size={15} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-black text-ink truncate tracking-tight">Dossier Du Patient</div>
            <div className="text-[9px] text-ink-faint font-semibold uppercase tracking-widest">DDP</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-surface-50 rounded-lg px-2.5 py-2">
          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
            {user.prenom[0]}{user.nom[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11.5px] font-bold text-ink truncate">{user.nom_complet}</div>
            <div className="text-[10px] text-ink-faint truncate">{user.role_display}</div>
          </div>
        </div>
      </div>

      {/* Statut caisse */}
      {showCaisseStatus && (
        <div className="px-3 pt-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold border
            ${isOuverte ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {isOuverte ? <Unlock size={12} /> : <Lock size={12} />}
            {isOuverte ? 'Caisse ouverte' : 'Caisse fermée'}
            {isOuverte && session && (
              <span className="ml-auto text-[10px] opacity-60 font-normal">
                {new Date(session.ouverte_le).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-none px-2.5 py-3">
        {activeModule && subItems.length > 0 ? (
          <>
            <button
              onClick={() => navigate('/modules')}
              className="flex items-center gap-2 w-full px-2.5 py-2 mb-2 text-[12px] font-semibold text-ink-faint hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <ChevronLeft size={14} />
              Tous les modules
            </button>

            <div className="flex items-center gap-2 px-2.5 py-1.5 mb-1">
              <span className="text-ink-muted">{MODULE_ICONS[activeModule === 'bureau' ? 'bureau_entrees' : activeModule]}</span>
              <span className="text-[11px] font-bold text-ink uppercase tracking-wider">
                {user.modules.find(m => m.code === (activeModule === 'bureau' ? 'bureau_entrees' : activeModule))?.nom || activeModule}
              </span>
            </div>

            {subItems.map((item) => {
              if (item.permission && !hasPermission(item.permission)) return null
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/caisse' || item.path === '/bureau'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-100 mb-0.5
                    ${isActive ? 'bg-primary-600 text-white shadow-sm' : 'text-ink-muted hover:bg-surface-100 hover:text-ink'}`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              )
            })}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 w-full px-2.5 py-2 mb-1 text-[11px] font-bold text-ink-faint uppercase tracking-wider">
              <LayoutGrid size={13} />
              Modules
            </div>
            {user.modules.map((module) => (
              <button
                key={module.code}
                onClick={() => navigate(MODULE_ENTRY[module.code] || `/${module.code}`)}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-ink-muted hover:bg-surface-100 hover:text-ink transition-all mb-0.5"
              >
                {MODULE_ICONS[module.code] || <Settings size={16} strokeWidth={1.75} />}
                {module.nom}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Déconnexion */}
      <div className="px-2.5 pb-3 border-t border-surface-100 pt-2.5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-ink-faint hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={15} strokeWidth={1.75} />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
