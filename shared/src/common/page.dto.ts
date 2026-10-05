import { z } from 'zod'

// Liste paginée au défilement : `offset` = éléments déjà chargés, `limit` = taille d'une page.
export const pageQuerySchema = z.object({
  offset: z.coerce.number('Indique un décalage.').int().min(0, 'Le décalage ne peut pas être négatif.').default(0),
  limit: z.coerce.number('Indique une taille de page.').int().min(1).max(100, 'Demande 100 éléments au plus.').default(20),
})
export type PageQueryDto = z.infer<typeof pageQuerySchema>

export interface PageDto<T> {
  items: T[]
  // Nombre total d'éléments, pour savoir s'il reste des pages.
  total: number
}
