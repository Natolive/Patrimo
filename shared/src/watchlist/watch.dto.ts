import type { QuoteDto } from '../portfolio/quote.dto.ts'

// Valeur suivie sans forcément la détenir.
export interface WatchDto extends QuoteDto {
  id: string
  symbol: string
  name: string
  currency: string
}
