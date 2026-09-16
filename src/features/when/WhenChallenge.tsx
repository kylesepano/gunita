import type { Challenge } from '../../game/questionGenerator'
export function WhenChallenge({
  challenge,
  value,
  onChange,
  disabled,
  easy,
}: {
  challenge: Challenge
  value: number | null
  onChange: (n: number) => void
  disabled: boolean
  easy: boolean
}) {
  return (
    <div className="timeline">
      <p className="mechanic-help">Move through time and place your best guess.</p>
      <div className="year-display">
        {value ?? '—'}
        <span>{value !== null && value < 0 ? 'BCE' : 'CE'}</span>
      </div>
      <label className="sr-only" htmlFor="year">
        Your guessed year
      </label>
      <input
        id="year"
        type="range"
        min={challenge.minYear}
        max={challenge.maxYear}
        step="1"
        value={value ?? Math.round((challenge.minYear + challenge.maxYear) / 2)}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerDown={() => {
          if (value === null) onChange(Math.round((challenge.minYear + challenge.maxYear) / 2))
        }}
        disabled={disabled}
      />
      <div className="timeline-anchors">
        <span>{challenge.minYear}</span>
        <span>{Math.round((challenge.minYear + challenge.maxYear) / 2)}</span>
        <span>{challenge.maxYear}</span>
      </div>
      {easy && (
        <div className="year-options">
          {challenge.years.map((y) => (
            <button
              key={y}
              disabled={disabled}
              aria-pressed={value === y}
              className={value === y ? 'selected' : ''}
              onClick={() => onChange(y)}
            >
              {y}
            </button>
          ))}
        </div>
      )}
      <p className="small-note">
        The closer the year, the higher your score. Use arrow keys for precise adjustments.
      </p>
    </div>
  )
}
