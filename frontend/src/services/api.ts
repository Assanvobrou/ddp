import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// ── Instance Axios principale ─────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Récupération des tokens depuis le storage ─────────────────────────────────
const getAccess = () => localStorage.getItem('ddp_access')
const getRefresh = () => localStorage.getItem('ddp_refresh')
const setTokens = (access: string, refresh?: string) => {
  localStorage.setItem('ddp_access', access)
  if (refresh) localStorage.setItem('ddp_refresh', refresh)
}
export const clearTokens = () => {
  localStorage.removeItem('ddp_access')
  localStorage.removeItem('ddp_refresh')
  localStorage.removeItem('ddp_user')
}

// ── Intercepteur requête — ajoute le Bearer token ────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccess()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Intercepteur réponse — refresh automatique du token ──────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true
      const refresh = getRefresh()

      if (!refresh) {
        clearTokens()
        window.location.href = '/connexion'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh })
        setTokens(data.access, data.refresh)
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`
        processQueue(null, data.access)
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        window.location.href = '/connexion'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ── Endpoints Auth ────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),
  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }),
  me: () => api.get('/auth/me/'),
  changePassword: (data: { ancien_mot_de_passe: string; nouveau_mot_de_passe: string; confirmation: string }) =>
    api.post('/auth/change-password/', data),
  users: {
    list: () => api.get('/auth/users/'),
    create: (data: unknown) => api.post('/auth/users/', data),
    get: (id: string) => api.get(`/auth/users/${id}/`),
    update: (id: string, data: unknown) => api.patch(`/auth/users/${id}/`, data),
    deactivate: (id: string) => api.delete(`/auth/users/${id}/`),
    assignerRole: (id: string, role: string) => api.post(`/auth/users/${id}/assigner-role/`, { role }),
    changerMotDePasse: (id: string, pwd: string) => api.post(`/auth/users/${id}/changer-mot-de-passe/`, { nouveau_mot_de_passe: pwd }),
    checkMatricule: (matricule: string, excludeId?: string) =>
      api.get('/auth/check-matricule/', { params: { matricule, ...(excludeId ? { exclude: excludeId } : {}) } }),
  },
  modules: () => api.get('/auth/modules/'),
}

// ── Endpoints Caisse ──────────────────────────────────────────────────────────
export const caisseAPI = {
  statut: () => api.get('/caisse/statut/'),
  statutAll: () => api.get('/caisse/statut/', { params: { all: 'true' } }),
  recapitulatifSession: (sessionId: string) => api.get('/caisse/recapitulatif/', { params: { session_id: sessionId } }),
  ouvrir: (data?: { heure_fin_prevue?: string }) => api.post('/caisse/ouvrir/', data || {}),
  recapitulatif: () => api.get('/caisse/recapitulatif/'),
  fermer: (data: { montant_compte: number; justificatif?: string }) =>
    api.post('/caisse/fermer/', data),
  versements: () => api.get('/caisse/versements/'),
  validerVersement: (id: string, data: { montant_recu: number; note?: string }) =>
    api.post(`/caisse/versements/${id}/valider/`, data),
  sessions: (params?: Record<string, string>) =>
    api.get('/caisse/sessions/', { params }),
  patients: {
    list: (params?: Record<string, string>) => api.get('/caisse/patients/', { params }),
    create: (data: unknown) => api.post('/caisse/patients/', data),
    get: (id: string) => api.get(`/caisse/patients/${id}/`),
  },
  fiches: {
    list: (params?: Record<string, string>) => api.get('/caisse/fiches/', { params }),
    create: (data: unknown) => api.post('/caisse/fiches/', data),
    get: (id: string) => api.get(`/caisse/fiches/${id}/`),
    update: (id: string, data: unknown) => api.patch(`/caisse/fiches/${id}/`, data),
  },
  dashboard: (params?: Record<string, string>) =>
    api.get('/caisse/dashboard/', { params }),
}

// ── Endpoints Configuration ───────────────────────────────────────────────────
export const configAPI = {
  services: {
    list: (params?: Record<string, string>) =>
      api.get('/configuration/services/', { params }),
    create: (data: unknown) => api.post('/configuration/services/', data),
    update: (id: string, data: unknown) =>
      api.patch(`/configuration/services/${id}/`, data),
    delete: (id: string) => api.delete(`/configuration/services/${id}/`),
  },
  prestations: {
    list: (params?: Record<string, string>) =>
      api.get('/configuration/prestations/', { params }),
    create: (data: unknown) => api.post('/configuration/prestations/', data),
    update: (id: string, data: unknown) =>
      api.patch(`/configuration/prestations/${id}/`, data),
    delete: (id: string) => api.delete(`/configuration/prestations/${id}/`),
  },
  assurances: {
    list: (params?: Record<string, string>) =>
      api.get('/configuration/assurances/', { params }),
    create: (data: unknown) => api.post('/configuration/assurances/', data),
    update: (id: string, data: unknown) =>
      api.patch(`/configuration/assurances/${id}/`, data),
    delete: (id: string) => api.delete(`/configuration/assurances/${id}/`),
  },
  parametres: {
    get: () => api.get('/configuration/parametres/'),
    update: (data: unknown) => api.patch('/configuration/parametres/', data),
  },
}
