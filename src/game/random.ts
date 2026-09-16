export function randomIndex(length: number): number {
  if (!Number.isInteger(length) || length < 1) throw new Error('A nonempty collection is required')
  const limit = 0x100000000 - (0x100000000 % length)
  const buffer = new Uint32Array(1)
  do {
    crypto.getRandomValues(buffer)
  } while (buffer[0] >= limit)
  return buffer[0] % length
}
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
