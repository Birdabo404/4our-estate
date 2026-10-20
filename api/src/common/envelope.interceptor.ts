import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

import { PageResult } from './page.js';

@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((body: unknown) => {
        if (body instanceof PageResult) {
          return {
            data: body.items,
            meta: {
              total: body.total,
              page: body.page,
              pageSize: body.pageSize,
            },
          };
        }
        return { data: body };
      }),
    );
  }
}
