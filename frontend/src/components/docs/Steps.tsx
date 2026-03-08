import { ReactNode } from 'react'

interface StepProps {
  title: string
  children: ReactNode
}

export function Step({ title, children }: StepProps) {
  return (
    <div className="step">
      <h3 className="step-title">{title}</h3>
      <div className="step-content">{children}</div>
    </div>
  )
}

interface StepsProps {
  children: ReactNode
}

function Steps({ children }: StepsProps) {
  return <div className="steps">{children}</div>
}

export default Steps
