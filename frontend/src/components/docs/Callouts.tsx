import { ReactNode } from 'react'

interface CalloutProps {
  children: ReactNode
}

export function Info({ children }: CalloutProps) {
  return (
    <div className="callout callout-info">
      <span className="callout-icon">ℹ️</span>
      <div className="callout-content">{children}</div>
    </div>
  )
}

export function Warning({ children }: CalloutProps) {
  return (
    <div className="callout callout-warning">
      <span className="callout-icon">⚠️</span>
      <div className="callout-content">{children}</div>
    </div>
  )
}

export function Tip({ children }: CalloutProps) {
  return (
    <div className="callout callout-tip">
      <span className="callout-icon">💡</span>
      <div className="callout-content">{children}</div>
    </div>
  )
}

export function Note({ children }: CalloutProps) {
  return (
    <div className="callout callout-note">
      <span className="callout-icon">📝</span>
      <div className="callout-content">{children}</div>
    </div>
  )
}

export function Check({ children }: CalloutProps) {
  return (
    <div className="callout callout-check">
      <span className="callout-icon">✓</span>
      <div className="callout-content">{children}</div>
    </div>
  )
}
