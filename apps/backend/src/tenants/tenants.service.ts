import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';
import { Role, Tenant } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Super Admin: list all tenants ─────────────────────────────────────────

  async findAll(page = 1, limit = 20): Promise<{ data: Tenant[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { outlets: true, users: true } } },
      }),
      this.prisma.tenant.count({ where: { deletedAt: null } }),
    ]);
    return { data, total };
  }

  // ── Super Admin: create tenant ────────────────────────────────────────────

  async create(dto: CreateTenantDto): Promise<Tenant> {
    return this.prisma.tenant.create({ data: dto });
  }

  // ── Find by id (self-service: tenant owner can read their own) ────────────

  async findOne(
    tenantId: string,
    requestingTenantId: string,
    requestingRole: Role,
  ): Promise<Tenant> {
    this.assertAccess(tenantId, requestingTenantId, requestingRole);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId, deletedAt: null },
      include: { _count: { select: { outlets: true, users: true } } },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  // ── Super Admin: update ───────────────────────────────────────────────────

  async update(
    tenantId: string,
    dto: UpdateTenantDto,
    requestingTenantId: string,
    requestingRole: Role,
  ): Promise<Tenant> {
    this.assertAccess(tenantId, requestingTenantId, requestingRole);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId, deletedAt: null },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: dto,
    });
  }

  // ── Super Admin: soft-delete ──────────────────────────────────────────────

  async remove(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId, deletedAt: null },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    await this.prisma.softDelete('tenant', { id: tenantId });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private assertAccess(
    tenantId: string,
    requestingTenantId: string,
    requestingRole: Role,
  ): void {
    // Super admins can access any tenant
    if (requestingRole === Role.SUPER_ADMIN) return;
    // Others can only access their own tenant
    if (tenantId !== requestingTenantId) {
      throw new ForbiddenException('Access denied to this tenant');
    }
  }
}
