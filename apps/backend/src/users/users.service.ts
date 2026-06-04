import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/create-user.dto';
import { Role, User } from '@prisma/client';

const BCRYPT_ROUNDS = 12;

// Which roles a requesting role is allowed to create/manage
const MANAGEABLE_ROLES: Record<Role, Role[]> = {
  [Role.SUPER_ADMIN]: Object.values(Role),
  [Role.TENANT_OWNER]: [
    Role.OUTLET_MANAGER,
    Role.BILLING_CLERK,
    Role.KITCHEN_STAFF,
  ],
  [Role.OUTLET_MANAGER]: [Role.BILLING_CLERK, Role.KITCHEN_STAFF],
  [Role.BILLING_CLERK]: [],
  [Role.KITCHEN_STAFF]: [],
};

type SafeUser = Omit<User, 'passwordHash' | 'refreshTokenHash'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Create staff user ────────────────────────────────────────────────────

  async create(
    dto: CreateUserDto,
    requestingUser: Express.User,
  ): Promise<SafeUser> {
    this.assertCanManageRole(requestingUser.role, dto.role);

    const targetOutletId = this.resolveTargetOutlet(dto.outletId ?? null, requestingUser);

    const emailLower = dto.email.toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { tenantId: requestingUser.tenantId, email: emailLower, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists in the tenant');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        tenantId: requestingUser.tenantId,
        outletId: targetOutletId,
        email: emailLower,
        passwordHash,
        name: dto.name,
        role: dto.role,
      },
    });

    return this.strip(user);
  }

  // ── List users in tenant / outlet ────────────────────────────────────────

  async findAll(requestingUser: Express.User): Promise<SafeUser[]> {
    const where: Record<string, unknown> = {
      tenantId: requestingUser.tenantId,
      deletedAt: null,
    };

    // Non-owners only see users in their outlet
    if (
      requestingUser.outletId &&
      requestingUser.role !== Role.TENANT_OWNER &&
      requestingUser.role !== Role.SUPER_ADMIN
    ) {
      where['outletId'] = requestingUser.outletId;
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return users.map(this.strip);
  }

  // ── Get single user ──────────────────────────────────────────────────────

  async findOne(id: string, requestingUser: Express.User): Promise<SafeUser> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId: requestingUser.tenantId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    this.assertSameOutletOrAbove(user, requestingUser);
    return this.strip(user);
  }

  // ── Update user ──────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateUserDto,
    requestingUser: Express.User,
  ): Promise<SafeUser> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId: requestingUser.tenantId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    if (dto.role) this.assertCanManageRole(requestingUser.role, dto.role);
    this.assertSameOutletOrAbove(user, requestingUser);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        role: dto.role,
        outletId: dto.outletId,
        isActive: dto.isActive,
      },
    });
    return this.strip(updated);
  }

  // ── Change own password ───────────────────────────────────────────────────

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash, refreshTokenHash: null },
    });
  }

  // ── Soft-delete user ──────────────────────────────────────────────────────

  async remove(id: string, requestingUser: Express.User): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId: requestingUser.tenantId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.id === requestingUser.userId) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    this.assertCanManageRole(requestingUser.role, user.role);
    await this.prisma.softDelete('user', { id });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private assertCanManageRole(requestingRole: Role, targetRole: Role): void {
    const allowed = MANAGEABLE_ROLES[requestingRole];
    if (!allowed.includes(targetRole)) {
      throw new ForbiddenException(
        `Role ${requestingRole} cannot manage users with role ${targetRole}`,
      );
    }
  }

  private assertSameOutletOrAbove(user: User, requesting: Express.User): void {
    if (
      requesting.role === Role.SUPER_ADMIN ||
      requesting.role === Role.TENANT_OWNER
    )
      return;

    if (
      requesting.outletId &&
      user.outletId &&
      requesting.outletId !== user.outletId
    ) {
      throw new ForbiddenException(
        'You can only manage users in your own outlet',
      );
    }
  }

  private resolveTargetOutlet(
    requestedOutletId: string | null,
    requesting: Express.User,
  ): string | null {
    // Outlet managers can only create users in their own outlet
    if (
      requesting.role === Role.OUTLET_MANAGER &&
      requesting.outletId
    ) {
      return requesting.outletId;
    }
    return requestedOutletId;
  }

  private strip(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, ...safe } = user;
    return safe;
  }
}
