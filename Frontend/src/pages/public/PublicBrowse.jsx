import { useMemo, useState } from 'react'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import PageHeader from '../../components/layout/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import EventGrid from '../../components/events/EventGrid'
import ClubGrid from '../../components/clubs/ClubGrid'
import NoticeList from '../../components/notices/NoticeList'
import LoadingState from '../../components/common/LoadingState'
import { useApi } from '../../hooks/useApi'

function fmt(d){if(!d)return '';return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
function day(d){if(!d)return '';return new Date(d).getDate()}
function month(d){if(!d)return '';return new Date(d).toLocaleDateString('en-US',{month:'short'})}

export default function PublicBrowse({type}){const [q,setQ]=useState('');const endpoint=type==='events'?'/events':type==='clubs'?'/clubs':'/notices';const {data:raw,loading}=useApi(endpoint);const source=useMemo(()=>{if(!raw)return [];if(type==='events')return raw.map(e=>({...e,id:e._id,date:fmt(e.date),day:day(e.date),month:month(e.date),registrations:e.registrationCount||0,time:e.startTime,status:e.status==='ended'||e.status==='completed'?'Ended':'Published'}));if(type==='clubs')return raw.map(c=>({...c,id:c._id,members:c.memberCount||0}));return raw.map(n=>({...n,id:n._id,date:fmt(n.publishedAt||n.createdAt)}))},[raw,type]);const filtered=useMemo(()=>source.filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase())),[source,q]);const copy={events:['Campus events','Something worth showing up for.','Workshops, competitions, cultural programs, and campus moments—organized in one place.'],clubs:['Student organizations','Find your people.','Explore communities built around curiosity, craft, service, and shared ambition.'],notices:['Notice board','Know what matters.','Current academic, general, club, and event updates from across campus.']}[type];return <div className="public-page"><Navbar/><main className="browse-main"><div className="container"><PageHeader eyebrow={copy[0]} title={copy[1]} description={copy[2]} actions={<SearchBar value={q} onChange={setQ} placeholder={`Search ${type}…`}/>}/>{loading?<LoadingState/>:type==='events'?<EventGrid events={filtered} base="/events"/>:type==='clubs'?<ClubGrid clubs={filtered} base="/clubs"/>:<NoticeList notices={filtered}/>}</div></main><Footer/></div>}
