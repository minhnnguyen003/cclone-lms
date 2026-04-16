import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

import { DomainError } from '@/common/errors/domain.error';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(exception.statusCode).json({
      data: null,
      meta: {},
      errors: [
        {
          status: exception.statusCode,
          title: exception.name,
          detail: exception.message,
        },
      ],
    });
  }
}
