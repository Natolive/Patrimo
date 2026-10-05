export interface PurchaseDto {
  id: string
  symbol: string
  name: string
  currency: string
  boughtAt: string
  quantity: number
  unitPrice: number
  fees: number
  // quantité × prix + frais
  total: number
}
