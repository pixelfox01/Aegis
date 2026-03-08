import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { env } from '../config/env'

export interface LinkedService {
  name: string
  domain: string   // populated from agreement_type (e.g. "Privacy Policy")
  linkedAt: string // formatted from created_at ISO timestamp
}

// Raw shape returned by GET /api/accounts
interface AccountRecord {
  id: number
  agreement_id: number
  company_name: string
  agreement_type: string
  created_at: string
}

function toLinkedService(record: AccountRecord): LinkedService {
  return {
    name: record.company_name,
    domain: record.agreement_type,
    linkedAt: record.created_at.split('T')[0], // "2026-03-08T12:30:45" → "2026-03-08"
  }
}

async function fetchServices(token: string): Promise<LinkedService[]> {
  const res = await fetch(`${env.apiUrl}/api/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const data: AccountRecord[] = await res.json()
  return data.map(toLinkedService)
}

function useAuth0LinkedServices() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0()
  const [services, setServices] = useState<LinkedService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }

    getAccessTokenSilently()
      .then(fetchServices)
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [isAuthenticated, getAccessTokenSilently])

  return { services, loading }
}

function useLocalLinkedServices() {
  const [services, setServices] = useState<LinkedService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('aegis_token')
    if (!token) { setLoading(false); return }

    fetchServices(token)
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [])

  return { services, loading }
}

export function useLinkedServices() {
  if (env.authMode === 'auth0') return useAuth0LinkedServices()
  return useLocalLinkedServices()
}
