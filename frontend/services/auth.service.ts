import { apiRequest } from './api.service'

export const AuthService = {
  async register(registerData: Record<string, string>) {
    return apiRequest<any>('/users', {
      method: 'POST',
      body: registerData,
    })
  },
}
