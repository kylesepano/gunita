import { useState } from 'react'
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react'
export function HowChallenge({
  items,
  onChange,
  disabled,
}: {
  items: string[]
  onChange: (items: string[]) => void
  disabled: boolean
}) {
  const [dragged, setDragged] = useState<number | null>(null)
  function move(from: number, to: number) {
    if (disabled || to < 0 || to >= items.length) return
    const copy = [...items]
    const [item] = copy.splice(from, 1)
    copy.splice(to, 0, item)
    onChange(copy)
  }
  return (
    <>
      <p className="mechanic-help">
        Reconstruct the story, earliest to latest. Drag a card or use its arrow buttons.
      </p>
      <ol className="sequence-list">
        {items.map((item, i) => (
          <li
            key={item}
            draggable={!disabled}
            onDragStart={() => setDragged(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (dragged !== null) move(dragged, i)
              setDragged(null)
            }}
            onDragEnd={() => setDragged(null)}
          >
            <GripVertical size={18} className="drag-handle" />
            <span className="sequence-number">0{i + 1}</span>
            <p>{item}</p>
            <div>
              <button
                aria-label={`Move ${item} up`}
                disabled={disabled || i === 0}
                onClick={() => move(i, i - 1)}
              >
                <ArrowUp size={16} />
              </button>
              <button
                aria-label={`Move ${item} down`}
                disabled={disabled || i === items.length - 1}
                onClick={() => move(i, i + 1)}
              >
                <ArrowDown size={16} />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </>
  )
}
