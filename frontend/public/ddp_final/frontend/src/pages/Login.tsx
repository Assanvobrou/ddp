import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  User, Lock, Eye, EyeOff,
  AlertCircle, ShieldCheck,
  ClipboardList, BarChart2, Settings
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8EDEE]">

      {/* ── PANNEAU GAUCHE — visible desktop uniquement ── */}
      <div className="hidden lg:flex lg:w-[440px] xl:w-[500px] flex-shrink-0 flex-col justify-between
        px-10 xl:px-14 py-12 relative overflow-hidden
        bg-gradient-to-br from-[#B76E79] to-[#A85D6B] text-white">

        {/* Cercles décoratifs */}
        <div className="absolute top-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute top-[100px] right-[-40px] w-[200px] h-[200px] rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-60px] w-[260px] h-[260px] bg-white/5 rounded-full pointer-events-none" />

        {/* Logo + nom */}
        <div className="flex flex-col items-center text-center z-10">
          <img
            src="/logo_2.png"
            alt="Maternité Rahama"
            className="h-[130px] w-[130px] xl:h-[150px] xl:w-[150px] object-contain mb-5"
            style={{ filter: 'brightness(0) invert(1)' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <h1 className="text-[28px] xl:text-[32px] font-extrabold tracking-tight leading-tight">
            Maternité Rahama
          </h1>
          <p className="text-white/60 text-[10px] uppercase tracking-widest mt-2">
            Système de gestion clinique
          </p>
        </div>

        {/* Tagline + features */}
        <div className="z-10">
          <h2 className="text-[17px] font-semibold text-white/90 mb-3">
            Une gestion simple et fiable
          </h2>
          <p className="text-white/60 text-[13px] leading-relaxed mb-8 max-w-[340px]">
            Une plateforme simple pour gérer les patients, les paiements et le personnel médical, au quotidien.
          </p>
          <div className="space-y-3">
            {[
              { icon: <ClipboardList size={15} />, text: 'Dossiers patients sécurisés' },
              { icon: <ShieldCheck size={15} />, text: 'Accès selon votre rôle' },
              { icon: <BarChart2 size={15} />, text: 'Suivi des recettes en temps réel' },
              { icon: <Settings size={15} />, text: 'Configuration flexible' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <span className="text-white/70 text-[13px]">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="z-10 flex justify-between text-white/30 text-xs">
          <span>© 2026 Maternité Rahama</span>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* ── PANNEAU DROIT — formulaire ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 min-h-screen lg:min-h-0">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">

          {/* Header mobile — logo + nom */}
          <div className="flex lg:hidden items-center gap-3 mb-7">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#B76E79] to-[#A85D6B] flex items-center justify-center flex-shrink-0 shadow-md">
              <img src="/logo_2.png" alt="Logo"
                className="h-10 w-10 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div>
              <p className="font-extrabold text-[15px] text-gray-900">Maternité Rahama</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Système de gestion</p>
            </div>
          </div>

          <h2 className="text-[22px] sm:text-2xl font-extrabold text-gray-900 mb-1">Connexion</h2>
          <p className="text-[13px] text-gray-500 mb-6">
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                e.target.value = e.target.value.toLowerCase()
                register('email').onChange(e)
              }}
              style={{ textTransform: 'lowercase' as const }}
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
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                </button>
              }
            />

            {apiError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-600 font-medium">
                <AlertCircle size={14} strokeWidth={1.75} className="flex-shrink-0" />
                {apiError}
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
              <ShieldCheck size={16} strokeWidth={1.75} />
              Se connecter
            </Button>
          </form>

          <div className="mt-5 text-center text-[11px] text-gray-400 flex items-center justify-center gap-2">
            <ShieldCheck size={11} strokeWidth={1.75} />
            <span>Connexion sécurisée</span>
            <span className="w-1 h-1 rounded-full bg-gray-200" />
            <span>Maternité Rahama © 2026</span>
          </div>
        </div>
      </div>
    </div>
  )
}
