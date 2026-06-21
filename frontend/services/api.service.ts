import { ENV } from '@/env.config'

// On étend proprement RequestInit en autorisant un body de type 'any' pour faciliter l'envoi d'objets
interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any
}

// Variables globales au fichier pour gérer la concurrence lors du rafraîchissement du token
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: any) => void
}> = []

/**
 * Traite la file d'attente des requêtes mises en pause pendant le refresh
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error)
    else promise.resolve(token!)
  })
  failedQueue = []
}

/**
 * Appelle silencieusement la route de rafraîchissement du backend
 */
async function executeTokenRefresh(): Promise<string> {
  const response = await fetch(`${ENV.apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Indispensable pour envoyer le cookie httpOnly 'refresh_token'
  })

  if (!response.ok) {
    throw new Error('Session expirée')
  }

  const data = await response.json()
  return data.accessToken
}

/**
 * Wrapper Fetch intelligent de niveau entreprise
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = `${ENV.apiUrl}${endpoint}`

  // 1. Configuration dynamique des headers et injection de l'Access Token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
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
      // Si on est côté serveur (SSR), on ne tente pas de refresh client via localStorage
      if (typeof window === 'undefined') {
        throw new Error('Non autorisé')
      }

      // Si un rafraîchissement est déjà en cours, on met cette requête dans la file d'attente
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((newToken) => {
          // Une fois le token rafraîchi, on met à jour le header et on rejoue
          ;(config.headers as Record<string, string>)['Authorization'] =
            `Bearer ${newToken}`
          return apiRequest<T>(endpoint, options)
        })
      }

      isRefreshing = true

      try {
        // Tente de récupérer un nouvel access token
        const newAccessToken = await executeTokenRefresh()
        localStorage.setItem('access_token', newAccessToken)

        // Libère toutes les requêtes en attente dans la queue
        processQueue(null, newAccessToken)

        // Rejoue la requête initiale qui avait échoué
        ;(config.headers as Record<string, string>)['Authorization'] =
          `Bearer ${newAccessToken}`
        return await apiRequest<T>(endpoint, options)
      } catch (refreshError) {
        // Échec critique du rafraîchissement (le refresh_token en cookie est expiré/invalide)
        processQueue(refreshError, null)
        localStorage.removeItem('access_token')
        window.location.href = '/login'
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
