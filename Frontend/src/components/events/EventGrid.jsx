import EventCard from './EventCard'
import EmptyState from '../common/EmptyState'
export default function EventGrid({events,...props}) { return events.length?<div className="card-grid event-grid">{events.map(e=><EventCard key={e.id} event={e} {...props}/>)}</div>:<EmptyState title="No events found" {...props}/> }
