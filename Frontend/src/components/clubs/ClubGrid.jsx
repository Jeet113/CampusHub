import ClubCard from './ClubCard'
import EmptyState from '../common/EmptyState'
export default function ClubGrid({clubs,...props}) { return clubs.length?<div className="card-grid">{clubs.map(c=><ClubCard club={c} key={c.id} {...props}/>)}</div>:<EmptyState title="No clubs found"/> }
