import { z } from 'zod'

// Période du graphique en bougies : une journée en 5 minutes, 5 jours en 15 minutes, un mois en heures, sinon 5 ans en séances.
export const CANDLE_RANGES = ['1d', '5d', '1mo', '5y'] as const
export const candlesQuerySchema = z.object({
  range: z.enum(CANDLE_RANGES, 'Choisis une période parmi 1d, 5d, 1mo ou 5y.').default('1d'),
})
export type CandlesQueryDto = z.infer<typeof candlesQuerySchema>
export type CandleRange = CandlesQueryDto['range']

// Bougie : `time` en secondes, heure de la place de cotation comptée comme UTC (minuit pour une séance entière).
export interface CandleDto {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// `offset` : décalage de la place sur UTC en secondes, pour placer une cotation en direct dans la bonne bougie.
export interface CandlesDto {
  offset: number
  candles: CandleDto[]
}
