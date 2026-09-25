import { Bookmark, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../common/Badge'
import { getAssetUrl } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

export default function EventCard({ event, base, saved = false, onSave }) {
  const { user } = useAuth()
  const defaultBase = user?.role === 'student' ? '/student/events' : '/events'
  const routeBase = base || defaultBase
  const bannerUrl = getAssetUrl(event.banner)

  return (
    <article className="event-card interactive-card">
      {bannerUrl ? (
        <div className="event-card-banner-wrap">
          <img src={bannerUrl} alt={event.title} className="event-card-banner-img" />
          <div className="event-card-banner-overlay" />
          <div className="event-card-banner-badges">
            <div className="date-block">
              <strong>{event.day}</strong>
              <span>{event.month}</span>
            </div>
            <div className="event-card-actions">
              <Badge tone="amber">{event.category}</Badge>
              {onSave && (
                <button
                  type="button"
                  className={saved ? 'saved' : ''}
                  onClick={(e) => {
                    e.preventDefault()
                    onSave(event.id || event._id)
                  }}
                  aria-label={saved ? 'Remove saved event' : 'Save event'}
                >
                  <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="event-card-top">
          <div className="date-block">
            <strong>{event.day}</strong>
            <span>{event.month}</span>
          </div>
          <div className="event-card-actions">
            <Badge>{event.category}</Badge>
            {onSave && (
              <button
                type="button"
                className={saved ? 'saved' : ''}
                onClick={(e) => {
                  e.preventDefault()
                  onSave(event.id || event._id)
                }}
                aria-label={saved ? 'Remove saved event' : 'Save event'}
              >
                <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="event-card-body">
        <p className="eyebrow">{event.organizer}</p>
        <h3>{event.title}</h3>
      </div>

      <div className="event-meta">
        <span>
          <MapPin size={15} />
          {event.location?.split(' · ')[0] || event.location}
        </span>
        <span>
          <Users size={15} />
          {event.registrations || 0} going
        </span>
      </div>

      <Link className="card-link" to={`${routeBase}/${event.id || event.slug || event._id}`}>
        View event <span aria-hidden>↗</span>
      </Link>
    </article>
  )
}
