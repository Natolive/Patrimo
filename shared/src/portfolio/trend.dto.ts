export const TREND_SIGNALS = ['up', 'down', 'neutral'] as const
export type TrendSignal = (typeof TREND_SIGNALS)[number]

export const TREND_PERIODS = ['1m', '3m', '6m', '1y', 'ytd'] as const
export type TrendPeriod = (typeof TREND_PERIODS)[number]

// Lecture technique du cours ; null quand l'historique est trop court pour la calculer.
export interface TrendDto {
  // Variation du cours sur la période (0.05 = +5 %).
  performance: Record<TrendPeriod, number | null>
  sma50: number | null
  sma200: number | null
  // up : cours et MM50 au-dessus de la MM200 ; down : les deux en dessous ; neutral sinon.
  signal: TrendSignal | null
  high52: number
  low52: number
  // Écart du cours au plus haut sur 52 semaines (≤ 0).
  fromHigh52: number
  // Volatilité annualisée des rendements quotidiens sur un an.
  volatility: number | null
}
