import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKotDto, UpdateKotStatusDto } from './dto/create-kot.dto';
import { KotStatus, KotItemStatus } from '@prisma/client';

@Injectable()
export class KotsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, outletId: string, dto: CreateKotDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, tenantId, outletId, deletedAt: null },
    });
    if (!order) throw new NotFoundException('Order not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastKot = await this.prisma.kOT.findFirst({
      where: { outletId, createdAt: { gte: today } },
      orderBy: { kotNumber: 'desc' },
    });
    const kotNumber = (lastKot?.kotNumber || 0) + 1;

    const kot = await this.prisma.kOT.create({
      data: {
        orderId: dto.orderId,
        outletId,
        kotNumber,
        kotItems: {
          create: dto.items.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            status: KotItemStatus.SENT_TO_KOT,
          })),
        },
      },
      include: {
        kotItems: {
          include: { orderItem: { include: { menuItem: true } } },
        },
        order: { select: { id: true, table: { select: { name: true } } } },
      },
    });

    await this.prisma.orderItem.updateMany({
      where: { id: { in: dto.items.map((i) => i.orderItemId) } },
      data: { kotStatus: KotItemStatus.SENT_TO_KOT },
    });

    return kot;
  }

  async findAllByOutlet(outletId: string, status?: string) {
    return this.prisma.kOT.findMany({
      where: {
        outletId,
        ...(status && { status: status as KotStatus }),
      },
      include: {
        kotItems: {
          include: { orderItem: { include: { menuItem: { select: { name: true, shortcode: true } } } } },
        },
        order: { select: { id: true, orderType: true, table: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOrder(tenantId: string, orderId: string) {
    return this.prisma.kOT.findMany({
      where: { orderId, order: { tenantId } },
      include: {
        kotItems: {
          include: { orderItem: { include: { menuItem: true } } },
        },
      },
      orderBy: { kotNumber: 'asc' },
    });
  }

  async updateStatus(outletId: string, kotId: string, status: string) {
    const kot = await this.prisma.kOT.findFirst({
      where: { id: kotId, outletId },
    });
    if (!kot) throw new NotFoundException('KOT not found');

    const updated = await this.prisma.kOT.update({
      where: { id: kotId },
      data: { status: status as KotStatus },
      include: { kotItems: true },
    });

    if (status === 'COMPLETED') {
      await this.prisma.kOTItem.updateMany({
        where: { kotId },
        data: { status: KotItemStatus.PREPARED },
      });
      const itemIds = updated.kotItems.map((ki) => ki.orderItemId);
      await this.prisma.orderItem.updateMany({
        where: { id: { in: itemIds } },
        data: { kotStatus: KotItemStatus.PREPARED },
      });
    }

    return updated;
  }

  async updateItemStatus(outletId: string, kotItemId: string, status: string) {
    const kotItem = await this.prisma.kOTItem.findFirst({
      where: { id: kotItemId, kot: { outletId } },
    });
    if (!kotItem) throw new NotFoundException('KOT item not found');

    const updated = await this.prisma.kOTItem.update({
      where: { id: kotItemId },
      data: { status: status as KotItemStatus },
    });

    await this.prisma.orderItem.update({
      where: { id: kotItem.orderItemId },
      data: { kotStatus: status as KotItemStatus },
    });

    return updated;
  }
}
