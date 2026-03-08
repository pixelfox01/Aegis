import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { env } from '../config/env'

export type Preferences = Record<string, string>

// Human-readable labels for each preference key.
export const PREF_LABELS: Record<string, string> = {
  data_collection:     'Data collection',
  third_party_sharing: 'Third-party sharing',
  data_retention:      'Data retention',
  tracking_cookies:    'Tracking cookies',
  account_deletion:    'Account deletion',
}

// Human-readable labels for each possible value.
export const VALUE_LABELS: Record<string, string> = {
  high: 'High', medium: 'Medium', low: 'Low',
  strict: 'Strict', moderate: 'Moderate', relaxed: 'Relaxed',
  block: 'Block', limit: 'Limit', allow: 'Allow',
  critical: 'Critical', nice: 'Nice to have', indifferent: 'Indifferent',
}

// Valid options per preference key (used to render select dropdowns).
export const PREF_OPTIONS: Record<string, { value: string; label: string }[]> = {
  data_collection: [
    { value: 'high',   label: 'High'   },
    { value: 'medium', label: 'Medium' },
    { value: 'low',    label: 'Low'    },
  ],
  third_party_sharing: [
    { value: 'strict',   label: 'Strict'   },
    { value: 'moderate', label: 'Moderate' },
    { value: 'relaxed',  label: 'Relaxed'  },
  ],
  data_retention: [
    { value: 'strict',   label: 'Strict'   },
    { value: 'moderate', label: 'Moderate' },
    { value: 'relaxed',  label: 'Relaxed'  },
  ],
  tracking_cookies: [
    { value: 'block', label: 'Block' },
    { value: 'limit', label: 'Limit' },
    { value: 'allow', label: 'Allow' },
  ],
  account_deletion: [
    { value: 'critical',    label: 'Critical'     },
    { value: 'nice',        label: 'Nice to have' },
    { value: 'indifferent', label: 'Indifferent'  },
  ],
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function readLocalPrefs(): Preferences {
  try {
    return JSON.parse(localStorage.getItem('raven_preferences') || '{}')
  } catch {
    return {}
  }
}

async function fetchPreferences(token: string): Promise<Preferences> {
  const res = await fetch(`${env.apiUrl}/users/me/preferences`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`${res.status}`)
  const data = await res.json()
  return (data.preferences && typeof data.preferences === 'object')
    ? data.preferences
    : data
}

async function postPreferences(token: string, prefs: Preferences): Promise<void> {
  const res = await fetch(`${env.apiUrl}/users/me/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ preferences: prefs }),
  })
  if (!res.ok) throw new Error(`${res.status}`)
}

// ── Auth0 variant ─────────────────────────────────────────────────────────────

function useAuth0Preferences() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0()
  const [preferences, setPreferences] = useState<Preferences>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) { setPreferences(readLocalPrefs()); setLoading(false); return }
    getAccessTokenSilently()
      .then(fetchPreferences)
      .then(setPreferences)
      .catch(() => setPreferences(readLocalPrefs()))
      .finally(() => setLoading(false))
  }, [isAuthenticated, getAccessTokenSilently])

  async function savePreferences(prefs: Preferences) {
    setSaving(true)
    // Always persist locally so nothing is lost if the request fails.
    localStorage.setItem('raven_preferences', JSON.stringify(prefs))
    try {
      const token = await getAccessTokenSilently()
      await postPreferences(token, prefs)
    } catch {
      // Endpoint not yet live — local storage is the fallback.
    } finally {
      setPreferences(prefs)
      setSaving(false)
    }
  }

  return { preferences, loading, saving, savePreferences }
}

// ── Local-auth variant ────────────────────────────────────────────────────────

function useLocalPreferences() {
  const [preferences, setPreferences] = useState<Preferences>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('aegis_token')
    if (!token) { setPreferences(readLocalPrefs()); setLoading(false); return }
    fetchPreferences(token)
      .then(setPreferences)
      .catch(() => setPreferences(readLocalPrefs()))
      .finally(() => setLoading(false))
  }, [])

  async function savePreferences(prefs: Preferences) {
    setSaving(true)
    localStorage.setItem('raven_preferences', JSON.stringify(prefs))
    const token = localStorage.getItem('aegis_token')
    if (token) {
      try {
        await postPreferences(token, prefs)
      } catch {
        // Endpoint not yet live — local storage is the fallback.
      }
    }
    setPreferences(prefs)
    setSaving(false)
  }

  return { preferences, loading, saving, savePreferences }
}

// ── Public hook ───────────────────────────────────────────────────────────────

export function usePreferences() {
  if (env.authMode === 'auth0') return useAuth0Preferences()
  return useLocalPreferences()
}
