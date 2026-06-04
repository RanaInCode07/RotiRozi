import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Usage: @Roles(Role.TENANT_OWNER, Role.OUTLET_MANAGER)
 * Combined with RolesGuard, restricts endpoint access to users with
 * the specified roles OR any role higher in the hierarchy.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
