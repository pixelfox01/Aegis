import { useEffect, useState } from 'react'

interface Heading {
  id: string
  text: string
  level: number
}

function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const content = document.querySelector('.docs-content')
    if (!content) return

    const headingElements = content.querySelectorAll('h2, h3')
    const headingData: Heading[] = Array.from(headingElements).map((heading) => ({
      id: heading.id || heading.textContent?.toLowerCase().replace(/\s+/g, '-') || '',
      text: heading.textContent || '',
      level: parseInt(heading.tagName.charAt(1)),
    }))

    headingElements.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = headingData[index].id
      }
    })

    setHeadings(headingData)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-100px 0px -80% 0px' }
    )

    headingElements.forEach((heading) => observer.observe(heading))

    return () => observer.disconnect()
  }, [])

  if (headings.length === 0) return null

  return (
    <nav className="table-of-contents">
      <h4 className="toc-title">On this page</h4>
      <ul className="toc-list">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={`toc-item toc-level-${heading.level} ${
              activeId === heading.id ? 'active' : ''
            }`}
          >
            <a href={`#${heading.id}`} className="toc-link">
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default TableOfContents
