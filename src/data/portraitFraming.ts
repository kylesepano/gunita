import type { CSSProperties } from 'react'
// Face-focused presentation of older full-length depictions hides uniforms,
// weapons, insignia and identifying text without altering the archival files.
const framing: Record<string, CSSProperties> = {
  '/portraits/lapulapu.jpg': {
    objectPosition: '50% 0%',
    transform: 'scale(4)',
    transformOrigin: '42% 5%',
  },
  '/portraits/napoleon.jpg': {
    objectPosition: '50% 0%',
    transform: 'scale(4.5)',
    transformOrigin: '50% 20%',
  },
  '/portraits/delpilar.jpg': {
    objectPosition: '50% 0%',
    transform: 'scale(3.5)',
    transformOrigin: '50% 43%',
  },
}
export const portraitFraming = (image: string): CSSProperties => framing[image] ?? {}
