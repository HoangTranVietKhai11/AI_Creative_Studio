// ============================================
// ContentPilot AI — Common Decorators
// ============================================

import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

/**
 * Extract the authenticated user from the request.
 * Usage: @CurrentUser() user: UserPayload
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

/**
 * Set required roles for an endpoint.
 * Usage: @Roles('ADMIN')
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Mark an endpoint as public (no auth required).
 * Usage: @Public()
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Custom throttle decorator for specific endpoints.
 */
export const THROTTLE_KEY = 'throttle';
export const CustomThrottle = (limit: number, ttl: number) =>
  SetMetadata(THROTTLE_KEY, { limit, ttl });
