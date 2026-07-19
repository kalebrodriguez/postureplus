import { Link } from 'react-router-dom'
import { SiteNav } from '../components/SiteNav'
import './PrivacyPage.css'

const FAQS = [
  {
    q: 'Does my camera video leave my device?',
    a: 'No. Pose detection runs entirely in your browser with MediaPipe. Frames are processed locally and are never uploaded to a Posture+ server.',
  },
  {
    q: 'Do I need an account?',
    a: 'No accounts, no sign-in. Open the coach, allow the camera, and start.',
  },
  {
    q: 'Where is session history stored?',
    a: 'Recent session summaries (duration, good-posture %, alerts) stay in your browser’s local storage only. Clear them anytime from the coach panel.',
  },
  {
    q: 'What permissions does Posture+ need?',
    a: 'Only camera access, and only after you click Enable Camera. You can revoke it in your browser site settings at any time.',
  },
  {
    q: 'Is this medical advice?',
    a: 'No. Posture+ is a wellness tool for awareness and simple mobility cues. It is not a diagnosis or treatment for pain or injury.',
  },
]

export function PrivacyPage() {
  return (
    <div className="privacy-page">
      <SiteNav variant="page" />

      <main className="privacy-main">
        <p className="privacy-eyebrow">Privacy & FAQ</p>
        <h1 className="privacy-title">Your camera stays with you.</h1>
        <p className="privacy-lede">
          Posture+ is built to coach in place — on your machine, in your browser,
          without shipping video anywhere.
        </p>

        <section className="privacy-block" aria-labelledby="privacy-principles">
          <h2 id="privacy-principles">Privacy principles</h2>
          <ul className="privacy-principles">
            <li>
              <strong>On-device analysis</strong>
              Pose landmarks are computed locally. We do not operate a video upload pipeline.
            </li>
            <li>
              <strong>Minimal data</strong>
              Optional session history is a small summary stored in localStorage on your device.
            </li>
            <li>
              <strong>No tracking accounts</strong>
              There is no login, email capture, or profile system in this app.
            </li>
          </ul>
        </section>

        <section className="privacy-block" aria-labelledby="faq-title">
          <h2 id="faq-title">FAQ</h2>
          <div className="faq-list">
            {FAQS.map((item) => (
              <details key={item.q} className="faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <Link className="btn btn--primary" to="/coach">
          Open coach
        </Link>
      </main>
    </div>
  )
}
