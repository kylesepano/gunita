import type { HistoricalEvent } from '../../types/history'
import type { Challenge } from '../../game/questionGenerator'
export function WhatChallenge({
  event,
  options,
  value,
  onChange,
  disabled,
}: {
  event: HistoricalEvent
  options: Challenge['eventOptions']
  value: string | null
  onChange: (id: string) => void
  disabled: boolean
}) {
  return (
    <>
      <div className="evidence-grid">
        <div>
          <small>YEAR</small>
          <strong>{event.year}</strong>
        </div>
        <div>
          <small>PERSON</small>
          <strong>{event.person.name}</strong>
        </div>
        <div>
          <small>PLACE</small>
          <strong>{event.location}</strong>
        </div>
      </div>
      <div className="event-options">
        {options.map((o, i) => (
          <button
            className={value === o.id ? 'selected' : ''}
            key={o.id}
            onClick={() => onChange(o.id)}
            disabled={disabled}
            aria-pressed={value === o.id}
          >
            <span className="option-letter">{String.fromCharCode(65 + i)}</span>
            <div>
              <small>{o.scope === 'philippines' ? 'PHILIPPINE HISTORY' : 'WORLD HISTORY'}</small>
              <strong>{o.title}</strong>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
