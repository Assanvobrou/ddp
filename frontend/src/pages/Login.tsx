import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  Stethoscope, User, Lock, Eye, EyeOff,
  AlertCircle, ShieldCheck, ClipboardList,
  BarChart2, Settings
} from 'lucide-react'
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
    return <Navigate to="/modules" replace />
  }

  const onSubmit = async ({ email, password }: FormData) => {
    setApiError('')
    try {
      await login(email.toLowerCase().trim(), password)
      toast.success('Connexion réussie')
    } catch (err: any) {
      const msg = err?.response?.data?.erreur || err?.response?.data?.detail
        || 'Identifiants incorrects. Veuillez réessayer.'
      setApiError(msg)
    }
  }

  return (
    <div className="min-h-screen flex bg-surface-100">

      {/* Panneau gauche — branding */}
      <div className="hidden lg:flex w-[440px] flex-shrink-0 bg-primary-600 flex-col p-12 relative overflow-hidden">
        {/* Motif décoratif */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute w-[380px] h-[380px] rounded-full border border-white/10 -top-20 -right-24" />
        <div className="absolute w-[240px] h-[240px] rounded-full border border-white/10 top-8 -right-6" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-primary-700/40 top-[30%] -right-20" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
            <Stethoscope size={22} strokeWidth={1.75} className="text-white" />
          </div>
          <div>
            <div className="text-white text-[16px] font-black tracking-tight">Dossier Du Patient</div>
            <div className="text-white/50 text-[9px] font-bold tracking-[0.9px] uppercase mt-0.5">Système de gestion clinique</div>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10 mt-auto pt-12">
          <h1 className="text-[34px] font-black text-white leading-[1.1] tracking-tight mb-4">
            Votre clinique,<br /><span className="text-white/70">organisée.</span>
          </h1>
          <p className="text-white/50 text-[14px] leading-[1.75] max-w-[320px] mb-10">
            Plateforme centralisée pour la gestion des patients, des paiements et du personnel médical.
          </p>
          <div className="space-y-2.5">
            {[
              { icon: <ClipboardList size={15} strokeWidth={1.75} />, bold: 'Dossiers patients', rest: 'complets et sécurisés' },
              { icon: <ShieldCheck size={15} strokeWidth={1.75} />, bold: 'Accès personnalisé', rest: 'selon votre rôle' },
              { icon: <BarChart2 size={15} strokeWidth={1.75} />, bold: 'Suivi des recettes', rest: 'en temps réel' },
              { icon: <Settings size={15} strokeWidth={1.75} />, bold: 'Configuration', rest: 'flexible et complète' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white flex-shrink-0">
                  {item.icon}
                </div>
                <span className="text-[13px] text-white/50">
                  <strong className="text-white/80 font-bold">{item.bold}</strong> {item.rest}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-10 pt-5 border-t border-white/10 flex items-center justify-between">
          <span className="text-white/25 text-[10.5px] font-medium">© 2026 Dossier Du Patient</span>
          <span className="text-white/25 text-[10.5px] font-semibold tracking-wide">v1.0.0</span>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] bg-white rounded-2xl border border-surface-200 shadow-card p-9 animate-fade-up">

          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Stethoscope size={18} strokeWidth={1.75} className="text-white" />
            </div>
            <div>
              <div className="text-ink text-[15px] font-black">Dossier Du Patient</div>
              <div className="text-ink-faint text-[10px] font-semibold uppercase tracking-wide">Gestion clinique</div>
            </div>
          </div>

          <h2 className="text-xl font-black text-ink tracking-tight mb-1">Connexion</h2>
          <p className="text-[13px] text-ink-faint mb-7">
            Entrez votre identifiant (ex : b.assanvo) et votre PIN.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              {...register('email')}
              label="Identifiant"
              type="text"
              placeholder="b.assanvo"
              leftIcon={<User size={15} strokeWidth={1.75} />}
              error={errors.email?.message}
              autoComplete="username"
            />
            <Input
              {...register('password')}
              label="Code PIN"
              type={showPass ? 'text' : 'password'}
              placeholder="••••"
              leftIcon={<Lock size={15} strokeWidth={1.75} />}
              error={errors.password?.message}
              autoComplete="current-password"
              rightElement={
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="p-1.5 text-ink-faint hover:text-ink-muted transition-colors">
                  {showPass ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                </button>
              }
            />

            {apiError && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-700 font-semibold">
                <AlertCircle size={14} strokeWidth={1.75} className="flex-shrink-0" />
                {apiError}
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
              <ShieldCheck size={16} strokeWidth={1.75} />
              Se connecter
            </Button>
          </form>

          <div className="mt-5 text-center text-[11px] text-ink-faint flex items-center justify-center gap-2">
            <ShieldCheck size={11} strokeWidth={1.75} />
            <span>Connexion sécurisée</span>
            <span className="w-1 h-1 rounded-full bg-surface-200" />
            <span>DDP © 2026</span>
          </div>
        </div>
      </div>
    </div>
  )
}