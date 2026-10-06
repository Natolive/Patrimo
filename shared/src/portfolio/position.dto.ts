import type { QuoteDto } from './quote.dto.ts'

// Ligne du portefeuille : toutes les opérations d'une même valeur encore détenue.
export interface PositionDto extends QuoteDto {
  symbol: string
  name: string
  currency: string
  quantity: number
  // Coût des titres encore détenus, frais compris (prix de revient × quantité).
  invested: number
  // Prix de revient unitaire, frais compris ; une vente ne le change pas (prix moyen pondéré).
  averageCost: number
  value: number
  gain: number
  gainRate: number
  // Variation de la valorisation depuis la clôture précédente.
  dayChange: number
  // Plus-values encaissées par les ventes, frais déduits.
  realizedGain: number
  // Dividendes encaissés, retenues déduites.
  dividends: number
  // Part de la valorisation totale (0 à 1).
  weight: number
}
