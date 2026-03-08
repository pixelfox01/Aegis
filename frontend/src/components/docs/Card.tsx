import { ReactNode } from 'react'

interface CardProps {
  title: string
  icon?: string
  href?: string
  children: ReactNode
  horizontal?: boolean
}

function Card({ title, icon, href, children, horizontal = false }: CardProps) {
  const content = (
    <div className={`card ${horizontal ? 'card-horizontal' : ''}`}>
      {icon && <span className="card-icon">{icon}</span>}
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <div className="card-description">{children}</div>
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} className="card-link">
        {content}
      </a>
    )
  }

  return content
}

export default Card
