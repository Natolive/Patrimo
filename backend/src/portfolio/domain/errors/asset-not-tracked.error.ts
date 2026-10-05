import { NotFoundError } from '../../../common/domain/errors/not-found.error.js';

export class AssetNotTrackedError extends NotFoundError {
  constructor() {
    super("Tu ne détiens ni ne suis cette valeur : ajoute un achat ou suis-la d'abord.");
  }
}
