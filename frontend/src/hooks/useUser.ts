import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { env } from '../config/env'

interface User {
  id: string
  email: string | null
  auth_provider: string
}

function useAuth0User() {
  const { isAuthenticated, getAccessTokenSilently, user: auth0User } = useAuth0()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function syncUser() {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently()
          const response = await fetch(`${env.apiUrl}/users/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              email: auth0User?.email,
              sub: auth0User?.sub
            })
          })

          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
            localStorage.setItem('aegis_user_id', userData.id)
          }
        } catch (error) {
          console.error('Failed to sync user:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    syncUser()
  }, [isAuthenticated, getAccessTokenSilently, auth0User])

  return { user, loading }
}

function useLocalUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function syncUser() {
      const token = localStorage.getItem('aegis_token')
      if (token) {
        try {
          const response = await fetch(`${env.apiUrl}/users/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
          })

          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
            localStorage.setItem('aegis_user_id', userData.id)
          }
        } catch (error) {
          console.error('Failed to sync user:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    syncUser()
  }, [])

  return { user, loading }
}

export function useUser() {
  if (env.authMode === 'auth0') {
    return useAuth0User()
  }
  return useLocalUser()
}
