import { NotFoundError } from '../../../common/domain/errors/not-found.error.js';

export class WatchNotFoundError extends NotFoundError {
  constructor() {
    super('Valeur suivie introuvable, elle a peut-être déjà été retirée.');
  }
}
