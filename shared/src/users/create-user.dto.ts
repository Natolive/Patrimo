import { z } from 'zod'
import { emailField } from '../common/email.field.ts'
import { newPasswordField } from '../common/new-password.field.ts'

// Compte créé en ligne de commande (`npm run user:create`), pas d'inscription.
export const createUserSchema = z.object({
  email: emailField,
  password: newPasswordField,
  firstName: z.string('Saisis le prénom.').trim().min(1, 'Saisis le prénom.').max(100),
  lastName: z.string('Saisis le nom.').trim().min(1, 'Saisis le nom.').max(100),
})
export type CreateUserDto = z.infer<typeof createUserSchema>
