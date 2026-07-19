import { Link, NavLink } from 'react-router-dom'
import './SiteNav.css'

interface SiteNavProps {
  variant?: 'landing' | 'page'
}

export function SiteNav({ variant = 'landing' }: SiteNavProps) {
  const howHref = variant === 'landing' ? '#how' : '/#how'
  const whyHref = variant === 'landing' ? '#why' : '/#why'

  return (
    <header className={`site-nav site-nav--${variant}`}>
      <Link to="/" className="site-nav__brand" aria-label="Posture+ home">
        <span className="site-nav__dot" aria-hidden="true" />
        Posture<span>+</span>
      </Link>
      <nav className="site-nav__links" aria-label="Primary">
        <a href={whyHref}>Why</a>
        <a href={howHref}>How it works</a>
        <NavLink to="/privacy">Privacy</NavLink>
        <NavLink to="/coach" className="site-nav__cta">
          Open coach
        </NavLink>
      </nav>
    </header>
  )
}
