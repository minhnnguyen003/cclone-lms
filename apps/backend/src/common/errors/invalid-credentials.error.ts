import { DomainError } from '@/common/errors/domain.error';

export class InvalidCredentialsError extends DomainError {
  readonly statusCode = 401;

  constructor(message = 'Invalid credentials.') {
    super(message);
  }
}
