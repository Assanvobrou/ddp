import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
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
  const { user } = useAuth()
  const [session, setSession] = useState<SessionCaisse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Utilise une ref stable pour éviter les boucles infinies
  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  const refresh = useCallback(async () => {
    const currentUser = userRef.current
    // Vérifie directement sur l'objet user sans passer par hasModule
    if (!currentUser) return
    const hasCaisse = currentUser.role === 'super_admin' ||
      currentUser.modules.some(m => m.code === 'caisse')
    if (!hasCaisse) return

    setIsLoading(true)
    try {
      const { data } = await caisseAPI.statut()
      setSession(data.ouverte ? data.session : null)
    } catch {
      // Silencieux — ne pas déconnecter si le statut caisse échoue
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, []) // dépendances vides — stable pour toujours

  useEffect(() => {
    // Lance refresh seulement quand l'utilisateur est chargé
    if (!user) return
    refresh()
    const interval = setInterval(refresh, 120_000)
    return () => clearInterval(interval)
  }, [user?.id]) // dépend uniquement de l'ID — stable

  return (
    <CaisseContext.Provider value={{ session, isOuverte: !!session, isLoading, refresh }}>
      {children}
    </CaisseContext.Provider>
  )
}

export function useCaisse(): CaisseContextValue {
  const ctx = useContext(CaisseContext)
  if (!ctx) throw new Error('useCaisse doit être dans CaisseProvider')
  return ctx
}
