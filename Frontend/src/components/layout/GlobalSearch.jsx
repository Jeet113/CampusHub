import { useEffect, useState } from 'react'
import { CalendarDays, Building2, FileText, Search, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from '../common/Modal'
import { api } from '../../services/api'

export default function GlobalSearch({ open, onClose, role = 'student' }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) {
      setQ('')
      setResults(null)
      return
    }
  }, [open])

  useEffect(() => {
    const term = q.trim()
    if (!term) {
      setResults(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(term)}`)
        if (!active) return
        const d = res?.data || {}
        setResults({
          Events: (d.events || []).slice(0, 4),
          Clubs: (d.clubs || []).slice(0, 4),
          Notices: (d.notices || []).slice(0, 4),
        })
      } catch {
        if (active) setResults({ Events: [], Clubs: [], Notices: [] })
      } finally {
        if (active) setLoading(false)
      }
    }, 200)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [q])

  const go = (type, item) => {
    onClose()
    setQ('')
    const id = item.slug || item._id || item.id
    if (role === 'student') {
      if (type === 'Events') navigate(`/student/events/${id}`)
      else if (type === 'Clubs') navigate(`/student/clubs/${id}`)
      else navigate('/student/notices')
    } else {
      navigate(`/${role}/${type.toLowerCase()}`)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Search CampusHub">
      <label className="global-search">
        {loading ? <Loader2 size={18} className="spinner" /> : <Search size={18} />}
        <span className="sr-only">Search events, clubs and notices</span>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search campus events, clubs and notices…"
        />
      </label>
      <div className="search-results">
        {!q.trim() ? (
          <div className="search-hint">
            <span>Try “Workshop”</span>
            <span>Try “Club”</span>
            <span>Try “Calendar”</span>
          </div>
        ) : loading && !results ? (
          <div className="search-hint" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <span>Searching live campus database…</span>
          </div>
        ) : results ? (
          Object.entries(results).map(([type, items]) => (
            <section key={type}>
              <h3>{type}</h3>
              {items.length ? (
                items.map((item) => {
                  const Icon = type === 'Events' ? CalendarDays : type === 'Clubs' ? Building2 : FileText
                  return (
                    <button key={item._id || item.id} onClick={() => go(type, item)}>
                      <Icon size={17} />
                      <span>{item.title || item.name}</span>
                      <small>{item.category || item.organizer}</small>
                    </button>
                  )
                })
              ) : (
                <p>No matching {type.toLowerCase()} found.</p>
              )}
            </section>
          ))
        ) : null}
      </div>
    </Modal>
  )
}
