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
          <h1 className="landing-hero__headline">
            Learn your posture. Catch fatigue. Improve for good.
          </h1>
          <p className="landing-hero__lede">
            Posture+ doesn’t just tell you that you’re slouching — it calibrates to you,
            waits for sustained problems, and coaches lasting improvement.
          </p>
          <div className="landing-hero__actions">
            <Link className="btn btn--primary" to="/coach">
              Open coach
            </Link>
            <Link className="btn btn--ghost" to="/progress">
              View progress
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-how" id="difference" aria-labelledby="diff-title">
        <p className="landing-how__eyebrow">Why Posture+</p>
        <h2 className="landing-how__title" id="diff-title">
          A personal posture-improvement system
        </h2>
        <p className="landing-how__lede">
          Built to answer three questions: what am I doing wrong, how do I correct it,
          and am I improving over time — privately, in your browser.
        </p>

        <ol className="landing-how__steps">
          <li>
            <span className="landing-how__step-num">01</span>
            <span className="landing-how__step-label">Calibrate to your body and desk</span>
          </li>
          <li>
            <span className="landing-how__step-num">02</span>
            <span className="landing-how__step-label">Get specific cues, not vague scores</span>
          </li>
          <li>
            <span className="landing-how__step-num">03</span>
            <span className="landing-how__step-label">Track sessions and fatigue patterns</span>
          </li>
        </ol>
      </section>

      <section className="landing-how" id="how" aria-labelledby="how-title">
        <p className="landing-how__eyebrow">How it works</p>
        <h2 className="landing-how__title" id="how-title">
          Calibrate. Coach. Summarize.
        </h2>
        <p className="landing-how__lede">
          Sustained-posture detection avoids nagging on every fidget. Alerts wait until a
          problem sticks — then show exactly what to fix.
        </p>

        <ol className="landing-how__steps">
          <li>
            <span className="landing-how__step-num">01</span>
            <span className="landing-how__step-label">15-second personal calibration</span>
          </li>
          <li>
            <span className="landing-how__step-num">02</span>
            <span className="landing-how__step-label">Live cues + guided exercises</span>
          </li>
          <li>
            <span className="landing-how__step-num">03</span>
            <span className="landing-how__step-label">Session summary & local progress</span>
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
        <span className="landing-footer__note">Private by design · Runs locally · No uploads</span>
      </footer>
    </div>
  )
}
