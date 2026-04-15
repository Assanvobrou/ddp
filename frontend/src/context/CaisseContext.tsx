import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { caisseAPI } from '@/services/api'
import { useAuth } from './AuthContext'
import type { SessionCaisse } from '@/types'

interface CaisseContextValue {
  session: SessionCaisse | null
  isOuverte: boolean
  isLoading: boolean
  refresh: () => Promise<void>
}

const CaisseContext = createContext<CaisseContextValue | null>(null)

export function CaisseProvider({ children }: { children: ReactNode }) {
  const { hasModule } = useAuth()
  const [session, setSession] = useState<SessionCaisse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!hasModule('caisse')) return
    setIsLoading(true)
    try {
      const { data } = await caisseAPI.statut()
      setSession(data.ouverte ? data.session : null)
    } catch {
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [hasModule])

  // Charge le statut caisse au montage si l'utilisateur a le module
  useEffect(() => {
    refresh()
    // Rafraîchit toutes les 2 minutes
    const interval = setInterval(refresh, 120_000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <CaisseContext.Provider
      value={{ session, isOuverte: !!session, isLoading, refresh }}
    >
      {children}
    </CaisseContext.Provider>
  )
}

export function useCaisse(): CaisseContextValue {
  const ctx = useContext(CaisseContext)
  if (!ctx) throw new Error('useCaisse doit être dans CaisseProvider')
  return ctx
}
