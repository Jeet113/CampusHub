import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Users, Bell, Settings, LogOut, Search, Menu, X, UserRound, Megaphone, ShieldCheck, Building2, ClipboardCheck, FileText, PlusCircle } from 'lucide-react'
import Logo from './Logo'
import Avatar from '../common/Avatar'
import ConfirmDialog from '../common/ConfirmDialog'
import GlobalSearch from './GlobalSearch'
import { useAuth } from '../../hooks/useAuth'
import { useApi } from '../../hooks/useApi'

const menus={
 student:[[LayoutDashboard,'Overview','dashboard'],[CalendarDays,'Events','events'],[Building2,'Clubs','clubs'],[FileText,'Notices','notices'],[UserRound,'Profile','profile'],[Bell,'Notifications','notifications'],[Settings,'Settings','settings']],
 club:[[LayoutDashboard,'Overview','dashboard'],[Building2,'Club profile','profile'],[CalendarDays,'Events','events'],[PlusCircle,'Create event','events/create'],[Megaphone,'Announcements','announcements'],[Users,'Members','members'],[Settings,'Settings','settings']],
 admin:[[LayoutDashboard,'Overview','dashboard'],[Users,'Users','users'],[Building2,'Clubs','clubs'],[CalendarDays,'Events','events'],[FileText,'Notices','notices'],[ClipboardCheck,'Approvals','approvals'],[Settings,'Settings','settings']]
}
export default function DashboardLayout({role}) {
 const [drawer,setDrawer]=useState(false),[logoutOpen,setLogoutOpen]=useState(false),[searchOpen,setSearchOpen]=useState(false); const {user,logout}=useAuth(); const navigate=useNavigate(); const location=useLocation();
 const { data: notifs } = useApi(user ? '/notifications' : null, { params: { limit: 20 } })
 const unreadCount = useMemo(() => (notifs || []).filter((n) => !n.read).length, [notifs])
 const items=useMemo(()=>menus[role],[role]);
 const userAvatar = user?.profileImage || (role === 'admin' || user?.role === 'admin' ? '/admin-avatar.png' : user?.club?.logo)
 const doLogout=()=>{logout();navigate('/')}
 return <div className="app-shell"><aside className={`sidebar ${drawer?'open':''}`}><div className="sidebar-top"><Logo to="/"/><button className="sidebar-close" onClick={()=>setDrawer(false)} aria-label="Close navigation"><X/></button></div><nav>{items.map(([Icon,label,path])=><NavLink key={path} onClick={()=>setDrawer(false)} to={`/${role}/${path}`} className={({isActive})=>isActive?'active':''}><Icon size={19}/><span>{label}</span>{label==='Notifications'&&unreadCount>0&&<b>{unreadCount}</b>}</NavLink>)}</nav><div className="sidebar-profile"><Avatar name={user?.name} src={userAvatar} role={role}/><div><strong>{user?.name}</strong><span>{role==='club'?'Organization':role}</span></div><button onClick={()=>setLogoutOpen(true)} aria-label="Log out"><LogOut size={18}/></button></div></aside>{drawer&&<button className="drawer-scrim" onClick={()=>setDrawer(false)} aria-label="Close menu"/>}<div className="app-main"><header className="app-header"><div><button className="app-menu" onClick={()=>setDrawer(true)} aria-label="Open navigation"><Menu/></button><div className="mobile-logo"><Logo to="/"/></div></div><button className="command-search" onClick={()=>setSearchOpen(true)}><Search size={17}/><span>Search campus…</span><kbd>⌘ K</kbd></button><div className="header-right"><button className="header-icon" onClick={()=>navigate(`/${role}/${role==='student'?'notifications':'settings'}`)} aria-label="Notifications"><Bell size={19}/>{unreadCount>0&&<i/>}</button><Avatar name={user?.name} src={userAvatar} role={role}/></div></header><main className="dashboard-content" key={location.pathname}><Outlet/></main></div><GlobalSearch open={searchOpen} onClose={()=>setSearchOpen(false)} role={role}/><ConfirmDialog open={logoutOpen} onClose={()=>setLogoutOpen(false)} onConfirm={doLogout} title="Log out of CampusHub?" message="Are you sure you want to log out of your CampusHub account?" confirmLabel="Log out"/></div>
}
