import type { PurchaseDto } from '../purchases/purchase.dto.ts'
import type { PositionDto } from './position.dto.ts'
import type { QuoteDto } from './quote.dto.ts'

export interface AssetPointDto {
  date: string
  close: number
  sma50: number | null
  sma200: number | null
}

// Fiche d'une valeur détenue ou suivie : cours, moyennes mobiles, lecture de tendance et achats.
export interface AssetDto extends QuoteDto {
  symbol: string
  name: string
  currency: string
  // null : valeur seulement suivie.
  position: PositionDto | null
  // null : valeur pas dans la liste de suivi.
  watchId: string | null
  points: AssetPointDto[]
  purchases: PurchaseDto[]
}
