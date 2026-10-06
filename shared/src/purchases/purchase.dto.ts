import type { TradeSide } from './trade-side.ts'

export interface PurchaseDto {
  id: string
  side: TradeSide
  symbol: string
  name: string
  currency: string
  boughtAt: string
  quantity: number
  unitPrice: number
  fees: number
  // Achat : quantité × prix + frais (payé) ; vente ou dividende : quantité × prix − frais (encaissé).
  total: number
}
