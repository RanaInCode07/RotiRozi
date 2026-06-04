import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

/**
 * Extracts the authenticated user from the request and attaches
 * tenantId / outletId to the request object so downstream services
 * can read them without re-decoding the JWT.
 *
 * Applied globally via APP_INTERCEPTOR or selectively on controllers.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    // req.user is populated by JwtAuthGuard / PassportStrategy
    if (request.user) {
      // Attach convenience properties used in services
      (request as Request & { tenantId?: string; outletId?: string | null }).tenantId =
        request.user.tenantId;
      (request as Request & { tenantId?: string; outletId?: string | null }).outletId =
        request.user.outletId ?? null;
    }

    return next.handle();
  }
}
