import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authAPI, clearTokens } from '@/services/api'
import type { Utilisateur } from '@/types'

interface AuthState {
  user: Utilisateur | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasModule: (code: string) => boolean
  hasPermission: (code: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Charge l'utilisateur depuis le storage au démarrage
  useEffect(() => {
    const stored = localStorage.getItem('ddp_user')
    const access = localStorage.getItem('ddp_access')
    if (stored && access) {
      try {
        const user: Utilisateur = JSON.parse(stored)
        setState({ user, isLoading: false, isAuthenticated: true })
        // Rafraîchit les données depuis l'API
        refreshUser()
      } catch {
        clearTokens()
        setState({ user: null, isLoading: false, isAuthenticated: false })
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }))
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await authAPI.login(email, password)
    const { access, refresh, utilisateur } = data
    localStorage.setItem('ddp_access', access)
    localStorage.setItem('ddp_refresh', refresh)
    localStorage.setItem('ddp_user', JSON.stringify(utilisateur))
    setState({ user: utilisateur, isLoading: false, isAuthenticated: true })
  }

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('ddp_refresh')
      if (refresh) await authAPI.logout(refresh)
    } finally {
      clearTokens()
      setState({ user: null, isLoading: false, isAuthenticated: false })
    }
  }

  const refreshUser = async () => {
    try {
      const { data } = await authAPI.me()
      const user: Utilisateur = data.data
      localStorage.setItem('ddp_user', JSON.stringify(user))
      setState({ user, isLoading: false, isAuthenticated: true })
    } catch {
      // Token expiré géré par l'intercepteur axios
    }
  }

  const hasModule = (code: string): boolean => {
    if (!state.user) return false
    if (state.user.role === 'super_admin') return true
    return state.user.modules.some((m) => m.code === code)
  }

  const hasPermission = (code: string): boolean => {
    if (!state.user) return false
    if (state.user.role === 'super_admin') return true
    return state.user.permissions.includes(code)
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser, hasModule, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
