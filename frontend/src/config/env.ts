export interface EnvConfig {
  apiUrl: string
  authMode: 'local' | 'auth0'
  auth0Domain?: string
  auth0ClientId?: string
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key]
  if (value !== undefined) {
    return value
  }
  if (defaultValue !== undefined) {
    return defaultValue
  }
  throw new Error(`Missing required environment variable: ${key}`)
}

export const env: EnvConfig = {
  apiUrl: getEnvVar('VITE_API_URL', 'http://localhost:8000'),
  authMode: getEnvVar('VITE_AUTH_MODE', 'local') as 'local' | 'auth0',
  auth0Domain: import.meta.env.VITE_AUTH0_DOMAIN,
  auth0ClientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
}

if (env.authMode === 'auth0' && (!env.auth0Domain || !env.auth0ClientId)) {
  throw new Error('VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID are required when VITE_AUTH_MODE is "auth0"')
}
