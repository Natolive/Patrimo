// Périodes des graphiques ; `months: null` = tout l'historique.
export const RANGES = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1A', months: 12 },
  { label: 'Tout', months: null },
] as const
export type RangeLabel = (typeof RANGES)[number]['label']

// Points de la période, comptée à partir du dernier point.
export function inRange<T extends { date: string }>(points: T[], label: RangeLabel): T[] {
  const months = RANGES.find((r) => r.label === label)?.months
  const last = points.at(-1)
  if (!months || !last) return points
  const from = new Date(`${last.date}T00:00:00Z`)
  from.setUTCMonth(from.getUTCMonth() - months)
  const start = from.toISOString().slice(0, 10)
  return points.filter((p) => p.date >= start)
}
