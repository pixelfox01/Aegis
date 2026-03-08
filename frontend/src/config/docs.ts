export interface DocSection {
  title: string
  pages: DocPage[]
}

export interface DocPage {
  title: string
  path: string
}

export const docsConfig: DocSection[] = [
  {
    title: 'Getting Started',
    pages: [
      { title: 'Introduction', path: 'getting-started/introduction' },
      { title: 'Requirements', path: 'getting-started/requirements' },
      { title: 'Quick Start', path: 'getting-started/quick-start' },
    ],
  },
  {
    title: 'Docker',
    pages: [
      { title: 'Docker Compose', path: 'docker/compose' },
    ],
  },
  {
    title: 'Configuration',
    pages: [
      { title: 'Environment Variables', path: 'configuration/environment' },
    ],
  },
]
