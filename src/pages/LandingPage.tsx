import { Link } from 'react-router-dom'
import { SiteNav } from '../components/SiteNav'
import { PostureHeroVisual } from '../components/landing/PostureHeroVisual'
import './LandingPage.css'

export function LandingPage() {
  return (
    <div className="landing">
      <SiteNav />

      <section className="landing-hero" aria-labelledby="landing-brand">
        <div className="landing-hero__atmosphere" aria-hidden="true">
          <PostureHeroVisual />
        </div>

        <div className="landing-hero__copy">
          <p className="landing-hero__brand" id="landing-brand">
            Posture<span>+</span>
          </p>
          <h1 className="landing-hero__headline">Sit better. Stand taller.</h1>
          <p className="landing-hero__lede">
            Real-time AI coaching that watches your posture and nudges you the
            moment it slips.
          </p>
          <div className="landing-hero__actions">
            <Link className="btn btn--primary" to="/coach">
              Open coach
            </Link>
            <a className="btn btn--ghost" href="#why">
              Why it matters
            </a>
          </div>
        </div>
      </section>

      <section className="landing-why" id="why" aria-labelledby="why-title">
        <p className="landing-why__eyebrow">Why posture matters</p>
        <h2 className="landing-why__title" id="why-title">
          Small slumps add up fast.
        </h2>
        <p className="landing-why__lede">
          Hours at a desk quietly stack tension in your neck, shoulders, and
          lower back. Catching the slip early is easier than undoing a week of
          it.
        </p>

        <ul className="landing-why__points">
          <li>
            <strong>Fewer ache days</strong>
            <span>Forward head posture and rounded shoulders are common desk strain patterns.</span>
          </li>
          <li>
            <strong>Better focus</strong>
            <span>Discomfort steals attention. Neutral alignment keeps you in the work longer.</span>
          </li>
          <li>
            <strong>A cue you can trust</strong>
            <span>Posture+ watches live and nudges you when form drops — not after the fact.</span>
          </li>
        </ul>
      </section>

      <section className="landing-how" id="how" aria-labelledby="how-title">
        <p className="landing-how__eyebrow">How it works</p>
        <h2 className="landing-how__title" id="how-title">
          Three steps. No accounts. No uploads.
        </h2>
        <p className="landing-how__lede">
          Everything runs in your browser — your camera feed never leaves your
          device.
        </p>

        <ol className="landing-how__steps">
          <li>
            <span className="landing-how__step-num">01</span>
            <span className="landing-how__step-label">Enable your webcam</span>
          </li>
          <li>
            <span className="landing-how__step-num">02</span>
            <span className="landing-how__step-label">Get a live posture score</span>
          </li>
          <li>
            <span className="landing-how__step-num">03</span>
            <span className="landing-how__step-label">Fix issues with short drills</span>
          </li>
        </ol>

        <Link className="btn btn--primary landing-how__cta" to="/coach">
          Start a session
        </Link>
      </section>

      <footer className="landing-footer">
        <span className="landing-footer__brand">
          Posture<span>+</span>
        </span>
        <div className="landing-footer__links">
          <Link to="/privacy">Privacy & FAQ</Link>
          <span>Private by design · Runs locally</span>
        </div>
      </footer>
    </div>
  )
}
