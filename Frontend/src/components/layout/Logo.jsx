import { Link } from 'react-router-dom'

export default function Logo({ to = '/', full = false, className = '' }) {
  if (full) {
    return (
      <Link to={to} className={`logo-full ${className}`.trim()} aria-label="CampusHub home">
        <img
          src="/logo-transparent.png"
          alt="CampusHub"
          width="135"
          height="38"
          className="site-logo-img"
          loading="eager"
        />
      </Link>
    )
  }

  return (
    <Link to={to} className={`logo ${className}`.trim()} aria-label="CampusHub home">
      <span className="logo-mark" aria-hidden="true">
        <img
          src="/emblem.png"
          alt="CampusHub"
          width="32"
          height="32"
          className="logo-mark-img"
          loading="eager"
        />
      </span>
      <span className="logo-text">
        Campus<span>Hub</span>
      </span>
    </Link>
  )
}
