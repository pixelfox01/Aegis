import { useState, lazy, Suspense, ComponentType, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { docsConfig } from '../config/docs'
import { components } from '../mdx-components'
import Breadcrumbs from '../components/docs/Breadcrumbs'
import TableOfContents from '../components/docs/TableOfContents'
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
  const [dark, setDark] = useState(true)
  const [visible, setVisible] = useState(false)

  const PageComponent = docPages[currentPage] || docPages['getting-started/introduction']

  const navigateToPage = (path: string) => {
    setSearchParams({ page: path })
  }

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`docs-root ${dark ? 'theme-dark' : 'theme-light'}`}>
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="grain" />

      <div className="docs-container">
        {!sidebarOpen && (
          <button 
            className={`floating-sidebar-toggle ${visible ? 'visible' : ''}`}
            onClick={() => setSidebarOpen(true)}
            title="Open sidebar"
          >
            →
          </button>
        )}
        
        <aside className={`docs-sidebar ${sidebarOpen ? 'open' : 'closed'} ${visible ? 'visible' : ''}`}>
          <div className="docs-sidebar-header">
            <h2>Documentation</h2>
            <div className="sidebar-actions">
              <button
                className="theme-toggle"
                onClick={() => setDark(!dark)}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span className="toggle-icon icon-sun">☀️</span>
                <span className="toggle-icon icon-moon">🌙</span>
                <span className="toggle-knob" />
              </button>
              <button 
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? '←' : '→'}
              </button>
            </div>
          </div>
          
          <div className="docs-search">
            <input
              type="text"
              placeholder="Search documentation..."
              className="search-input"
            />
          </div>
          
          <nav className="docs-nav">
            {docsConfig.map((section) => (
              <div key={section.title} className="nav-section">
                <h3 className="nav-section-title">
                  {section.title}
                </h3>
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

        <main className={`docs-content ${visible ? 'visible' : ''}`}>
          <Breadcrumbs path={currentPage} />
          <Suspense fallback={<div className="loading">Loading documentation...</div>}>
            <MDXProvider components={components}>
              <PageComponent />
            </MDXProvider>
          </Suspense>
        </main>

        <aside className={`docs-toc ${visible ? 'visible' : ''}`}>
          <TableOfContents />
        </aside>
      </div>
    </div>
  )
}

export default Docs