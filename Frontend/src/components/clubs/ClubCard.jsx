import { Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '../common/Avatar'
import Badge from '../common/Badge'
import { useAuth } from '../../hooks/useAuth'

export default function ClubCard({ club, base }) {
  const { user } = useAuth()
  const defaultBase = user?.role === 'student' ? '/student/clubs' : '/clubs'
  const routeBase = base || defaultBase

  return (
    <article className="club-card interactive-card">
      <div className="club-heading">
        <Avatar name={club.initials} size="lg" color={club.accent} src={club.logo} />
        <Badge>{club.category}</Badge>
      </div>
      <div>
        <h3>{club.name}</h3>
        <p>{club.description}</p>
      </div>
      <div className="club-footer">
        <span>
          <Users size={16} />
          {club.members.toLocaleString()} members
        </span>
        <Link to={`${routeBase}/${club.id || club.slug}`}>
          View club <span aria-hidden>↗</span>
        </Link>
      </div>
    </article>
  )
}
