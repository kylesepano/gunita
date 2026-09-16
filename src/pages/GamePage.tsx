import { Navigate, Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  RotateCw,
  Flame,
  Trophy,
  Lightbulb,
  BookOpen,
  CheckCircle2,
} from 'lucide-react'
import { useGame } from '../stores/gameStore'
import { categories } from '../game/roulette'
import { Roulette } from '../features/roulette/Roulette'
import { CategoryIcon } from '../components/CategoryIcon'
import { ChallengeArea } from '../features/game/ChallengeArea'
import { evaluate } from '../game/evaluate'
export default function GamePage() {
  const s = useGame()
  const navigate = useNavigate()
  if (!s.deck.length) return <Navigate to="/play" replace />
  if (s.phase === 'completed') return <Navigate to="/results" replace />
  const event = s.catalog.find((e) => e.id === s.deck[s.round])
  if (!event) return <Navigate to="/play" replace />
  const c = categories.find((c) => c.type === s.category)
  const revealed = s.phase === 'revealed'
  const result = revealed ? s.results.at(-1) : null
  const title = {
    who: event.role,
    where: event.wherePrompt ?? 'Where did this story unfold?',
    when: 'When did this moment become history?',
    what: 'What event connects these clues?',
    why: 'What set this moment in motion?',
    how: 'How did the story unfold?',
  }
  const answerReady =
    s.category === 'how' || (s.answer !== null && (!Array.isArray(s.answer) || s.answer.length > 0))
  return (
    <div className="page-container game-page">
      <div className="game-topbar">
        <Link className="back-link" to="/">
          ← Save & leave
        </Link>
        <span>
          {s.scope === 'mixed'
            ? 'HISTORY FROM AROUND THE WORLD'
            : `${s.scope === 'world' ? 'WORLD' : 'PHILIPPINE'} HISTORY`}
        </span>
        <span className="difficulty-tag">
          {s.mode === 'roulette'
            ? 'Roulette'
            : `${categories.find((category) => category.type === s.mode)?.english} only`}{' '}
          · {s.difficulty}
        </span>
      </div>
      <div className="scorebar">
        <div>
          <span className="eyebrow">YOUR EXPEDITION</span>
          <strong>
            Round {String(s.round + 1).padStart(2, '0')} <span>/ 10</span>
          </strong>
        </div>
        <div className="score-stats">
          <span>
            <Trophy size={20} />
            <strong>
              {s.results.reduce((sum, r) => sum + r.breakdown.total, 0).toLocaleString()}
            </strong>
            <small>POINTS</small>
          </span>
          <span>
            <Flame size={20} />
            <strong>{s.streak}</strong>
            <small>STREAK</small>
          </span>
        </div>
      </div>
      <div className="round-progress">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={i < s.round ? 'done' : i === s.round ? 'current' : ''} />
        ))}
      </div>
      <div className="game-layout">
        <aside className="clue-panel">
          <div className="eyebrow">
            <BookOpen size={15} /> A MOMENT IN HISTORY
          </div>
          <h2>Follow the clues.</h2>
          <p className="clue-text">{event.clue}</p>
          <span className="collection-tag">
            {event.scope === 'philippines' ? 'Philippine collection' : 'World collection'}
          </span>
          {s.phase === 'answering' && (
            <button className="hint-button" disabled={s.hinted} onClick={s.hint}>
              <Lightbulb size={16} /> {s.hinted ? 'Hint revealed' : 'A little nudge?'}{' '}
            </button>
          )}
          {s.hinted && (
            <div className="hint-text">
              {s.category === 'when'
                ? `Think of the ${Math.ceil(event.year / 100)}th century.`
                : s.category === 'where'
                  ? event.country
                    ? `Look in ${event.country}.`
                    : `Look in the ${event.coordinates[0] >= 0 ? 'Northern' : 'Southern'} Hemisphere.`
                  : `${event.person.bio}.`}
              <small>Using a hint removes the no-hint bonus.</small>
            </div>
          )}
          <div className="clue-footer">
            Stay curious.
            <br />
            <em>Every guess is a way forward.</em>
          </div>
        </aside>
        <section className="panel challenge-panel">
          {s.phase === 'clue' || s.phase === 'spinning' ? (
            <div className="spin-screen">
              <div className="eyebrow">LET CHANCE OPEN A CHAPTER</div>
              <h2>Give history a spin.</h2>
              <p>Six perspectives. Which one will be yours?</p>
              <Roulette
                category={s.category}
                spinning={s.phase === 'spinning'}
                onFinish={s.finishSpin}
              />
              <button className="button primary" disabled={s.phase === 'spinning'} onClick={s.spin}>
                <RotateCw size={18} />
                {s.phase === 'spinning' ? 'Finding your next chapter…' : 'Spin the roulette'}
              </button>
              <p className="small-note" aria-live="polite">
                {s.phase === 'spinning'
                  ? 'The wheel is turning.'
                  : 'Your challenge will appear when the wheel stops.'}
              </p>
            </div>
          ) : (
            <>
              <div className="challenge-label">
                {c && (
                  <>
                    <CategoryIcon type={c.type} />
                    <span>{c.english}</span>
                  </>
                )}
                <span>CHALLENGE {String(s.round + 1).padStart(2, '0')}</span>
              </div>
              <h2>{s.category && title[s.category]}</h2>
              <ChallengeArea key={`${s.sessionId}-${s.round}`} event={event} />
              {!revealed && (
                <div className="submit-row">
                  <span>Trust your curiosity.</span>
                  <button
                    className="button primary"
                    disabled={!answerReady}
                    onClick={() => {
                      if (s.category && s.challenge)
                        s.submit(evaluate(s.category, s.answer, event, s.challenge))
                    }}
                  >
                    Lock in answer <ArrowRight size={17} />
                  </button>
                </div>
              )}
              {result && (
                <div className="answer-reveal" aria-live="polite">
                  <div className="reveal-top">
                    <CheckCircle2 size={25} />
                    <div>
                      <div className="eyebrow">
                        {result.breakdown.accuracy >= 0.8
                          ? 'A CONNECTION WELL MADE'
                          : 'ANOTHER STORY TO REMEMBER'}
                      </div>
                      <h3>+{result.breakdown.total.toLocaleString()} points</h3>
                    </div>
                  </div>
                  <h3>{event.title}</h3>
                  <p>
                    <strong>
                      {s.category === 'who'
                        ? event.person.name
                        : s.category === 'where'
                          ? event.location
                          : s.category === 'when'
                            ? `${event.year} CE · ${Math.abs(Number(s.answer) - event.year)} years from your guess`
                            : s.category === 'why'
                              ? event.causes.join(' · ')
                              : s.category === 'how'
                                ? 'The correct sequence:'
                                : event.title}
                    </strong>
                  </p>
                  {s.category === 'how' && (
                    <ol>
                      {event.sequence.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ol>
                  )}
                  <p>{event.description}</p>
                  {event.note && <p className="editorial-note">Content note: {event.note}</p>}
                  <a className="source-link" href={event.source} target="_blank" rel="noreferrer">
                    Explore the source ↗
                  </a>
                  <div className="score-breakdown">
                    {[
                      ['Accuracy', result.breakdown.base],
                      ['Difficulty', result.breakdown.difficulty],
                      ['Time', result.breakdown.time],
                      ['Streak', result.breakdown.streak],
                      ['No hint', result.breakdown.noHint],
                    ].map(([label, value]) => (
                      <span key={label}>
                        <small>{label}</small>
                        <strong>{Number(value).toLocaleString()}</strong>
                      </span>
                    ))}
                  </div>
                  <button
                    className="button primary"
                    onClick={() => {
                      s.next()
                      if (s.round === 9) navigate('/results')
                    }}
                  >
                    {s.round === 9 ? 'See your discoveries' : 'Next chapter'}
                    <ArrowRight size={17} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
