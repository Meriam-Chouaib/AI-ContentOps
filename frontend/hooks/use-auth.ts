'use client'

import useSWR, { mutate } from 'swr'
import { apiRequest } from '../services/api.service'

interface UserProfile {
  id: number
  email: string
  credits: number // Déjà aligné avec l'US-04 (Système de crédits MySQL)
}

export function useAuth() {
  // SWR récupère le profil si un access_token existe en localStorage
  const {
    data: user,
    error,
    isLoading,
  } = useSWR<UserProfile>(
    typeof window !== 'undefined' && localStorage.getItem('access_token')
      ? '/auth/profile'
      : null,
    (url: string) => apiRequest<UserProfile>(url, { method: 'GET' }),
    {
      shouldRetryOnError: false, // Évite de boucler si le token est mort, l'intercepteur fetch gère le refresh
      revalidateOnFocus: true, // Re-vérifie les crédits si l'utilisateur change d'onglet
    },
  )

  const login = async (credentials: Record<string, string>) => {
    const data = await apiRequest<{ accessToken: string; user: UserProfile }>(
      '/auth/login',
      {
        method: 'POST',
        body: credentials,
      },
    )

    localStorage.setItem('access_token', data.accessToken)
    // On met à jour le cache local de SWR instantanément
    await mutate('/auth/profile', data.user, false)
  }

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch {
      // On ignore l'erreur backend si la session est déjà détruite
    } finally {
      localStorage.removeItem('access_token')
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
