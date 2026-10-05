import type { z } from 'zod'
import { createUserSchema } from './create-user.dto.ts'

// Nom affiché ; l'email (identifiant de connexion) ne change pas ici.
export const updateProfileSchema = createUserSchema.pick({ firstName: true, lastName: true })
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>
