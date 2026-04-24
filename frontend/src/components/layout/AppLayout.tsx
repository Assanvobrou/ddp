import { ReactNode, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const today = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })

  return (
    <header className="bg-white border-b border-surface-200 px-4 md:px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] md:text-[17px] font-black text-ink tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-[10px] md:text-xs text-ink-faint mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="hidden md:flex items-center gap-1.5 bg-surface-100 text-ink-faint px-3 py-1.5 rounded-lg text-xs font-medium">
          <Calendar size={13} strokeWidth={1.75} />
          <span className="capitalize">{today}</span>
        </div>
        {actions}
      </div>
    </header>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-surface-100">

      {/* Sidebar desktop — toujours visible */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Bouton hamburger mobile */}
      <button onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 bg-white border border-surface-200 rounded-xl flex items-center justify-center shadow-md">
        <Menu size={18} strokeWidth={1.75} className="text-ink" />
      </button>

      {/* Sidebar mobile — overlay drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)} />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 animate-fade-up">
            <div className="relative">
              <button onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-[-44px] w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md">
                <X size={16} strokeWidth={1.75} />
              </button>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-0 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
