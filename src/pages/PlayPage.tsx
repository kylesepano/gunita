import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  ArrowRight,
  Globe2,
  Flag,
  Compass,
  Check,
  Clock3,
  Layers,
  MapPin,
  CalendarDays,
  RotateCw,
} from 'lucide-react'
import type { Scope, Difficulty, GameMode } from '../types/history'
import { useGame } from '../stores/gameStore'
import { categories } from '../game/roulette'
import { useCatalog } from '../stores/catalogStore'
export default function PlayPage() {
  const [scope, setScope] = useState<Scope>('mixed')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const start = useGame((s) => s.start)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const category = categories.find((c) => c.type === params.get('category'))
  const [mode, setMode] = useState<GameMode>(() =>
    ['where', 'when'].includes(params.get('category') ?? '')
      ? (params.get('category') as GameMode)
      : 'roulette',
  )
  const catalog = useCatalog()
  const refreshCatalog = catalog.refresh
  const [error, setError] = useState('')
  useEffect(() => {
    void refreshCatalog()
  }, [refreshCatalog])
  const available = catalog.events.filter((e) => scope === 'mixed' || e.scope === scope).length
  return (
    <div className="page-container setup-page">
      <Link to="/" className="back-link">
        ← Back to discovery
      </Link>
      <div className="page-title">
        <div className="eyebrow">YOUR EXPEDITION, YOUR WAY</div>
        <h1>Where will curiosity take you?</h1>
        <p>Choose what you want to practice and how you want to play.</p>
      </div>
      {category && (
        <div className="info-banner">
          <strong>{category.english}</strong> — {category.description} Choose a focused mode below
          to skip the roulette.
        </div>
      )}
      <section className="panel">
        <div className="form-section-title">
          <span>01</span>
          <div>
            <h2>Choose your game mode</h2>
            <p>Focus on places or dates, or let the wheel choose.</p>
          </div>
        </div>
        <div className="mode-grid">
          {(
            [
              {
                id: 'roulette',
                title: 'Roulette',
                text: 'All six challenges, chosen by the wheel.',
                Icon: RotateCw,
              },
              {
                id: 'where',
                title: 'Where only',
                text: 'Ten location challenges. No roulette.',
                Icon: MapPin,
              },
              {
                id: 'when',
                title: 'When only',
                text: 'Ten year challenges. No roulette.',
                Icon: CalendarDays,
              },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              className={`mode-option ${mode === option.id ? 'selected' : ''}`}
              aria-pressed={mode === option.id}
              onClick={() => setMode(option.id)}
            >
              <option.Icon size={26} />
              <strong>{option.title}</strong>
              <span>{option.text}</span>
            </button>
          ))}
        </div>
        <div className="form-section-title">
          <span>02</span>
          <div>
            <h2>Choose your world</h2>
            <p>Which stories would you like to explore?</p>
          </div>
        </div>
        <div className="scope-grid">
          {(
            [
              {
                id: 'mixed',
                name: 'A bit of everything',
                caption: 'History from every collection',
                Icon: Globe2,
              },
              {
                id: 'philippines',
                name: 'Philippine history',
                caption: 'Events from the Philippines',
                Icon: Flag,
              },
              {
                id: 'world',
                name: 'World history',
                caption: 'Beyond borders, across eras',
                Icon: Compass,
              },
            ] as const
          ).map((o) => (
            <button
              key={o.id}
              className={`scope-option ${scope === o.id ? 'selected' : ''}`}
              onClick={() => setScope(o.id)}
              aria-pressed={scope === o.id}
            >
              <o.Icon size={32} strokeWidth={1.2} />
              <strong>{o.name}</strong>
              <span>{o.caption}</span>
              {scope === o.id && <Check className="selection-check" size={18} />}
            </button>
          ))}
        </div>
        <div className="form-section-title">
          <span>03</span>
          <div>
            <h2>Find your challenge</h2>
            <p>A familiar path or a deeper dive?</p>
          </div>
        </div>
        <div className="difficulty-grid">
          {(
            [
              { id: 'easy', title: 'Curious explorer', caption: 'Easy · More guidance' },
              { id: 'medium', title: 'History enthusiast', caption: 'Medium · A little intrigue' },
              { id: 'hard', title: 'Seasoned archivist', caption: 'Hard · Trust your memory' },
            ] as const
          ).map((d) => (
            <button
              key={d.id}
              className={difficulty === d.id ? 'selected' : ''}
              onClick={() => setDifficulty(d.id)}
              aria-pressed={difficulty === d.id}
            >
              <strong>{d.title}</strong>
              <span>{d.caption}</span>
            </button>
          ))}
        </div>
        <div className="setup-summary">
          <span>
            <Layers size={17} /> 10 rounds
          </span>
          <span>
            <Clock3 size={17} /> At your own pace
          </span>
          <span>
            {mode === 'roulette'
              ? 'All 6 challenge types'
              : `${mode === 'where' ? 'Location' : 'Year'} challenges only`}
          </span>
        </div>
        {available > 0 && available < 10 && (
          <p className="small-note">
            This collection has {available} events. Events repeat to make ten rounds.
          </p>
        )}
        {catalog.loading && <p role="status">Loading questions…</p>}
        {catalog.error && (
          <div className="info-banner" role="alert">
            {catalog.error}
            <button className="text-link" onClick={() => void catalog.refresh()}>
              Try again
            </button>
          </div>
        )}
        {!catalog.loading && !catalog.error && available === 0 && (
          <p role="status">There are no published questions in this collection yet.</p>
        )}
        {error && <p role="alert">{error}</p>}
        <button
          className="button primary start-button"
          disabled={catalog.loading || !catalog.loaded || !!catalog.error || available === 0}
          onClick={() => {
            try {
              start(scope, difficulty, mode, catalog.events)
              navigate('/game')
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not start the game.')
            }
          }}
        >
          Begin the expedition <ArrowRight size={19} />
        </button>
        <p className="center-note">Playing as a guest? Your progress stays in this browser.</p>
      </section>
    </div>
  )
}
