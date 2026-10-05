import { z } from 'zod'
import { pageQuerySchema } from '../common/page.dto.ts'

// Opérations, les plus récentes d'abord ; `symbol` : celles d'une seule valeur (fiche).
export const purchasesQuerySchema = pageQuerySchema.extend({
  symbol: z.string().trim().min(1).max(20).optional(),
})
export type PurchasesQueryDto = z.infer<typeof purchasesQuerySchema>
