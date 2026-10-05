import { ConflictError } from '../../../common/domain/errors/conflict.error.js';

export class AlreadyWatchedError extends ConflictError {
  constructor(name: string) {
    super(`Tu suis déjà ${name}.`);
  }
}
