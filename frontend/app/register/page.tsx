'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthService } from '../../services/auth.service'
import { FormField, GenericForm } from '@/components/ui/Form'
import { registerSchema } from '@/validations/auth.validation'

export default function RegisterPage() {
  const [status, setStatus] = useState({ success: '', error: '' })

  const registerFields: FormField[] = [
    {
      name: 'email',
      label: 'Adresse Email',
      type: 'email',
      placeholder: 'nom@exemple.com',
    },
    {
      name: 'name',
      label: 'Nom complet',
      type: 'text',
      placeholder: 'Jean Dupont',
    },
    {
      name: 'username',
      label: "Nom d'utilisateur",
      type: 'text',
      placeholder: 'jdupont',
    },
    {
      name: 'password',
      label: 'Mot de passe',
      type: 'password',
      placeholder: '••••••••',
    },
  ]

  const handleRegisterSubmit = async (formData: any) => {
    setStatus({ success: '', error: '' })
    try {
      const data = await AuthService.register(formData)
      setStatus({
        success: `Félicitations ! Compte créé avec succès (ID: ${data.id})`,
        error: '',
      })
    } catch (err: any) {
      setStatus({ success: '', error: err.message })
      throw err
    }
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4'>
      <div className='w-full max-w-md'>
        <GenericForm
          title='Créer un compte'
          subtitle="Rejoignez l'aventure AI-ContentOps"
          fields={registerFields}
          submitLabel="S'inscrire"
          validationSchema={registerSchema}
          onSubmit={handleRegisterSubmit}
          successMessage={status.success}
          errorMessage={status.error}
        />

        <p className='mt-4 text-center text-sm text-gray-600'>
          Vous avez déjà un compte ?{' '}
          <Link
            href='/login'
            className='font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-150'
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
