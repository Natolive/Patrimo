import type { NewsItemDto } from './news-item.dto.ts'

export interface WatchNewsDto {
  // Mots-clés cherchés (ceux de la personne, sinon la suggestion).
  query: string
  // true : suggestion calculée depuis le nom de la valeur, pas encore personnalisée.
  suggested: boolean
  items: NewsItemDto[]
}
