'use client'

import { useState } from 'react'
import { useAuth } from '../../hooks/use-auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormField, GenericForm } from '@/components/ui/Form'
import { loginSchema } from '@/validations/auth.validation'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState({ success: '', error: '' })

  const loginFields: FormField[] = [
    {
      name: 'email',
      label: 'Adresse Email',
      type: 'email',
      placeholder: 'nom@exemple.com',
    },
    {
      name: 'password',
      label: 'Mot de passe',
      type: 'password',
      placeholder: '••••••••',
    },
  ]

  const handleLoginSubmit = async (formData: any) => {
    setStatus({ success: '', error: '' })
    try {
      await login(formData)
      setStatus({ success: 'Connexion réussie ! Redirection...', error: '' })
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
      router.push(callbackUrl)
      router.refresh()
    } catch (err: any) {
      setStatus({ success: '', error: err.message })
      throw err
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <GenericForm
        title='Connexion'
        subtitle='Accédez à votre espace AI-ContentOps'
        fields={loginFields}
        submitLabel='Se connecter'
        validationSchema={loginSchema}
        onSubmit={handleLoginSubmit}
        successMessage={status.success}
        errorMessage={status.error}
      />
    </div>
  )
}
