import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOutletDto, UpdateOutletDto } from './dto/create-outlet.dto';
import { Outlet, Prisma, Role } from '@prisma/client';

@Injectable()
export class OutletsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Create outlet (TenantOwner only) ────────────────────────────────────

  async create(
    tenantId: string,
    dto: CreateOutletDto,
  ): Promise<Outlet> {
    return this.prisma.outlet.create({
      data: {
        tenantId,
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        settings: (dto.settings ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  // ── List outlets for a tenant ────────────────────────────────────────────

  async findAll(
    tenantId: string,
    requestingOutletId: string | null,
    requestingRole: Role,
  ): Promise<Outlet[]> {
    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
      isActive: true,
    };

    // Outlet-scoped users only see their assigned outlet
    if (
      requestingOutletId &&
      requestingRole !== Role.TENANT_OWNER &&
      requestingRole !== Role.SUPER_ADMIN
    ) {
      where['id'] = requestingOutletId;
    }

    return this.prisma.outlet.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { users: true, menuItems: true, orders: true },
        },
      },
    });
  }

  // ── Get single outlet ────────────────────────────────────────────────────

  async findOne(
    id: string,
    tenantId: string,
    requestingOutletId: string | null,
    requestingRole: Role,
  ): Promise<Outlet> {
    this.assertOutletAccess(id, requestingOutletId, requestingRole);

    const outlet = await this.prisma.outlet.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: {
          select: { users: true, menuItems: true, orders: true },
        },
      },
    });
    if (!outlet) throw new NotFoundException('Outlet not found');
    return outlet;
  }

  // ── Update outlet ─────────────────────────────────────────────────────────

  async update(
    id: string,
    tenantId: string,
    dto: UpdateOutletDto,
  ): Promise<Outlet> {
    const outlet = await this.prisma.outlet.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!outlet) throw new NotFoundException('Outlet not found');

    return this.prisma.outlet.update({
      where: { id },
      data: {
        ...dto,
        settings: dto.settings
          ? (dto.settings as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }

  // ── Soft-delete outlet ────────────────────────────────────────────────────

  async remove(id: string, tenantId: string): Promise<void> {
    const outlet = await this.prisma.outlet.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!outlet) throw new NotFoundException('Outlet not found');
    await this.prisma.softDelete('outlet', { id });
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private assertOutletAccess(
    outletId: string,
    requestingOutletId: string | null,
    role: Role,
  ): void {
    if (role === Role.SUPER_ADMIN || role === Role.TENANT_OWNER) return;
    if (requestingOutletId && requestingOutletId !== outletId) {
      throw new ForbiddenException('Access denied to this outlet');
    }
  }
}
