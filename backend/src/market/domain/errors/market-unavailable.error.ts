import { DomainError } from '../../../common/domain/errors/domain.error.js';

export class MarketUnavailableError extends DomainError {
  constructor() {
    super('Les cours sont indisponibles pour le moment, réessaie dans un instant.');
  }
}
