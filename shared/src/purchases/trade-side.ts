// Sens d'une opération : un achat ou une vente au comptant, ou un dividende encaissé.
export const TRADE_SIDES = ['buy', 'sell', 'dividend'] as const
export type TradeSide = (typeof TRADE_SIDES)[number]

export const TRADE_SIDE_LABELS: Record<TradeSide, string> = { buy: 'Achat', sell: 'Vente', dividend: 'Dividende' }
