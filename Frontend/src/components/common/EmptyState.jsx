import { SearchX } from 'lucide-react'
import Button from './Button'
export default function EmptyState({title='Nothing found',message='Try changing your search or filters.',onReset}) { return <div className="empty-state"><SearchX size={28}/><h3>{title}</h3><p>{message}</p>{onReset&&<Button variant="secondary" onClick={onReset}>Clear filters</Button>}</div> }
