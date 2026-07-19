import './AlertToast.css'

interface AlertToastProps {
  message: string | null
}

export function AlertToast({ message }: AlertToastProps) {
  return (
    <div
      className={`alert-toast${message ? ' show' : ''}`}
      role="status"
      aria-live="assertive"
    >
      {message ?? '⚠ Posture alert'}
    </div>
  )
}
