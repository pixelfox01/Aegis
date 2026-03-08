import { useState, lazy, Suspense, ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { docsConfig } from '../config/docs'
import { components } from '../mdx-components'
import '../styles/docs.css'

const docPages: Record<string, React.LazyExoticComponent<ComponentType>> = {
  'getting-started/introduction': lazy(() => import('../content/docs/getting-started/introduction.mdx')),
  'getting-started/requirements': lazy(() => import('../content/docs/getting-started/requirements.mdx')),
  'getting-started/quick-start': lazy(() => import('../content/docs/getting-started/quick-start.mdx')),
  'docker/compose': lazy(() => import('../content/docs/docker/compose.mdx')),
  'configuration/environment': lazy(() => import('../content/docs/configuration/environment.mdx')),
}

function Docs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = searchParams.get('page') || 'getting-started/introduction'
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const PageComponent = docPages[currentPage] || docPages['getting-started/introduction']

  const navigateToPage = (path: string) => {
    setSearchParams({ page: path })
  }

  return (
    <div className="docs-container">
      <aside className={`docs-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="docs-sidebar-header">
          <h2>Documentation</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>
        
        <nav className="docs-nav">
          {docsConfig.map((section) => (
            <div key={section.title} className="nav-section">
              <h3 className="nav-section-title">{section.title}</h3>
              <ul className="nav-pages">
                {section.pages.map((page) => (
                  <li key={page.path}>
                    <button
                      className={`nav-link ${currentPage === page.path ? 'active' : ''}`}
                      onClick={() => navigateToPage(page.path)}
                    >
                      {page.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className="docs-content">
        <Suspense fallback={<div className="loading">Loading documentation...</div>}>
          <MDXProvider components={components}>
            <PageComponent />
          </MDXProvider>
        </Suspense>
      </main>
    </div>
  )
}

export default Docs
