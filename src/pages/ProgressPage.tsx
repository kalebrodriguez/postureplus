import { Link } from 'react-router-dom'
import { SiteNav } from '../components/SiteNav'
import {
  buildProgressInsight,
  clearSessionHistory,
  formatHistoryWhen,
  loadSessionHistory,
} from '../lib/storage'
import { formatElapsed } from '../lib/posture'
import { useMemo, useState } from 'react'
import './ProgressPage.css'

export function ProgressPage() {
  const [history, setHistory] = useState(() => loadSessionHistory())
  const insight = useMemo(() => buildProgressInsight(history), [history])

  return (
    <div className="progress-page">
      <SiteNav />
      <main className="progress-main">
        <p className="progress-eyebrow">Local progress</p>
        <h1>Are you improving over time?</h1>
        <p className="progress-lede">
          Session history stays in this browser only — no account required.
        </p>

        <div className="progress-stats">
          <div>
            <span>This week</span>
            <strong>{insight.sessionsThisWeek} sessions</strong>
          </div>
          <div>
            <span>Avg good posture</span>
            <strong>
              {insight.weeklyGoodPercent == null ? '—' : `${insight.weeklyGoodPercent}%`}
            </strong>
          </div>
          <div>
            <span>Improvement streak</span>
            <strong>{insight.streakDays}d</strong>
          </div>
        </div>

        <p className="progress-insight">{insight.insight}</p>

        <div className="progress-head">
          <h2>Recent sessions</h2>
          {history.length > 0 ? (
            <button
              type="button"
              className="progress-clear"
              onClick={() => {
                clearSessionHistory()
                setHistory([])
              }}
            >
              Clear history
            </button>
          ) : null}
        </div>

        {history.length === 0 ? (
          <p className="progress-empty">
            Finish a coaching session (20s+) to start building your private history.{' '}
            <Link to="/coach">Open coach</Link>
          </p>
        ) : (
          <ul className="progress-list">
            {history.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{formatHistoryWhen(entry.endedAt)}</strong>
                  <span>{formatElapsed(entry.durationMs)}</span>
                </div>
                <div>
                  <span>{entry.goodPercent}% good</span>
                  <span>{entry.averageScore} avg</span>
                  <span>{entry.topIssue ?? 'No major issue'}</span>
                  <span>{entry.scoreTrend}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
