'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'

export interface FormField {
  name: string
  label: string
  type: 'email' | 'password' | 'text' | 'number'
  placeholder?: string
}

interface GenericFormProps {
  title?: string
  subtitle?: string
  fields: FormField[]
  submitLabel: string
  validationSchema: z.ZodObject<any> // <-- Le schéma de validation obligatoire
  onSubmit: (formData: any) => Promise<void>
  successMessage?: string
  errorMessage?: string
}

export function GenericForm({
  title,
  subtitle,
  fields,
  submitLabel,
  validationSchema,
  onSubmit,
  successMessage,
  errorMessage,
}: GenericFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Initialisation de React Hook Form avec la validation Zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(validationSchema),
  })

  const handleFormSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      await onSubmit(data)
      reset() // Reset le formulaire uniquement en cas de succès
    } catch {
      // L'erreur est capturée par le parent
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100 space-y-6'>
      {(title || subtitle) && (
        <div className='text-center'>
          {title && (
            <h2 className='text-3xl font-extrabold text-gray-900'>{title}</h2>
          )}
          {subtitle && <p className='mt-2 text-sm text-gray-600'>{subtitle}</p>}
        </div>
      )}

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className='space-y-4'
        noValidate
      >
        {fields.map((field) => (
          <div key={field.name} className='flex flex-col gap-1 w-full'>
            <label className='text-sm font-semibold text-gray-700'>
              {field.label}
            </label>
            <input
              type={field.type}
              placeholder={field.placeholder}
              {...register(field.name)} // <-- Enregistrement magique RHF
              className={`w-full px-3 py-2 border rounded-md shadow-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm ${
                errors[field.name]
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
            />
            {/* Affichage ciblé de l'erreur du champ */}
            {errors[field.name] && (
              <span className='text-xs text-red-500 font-medium'>
                {errors[field.name]?.message as string}
              </span>
            )}
          </div>
        ))}

        <div className='pt-2'>
          <Button type='submit' isLoading={isLoading}>
            {submitLabel}
          </Button>
        </div>
      </form>

      {successMessage && (
        <div className='p-3 bg-green-50 text-green-700 text-sm font-medium rounded-md border border-green-200'>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className='p-3 bg-red-50 text-red-700 text-sm font-medium rounded-md border border-red-200'>
          {errorMessage}
        </div>
      )}
    </div>
  )
}
