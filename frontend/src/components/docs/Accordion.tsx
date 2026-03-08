import { ReactNode, useState } from 'react'

interface AccordionProps {
  title: string
  children: ReactNode
}

export function Accordion({ title, children }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="accordion">
      <button
        className="accordion-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div className="accordion-content">{children}</div>}
    </div>
  )
}

interface AccordionGroupProps {
  children: ReactNode
}

function AccordionGroup({ children }: AccordionGroupProps) {
  return <div className="accordion-group">{children}</div>
}

export default AccordionGroup
