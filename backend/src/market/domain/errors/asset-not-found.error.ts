import { NotFoundError } from '../../../common/domain/errors/not-found.error.js';

export class AssetNotFoundError extends NotFoundError {
  constructor(query: string) {
    super(`Aucune valeur trouvée pour « ${query} » : essaie son code ISIN, indiqué sur l'avis d'opéré de ton courtier.`);
  }
}
