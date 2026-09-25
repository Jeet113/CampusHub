import { Link } from 'react-router-dom'
export default function Logo({to='/'}) { return <Link to={to} className="logo" aria-label="CampusHub home"><span className="logo-mark">C</span><span>Campus<span>Hub</span></span></Link> }
