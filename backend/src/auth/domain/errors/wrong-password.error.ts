import { DomainError } from '../../../common/domain/errors/domain.error.js';

export class WrongPasswordError extends DomainError {
  constructor() {
    super('Mot de passe incorrect : saisis ton mot de passe actuel.');
  }
}
