import { DomainError } from '@/common/errors/domain.error';

export class UserAlreadyExistsError extends DomainError {
  readonly statusCode = 409;

  constructor(email: string) {
    super(`A user with email "${email}" already exists.`);
  }
}
