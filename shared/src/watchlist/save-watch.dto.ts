import { z } from 'zod'

export const watchSchema = z.object({
  asset: z.string('Saisis le code ISIN ou le mnémonique.').trim().min(2, 'Saisis le code ISIN (ex. FR0000120073) ou le mnémonique (ex. CW8).').max(40),
})
export type SaveWatchDto = z.infer<typeof watchSchema>
