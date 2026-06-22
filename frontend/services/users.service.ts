import { apiRequest } from '@/services/api.service'

// Définition de l'interface utilisateur (doit correspondre à ton entité Backend)
export interface User {
  id: number
  email: string
  name: string
  username: string
}

export const UsersService = {
  /**
   * Récupère la liste de tous les utilisateurs
   */
  async findAll(): Promise<User[]> {
    return apiRequest<User[]>('/users', { method: 'GET' })
  },

  /**
   * Récupère un utilisateur par son ID
   */
  async findOne(id: number): Promise<User> {
    return apiRequest<User>(`/users/${id}`, { method: 'GET' })
  },

  /**
   * Crée un nouvel utilisateur
   */
  async create(userData: Partial<User>): Promise<User> {
    return apiRequest<User>('/users', {
      method: 'POST',
      body: userData,
    })
  },

  /**
   * Met à jour un utilisateur
   */
  async update(id: number, updateData: Partial<User>): Promise<User> {
    return apiRequest<User>(`/users/${id}`, {
      method: 'PATCH',
      body: updateData,
    })
  },

  /**
   * Supprime un utilisateur
   */
  async remove(id: number): Promise<void> {
    return apiRequest<void>(`/users/${id}`, { method: 'DELETE' })
  },
}
