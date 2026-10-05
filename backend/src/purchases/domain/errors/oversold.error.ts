import { DomainError } from '../../../common/domain/errors/domain.error.js';
import { frenchDate } from '../french-date.js';

export class OversoldError extends DomainError {
  constructor(name: string, date: string) {
    super(`Tu vendrais plus de titres ${name} que tu n'en détiens le ${frenchDate(date)} : vérifie la quantité et la date, ou saisis d'abord l'achat.`);
  }
}
