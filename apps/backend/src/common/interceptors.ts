// ============================================
// ContentPilot AI — Common Interceptors
// ============================================

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, map } from 'rxjs';

/**
 * Transform all successful responses into a consistent format:
 * { success: true, data: ... }
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
      })),
    );
  }
}

/**
 * Log request timing and details for monitoring.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const duration = Date.now() - now;

        this.logger.log(
          `${method} ${url} ${response.statusCode} - ${duration}ms`,
        );

        // Warn on slow requests
        if (duration > 3000) {
          this.logger.warn(`⚠️ Slow request: ${method} ${url} took ${duration}ms`);
        }
      }),
    );
  }
}
