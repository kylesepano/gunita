import { Check, Plus, ArrowDown, X } from 'lucide-react'
import type { Challenge } from '../../game/questionGenerator'
export function WhyChallenge({
  causes,
  title,
  value,
  onChange,
  disabled,
}: {
  causes: Challenge['causes']
  title: string
  value: string[]
  onChange: (items: string[]) => void
  disabled: boolean
}) {
  return (
    <>
      <p className="mechanic-help">
        Select every cause that contributed to this event. More than one can be correct.
      </p>
      <div className="cause-grid">
        {causes.map((c) => {
          const selected = value.includes(c.text)
          const resultClass = disabled ? (c.correct ? 'correct-answer' : 'incorrect-answer') : ''
          return (
            <button
              className={`cause-option ${selected ? 'selected' : ''} ${resultClass}`}
              key={c.text}
              onClick={() =>
                onChange(selected ? value.filter((x) => x !== c.text) : [...value, c.text])
              }
              disabled={disabled}
              aria-pressed={selected}
              aria-label={
                disabled
                  ? `${c.text}: ${c.correct ? 'correct cause' : 'incorrect cause'}`
                  : undefined
              }
            >
              {disabled ? (
                c.correct ? (
                  <Check size={19} />
                ) : (
                  <X size={19} />
                )
              ) : selected ? (
                <Check size={19} />
              ) : (
                <Plus size={19} />
              )}
              <span>
                {c.text}
                {disabled && (
                  <small className="cause-status">
                    {c.correct ? 'Correct cause' : 'Incorrect cause'}
                  </small>
                )}
              </span>
            </button>
          )
        })}
      </div>
      <div className="effect">
        <ArrowDown size={22} />
        <small>CONTRIBUTED TO</small>
        <h3>{title}</h3>
      </div>
    </>
  )
}
