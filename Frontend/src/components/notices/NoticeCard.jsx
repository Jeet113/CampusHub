import { ArrowUpRight } from 'lucide-react'
import Badge from '../common/Badge'

export default function NoticeCard({ notice, onSelect }) {
  return (
    <article
      className={`notice-card ${notice.important ? 'important' : ''}`}
      onClick={() => onSelect?.(notice)}
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
    >
      <div>
        <div className="notice-meta">
          <Badge tone={notice.important ? 'amber' : 'neutral'}>{notice.category}</Badge>
          <time>{notice.date}</time>
        </div>
        <h3>{notice.title}</h3>
        <p>{notice.description}</p>
      </div>
      <button
        type="button"
        aria-label={`Read ${notice.title}`}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.(notice)
        }}
      >
        <ArrowUpRight size={18} />
      </button>
    </article>
  )
}
