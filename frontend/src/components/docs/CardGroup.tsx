import { ReactNode } from 'react'

interface CardGroupProps {
  cols?: number
  children: ReactNode
}

function CardGroup({ cols = 2, children }: CardGroupProps) {
  return (
    <div className="card-group" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {children}
    </div>
  )
}

export default CardGroup
