import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { Auth0Provider } from "@auth0/auth0-react"
import { env } from './config/env'

const AppWithAuth = () => {
  if (env.authMode === 'auth0' && env.auth0Domain && env.auth0ClientId) {
    return (
      <Auth0Provider
        domain={env.auth0Domain}
        clientId={env.auth0ClientId}
        authorizationParams={{ redirect_uri: window.location.origin }}
      >
        <App />
      </Auth0Provider>
    )
  }
  
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithAuth />
  </StrictMode>,
)
