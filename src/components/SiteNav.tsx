import { Link, NavLink } from 'react-router-dom'
import './SiteNav.css'

export function SiteNav() {
  return (
    <header className="site-nav">
      <Link to="/" className="site-nav__brand" aria-label="Posture+ home">
        <span className="site-nav__dot" aria-hidden="true" />
        Posture<span>+</span>
      </Link>
      <nav className="site-nav__links" aria-label="Primary">
        <Link to={{ pathname: '/', hash: 'difference' }}>Why Posture+</Link>
        <NavLink to="/progress">Progress</NavLink>
        <NavLink to="/coach" className="site-nav__cta">
          Open coach
        </NavLink>
      </nav>
    </header>
  )
}
