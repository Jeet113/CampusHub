import NoticeCard from './NoticeCard'
import EmptyState from '../common/EmptyState'

export default function NoticeList({ notices = [], onSelect }) {
  return notices.length ? (
    <div className="notice-list">
      {notices.map((n) => (
        <NoticeCard key={n.id || n._id} notice={n} onSelect={onSelect} />
      ))}
    </div>
  ) : (
    <EmptyState title="No notices found" />
  )
}
