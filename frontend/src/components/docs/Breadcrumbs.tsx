interface BreadcrumbsProps {
  path: string
}

function Breadcrumbs({ path }: BreadcrumbsProps) {
  const parts = path.split('/')
  const breadcrumbs = parts.map((part, index) => ({
    label: part
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    path: parts.slice(0, index + 1).join('/'),
  }))

  return (
    <nav className="breadcrumbs">
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.path} className="breadcrumb-item">
          {index > 0 && <span className="breadcrumb-separator">/</span>}
          <span className="breadcrumb-label">{crumb.label}</span>
        </span>
      ))}
    </nav>
  )
}

export default Breadcrumbs
