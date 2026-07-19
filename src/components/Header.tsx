import { Link } from 'react-router-dom'
import './Header.css'

interface HeaderProps {
  variant?: 'coach'
  badgeLabel: string
  badgeTone: 'idle' | 'good' | 'fair' | 'poor'
}

export function Header({ variant = 'coach', badgeLabel, badgeTone }: HeaderProps) {
  return (
    <header className={`app-header app-header--${variant}`}>
      <Link to="/" className="logo" aria-label="Posture+ home">
        <div className="logo-dot" aria-hidden="true" />
        Posture<span>+</span>
      </Link>
      <div className="app-header__right">
        <Link to="/" className="app-header__home">
          Home
        </Link>
        <div
          className={`status-badge${badgeTone === 'idle' ? '' : ` ${badgeTone}`}`}
          role="status"
          aria-live="polite"
        >
          <div className="badge-dot" aria-hidden="true" />
          <span>{badgeLabel}</span>
        </div>
      </div>
    </header>
  )
}
