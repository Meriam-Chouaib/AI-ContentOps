import { ENV } from '@/env.config'

interface RequestOptions extends RequestInit {
  body?: any
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = `${ENV.apiUrl}${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const config: RequestInit = {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  }

  const response = await fetch(url, config)
  const data = await response.json()

  if (!response.ok) {
    const errorMessage = Array.isArray(data.message)
      ? data.message[0]
      : data.message || 'Une erreur est survenue'
    throw new Error(errorMessage)
  }

  return data as T
}
