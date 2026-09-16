import { Navigate, Link } from 'react-router-dom'
import { Trophy, ArrowRight, Check } from 'lucide-react'
import { useGame } from '../stores/gameStore'
import { categories } from '../game/roulette'
import { CategoryIcon } from '../components/CategoryIcon'
export default function ResultsPage() {
  const s = useGame()
  if (s.phase !== 'completed' || !s.results.length)
    return <Navigate to={s.deck.length ? '/game' : '/play'} replace />
  const total = s.results.reduce((sum, r) => sum + r.breakdown.total, 0)
  const accuracy = s.results.reduce((sum, r) => sum + r.breakdown.accuracy, 0) / s.results.length
  const performance = categories.map((c) => {
    const rounds = s.results.filter((r) => r.category === c.type)
    return {
      ...c,
      count: rounds.length,
      accuracy: rounds.length
        ? rounds.reduce((sum, r) => sum + r.breakdown.accuracy, 0) / rounds.length
        : null,
    }
  })
  const ranked = performance
    .filter((c) => c.accuracy !== null)
    .sort((a, b) => b.accuracy! - a.accuracy!)
  return (
    <div className="page-container results-page">
      <div className="result-heading">
        <span className="trophy-medallion">
          <Trophy size={36} strokeWidth={1.3} />
        </span>
        <div className="eyebrow">TEN ROUNDS. A WORLD OF DISCOVERY.</div>
        <h1>A little wiser than before.</h1>
        <p>Your expedition is complete. The curiosity stays with you.</p>
        <div className="final-score">
          {total.toLocaleString()}
          <small>TOTAL POINTS · OF 120,000</small>
        </div>
      </div>
      <div className="result-stats">
        {[
          ['Accuracy', `${Math.round(accuracy * 100)}%`],
          [
            'Correct answers',
            `${s.results.filter((r) => r.breakdown.accuracy >= 0.8).length} / 10`,
          ],
          ['Longest streak', String(s.longestStreak)],
          ['Avg. response', `${Math.round(s.results.reduce((a, r) => a + r.time, 0) / 10000)}s`],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className="panel performance-panel">
        <div className="section-heading">
          <div>
            <div className="eyebrow">YOUR SIX PERSPECTIVES</div>
            <h2>Where your curiosity led.</h2>
          </div>
        </div>
        {performance.map((c) => (
          <div className="performance-row" key={c.type}>
            <CategoryIcon type={c.type} />
            <strong>
              {c.label}
              <small>{c.english}</small>
            </strong>
            <div className="performance-track">
              <span style={{ width: `${(c.accuracy ?? 0) * 100}%`, background: c.color }} />
            </div>
            <span>{c.accuracy === null ? 'Not drawn' : `${Math.round(c.accuracy * 100)}%`}</span>
          </div>
        ))}
        <div className="performance-summary">
          <span>
            Best category <strong>{ranked[0]?.label}</strong>
          </span>
          <span>
            Room to discover <strong>{ranked.at(-1)?.label}</strong>
          </span>
        </div>
        <p className="small-note">
          Correct answers meet at least 80% accuracy. Categories not drawn are excluded from
          rankings.
        </p>
      </section>
      <div className="results-actions">
        <Link className="button primary" to="/play">
          Another expedition <ArrowRight size={17} />
        </Link>
        <Link className="button secondary" to="/">
          Return home
        </Link>
      </div>
      <div className="save-results">
        <p className="small-note">
          <Check size={14} /> Your results are saved in this browser until you begin a new game.
        </p>
      </div>
    </div>
  )
}
