import { useEffect, useState } from 'react'
import { Compass } from 'lucide-react'
import { categories, wheelRotation } from '../../game/roulette'
import type { QuestionType } from '../../types/history'
import { CategoryIcon } from '../../components/CategoryIcon'
export function Roulette({
  category = null,
  spinning = false,
  onFinish,
  decorative = false,
}: {
  category?: QuestionType | null
  spinning?: boolean
  onFinish?: () => void
  decorative?: boolean
}) {
  const [rotation, setRotation] = useState(0)
  useEffect(() => {
    if (!spinning || !category) return
    const frame = requestAnimationFrame(() =>
      setRotation((value) => wheelRotation(category, value)),
    )
    const timeout = setTimeout(
      () => onFinish?.(),
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 4200,
    )
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timeout)
    }
  }, [spinning, category, onFinish])
  return (
    <div
      className={`roulette ${decorative ? 'decorative' : ''}`}
      role="img"
      aria-label={
        spinning
          ? 'Roulette spinning'
          : category
            ? `Selected category: ${categories.find((c) => c.type === category)?.label}`
            : 'Six history challenges on a roulette wheel'
      }
    >
      <span className="wheel-pointer" />
      <div className="wheel-rim">
        <div className="wheel-face" style={{ transform: `rotate(${rotation}deg)` }}>
          <svg viewBox="0 0 400 400" aria-hidden="true">
            {categories.map((c, i) => {
              const start = ((i * 60 - 90) * Math.PI) / 180
              const end = start + Math.PI / 3
              return (
                <path
                  key={c.type}
                  d={`M200 200 L${200 + 196 * Math.cos(start)} ${200 + 196 * Math.sin(start)} A196 196 0 0 1 ${200 + 196 * Math.cos(end)} ${200 + 196 * Math.sin(end)} Z`}
                  fill={i % 2 ? '#dce5ef' : '#edf2f8'}
                  stroke="#8da2ba"
                  strokeWidth="1"
                />
              )
            })}
          </svg>
          {categories.map((c, i) => (
            <div
              className="wheel-label"
              key={c.type}
              style={{
                transform: `translate(-50%, -50%) rotate(${i * 60 + 30}deg) translateY(-132px)`,
              }}
            >
              <CategoryIcon type={c.type} size={27} />
              <strong>{c.label}</strong>
            </div>
          ))}
        </div>
        <div className="wheel-center">
          <Compass size={42} strokeWidth={1} />
          <span>G</span>
        </div>
      </div>
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
    </div>
  )
}
