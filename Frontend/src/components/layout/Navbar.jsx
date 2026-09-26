import { useState } from 'react'
import { Menu, X, LayoutDashboard } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'
import Button from '../common/Button'
import Avatar from '../common/Avatar'
import { useAuth } from '../../hooks/useAuth'

const links = [
  ['Home', '/'],
  ['Events', '/events'],
  ['Clubs', '/clubs'],
  ['Notices', '/notices'],
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  const userAvatar = user?.profileImage || user?.club?.logo
  const dashboardPath = user ? `/${user.role}/dashboard` : '/login'
  const roleLabel = user?.role === 'club' ? 'Organization' : user?.role

  return (
    <header className="public-nav">
      <div className="container nav-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Primary">
          {links.map(([n, to]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {n}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link
                to={dashboardPath}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '4px 14px 4px 6px',
                  borderRadius: 99,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s ease',
                }}
                title={`Logged in as ${user.name} (${roleLabel})`}
              >
                <Avatar name={user.name} src={userAvatar} size="sm" />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                  <strong style={{ fontSize: 13, color: '#f3f3f6', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </strong>
                  <span style={{ fontSize: 10, color: 'var(--accent)', textTransform: 'capitalize', fontWeight: 500 }}>
                    {roleLabel}
                  </span>
                </div>
              </Link>
              <Link to={dashboardPath}>
                <Button>
                  <LayoutDashboard size={15} /> Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-login">
                Log in
              </Link>
              <Link to="/register">
                <Button>Get started</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="menu-button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <nav className="mobile-menu" aria-label="Mobile navigation">
          {links.map(([n, to]) => (
            <NavLink onClick={() => setOpen(false)} key={to} to={to}>
              {n}
            </NavLink>
          ))}
          {user ? (
            <Link
              to={dashboardPath}
              onClick={() => setOpen(false)}
              className="mobile-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}
            >
              <Avatar name={user.name} src={userAvatar} size="sm" />
              <span>Dashboard ({user.name})</span>
            </Link>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)}>
                Log in
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="mobile-primary">
                Get started
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
