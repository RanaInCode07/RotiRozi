import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Role hierarchy (higher index = more privileged):
 * KITCHEN_STAFF = BILLING_CLERK < OUTLET_MANAGER < TENANT_OWNER < SUPER_ADMIN
 *
 * A user can access any endpoint requiring a role equal to or below their own.
 */
const ROLE_HIERARCHY: Role[] = [
  Role.KITCHEN_STAFF,
  Role.BILLING_CLERK,
  Role.OUTLET_MANAGER,
  Role.TENANT_OWNER,
  Role.SUPER_ADMIN,
];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator → no restriction (but still requires JWT)
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest() as { user: any };

    if (!user) throw new ForbiddenException('No authenticated user found');

    const userRankIndex = ROLE_HIERARCHY.indexOf(user.role as Role);

    const hasPermission = requiredRoles.some((required) => {
      const requiredIndex = ROLE_HIERARCHY.indexOf(required);
      return userRankIndex >= requiredIndex;
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredRoles.join(' or ')}, Found: ${user.role}`,
      );
    }

    return true;
  }
}
