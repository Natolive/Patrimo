import { z } from 'zod'

// Nombre saisi à la française (« 1 234,56 ») ou envoyé tel quel par l'API.
export const numberField = (message: string) =>
  z.preprocess((v) => (typeof v === 'string' ? v.replace(/[\s ]/g, '').replace(',', '.') : v), z.coerce.number(message).refine(Number.isFinite, message))
