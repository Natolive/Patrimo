import type { QuoteDto } from './quote.dto.ts'

// Ligne du portefeuille : tous les achats d'une même valeur.
export interface PositionDto extends QuoteDto {
  symbol: string
  name: string
  currency: string
  quantity: number
  // Total payé, frais compris.
  invested: number
  // Prix de revient unitaire, frais compris.
  averageCost: number
  value: number
  gain: number
  gainRate: number
  // Variation de la valorisation depuis la clôture précédente.
  dayChange: number
  // Part de la valorisation totale (0 à 1).
  weight: number
}
