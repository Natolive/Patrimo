import type { NewsItemDto } from './news-item.dto.ts'

// Article du fil de l'accueil, avec les valeurs suivies qu'il concerne (une dépêche Wall Street vaut pour plusieurs ETF).
export interface FeedItemDto extends NewsItemDto {
  assets: { symbol: string, name: string }[]
}
