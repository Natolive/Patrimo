import type { TradeSide } from '@patrimo/shared'

// Couleur et icône d'une opération : achat en vert, vente en rouge, dividende en bleu.
export const SIDE_COLOR = { buy: 'success', sell: 'error', dividend: 'info' } as const satisfies Record<TradeSide, string>
export const SIDE_ICON: Record<TradeSide, string> = { buy: 'i-lucide-arrow-down-to-line', sell: 'i-lucide-arrow-up-from-line', dividend: 'i-lucide-coins' }
