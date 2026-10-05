import { z } from 'zod'

// Recherche globale : nom, code ISIN ou mnémonique.
export const assetSearchQuerySchema = z.object({
  q: z.string('Saisis un nom, un code ISIN ou un mnémonique.').trim().min(2, 'Saisis au moins 2 caractères.').max(50),
})
export type AssetSearchQueryDto = z.infer<typeof assetSearchQuerySchema>

// Valeur proposée par la recherche (action ou ETF coté).
export interface AssetSuggestionDto {
  symbol: string
  name: string
  // Place de cotation, ex. « Paris ».
  exchange: string
  type: 'equity' | 'etf'
}

// Dernier cours d'une valeur, pour préremplir un ordre.
export interface LastPriceDto {
  symbol: string
  price: number
  date: string
}
