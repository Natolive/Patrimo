import { NotFoundError } from '../../../common/domain/errors/not-found.error.js';

export class PurchaseNotFoundError extends NotFoundError {
  constructor() {
    super('Achat introuvable, il a peut-être déjà été supprimé.');
  }
}
