import NoticeCard from './NoticeCard'
import EmptyState from '../common/EmptyState'
export default function NoticeList({notices}) { return notices.length?<div className="notice-list">{notices.map(n=><NoticeCard key={n.id} notice={n}/>)}</div>:<EmptyState title="No notices found"/> }
