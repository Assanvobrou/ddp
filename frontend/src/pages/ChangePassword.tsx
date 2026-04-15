import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Button, Input, Card, CardHeader } from '@/components/ui'
import { AppLayout, Topbar } from '@/components/layout/AppLayout'

const schema = z.object({
  ancien_mot_de_passe: z.string().min(1, 'Ancien mot de passe requis'),
  nouveau_mot_de_passe: z.string().min(8, 'Minimum 8 caractères'),
  confirmation: z.string().min(1, 'Confirmation requise'),
}).refine(d => d.nouveau_mot_de_passe === d.confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmation'],
})

type FormData = z.infer<typeof schema>

export default function ChangePassword() {
  const { refreshUser } = useAuth()
  const navigate = useNavigate()
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await authAPI.changePassword(data)
      await refreshUser()
      toast.success('Mot de passe changé avec succès !')
      navigate(-1)
    } catch (e: any) {
      toast.error(e?.response?.data?.erreur || 'Erreur lors du changement')
    }
  }

  return (
    <AppLayout>
      <Topbar title="Changer le mot de passe" subtitle="Sécurité du compte" />
      <div className="p-6">
        <div className="max-w-md">
          <Card>
            <CardHeader title="Nouveau mot de passe" emoji="🔐" />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                {...register('ancien_mot_de_passe')}
                label="Ancien mot de passe *"
                type={showOld ? 'text' : 'password'}
                leftIcon="🔒"
                error={errors.ancien_mot_de_passe?.message}
                rightElement={
                  <button type="button" onClick={() => setShowOld(v => !v)}
                    className="text-xs font-bold text-gray-400 hover:text-gray-700 px-2">
                    {showOld ? 'Masquer' : 'Afficher'}
                  </button>
                }
              />
              <Input
                {...register('nouveau_mot_de_passe')}
                label="Nouveau mot de passe * (min. 8 caractères)"
                type={showNew ? 'text' : 'password'}
                leftIcon="🔑"
                error={errors.nouveau_mot_de_passe?.message}
                rightElement={
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    className="text-xs font-bold text-gray-400 hover:text-gray-700 px-2">
                    {showNew ? 'Masquer' : 'Afficher'}
                  </button>
                }
              />
              <Input
                {...register('confirmation')}
                label="Confirmer le nouveau mot de passe *"
                type="password"
                leftIcon="✅"
                error={errors.confirmation?.message}
              />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => navigate(-1)}>
                  Annuler
                </Button>
                <Button type="submit" loading={isSubmitting} className="flex-1">
                  💾 Enregistrer
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
