import { useMemo, useState } from 'react'
import { Users, Building2, CalendarDays, ClipboardCheck, ArrowRight, Eye, Pencil, Ban, Check, X, Trash2, Plus, Send, ShieldCheck, UserPlus, FileText } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import StatCard from '../../components/dashboard/StatCard'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Avatar from '../../components/common/Avatar'
import SearchBar from '../../components/common/SearchBar'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingState from '../../components/common/LoadingState'
import { useToast } from '../../components/common/Toast'
import { useApi } from '../../hooks/useApi'
import { api } from '../../services/api'
import { SettingsPage } from '../student/StudentPages'

function fmt(d){if(!d)return '';const dt=new Date(d);return dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
function day(d){if(!d)return '';return String(new Date(d).getDate())}

export function AdminDashboard(){const {data:metrics,loading}=useApi('/admin/metrics');const {data:eventsRaw}=useApi('/events',{params:{limit:5}});const {data:approvalData}=useApi('/admin/approvals');const m=metrics||{};const events=(eventsRaw||[]).map(e=>({...e,id:e._id,day:day(e.date),title:e.title,organizer:e.organizer,category:e.category}));const pendingClubs=(approvalData?.clubs||[]).slice(0,3);if(loading)return <LoadingState/>;return <><PageHeader eyebrow="Platform control" title="Admin Dashboard" description="A clear view of CampusHub operations and pending work."/><div className="stats-grid"><StatCard icon={Users} label="Total students" value={String(m.studentCount||0)} detail={`${m.recentStudents||0} recent`}/><StatCard icon={Building2} label="Total clubs" value={String(m.clubCount||0)} detail={`${m.pendingClubs||0} awaiting review`}/><StatCard icon={CalendarDays} label="Total events" value={String(m.eventCount||0)} detail={`${m.publishedEvents||0} published`}/><StatCard icon={ClipboardCheck} label="Pending approvals" value={String((m.pendingClubs||0)+(m.pendingEvents||0))} detail="Needs attention"/></div><div className="dashboard-columns admin-overview"><section><div className="section-head"><h2>Campus activity</h2><Badge tone="green">Healthy</Badge></div><div className="admin-chart"><div className="chart-y"><span>400</span><span>300</span><span>200</span><span>100</span><span>0</span></div><div className="line-visual"><svg viewBox="0 0 600 180" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F59E0B" stopOpacity=".25"/><stop offset="1" stopColor="#F59E0B" stopOpacity="0"/></linearGradient></defs><path d="M0 145 C65 140 80 105 140 115 S215 82 270 95 S350 45 410 65 S510 35 600 22 L600 180 L0 180Z" fill="url(#area)"/><path d="M0 145 C65 140 80 105 140 115 S215 82 270 95 S350 45 410 65 S510 35 600 22" fill="none" stroke="#F59E0B" strokeWidth="3"/></svg><div className="chart-x"><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span></div></div></div></section><section><div className="section-head"><h2>Pending approvals</h2><a href="/admin/approvals">Review all <ArrowRight size={15}/></a></div><div className="approval-mini">{pendingClubs.map((c,i)=><article key={c._id}><Avatar name={c.initials||c.name?.slice(0,2)} color={c.accent}/><span><strong>{c.name}</strong><small>Submitted {i+1} day{i?'s':''} ago</small></span><button aria-label="Approve"><Check/></button><button aria-label="Reject"><X/></button></article>)}</div></section></div><div className="admin-feed-grid"><section><div className="section-head"><h2>Recent events</h2></div>{events.slice(0,5).map(e=><div className="feed-row" key={e.id}><span className="event-mini-date">{e.day}</span><span><strong>{e.title}</strong><small>{e.organizer}</small></span><Badge>{e.category}</Badge></div>)}</section></div></>}

function ManagementPage({kind,data,columns,searchBy,renderRow,actions,headerAction}){const [q,setQ]=useState(''),[target,setTarget]=useState(null);const {toast}=useToast();const list=useMemo(()=>data.filter(x=>searchBy(x).toLowerCase().includes(q.toLowerCase())),[data,q,searchBy]);const act=(label,item)=>{if(['Suspend','Reject','Remove','Delete'].includes(label)){setTarget({label,item});return}toast(`${label} action completed`)};return <><PageHeader eyebrow="Platform management" title={kind} description={`Review, organize, and act on ${kind.toLowerCase()} across CampusHub.`} actions={headerAction}/><div className="list-toolbar"><SearchBar value={q} onChange={setQ} placeholder={`Search ${kind.toLowerCase()}…`}/></div><div className="responsive-table admin-table"><div className="table-head">{columns.map(x=><span key={x}>{x}</span>)}</div>{list.map(item=><article key={item.id||item._id||item.email}>{renderRow(item)}<div className="table-actions">{actions(item).map(([label,Icon])=><button key={label} onClick={()=>act(label,item)} aria-label={`${label} ${item.name||item.title}`} title={label}><Icon/></button>)}</div></article>)}</div><ConfirmDialog open={!!target} onClose={()=>setTarget(null)} onConfirm={()=>toast(`${target?.label} action completed`)} title={`${target?.label} this item?`} message="This updates the platform state and requires confirmation." confirmLabel={target?.label} danger/></>}

const CLUB_CATEGORIES = [
  'Technology',
  'Arts & Culture',
  'Sports',
  'Academic',
  'Career',
  'Cultural',
  'Debate',
  'Social',
  'Photography',
  'Robotics',
  'Leadership',
  'Business',
]

const ACCENT_COLORS = [
  '#F59E0B',
  '#10B981',
  '#38BDF8',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#6366F1',
  '#14B8A6',
]

export function AdminUsers() {
  const { data: raw, loading } = useApi('/admin/metrics', { transform: (r) => r })
  const users = (raw?.recentUsers || []).map((u) => ({
    ...u,
    id: u._id,
    joined: fmt(u.createdAt),
    status: u.status === 'active' ? 'Active' : 'Suspended',
  }))
  if (loading) return <LoadingState />
  return (
    <ManagementPage
      kind="Users"
      data={users}
      columns={['User', 'ID / Email', 'Role', 'Department', 'Status', 'Actions']}
      searchBy={(u) => u.name + u.email + (u.id || '')}
      actions={(u) => [
        ['View', Eye],
        ['Edit', Pencil],
        [u.status === 'Suspended' ? 'Activate' : 'Suspend', u.status === 'Suspended' ? Check : Ban],
      ]}
      renderRow={(u) => (
        <>
          <div className="table-title">
            <Avatar name={u.name} />
            <span>
              <strong>{u.name}</strong>
              <small>Joined {u.joined}</small>
            </span>
          </div>
          <span data-label="ID / Email">
            {u.studentId || '—'}
            <small>{u.email}</small>
          </span>
          <span data-label="Role">
            <Badge>{u.role}</Badge>
          </span>
          <span data-label="Department">{u.department || '—'}</span>
          <span data-label="Status">
            <Badge tone={u.status === 'Active' ? 'green' : 'amber'}>{u.status}</Badge>
          </span>
        </>
      )}
    />
  )
}

export function AdminClubs() {
  const { data: raw, loading, refetch } = useApi('/clubs')
  const { toast } = useToast()
  const [seedModal, setSeedModal] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [selectedAccent, setSelectedAccent] = useState('#F59E0B')
  const [createdInfo, setCreatedInfo] = useState(null)
  const [formError, setFormError] = useState('')

  const clubs = (raw || []).map((c) => ({
    ...c,
    id: c._id,
    members: c.memberCount || 0,
    status: c.status === 'approved' ? 'Approved' : c.status === 'pending' ? 'Pending' : 'Suspended',
    created: String(c.established || new Date(c.createdAt).getFullYear()),
  }))

  const handleSeedClub = async (e) => {
    e.preventDefault()
    setSeeding(true)
    setFormError('')
    const form = new FormData(e.currentTarget)
    const establishedRaw = form.get('established')?.toString().trim()
    const initialsRaw = form.get('initials')?.toString().trim().toUpperCase()
    const payload = {
      name: form.get('name')?.toString().trim(),
      clubId: form.get('clubId')?.toString().trim().toUpperCase(),
      email: form.get('email')?.toString().trim().toLowerCase(),
      password: form.get('password')?.toString(),
      category: form.get('category')?.toString().trim() || 'Technology',
      initials: initialsRaw ? initialsRaw.slice(0, 10) : undefined,
      description: form.get('description')?.toString().trim() || undefined,
      established: establishedRaw && !isNaN(Number(establishedRaw)) ? Number(establishedRaw) : undefined,
      accent: selectedAccent || '#F59E0B',
    }

    try {
      await api.post('/admin/clubs', payload)
      toast('Club seeded successfully with login credentials!')
      setCreatedInfo({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        clubId: payload.clubId,
      })
      refetch()
    } catch (err) {
      const errMsg =
        err.errors?.length > 0
          ? err.errors.map((item) => `${item.field.replace('body.', '')}: ${item.message}`).join(' · ')
          : err.message || 'Failed to seed club'
      setFormError(errMsg)
      toast(errMsg)
    } finally {
      setSeeding(false)
    }
  }

  if (loading) return <LoadingState />

  return (
    <>
      <ManagementPage
        kind="Clubs"
        data={clubs}
        columns={['Club', 'Category', 'Members', 'Status', 'Created', 'Actions']}
        searchBy={(c) => c.name + c.category}
        headerAction={
          <Button onClick={() => { setCreatedInfo(null); setFormError(''); setSeedModal(true); }}>
            <Plus size={17} /> Seed / Create Club
          </Button>
        }
        actions={(c) =>
          c.status === 'Pending'
            ? [
                ['Approve', Check],
                ['Reject', X],
                ['View', Eye],
              ]
            : [
                ['View', Eye],
                ['Suspend', Ban],
              ]
        }
        renderRow={(c) => (
          <>
            <div className="table-title">
              <Avatar name={c.initials} color={c.accent} src={c.logo} />
              <strong>{c.name}</strong>
            </div>
            <span data-label="Category">{c.category}</span>
            <span data-label="Members">{c.members.toLocaleString()}</span>
            <span data-label="Status">
              <Badge tone={c.status === 'Approved' ? 'green' : c.status === 'Pending' ? 'amber' : 'neutral'}>
                {c.status}
              </Badge>
            </span>
            <span data-label="Created">{c.created}</span>
          </>
        )}
      />

      {/* Seed Club Modal */}
      <Modal
        open={seedModal}
        onClose={() => setSeedModal(false)}
        title={createdInfo ? 'Club Created & Credentials' : 'Seed / Create Club Account'}
      >
        {createdInfo ? (
          <div style={{ marginTop: 15, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 10 }}>
              <strong style={{ color: '#10B981', display: 'block', marginBottom: 4 }}>
                Club account created & verified!
              </strong>
              <p style={{ margin: 0, fontSize: 13, color: '#c4c4cc' }}>
                The club representative can now log in at <code>/login</code> using these credentials to edit club info, upload banner & logo, post events, and manage members.
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', fontSize: 13 }}>
                <span style={{ color: '#8d8d97' }}>Organization:</span>
                <strong>{createdInfo.name}</strong>
                <span style={{ color: '#8d8d97' }}>Club ID:</span>
                <code>{createdInfo.clubId}</code>
                <span style={{ color: '#8d8d97' }}>Login Email:</span>
                <strong style={{ color: 'var(--accent)' }}>{createdInfo.email}</strong>
                <span style={{ color: '#8d8d97' }}>Password:</span>
                <code>{createdInfo.password}</code>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 5 }}>
              <Button onClick={() => setSeedModal(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSeedClub} className="form-grid" style={{ marginTop: 15, gap: '14px 13px' }}>
            <Input label="Club / Organization Name" name="name" placeholder="e.g. CUET Robotics Society" required className="span-2" />
            <Input label="Club ID / Organization ID" name="clubId" placeholder="e.g. ORG-001 or RS" required />
            <Input label="Acronym / Initials (Max 10 chars)" name="initials" placeholder="e.g. RS, ACM, IEEE" maxLength={10} />

            <Input label="Club Login Email" name="email" type="email" placeholder="robotics@campushub.local" required className="span-2" />
            <Input label="Password for Club Login" name="password" type="password" minLength={8} placeholder="At least 8 characters" required className="span-2" />

            <label className="field">
              <span>Category</span>
              <select name="category" defaultValue="Technology">
                {CLUB_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>

            <Input label="Established Year (Optional)" name="established" type="number" min="1800" max={new Date().getFullYear()} placeholder="e.g. 2018" />

            <div className="span-2">
              <span style={{ fontSize: 12, fontWeight: 500, color: '#aaaab3', display: 'block', marginBottom: 6 }}>
                Brand accent color
              </span>
              <div className="color-swatches">
                {ACCENT_COLORS.map((col) => (
                  <button
                    type="button"
                    key={col}
                    className={`color-swatch ${selectedAccent === col ? 'active' : ''}`}
                    style={{ background: col }}
                    onClick={() => setSelectedAccent(col)}
                    title={col}
                  />
                ))}
                <input
                  type="color"
                  value={selectedAccent}
                  onChange={(e) => setSelectedAccent(e.target.value)}
                  style={{ width: 30, height: 30, border: 'none', background: 'transparent', cursor: 'pointer' }}
                  title="Custom color"
                />
              </div>
            </div>

            <label className="field span-2">
              <span>Description (Optional)</span>
              <textarea name="description" rows={3} placeholder="Initial description. The club leader can edit and expand this after logging in." />
            </label>

            {formError && (
              <div className="form-error span-2" role="alert">
                {formError}
              </div>
            )}

            <div className="span-2" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <Button variant="ghost" type="button" onClick={() => setSeedModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={seeding}>
                {seeding ? 'Creating club account…' : 'Seed Club & Create Credentials'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}

export function AdminEvents(){const {data:raw,loading}=useApi('/events');const events=(raw||[]).map(e=>({...e,id:e._id,day:day(e.date),date:fmt(e.date),status:e.status==='published'?'Published':e.status==='pending'?'Pending':'Draft'}));if(loading)return <LoadingState/>;return <ManagementPage kind="Events" data={events} columns={['Event','Organizer','Date','Category','Status','Actions']} searchBy={e=>e.title+e.organizer+e.category} actions={e=>e.status==='Pending'?[["Approve",Check],["Reject",X],["View",Eye]]:[["View",Eye],["Remove",Trash2]]} renderRow={e=><><div className="table-title"><span className="event-mini-date">{e.day}</span><strong>{e.title}</strong></div><span data-label="Organizer">{e.organizer}</span><span data-label="Date">{e.date}</span><span data-label="Category"><Badge>{e.category}</Badge></span><span data-label="Status"><Badge tone={e.status==='Published'?'green':e.status==='Pending'?'amber':'neutral'}>{e.status}</Badge></span></>}/>}

export function AdminNotices(){const {data:raw,loading,refetch}=useApi('/notices');const [editing,setEditing]=useState(null),[remove,setRemove]=useState(null);const items=(raw||[]).map(n=>({...n,id:n._id,date:fmt(n.publishedAt||n.createdAt)}));const {toast}=useToast();const submit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{if(editing){await api.put(`/notices/${editing._id}`,{title:f.get('title'),description:f.get('content'),category:f.get('category')});toast('Notice updated')}else{await api.post('/notices',{title:f.get('title'),description:f.get('content'),category:f.get('category')});toast('Notice published')}setEditing(null);e.currentTarget.reset();refetch()}catch(err){toast(err.message||'Failed')}};const del=async()=>{try{await api.delete(`/notices/${remove._id}`);toast('Notice deleted');refetch()}catch(err){toast(err.message||'Delete failed')}finally{setRemove(null)}};if(loading)return <LoadingState/>;return <><PageHeader eyebrow="Campus communication" title="Notice management" description="Create and maintain authoritative university updates." actions={<Button onClick={()=>document.getElementById('notice-title')?.focus()}><Plus size={17}/> Create notice</Button>}/><div className="admin-notice-layout"><form className="settings-card" onSubmit={submit}><h2>{editing?'Edit notice':'Create a notice'}</h2><Input id="notice-title" label="Title" name="title" defaultValue={editing?.title||''} key={editing?._id||'new'} required/><div className="form-grid"><label className="field"><span>Category</span><select name="category" defaultValue={editing?.category||'Academic'}><option>Academic</option><option>General</option><option>Club</option><option>Event</option><option>Important</option></select></label><label className="field"><span>Priority</span><select name="priority" defaultValue={editing?.important?'Important':'Normal'}><option>Normal</option><option>Important</option><option>Urgent</option></select></label></div><label className="field"><span>Content</span><textarea name="content" defaultValue={editing?.description||''} rows="6" required/></label><Input label="Publish date" name="date" type="date"/><Button type="submit"><Send size={17}/> {editing?'Update':'Publish'} notice</Button></form><section><div className="section-head"><h2>Published notices</h2><span>{items.length} total</span></div><div className="admin-notice-list">{items.map(n=><article key={n.id}><div><Badge tone={n.important?'amber':'neutral'}>{n.category}</Badge><h3>{n.title}</h3><p>{n.description}</p><time>{n.date}</time></div><button onClick={()=>setEditing(n)} aria-label="Edit notice"><Pencil/></button><button onClick={()=>setRemove(n)} aria-label="Delete notice"><Trash2/></button></article>)}</div></section></div><ConfirmDialog open={!!remove} onClose={()=>setRemove(null)} onConfirm={del} title="Delete this notice?" message="Students will no longer be able to see this notice." confirmLabel="Delete notice" danger/></>}

export function AdminApprovals(){const [tab,setTab]=useState('Clubs');const [resolved,setResolved]=useState([]);const {toast}=useToast();const {data:approvalData,loading}=useApi('/admin/approvals');const {data:noticesRaw}=useApi('/notices');const sets={Clubs:(approvalData?.clubs||[]).map(c=>({id:c._id,_id:c._id,title:c.name,by:c.name,date:fmt(c.createdAt),preview:c.description,type:'club',Icon:Building2})),Events:(approvalData?.events||[]).map(e=>({id:e._id,_id:e._id,title:e.title,by:e.organizer,date:fmt(e.createdAt),preview:e.description,type:'event',Icon:CalendarDays})),Announcements:(noticesRaw||[]).filter(n=>n.status==='pending').map(n=>({id:n._id,_id:n._id,title:n.title,by:'Office of Student Affairs',date:fmt(n.createdAt),preview:n.description,type:'notice',Icon:FileText}))};const act=async(item,decision)=>{try{await api.post(`/admin/approvals/${item._id}/${decision}`,{type:item.type});setResolved(v=>[...v,item.id]);toast(`Submission ${decision==='approve'?'approved':'rejected'}`)}catch(err){toast(err.message||'Action failed')}};if(loading)return <LoadingState/>;return <><PageHeader eyebrow="Review queue" title="Pending approvals" description="Review submissions before they become visible across CampusHub."/><div className="approval-tabs">{Object.keys(sets).map(t=><button className={tab===t?'active':''} onClick={()=>setTab(t)} key={t}>{t}<span>{sets[t].filter(x=>!resolved.includes(x.id)).length}</span></button>)}</div><div className="approval-list">{sets[tab].filter(x=>!resolved.includes(x.id)).map(item=><article key={item.id}><span className="approval-icon"><item.Icon/></span><div><div><Badge tone="amber">Pending review</Badge><time>Submitted {item.date}</time></div><h2>{item.title}</h2><p>{item.preview}</p><small>Submitted by <strong>{item.by}</strong></small></div><div className="approval-actions"><Button variant="ghost"><Eye size={17}/> View</Button><Button variant="secondary" onClick={()=>act(item,'reject')}><X size={17}/> Reject</Button><Button onClick={()=>act(item,'approve')}><Check size={17}/> Approve</Button></div></article>)}{!sets[tab].filter(x=>!resolved.includes(x.id)).length&&<div className="empty-state"><ShieldCheck/><h3>Queue cleared</h3><p>There are no pending {tab.toLowerCase()} to review.</p></div>}</div></>}

export function AdminSettings(){return <SettingsPage title="Platform settings" sections={['New registration alerts','Approval queue reminders','Security notifications','Weekly platform report','Maintenance mode']}/>}
