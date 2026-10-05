import type { PositionDto } from './position.dto.ts'

export interface PortfolioPointDto {
  date: string
  value: number
  invested: number
}

export interface PortfolioDto {
  invested: number
  value: number
  gain: number
  gainRate: number
  // Plus-values encaissées par les ventes, positions soldées comprises.
  realizedGain: number
  dayChange: number
  dayChangeRate: number
  positions: PositionDto[]
  // Valorisation et montant investi, jour après jour depuis le premier achat.
  history: PortfolioPointDto[]
}
