import { DomainError } from '../../../common/domain/errors/domain.error.js';
import { frenchDate } from '../french-date.js';

export class SaleLeftUncoveredError extends DomainError {
  constructor(date: string) {
    super(`Sans cet achat, la vente du ${frenchDate(date)} porterait sur des titres que tu n'as pas : supprime d'abord la vente.`);
  }
}
