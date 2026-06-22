'use client'

import useSWR, { mutate } from 'swr'
import { apiRequest } from '../services/api.service'

interface UserProfile {
  id: number
  email: string
  credits: number // Déjà aligné avec l'US-04 (Système de crédits MySQL)
}

export function useAuth() {
  // SWR récupère le profil côté client; authentication uses httpOnly cookies
  const {
    data: user,
    error,
    isLoading,
  } = useSWR<UserProfile>(
    typeof window !== 'undefined' ? '/auth/profile' : null,
    (url: string) => apiRequest<UserProfile>(url, { method: 'GET' }),
    {
      shouldRetryOnError: false, // Fetch wrapper gère le refresh
      revalidateOnFocus: true,
    },
  )

  const login = async (credentials: Record<string, string>) => {
    const data = await apiRequest<{ user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: credentials,
    })

    // Mise à jour du cache SWR avec l'utilisateur retourné côté serveur
    await mutate('/auth/profile', data.user, false)
  }

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch {
      // On ignore l'erreur backend si la session est déjà détruite
    } finally {
      await mutate('/auth/profile', null, false)
      window.location.href = '/login'
    }
  }

  return {
    user: user || null,
    isAuthenticated: !!user,
    isLoading,
    isError: !!error,
    login,
    logout,
  }
}
