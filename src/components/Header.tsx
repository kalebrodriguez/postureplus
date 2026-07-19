import './Header.css'

interface HeaderProps {
  badgeLabel: string
  badgeTone: 'idle' | 'good' | 'fair' | 'poor'
}

export function Header({ badgeLabel, badgeTone }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="logo">
        <div className="logo-dot" aria-hidden="true" />
        Posture<span>+</span>
      </div>
      <div
        className={`status-badge${badgeTone === 'idle' ? '' : ` ${badgeTone}`}`}
        role="status"
        aria-live="polite"
      >
        <div className="badge-dot" aria-hidden="true" />
        <span>{badgeLabel}</span>
      </div>
    </header>
  )
}
