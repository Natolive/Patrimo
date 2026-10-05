// Valeur entièrement vendue : il n'en reste que la plus-value réalisée.
export interface ClosedPositionDto {
  symbol: string
  name: string
  currency: string
  realizedGain: number
}
