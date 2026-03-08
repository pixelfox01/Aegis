import { useAuth0 } from "@auth0/auth0-react"
import { useScrollDirection } from "../hooks/useScrollDirection"

interface HeaderProps {
  visible: boolean
  dark: boolean
  setDark: (dark: boolean) => void
}

export default function Header({ visible, dark, setDark }: HeaderProps) {
  const { loginWithRedirect, isLoading } = useAuth0()
  const { scrollDirection, isTop } = useScrollDirection()

  const handleSignUp = () =>
    loginWithRedirect({ authorizationParams: { screen_hint: "signup" } })

  const headerClasses = [
    'docs-header',
    visible ? 'visible' : '',
    scrollDirection === 'down' && !isTop ? 'header-hidden' : '',
    isTop ? 'header-at-top' : ''
  ].filter(Boolean).join(' ')

  return (
    <nav className={headerClasses}>
      <a href="/" className="nav-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C6 2 3 7 3 12c0 3 1.5 5.5 4 7l5-9 5 9c2.5-1.5 4-4 4-7 0-5-3-10-9-10z" />
        </svg>
        Raven
      </a>
      <div className="nav-links">
        <a href="/" className="nav-btn">Home</a>
        <a href="/docs" className="nav-btn">Docs</a>
        <button
          className="nav-btn primary"
          onClick={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? "..." : "Create account"}
        </button>
        <button
          className="header-theme-toggle"
          onClick={() => setDark(!dark)}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="toggle-icon icon-sun">☀️</span>
          <span className="toggle-icon icon-moon">🌙</span>
          <span className="toggle-knob" />
        </button>
      </div>
    </nav>
  )
}
