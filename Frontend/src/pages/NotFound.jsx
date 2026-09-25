import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import Logo from '../components/layout/Logo'
import Button from '../components/common/Button'
export function NotFound(){return <main className="status-page"><Logo/><p className="status-code">404</p><h1>This corner of campus is empty.</h1><p>The page may have moved, or the link is no longer active.</p><Link to="/"><Button><ArrowLeft size={17}/> Return home</Button></Link></main>}
export function Unauthorized(){return <main className="status-page"><Logo/><ShieldAlert className="status-icon"/><p className="eyebrow">Access restricted</p><h1>This workspace belongs to another role.</h1><p>Sign in with the appropriate CampusHub demo account to continue.</p><Link to="/login"><Button>Choose an account</Button></Link></main>}
