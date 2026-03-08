import { ReactNode, useState, Children, isValidElement } from 'react'

interface CodeGroupProps {
  children: ReactNode
}

function CodeGroup({ children }: CodeGroupProps) {
  const [activeTab, setActiveTab] = useState(0)
  
  const codeBlocks = Children.toArray(children).filter(child => 
    isValidElement(child) && child.type === 'pre'
  )

  const tabs = codeBlocks.map((block, index) => {
    if (isValidElement(block)) {
      const blockProps = block.props as any
      if (blockProps.children) {
        const code = blockProps.children
        if (isValidElement(code)) {
          const codeProps = code.props as any
          if (codeProps.className) {
            const match = codeProps.className.match(/language-(\w+)/)
            return match ? match[1] : `Tab ${index + 1}`
          }
        }
      }
    }
    return `Tab ${index + 1}`
  })

  return (
    <div className="code-group">
      <div className="code-group-tabs">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`code-group-tab ${index === activeTab ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="code-group-content">
        {codeBlocks[activeTab]}
      </div>
    </div>
  )
}

export default CodeGroup
