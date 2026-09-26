import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, Building2, Bell, Bookmark, ArrowRight, MapPin, Clock, Users, Share2, Check, Pencil, Lock, Mail, GraduationCap, Award, Filter, X, Camera, Upload } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import StatCard from '../../components/dashboard/StatCard'
import EventGrid from '../../components/events/EventGrid'
import EventCard from '../../components/events/EventCard'
import ClubGrid from '../../components/clubs/ClubGrid'
import ClubCard from '../../components/clubs/ClubCard'
import NoticeList from '../../components/notices/NoticeList'
import SearchBar from '../../components/common/SearchBar'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Badge from '../../components/common/Badge'
import Avatar from '../../components/common/Avatar'
import Modal from '../../components/common/Modal'
import LoadingState from '../../components/common/LoadingState'
import { useToast } from '../../components/common/Toast'
import { useAuth } from '../../hooks/useAuth'
import { useApi, useMutation } from '../../hooks/useApi'
import { api, getAssetUrl } from '../../services/api'
import { DEPARTMENTS } from '../../data/departments'
import { getEventAutomatedStatus, isEventEnded } from '../../utils/eventStatus'

const FilterPills=({items,active,setActive})=><div className="filter-pills">{items.map(x=><button key={x} className={active===x?'active':''} onClick={()=>setActive(x)}>{x}</button>)}</div>

