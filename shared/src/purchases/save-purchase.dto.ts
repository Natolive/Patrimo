import { z } from 'zod'
import { numberField } from '../common/number.field.ts'

export const purchaseSchema = z.object({
  // Code ISIN (sur l'avis d'opéré Bourse Direct) ou mnémonique : la valeur est retrouvée par l'API.
  asset: z.string('Saisis le code ISIN ou le mnémonique.').trim().min(2, 'Saisis le code ISIN (ex. FR0000120073) ou le mnémonique (ex. CW8).').max(40),
  boughtAt: z.iso
    .date('Choisis la date d’achat.')
    .refine((d) => d <= new Date().toISOString().slice(0, 10), 'Choisis une date passée ou aujourd’hui.'),
  quantity: numberField('Indique le nombre de titres achetés.').pipe(z.number().positive('Indique au moins une fraction de titre.')),
  unitPrice: numberField('Indique le prix unitaire payé.').pipe(z.number().positive('Indique un prix supérieur à 0.')),
  fees: numberField('Indique les frais (0 s’il n’y en a pas).').pipe(z.number().min(0, 'Les frais ne peuvent pas être négatifs.')),
})
export type PurchaseInput = z.input<typeof purchaseSchema>
export type SavePurchaseDto = z.infer<typeof purchaseSchema>
