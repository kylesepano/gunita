import { Check, Plus, ArrowDown } from 'lucide-react'
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
        {causes.map((c) => (
          <button
            className={value.includes(c.text) ? 'selected' : ''}
            key={c.text}
            onClick={() =>
              onChange(
                value.includes(c.text) ? value.filter((x) => x !== c.text) : [...value, c.text],
              )
            }
            disabled={disabled}
            aria-pressed={value.includes(c.text)}
          >
            {value.includes(c.text) ? <Check size={19} /> : <Plus size={19} />}
            <span>{c.text}</span>
          </button>
        ))}
      </div>
      <div className="effect">
        <ArrowDown size={22} />
        <small>CONTRIBUTED TO</small>
        <h3>{title}</h3>
      </div>
    </>
  )
}
