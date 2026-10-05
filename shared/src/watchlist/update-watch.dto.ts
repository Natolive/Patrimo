import { z } from 'zod'

// Vide = revenir à la suggestion.
export const updateWatchSchema = z.object({
  newsQuery: z
    .string('Saisis des mots-clés.')
    .trim()
    .max(200, 'Raccourcis les mots-clés à 200 caractères.')
    .transform((v) => v || null),
})
export type UpdateWatchInput = z.input<typeof updateWatchSchema>
export type UpdateWatchDto = z.infer<typeof updateWatchSchema>