function fmt(d){if(!d)return '';const dt=new Date(d);return dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
function day(d){if(!d)return '';return new Date(d).getDate()}
function month(d){if(!d)return '';return new Date(d).toLocaleDateString('en-US',{month:'short'})}

export function StudentDashboard(){const {user}=useAuth();const {data:events,loading:el}=useApi('/events',{params:{limit:5}});const {data:clubs,loading:cl}=useApi('/clubs',{params:{limit:4}});const {data:notices,loading:nl}=useApi('/notices',{params:{limit:3}});const {data:notifs}=useApi('/notifications',{params:{limit:5}});const evts=events||[];const clbs=clubs||[];const ntcs=notices||[];const nots=notifs||[];const firstName=user?.name?.split(' ')[0]||'Student';const now=new Date();const greeting=now.getHours()<12?'Good morning':now.getHours()<17?'Good afternoon':'Good evening';const dayName=now.toLocaleDateString('en-US',{weekday:'long'});const dateStr=now.toLocaleDateString('en-US',{month:'long',day:'numeric'});if(el)return <LoadingState/>;return <><PageHeader eyebrow={`${dayName} · ${dateStr}`} title={`${greeting}, ${firstName}.`} description="Here's what's happening around your campus." actions={<Link to="/student/events"><Button>Explore campus <ArrowRight size={17}/></Button></Link>}/><div className="stats-grid"><StatCard icon={CalendarDays} label="Upcoming events" value={String(evts.length).padStart(2,'0')} detail="Browse events"/><StatCard icon={Building2} label="Clubs" value={String(clbs.length).padStart(2,'0')} detail="Explore clubs"/><StatCard icon={Bell} label="Notices" value={String(ntcs.length).padStart(2,'0')} detail="Latest updates"/><StatCard icon={Bookmark} label="Notifications" value={String(nots.length).padStart(2,'0')} detail="Recent activity"/></div><div className="dashboard-columns"><section><SectionHead title="Coming up next" link="/student/events"/>{evts[0]?<div className="featured-event"><div><Badge tone="amber">Your next event</Badge><p className="eyebrow">{evts[0].organizer}</p><h2>{evts[0].title}</h2><div className="featured-meta"><span><CalendarDays/>{fmt(evts[0].date)}</span><span><Clock/>{evts[0].startTime}</span><span><MapPin/>{evts[0].location}</span></div><Link to={`/student/events/${evts[0]._id}`}><Button>View details <ArrowRight size={17}/></Button></Link></div><div className="event-art"><span>{evts[0].category?.slice(0,2)}</span><i/><i/></div></div>:<p style={{padding:'1rem',opacity:.6}}>No upcoming events.</p>}</section><section><SectionHead title="Recent notices" link="/student/notices"/><NoticeList notices={ntcs.slice(0,3).map(n=>({...n,id:n._id,date:fmt(n.publishedAt||n.createdAt)}))}/></section></div><section className="dash-section"><SectionHead title="Recommended clubs" link="/student/clubs"/><div className="mini-club-grid">{clbs.slice(0,4).map(c=><ClubCard club={{...c,id:c._id,members:c.memberCount||0}} key={c._id}/>)}</div></section><section className="quick-actions"><p className="eyebrow">Quick actions</p><div>{[[CalendarDays,'Explore events','/student/events'],[Building2,'Find clubs','/student/clubs'],[Bell,'View notices','/student/notices'],[Pencil,'Edit profile','/student/profile']].map(([Icon,label,to])=><Link to={to} key={label}><Icon/><span>{label}</span><ArrowRight/></Link>)}</div></section></>}
function SectionHead({title,link}){return <div className="section-head"><h2>{title}</h2>{link&&<Link to={link}>View all <ArrowRight size={15}/></Link>}</div>}

export function StudentEvents(){const [q,setQ]=useState(''),[cat,setCat]=useState('All'),[saved,setSaved]=useState([]),[mobile,setMobile]=useState(false);const {toast}=useToast();const {data:raw,loading}=useApi('/events');const events=(raw||[]).map(e=>({...e,id:e._id,date:fmt(e.date),day:day(e.date),month:month(e.date),registrations:e.registrationCount||0,time:e.startTime,status:getEventAutomatedStatus(e)}));const categories=['All','Workshop','Competition','Seminar','Cultural','Sports','Career','Technology','Other'];const list=useMemo(()=>events.filter(e=>{const matchCat=cat==='All'?true:cat==='Other'?!['Workshop','Competition','Seminar','Cultural','Sports','Career','Technology'].includes(e.category)||e.category==='Other':e.category===cat;return matchCat&&(e.title+e.organizer).toLowerCase().includes(q.toLowerCase())}),[events,q,cat]);const toggle=async id=>{if(saved.includes(id)){try{await api.delete(`/events/${id}/save`);setSaved(v=>v.filter(x=>x!==id));toast('Event removed from saved')}catch{}}else{try{await api.post(`/events/${id}/save`);setSaved(v=>[...v,id]);toast('Event saved for later')}catch{}}};if(loading)return <LoadingState/>;return <><PageHeader eyebrow="Discover" title="Campus events" description={`${list.length} opportunities to learn, compete, create, and connect.`}/><div className="list-toolbar"><SearchBar value={q} onChange={setQ} placeholder="Search events or organizers…"/><div className="desktop-filters"><FilterPills items={categories} active={cat} setActive={setCat}/></div><Button variant="secondary" className="mobile-filter" onClick={()=>setMobile(true)}><Filter size={17}/> Filters</Button></div><EventGrid events={list} saved={saved} onSave={toggle} onReset={()=>{setQ('');setCat('All')}}/><Modal open={mobile} onClose={()=>setMobile(false)} title="Filter events"><FilterPills items={categories} active={cat} setActive={setCat}/><Button className="full" onClick={()=>setMobile(false)}>Show {list.length} events</Button></Modal></>}

export function StudentEventDetails({publicView=false}){const {id}=useParams();const {user}=useAuth();const {data:event,loading,refetch}=useApi(id?`/events/${id}`:null);const [registered,setRegistered]=useState(false),[savedEv,setSaved]=useState(false),[confirm,setConfirm]=useState(false);const {toast}=useToast();useEffect(()=>{if(event?.isRegistered)setRegistered(true);if(event?.isSaved)setSaved(true)},[event]);const register=async()=>{try{await api.post(`/events/${event._id}/register`);setRegistered(true);setConfirm(false);toast('Event registered successfully');refetch()}catch(err){toast(err.message||'Registration failed');setConfirm(false)}};if(loading||!event)return <LoadingState/>;const isEnded=isEventEnded(event);const ev={...event,id:event._id,date:fmt(event.date),day:day(event.date),month:month(event.date),time:event.startTime,registrations:event.registrationCount||0};const bannerUrl=getAssetUrl(event.banner);return <><div className="detail-breadcrumb"><Link to={user?.role==='student'?'/student/events':'/events'}>Events</Link><span>/</span><span>{ev.category}</span></div><div className="event-landscape-card"><div className="event-landscape-cover" style={bannerUrl?{backgroundImage:`url(${bannerUrl})`}:{background:'radial-gradient(circle at 80% 30%, rgba(245,158,11,0.22), transparent 45%), linear-gradient(135deg, #1f1a14, #101016)'}}><div className="event-landscape-overlay"/><div className="event-landscape-top-badges"><div className="date-block"><strong>{ev.day}</strong><span>{ev.month}</span></div><div style={{display:'flex',gap:8}}>{isEnded&&<Badge tone="amber">Ended</Badge>}<Badge tone="amber">{ev.category}</Badge></div></div></div><div className="event-landscape-body"><div className="event-landscape-header"><p className="eyebrow">Presented by {ev.organizer}</p><h1>{ev.title}</h1><p className="event-landscape-desc">{ev.description}</p></div><div className="detail-actions">{isEnded?<Button disabled variant="secondary"><Clock size={16}/> Event Ended</Button>:!user?<Link to="/login"><Button>Sign in to register <ArrowRight size={17}/></Button></Link>:user.role==='student'?<Button onClick={()=>setConfirm(true)} disabled={registered}>{registered?<><Check size={18}/> Registered</>:<>Register for event <ArrowRight size={18}/></>}</Button>:user.role==='club'?<Link to="/club/events"><Button variant="secondary"><Pencil size={15}/> Manage events</Button></Link>:<Link to="/admin/events"><Button variant="secondary">Admin events</Button></Link>}{user?.role==='student'&&<Button variant="secondary" onClick={async()=>{try{if(savedEv){await api.delete(`/events/${ev._id}/save`);setSaved(false);toast('Removed from saved events')}else{await api.post(`/events/${ev._id}/save`);setSaved(true);toast('Event saved for later')}}catch{}}}><Bookmark size={18} fill={savedEv?'currentColor':'none'}/>{savedEv?'Saved':'Save'}</Button>}<Button variant="ghost" aria-label="Share event" onClick={()=>{navigator.clipboard?.writeText(window.location.href);toast('Share link copied')}}><Share2 size={18}/></Button></div></div></div><div className="detail-layout"><section><h2>About this event</h2><p>{ev.description} Participants will leave with practical insight, new connections, and resources for continued learning. The session is open to students from every department.</p><h2>What to expect</h2><ul className="check-list"><li><Check/>A focused, beginner-friendly learning experience</li><li><Check/>Hands-on discussion with experienced facilitators</li><li><Check/>Time to meet students with similar interests</li></ul><h2>Organizer</h2><div className="organizer-card"><Avatar name={ev.organizer}/><div><strong>{ev.organizer}</strong><span>Verified campus organization</span></div><Link to={`/clubs/${event.club?.slug || event.club?._id || event.club}`}><Button variant="ghost">View club</Button></Link></div></section><aside className="event-info-card"><h2>Event information</h2><dl><div><CalendarDays/><dt>Date</dt><dd>{ev.date}</dd></div><div><Clock/><dt>Time</dt><dd>{ev.time} – {event.endTime||'5:00 PM'}</dd></div><div><MapPin/><dt>Location</dt><dd>{ev.location}</dd></div><div><Users/><dt>Attendance</dt><dd>{ev.registrations} registered</dd></div></dl><div className="capacity"><div><span>Registration capacity</span><b>{ev.registrations}/{event.capacity||200}</b></div><i><span style={{width:`${Math.min(ev.registrations/(event.capacity||200)*100,100)}%`}}/></i></div></aside></div><Modal open={confirm} onClose={()=>setConfirm(false)} title="Register for this event?" actions={<><Button variant="ghost" onClick={()=>setConfirm(false)}>Cancel</Button><Button onClick={register}>Confirm registration</Button></>}><p className="muted-copy">You're registering for <strong>{ev.title}</strong> on {ev.date}. We'll add it to your activities.</p></Modal></>}

export function StudentClubs(){const [q,setQ]=useState(''),[cat,setCat]=useState('All');const {data:raw,loading}=useApi('/clubs');const clubs=(raw||[]).map(c=>({...c,id:c._id,members:c.memberCount||0}));const categories=['All','Technology','Career','Cultural','Sports','Debate','Social','Photography','Robotics'];const list=useMemo(()=>clubs.filter(c=>(cat==='All'||c.category===cat)&&(c.name+c.description).toLowerCase().includes(q.toLowerCase())),[clubs,q,cat]);if(loading)return <LoadingState/>;return <><PageHeader eyebrow="Communities" title="Find your people" description="Explore student organizations making campus more interesting."/><div className="list-toolbar stacked"><SearchBar value={q} onChange={setQ} placeholder="Search clubs…"/><FilterPills items={categories} active={cat} setActive={setCat}/></div><ClubGrid clubs={list}/></>}

export function StudentClubDetails({publicView=false}){const {id}=useParams();const {data:club,loading,refetch}=useApi(id?`/clubs/${id}`:null);const {data:eventsRaw}=useApi('/events',{params:{limit:2}});const {data:noticesRaw}=useApi('/notices',{params:{limit:3}});const [joined,setJoined]=useState(false),[confirm,setConfirm]=useState(false);const {toast}=useToast();const join=async()=>{try{await api.post(`/clubs/${club._id}/join`);setJoined(true);setConfirm(false);toast('Club joined successfully');refetch()}catch(err){toast(err.message||'Could not join club');setConfirm(false)}};if(loading||!club)return <LoadingState/>;const c={...club,id:club._id,members:club.memberCount||0};const events=(eventsRaw||[]).map(e=>({...e,id:e._id,date:fmt(e.date),day:day(e.date),month:month(e.date),registrations:e.registrationCount||0,time:e.startTime}));const notices=(noticesRaw||[]).map(n=>({...n,id:n._id,date:fmt(n.publishedAt||n.createdAt)}));return <><div className="club-cover" style={{'--club-color':c.accent||'#F59E0B', ...(getAssetUrl(c.banner) ? { backgroundImage: `url(${getAssetUrl(c.banner)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {})}}><div className="club-cover-pattern" style={getAssetUrl(c.banner) ? { display: 'none' } : undefined}/></div><div className="club-profile-head"><Avatar name={c.initials} size="xl" color={c.accent} src={c.logo}/><div><Badge>{c.category}</Badge><h1>{c.name}</h1><p>{c.description}</p><div><span><Users size={16}/>{c.members.toLocaleString()} members</span><span>Established {c.established}</span></div></div>{publicView?<Link to="/login"><Button>Sign in to join</Button></Link>:<Button onClick={()=>setConfirm(true)} disabled={joined}>{joined?<><Check size={18}/> Joined</>:<>Join club <ArrowRight size={18}/></>}</Button>}</div><div className="detail-layout club-detail"><section><h2>About the organization</h2><p>{c.description} We bring together curious students through peer-led sessions, projects, competitions, and meaningful campus initiatives. Everyone is welcome, regardless of prior experience.</p><SectionHead title="Upcoming events" link={publicView?'/events':'/student/events'}/><div className="detail-event-list">{events.slice(0,2).map(e=><EventCard event={e} key={e.id}/>)}</div></section><aside><h2>Recent announcements</h2><div className="announcement-list">{notices.slice(0,3).map(n=><article key={n.id}><Badge>{n.category}</Badge><h3>{n.title}</h3><p>{n.date}</p></article>)}</div></aside></div><Modal open={confirm} onClose={()=>setConfirm(false)} title={`Join ${c.name}?`} actions={<><Button variant="ghost" onClick={()=>setConfirm(false)}>Not now</Button><Button onClick={join}>Join club</Button></>}><p className="muted-copy">You'll receive club announcements and see its activities on your dashboard.</p></Modal></>}

export function StudentNotices(){const [tab,setTab]=useState('All');const {data:raw,loading}=useApi('/notices');const notices=(raw||[]).map(n=>({...n,id:n._id,date:fmt(n.publishedAt||n.createdAt)}));const tabs=['All','Academic','General','Club','Important'];const list=notices.filter(n=>tab==='All'||n.category===tab);if(loading)return <LoadingState/>;return <><PageHeader eyebrow="Notice board" title="Campus updates" description="Clear, current information from across the university."/><FilterPills items={tabs} active={tab} setActive={setTab}/><div className="content-narrow"><NoticeList notices={list}/></div></>}

export function StudentProfile(){
  const {toast}=useToast();
  const {user,updateUser}=useAuth();
  const [uploading,setUploading]=useState(false);
  const [editModal,setEditModal]=useState(false);
  const [passwordModal,setPasswordModal]=useState(false);
  const [editLoading,setEditLoading]=useState(false);
  const [passwordLoading,setPasswordLoading]=useState(false);
  const [passwordError,setPasswordError]=useState('');
  const fileInputRef=useRef(null);

  if(!user)return <LoadingState/>;

  const handleAvatarSelect=async(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;

    if(!file.type.startsWith('image/')){
      toast('Please select an image file (PNG, JPG, WebP)');
      return;
    }
    if(file.size>5*1024*1024){
      toast('Image file must be under 5MB');
      return;
    }

    const formData=new FormData();
    formData.append('image',file);
    formData.append('avatar',file);

    setUploading(true);
    try{
      const res=await api.post('/users/me/avatar',formData);
      if(res?.data){
        updateUser(res.data);
        toast('Profile photo uploaded and saved to Cloudinary!');
      } else if (res?.imageUrl) {
        updateUser({ profileImage: { imageUrl: res.imageUrl, url: res.imageUrl, cloudinaryPublicId: res.cloudinaryPublicId } });
        toast('Profile photo uploaded and saved to Cloudinary!');
      }
    }catch(err){
      toast(err.message||'Failed to upload photo to Cloudinary');
    }finally{
      setUploading(false);
      if(fileInputRef.current)fileInputRef.current.value='';
    }
  };

  const handleEditSubmit=async(e)=>{
    e.preventDefault();
    setEditLoading(true);
    const form=new FormData(e.currentTarget);
    const updates={
      name:form.get('name'),
      department:form.get('department'),
      batch:form.get('batch'),
      phone:form.get('phone'),
      bio:form.get('bio'),
    };
    try{
      const res=await api.put('/users/me',updates);
      if(res?.data){
        updateUser(res.data);
        toast('Profile details updated');
        setEditModal(false);
      }
    }catch(err){
      toast(err.message||'Update failed');
    }finally{
      setEditLoading(false);
    }
  };

  const handlePasswordSubmit=async(e)=>{
    e.preventDefault();
    setPasswordError('');
    const form=new FormData(e.currentTarget);
    const currentPassword=form.get('currentPassword');
    const newPassword=form.get('newPassword');
    const confirmPassword=form.get('confirmPassword');

    if(newPassword!==confirmPassword){
      setPasswordError('New passwords do not match');
      return;
    }
    if(newPassword.length<8){
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    try{
      await api.patch('/users/me/password',{currentPassword,newPassword});
      toast('Password changed successfully');
      setPasswordModal(false);
    }catch(err){
      setPasswordError(err.message||'Failed to change password');
    }finally{
      setPasswordLoading(false);
    }
  };

  return <><PageHeader eyebrow="Your account" title="Profile" description="Your academic identity and CampusHub activity." actions={<Button onClick={()=>setEditModal(true)}><Pencil size={17}/> Edit profile</Button>}/><div className="profile-grid"><section className="profile-main"><div className="profile-identity"><div style={{position:'relative',display:'inline-block'}}><Avatar name={user.name} size="xl" src={user.profileImage}/><button type="button" onClick={()=>fileInputRef.current?.click()} disabled={uploading} title="Upload profile photo" aria-label="Upload profile photo" style={{position:'absolute',bottom:-4,right:-4,width:32,height:32,borderRadius:'50%',background:'var(--accent)',color:'#0a0a0f',border:'2px solid #121219',display:'flex',alignItems:'center',justifyContent:'center',cursor:uploading?'not-allowed':'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.4)'}}>{uploading?<span style={{display:'inline-block',width:14,height:14,border:'2px solid #000',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>:<Camera size={16}/>}</button><input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/jpg" onChange={handleAvatarSelect} style={{display:'none'}}/></div><div><h2>{user.name}</h2><p>{user.department||'Campus Student'}</p><div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}><Badge tone="amber">Active {user.role}</Badge><button type="button" onClick={()=>fileInputRef.current?.click()} disabled={uploading} style={{background:'none',border:'none',color:'var(--accent)',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:5,padding:0,textDecoration:'underline'}}><Upload size={13}/> {uploading?'Uploading to Cloudinary…':user.profileImage?.url?'Change photo':'Upload photo'}</button></div></div></div><div className="info-grid"><Info icon={GraduationCap} label="Student ID" value={user.studentId||'—'}/><Info icon={Mail} label="University email" value={user.email}/><Info icon={Building2} label="Department" value={user.department||'—'}/><Info icon={Award} label="Batch / Year" value={user.batch||'—'}/></div><div className="profile-about"><h3>About</h3><p>{user.bio||'No bio added yet. Click "Edit profile" to share your interests.'}</p></div></section><aside className="profile-aside"><h3>Campus activity</h3><div><strong>—</strong><span>Joined clubs</span></div><div><strong>—</strong><span>Events attended</span></div><div><strong>—</strong><span>Saved events</span></div><Button variant="secondary" className="full" onClick={()=>setPasswordModal(true)}><Lock size={17}/> Change password</Button></aside></div><Modal open={editModal} onClose={()=>setEditModal(false)} title="Edit profile details"><form onSubmit={handleEditSubmit} className="form-grid" style={{marginTop:15}}><Input label="Full name" name="name" defaultValue={user.name} required/><label className="field"><span>Department</span><select name="department" defaultValue={user.department||''}><option value="">Select Department</option>{DEPARTMENTS.map(d=><option key={d.value} value={d.value}>{d.label} ({d.value})</option>)}</select></label><Input label="Batch" name="batch" defaultValue={user.batch||''} placeholder="e.g. 2023-24"/><Input label="Phone number" name="phone" defaultValue={user.phone||''} placeholder="e.g. +880 1700-000000"/><label className="field span-2"><span>Bio</span><textarea name="bio" rows="4" defaultValue={user.bio||''} placeholder="Tell campus about yourself..."/></label><div className="span-2" style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:10}}><Button variant="ghost" type="button" onClick={()=>setEditModal(false)}>Cancel</Button><Button type="submit" disabled={editLoading}>{editLoading?'Saving…':'Save changes'}</Button></div></form></Modal><Modal open={passwordModal} onClose={()=>setPasswordModal(false)} title="Change password"><form onSubmit={handlePasswordSubmit} style={{display:'flex',flexDirection:'column',gap:14,marginTop:15}}><Input label="Current password" name="currentPassword" type="password" required/><Input label="New password" name="newPassword" type="password" minLength="8" required/><Input label="Confirm new password" name="confirmPassword" type="password" minLength="8" required/>{passwordError&&<div className="form-error" role="alert">{passwordError}</div>}<div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:10}}><Button variant="ghost" type="button" onClick={()=>setPasswordModal(false)}>Cancel</Button><Button type="submit" disabled={passwordLoading}>{passwordLoading?'Updating…':'Update password'}</Button></div></form></Modal></>}
function Info({icon:Icon,label,value}){return <div className="info-item"><Icon/><span>{label}<strong>{value}</strong></span></div>}

export function StudentNotifications(){const {data:raw,loading,refetch}=useApi('/notifications');const [items,setItems]=useState([]);const notifs=items.length?items:(raw||[]).map(n=>({...n,id:n._id,text:n.message,time:fmt(n.createdAt),unread:!n.read}));const mark=async()=>{try{await api.patch('/notifications/read-all');setItems(notifs.map(x=>({...x,unread:false})));refetch()}catch{}};if(loading)return <LoadingState/>;return <><PageHeader eyebrow="Inbox" title="Notifications" description={`${notifs.filter(x=>x.unread).length} unread updates from your campus.`} actions={<Button variant="secondary" onClick={mark}>Mark all as read</Button>}/><div className="notification-list">{notifs.map(n=><button key={n.id} className={n.unread?'unread':''} onClick={async()=>{try{await api.patch(`/notifications/${n.id}/read`);setItems(prev=>(prev.length?prev:notifs).map(x=>x.id===n.id?{...x,unread:false}:x))}catch{}}}><i/><div><strong>{n.title}</strong><p>{n.text}</p><time>{n.time}</time></div><ArrowRight/></button>)}</div></>}

export function StudentSettings(){return <SettingsPage title="Student settings" sections={['Profile visibility','Email notifications','Event reminders','Club updates','Private activity']}/>}
export function SettingsPage({title='Settings',sections=[]}){const {toast}=useToast();const [values,setValues]=useState(()=>Object.fromEntries(sections.map((x,i)=>[x,i<3])));return <><PageHeader eyebrow="Preferences" title={title} description="Manage how CampusHub works for you."/><div className="settings-card"><h2>Preferences</h2><p>Choose what you want to receive and share.</p>{sections.map(x=><label className="setting-row" key={x}><span><strong>{x}</strong><small>Keep this setting {values[x]?'enabled':'disabled'} for your account.</small></span><input type="checkbox" checked={values[x]} onChange={()=>setValues(v=>({...v,[x]:!v[x]}))}/></label>)}<Button onClick={()=>toast('Settings saved')}>Save changes</Button></div></>}
