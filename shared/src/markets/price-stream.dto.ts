import { z } from 'zod'

// Message `subscribe` du WebSocket `/stream` : la liste complète des valeurs à écouter (remplace la précédente).
export const streamSubscribeSchema = z.object({
  symbols: z.array(z.string().trim().min(1).max(20)).max(100, 'Écoute au plus 100 valeurs à la fois.'),
})
export type StreamSubscribeDto = z.infer<typeof streamSubscribeSchema>

// Cotation poussée en direct (message `tick`) ; `changeRate` : 0,0123 = +1,23 % sur la séance.
export interface PriceTickDto {
  symbol: string
  price: number
  time: string
  change: number
  changeRate: number
  dayVolume: number
}
