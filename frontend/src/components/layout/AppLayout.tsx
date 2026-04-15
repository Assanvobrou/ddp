import { ReactNode } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar } from 'lucide-react'
import Sidebar from './Sidebar'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const today = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })

  return (
    <header className="bg-white border-b border-surface-200 px-6 py-3.5 flex items-center gap-4 sticky top-0 z-10">
      <div className="flex-1 min-w-0">
        <h1 className="text-[17px] font-black text-ink tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-ink-faint mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 bg-surface-100 text-ink-faint px-3 py-1.5 rounded-lg text-xs font-medium">
          <Calendar size={13} strokeWidth={1.75} />
          <span className="capitalize">{today}</span>
        </div>
        {actions}
      </div>
    </header>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-100">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">{children}</main>
    </div>
  )
}
