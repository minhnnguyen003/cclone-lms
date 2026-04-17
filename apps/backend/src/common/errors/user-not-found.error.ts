import { DomainError } from '@/common/errors/domain.error';

export class UserNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor() {
    super('User not found.');
  }
}
