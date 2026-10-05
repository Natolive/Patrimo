import type { TrendDto } from './trend.dto.ts'

// Dernier cours d'une valeur et sa lecture de tendance.
export interface QuoteDto {
  price: number
  dayChangeRate: number
  trend: TrendDto
}
