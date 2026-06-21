'use client'

import { useState } from 'react'
import { z } from 'zod' // <-- 1. Importe Zod
import { AuthService } from '../../services/auth.service'
import { FormField, GenericForm } from '@/components/ui/Form'

// 2. Définition du schéma de validation (Best Practice)
const registerSchema = z.object({
  email: z
    .string()
    .min(1, { message: "L'email est obligatoire." })
    .email({ message: "L'adresse email n'est pas valide." }),
  name: z
    .string()
    .min(2, { message: 'Le nom complet doit contenir au moins 2 caractères.' }),
  username: z
    .string()
    .min(3, {
      message: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
    })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message:
        "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores.",
    }),
  password: z.string().min(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères.',
  }),
})

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
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <GenericForm
        title='Créer un compte'
        subtitle="Rejoignez l'aventure AI-ContentOps"
        fields={registerFields}
        submitLabel="S'inscrire"
        validationSchema={registerSchema} // <-- 3. On passe le schéma ici
        onSubmit={handleRegisterSubmit}
        successMessage={status.success}
        errorMessage={status.error}
      />
    </div>
  )
}
