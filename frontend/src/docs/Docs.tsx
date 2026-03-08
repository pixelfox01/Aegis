import { useState, lazy, Suspense, ComponentType, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { docsConfig } from '../config/docs'
import { components } from '../mdx-components'
import Breadcrumbs from '../components/docs/Breadcrumbs'
import TableOfContents from '../components/docs/TableOfContents'
import Header from '../components/Header'
import { useScrollDirection } from '../hooks/useScrollDirection'
import { useTheme } from '../hooks/useTheme'
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
  const { dark, setDark } = useTheme()
  const [visible, setVisible] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { scrollDirection, isTop } = useScrollDirection()

  const PageComponent = docPages[currentPage] || docPages['getting-started/introduction']

  const navigateToPage = (path: string) => {
    setSearchParams({ page: path })
  }

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen])

  const allPages = docsConfig.flatMap(section => 
    section.pages.map(page => ({ ...page, section: section.title }))
  )

  const filteredPages = searchQuery
    ? allPages.filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.path.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allPages

  return (
    <div className={`docs-root ${dark ? 'theme-dark' : 'theme-light'}`}>
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="grain" />

      <Header visible={visible} dark={dark} setDark={setDark} />

      <div className={`docs-container ${scrollDirection === 'down' && !isTop ? 'header-hidden' : ''}`}>
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
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? '←' : '→'}
              </button>
            </div>
          </div>
          
          <div className="docs-search">
            <button
              className="search-trigger"
              onClick={() => setSearchOpen(true)}
            >
              <span className="search-icon">🔍</span>
              <span className="search-placeholder">Search documentation...</span>
              <kbd className="search-kbd">
                <span className="kbd-key">⌘</span>
                <span className="kbd-key">K</span>
              </kbd>
            </button>
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

      {searchOpen && (
        <>
          <div className="search-overlay" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} />
          <div className="search-modal">
            <div className="search-modal-header">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-modal-input"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button className="search-close" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
                esc
              </button>
            </div>
            <div className="search-results">
              {filteredPages.length > 0 ? (
                filteredPages.map((page) => (
                  <button
                    key={page.path}
                    className="search-result-item"
                    onClick={() => {
                      navigateToPage(page.path)
                      setSearchOpen(false)
                      setSearchQuery('')
                    }}
                  >
                    <div className="search-result-content">
                      <div className="search-result-title">{page.title}</div>
                      <div className="search-result-breadcrumb">{page.section} / {page.title}</div>
                    </div>
                    <span className="search-result-arrow">→</span>
                  </button>
                ))
              ) : (
                <div className="search-no-results">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Docs