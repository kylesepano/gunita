import type { Person, Difficulty } from '../../types/history'
import { portraitFraming } from '../../data/portraitFraming'
export function WhoChallenge({
  people,
  difficulty,
  value,
  onChange,
  disabled,
}: {
  people: Person[]
  difficulty: Difficulty
  value: string | null
  onChange: (id: string) => void
  disabled: boolean
}) {
  return (
    <>
      <div className="portrait-grid">
        {people.map((p, i) => (
          <button
            className={`portrait-card ${value === p.id ? 'selected' : ''}`}
            key={p.id}
            onClick={() => onChange(p.id)}
            disabled={disabled}
            aria-pressed={value === p.id}
          >
            <span className="portrait-frame">
              <img
                src={p.image}
                style={{
                  objectPosition: p.imagePosition ?? '50% 25%',
                  ...portraitFraming(p.image),
                }}
                alt={difficulty === 'easy' ? p.name : `Historical figure ${i + 1}: ${p.bio}`}
              />
            </span>
            <strong>
              {difficulty === 'easy' ? p.name : `Figure ${String.fromCharCode(65 + i)}`}
            </strong>
            <span>
              {difficulty === 'medium' ? p.bio : difficulty === 'hard' ? 'Portrait study' : p.bio}
            </span>
          </button>
        ))}
      </div>
      <p className="small-note">
        Identify the person from their portrait. Historical paintings and statues are later
        depictions.{' '}
        <a href="/portraits/credits.html" target="_blank" rel="noreferrer" className="source-link">
          Image credits ↗
        </a>
      </p>
    </>
  )
}
