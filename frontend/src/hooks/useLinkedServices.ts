import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { env } from '../config/env'

export interface LinkedService {
  name: string
  domain: string
  linkedAt: string
}

// Placeholder fallback used until GET /users/me/services is implemented.
const FALLBACK_SERVICES: LinkedService[] = [
  { name: "Google",   domain: "google.com",   linkedAt: "2026-01-10" },
  { name: "Discord",  domain: "discord.com",  linkedAt: "2026-01-22" },
  { name: "Spotify",  domain: "spotify.com",  linkedAt: "2026-02-03" },
  { name: "GitHub",   domain: "github.com",   linkedAt: "2026-02-14" },
  { name: "Amazon",   domain: "amazon.com",   linkedAt: "2026-02-20" },
  { name: "Reddit",   domain: "reddit.com",   linkedAt: "2026-02-28" },
  { name: "Twitch",   domain: "twitch.tv",    linkedAt: "2026-03-01" },
  { name: "LinkedIn", domain: "linkedin.com", linkedAt: "2026-03-05" },
]

async function fetchServices(token: string): Promise<LinkedService[]> {
  const res = await fetch(`${env.apiUrl}/users/me/services`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const data = await res.json()
  // Accept either { services: [...] } or a bare array.
  return Array.isArray(data) ? data : data.services
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
      .catch(() => setServices(FALLBACK_SERVICES))
      .finally(() => setLoading(false))
  }, [isAuthenticated, getAccessTokenSilently])

  return { services, loading }
}

function useLocalLinkedServices() {
  const [services, setServices] = useState<LinkedService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('aegis_token')
    if (!token) { setServices(FALLBACK_SERVICES); setLoading(false); return }

    fetchServices(token)
      .then(setServices)
      .catch(() => setServices(FALLBACK_SERVICES))
      .finally(() => setLoading(false))
  }, [])

  return { services, loading }
}

export function useLinkedServices() {
  if (env.authMode === 'auth0') return useAuth0LinkedServices()
  return useLocalLinkedServices()
}
