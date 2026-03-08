import { useState, useEffect } from 'react'
import { env } from '../config/env'
import { useTheme } from '../hooks/useTheme'

interface LocalAuthProps {
  onAuthSuccess: (token: string) => void
}

export default function LocalAuth({ onAuthSuccess }: LocalAuthProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const { dark, setDark } = useTheme()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const response = await fetch(`${env.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Authentication failed')
      }

      const data = await response.json()
      localStorage.setItem('aegis_token', data.access_token)
      onAuthSuccess(data.access_token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap');

        .theme-dark {
          --ink: #f0ede8;
          --muted: #8a8fa8;
          --accent: #e05444;
          --border: rgba(255,255,255,0.1);
          --bg: #0d0d14;
          --input-bg: rgba(255,255,255,0.05);
          --input-border: rgba(255,255,255,0.15);
          --btn-bg: rgba(240,237,232,0.92);
          --btn-color: #0d0d14;
          --btn-hover: #ffffff;
        }

        .theme-light {
          --ink: #0e0e0e;
          --muted: #8a8680;
          --accent: #c0392b;
          --border: rgba(14,14,14,0.12);
          --bg: #f5f2ed;
          --input-bg: #ffffff;
          --input-border: rgba(14,14,14,0.15);
          --btn-bg: #0e0e0e;
          --btn-color: #f5f2ed;
          --btn-hover: #2a2a2a;
        }

        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          color: var(--ink);
          font-family: 'DM Mono', monospace;
          transition: background 0.5s ease, color 0.5s ease;
          padding: 2rem;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .auth-card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .auth-header {
          margin-bottom: 2rem;
        }

        .auth-title {
          font-size: 1.75rem;
          font-weight: 300;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }

        .auth-subtitle {
          color: var(--muted);
          font-size: 0.875rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          color: var(--muted);
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 4px;
          color: var(--ink);
          font-family: 'DM Mono', monospace;
          font-size: 0.9rem;
          transition: border-color 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .form-hint {
          display: block;
          font-size: 0.75rem;
          color: var(--muted);
          margin-top: 0.25rem;
        }

        .error-message {
          padding: 0.75rem;
          margin-bottom: 1rem;
          background: rgba(224, 84, 68, 0.1);
          border: 1px solid var(--accent);
          border-radius: 4px;
          color: var(--accent);
          font-size: 0.875rem;
        }

        .btn-primary {
          width: 100%;
          padding: 0.875rem;
          background: var(--btn-bg);
          color: var(--btn-color);
          border: none;
          border-radius: 4px;
          font-family: 'DM Mono', monospace;
          font-size: 0.9rem;
          font-weight: 400;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--btn-hover);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer {
          margin-top: 1.5rem;
          text-align: center;
        }

        .btn-link {
          background: none;
          border: none;
          color: var(--accent);
          font-family: 'DM Mono', monospace;
          font-size: 0.875rem;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }

        .theme-toggle {
          position: fixed;
          top: 2rem;
          right: 2rem;
          background: var(--input-bg);
          border: 1px solid var(--border);
          color: var(--ink);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-family: 'DM Mono', monospace;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .theme-toggle:hover {
          background: var(--input-border);
        }
      `}</style>

      <div className={`auth-container ${dark ? 'theme-dark' : 'theme-light'}`}>
        <button className="theme-toggle" onClick={() => setDark(!dark)}>
          {dark ? '☀' : '☾'}
        </button>

        <div className={`auth-card ${visible ? 'visible' : ''}`}>
          <div className="auth-header">
            <h1 className="auth-title">
              {isLogin ? 'Welcome back' : 'Create admin account'}
            </h1>
            <p className="auth-subtitle">
              {isLogin ? 'Sign in to your Raven instance' : 'First-time setup for your instance'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              {!isLogin && (
                <small className="form-hint">
                  Minimum 8 characters
                </small>
              )}
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="auth-footer">
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
            >
              {isLogin ? 'Need to register?' : 'Already have an account?'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
