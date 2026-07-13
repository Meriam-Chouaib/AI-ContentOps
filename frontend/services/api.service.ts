import { ENV } from '@/env.config'
import { mutate } from 'swr'

// On étend proprement RequestInit en autorisant un body de type 'any' pour faciliter l'envoi d'objets
interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any
}

// Variables globales au fichier pour gérer la concurrence lors du rafraîchissement du token
let isRefreshing = false
let failedQueue: Array<{
  resolve: () => void
  reject: (error: any) => void
}> = []

/**
 * Traite la file d'attente des requêtes mises en pause pendant le refresh
 */
const processQueue = (error: any) => {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error)
    else promise.resolve()
  })
  failedQueue = []
}

/**
 * Appelle silencieusement la route de rafraîchissement du backend.
 * Le serveur met à jour les cookies httpOnly et renvoie un statut OK.
 */
async function executeTokenRefresh(): Promise<void> {
  const response = await fetch(`${ENV.apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Indispensable pour envoyer le cookie httpOnly 'refresh_token'
  })

  if (!response.ok) {
    throw new Error('Session expirée')
  }

  // We do not store tokens client-side. Server sets httpOnly cookies.
  return
}

/**
 * Wrapper Fetch intelligent de niveau entreprise (cookie-based tokens)
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = `${ENV.apiUrl}${endpoint}`

  // 1. Configuration des headers (pas d'Authorization: Bearer depuis le client)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Permet la transmission sécurisée des cookies cross-origin
    body: options.body ? JSON.stringify(options.body) : undefined,
  }

  try {
    const response = await fetch(url, config)

    // 2. Gestion de l'expiration de l'Access Token (Erreur 401)
    if (response.status === 401) {
      // Si on est côté serveur (SSR), on ne tente pas de refresh client
      if (typeof window === 'undefined') {
        throw new Error('Non autorisé')
      }

      // Si un rafraîchissement est déjà en cours, on met cette requête dans la file d'attente
      if (isRefreshing) {
        return new Promise<T>((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(apiRequest<T>(endpoint, options) as any),
            reject,
          })
        }).then(() => {
          return apiRequest<T>(endpoint, options)
        })
      }

      isRefreshing = true

      try {
        // Tente de récupérer un nouvel access token via le cookie refresh
        await executeTokenRefresh()

        // Libère toutes les requêtes en attente dans la queue
        processQueue(null)

        // Rejoue la requête initiale qui avait échoué
        return await apiRequest<T>(endpoint, options)
      } catch (refreshError) {
        // Échec critique du rafraîchissement (le refresh_token en cookie est expiré/invalide)
        processQueue(refreshError)
        // Clear global SWR authentication cache to ensure no stale state
        await mutate('/auth/profile', null, false)
        // Redirection propre vers la page de login seulement si on n'y est pas déjà
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        throw refreshError
      } finally {
        isRefreshing = false
      }
    }

    // 3. Extraction générique des données (gère le cas où le body est vide)
    const isJson = response.headers
      .get('content-type')
      ?.includes('application/json')
    const data = isJson ? await response.json() : null

    // 4. Gestion fine des erreurs NestJS / Standard HTTP
    if (!response.ok) {
      // If the backend returned a structured validation error (with an 'errors' array),
      // serialize the whole object so callers can parse row-level details.
      if (data && data.errors && Array.isArray(data.errors)) {
        throw new Error(JSON.stringify(data))
      }
      const errorMessage = data
        ? Array.isArray(data.message)
          ? data.message[0]
          : data.message
        : 'Une erreur réseau est survenue'
      throw new Error(errorMessage || `Erreur: ${response.status}`)
    }

    return data as T
  } catch (error) {
    throw error
  }
}

/**
 * Downloads a file from the API using the same credential logic.
 */
export async function apiDownload(endpoint: string, filename: string): Promise<void> {
  const url = `${ENV.apiUrl}${endpoint}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to download file: ${response.status} ${errorText}`)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}
