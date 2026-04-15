import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { Button, Input } from '@/components/ui'

const schema = z.object({
  email: z.string().min(1, 'Identifiant requis'),
  password: z.string().min(1, 'Mot de passe requis'),
})
type FormData = z.infer<typeof schema>

export default function Login() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (isAuthenticated && user) {
    // Redirection selon les modules de l'utilisateur
    return <Navigate to="/modules" replace />
  }

  const onSubmit = async ({ email, password }: FormData) => {
    setApiError('')
    try {
      await login(email.toLowerCase().trim(), password)
      toast.success('Connexion réussie !')
    } catch (err: any) {
      const msg = err?.response?.data?.erreur || err?.response?.data?.detail
        || 'Identifiants incorrects. Veuillez réessayer.'
      setApiError(msg)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche — branding */}
      <div className="hidden lg:flex w-[460px] flex-shrink-0 bg-[#07111F] flex-col p-12 relative overflow-hidden">
        {/* Décoration */}
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-[rgba(0,196,180,0.1)] -top-24 -right-28" />
        <div className="absolute w-[260px] h-[260px] rounded-full border border-[rgba(0,196,180,0.07)] top-10 -right-8" />
        <div className="absolute w-[320px] h-[320px] rounded-full bg-[radial-gradient(circle,rgba(0,196,180,0.07)_0%,transparent_68%)] top-[28%] -right-24" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-12 h-12 rounded-[13px] bg-gradient-to-br from-[#00A899] to-[#00C4B4] flex items-center justify-center text-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_28px_rgba(0,196,180,0.28)]">
            🗂️
          </div>
          <div>
            <div className="text-white text-[17px] font-black tracking-tight">Dossier Du Patient</div>
            <div className="text-white/30 text-[9px] font-bold tracking-[0.9px] uppercase mt-0.5">Système de gestion clinique</div>
          </div>
        </div>

        <div className="relative z-10 mt-auto pt-12">
          <h1 className="text-[36px] font-black text-white leading-[1.12] tracking-tight mb-4">
            Votre clinique,<br /><span className="text-[#00C4B4]">organisée.</span>
          </h1>
          <p className="text-white/42 text-[14px] leading-[1.75] max-w-[330px] mb-10">
            Plateforme centralisée pour la gestion des patients, des paiements et du personnel médical.
          </p>
          <div className="space-y-2.5">
            {[
              ['🗂️', 'Dossiers patients', 'complets et sécurisés'],
              ['🔐', 'Accès personnalisé', 'selon votre rôle'],
              ['📊', 'Suivi des recettes', 'en temps réel'],
              ['🩺', 'Prestations', 'configurables et flexibles'],
            ].map(([emoji, bold, rest]) => (
              <div key={bold} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.07] flex items-center justify-center text-sm flex-shrink-0">
                  {emoji}
                </div>
                <span className="text-[13px] text-white/48">
                  <strong className="text-white/80 font-bold">{bold}</strong> {rest}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-12 pt-5 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-white/20 text-[10.5px] font-medium">© 2026 Dossier Du Patient</span>
          <span className="text-white/20 text-[10.5px] font-semibold tracking-wide">v1.0.0</span>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#EDF1F7]">
        <div className="w-full max-w-[400px] bg-white rounded-2xl border border-gray-100 shadow-[0_2px_6px_rgba(0,0,0,0.04),0_16px_48px_rgba(0,0,0,0.07)] p-9 animate-[fadeIn_0.4s_ease]">

          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-[11px] bg-gradient-to-br from-[#00A899] to-[#00C4B4] flex items-center justify-center text-xl">🗂️</div>
            <div>
              <div className="text-gray-900 text-[15px] font-black">Dossier Du Patient</div>
              <div className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide">Gestion clinique</div>
            </div>
          </div>

          <h2 className="text-xl font-black text-gray-900 tracking-tight mb-1">Connexion</h2>
          <p className="text-[13px] text-gray-400 mb-7">Entrez vos identifiants pour accéder à votre espace.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              {...register('email')}
              label="Identifiant"
              type="text"
              placeholder="Email ou matricule"
              leftIcon="👤"
              error={errors.email?.message}
              autoComplete="username"
            />
            <Input
              {...register('password')}
              label="Mot de passe"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon="🔒"
              error={errors.password?.message}
              autoComplete="current-password"
              rightElement={
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-700 px-2 py-1">
                  {showPass ? 'Masquer' : 'Afficher'}
                </button>
              }
            />

            {apiError && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200/60 rounded-xl text-[12.5px] text-red-700 font-semibold">
                ⚠️ {apiError}
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
              🔑 Se connecter
            </Button>
          </form>

          <div className="mt-5 text-center text-[11px] text-gray-400 flex items-center justify-center gap-2">
            <span>🔐 Connexion chiffrée</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>🗂️ DDP © 2026</span>
          </div>
        </div>
      </div>
    </div>
  )
}
