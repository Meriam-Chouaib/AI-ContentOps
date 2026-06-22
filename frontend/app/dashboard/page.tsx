'use client'
import { ENV } from '@/env.config'
import { User, UsersService } from '@/services/users.service'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  console.log('API URL utilisée:', ENV.apiUrl)
  useEffect(() => {
    UsersService.findAll()
      .then(setUsers)
      .catch((err) => console.error('Erreur chargement:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Chargement...</div>

  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>
          {u.name} - {u.email}
        </li>
      ))}
    </ul>
  )
}
