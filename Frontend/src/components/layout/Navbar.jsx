import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'
import Button from '../common/Button'
const links=[['Home','/'],['Events','/events'],['Clubs','/clubs'],['Notices','/notices']]
export default function Navbar() { const [open,setOpen]=useState(false); return <header className="public-nav"><div className="container nav-inner"><Logo/><nav className="desktop-nav" aria-label="Primary">{links.map(([n,to])=><NavLink key={to} to={to} end={to==='/'}>{n}</NavLink>)}</nav><div className="nav-actions"><Link to="/login" className="nav-login">Log in</Link><Link to="/register"><Button>Get started</Button></Link></div><button className="menu-button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label="Toggle navigation">{open?<X/>:<Menu/>}</button></div>{open&&<nav className="mobile-menu" aria-label="Mobile navigation">{links.map(([n,to])=><NavLink onClick={()=>setOpen(false)} key={to} to={to}>{n}</NavLink>)}<Link to="/login" onClick={()=>setOpen(false)}>Log in</Link><Link to="/register" onClick={()=>setOpen(false)} className="mobile-primary">Get started</Link></nav>}</header> }
