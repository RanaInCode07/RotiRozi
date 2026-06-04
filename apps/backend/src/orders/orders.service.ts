import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrderDto,
  AddItemsDto,
  ApplyDiscountDto,
  RecordPaymentDto,
} from './dto/create-order.dto';
import { OrderStatus, TableStatus, PaymentMode } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, outletId: string, userId: string, dto: CreateOrderDto) {
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: dto.items.map((i) => i.menuItemId) },
        tenantId,
        outletId,
        deletedAt: null,
        isAvailable: true,
      },
    });

    if (menuItems.length !== dto.items.length) {
      throw new BadRequestException('One or more menu items are unavailable');
    }

    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));

    const orderItems = dto.items.map((item) => {
      const unitPrice = priceMap.get(item.menuItemId)!;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice,
        totalPrice: new Decimal(unitPrice.toString()).mul(item.quantity),
        notes: item.notes,
      };
    });

    const totalAmount = orderItems.reduce(
      (sum, i) => sum.add(i.totalPrice),
      new Decimal(0),
    );

    const outlet = await this.prisma.outlet.findUnique({ where: { id: outletId } });
    const settings = (outlet?.settings as any) || {};
    const taxRate = new Decimal(settings.taxRate || 0).div(100);
    const taxAmount = totalAmount.mul(taxRate);
    const netAmount = totalAmount.add(taxAmount);

    const order = await this.prisma.order.create({
      data: {
        tenantId,
        outletId,
        tableId: dto.tableId || null,
        assignedUserId: userId,
        orderType: dto.orderType as any,
        source: (dto.source as any) || 'POS',
        notes: dto.notes,
        totalAmount,
        taxAmount,
        netAmount,
        orderItems: { create: orderItems },
      },
      include: { orderItems: { include: { menuItem: true } }, table: true },
    });

    if (dto.tableId) {
      await this.prisma.restaurantTable.update({
        where: { id: dto.tableId },
        data: { status: TableStatus.OCCUPIED },
      });
    }

    return order;
  }

  async findAll(tenantId: string, outletId: string, status?: string) {
    return this.prisma.order.findMany({
      where: {
        tenantId,
        outletId,
        deletedAt: null,
        ...(status && { status: status as OrderStatus }),
      },
      include: {
        orderItems: { include: { menuItem: { select: { name: true, shortcode: true } } } },
        table: { select: { id: true, name: true } },
        assignedUser: { select: { id: true, name: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        orderItems: { include: { menuItem: true } },
        table: true,
        assignedUser: { select: { id: true, name: true } },
        payments: true,
        kots: { include: { kotItems: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async addItems(tenantId: string, orderId: string, dto: AddItemsDto) {
    const order = await this.findOne(tenantId, orderId);
    if (!['DRAFT', 'CONFIRMED', 'PREPARING'].includes(order.status)) {
      throw new BadRequestException('Cannot add items to this order in its current state');
    }

    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: dto.items.map((i) => i.menuItemId) },
        tenantId,
        deletedAt: null,
        isAvailable: true,
      },
    });

    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));
    const newItems = dto.items.map((item) => {
      const unitPrice = priceMap.get(item.menuItemId)!;
      return {
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice,
        totalPrice: new Decimal(unitPrice.toString()).mul(item.quantity),
        notes: item.notes,
      };
    });

    await this.prisma.orderItem.createMany({ data: newItems });
    return this.recalculateTotals(tenantId, orderId);
  }

  async updateStatus(tenantId: string, orderId: string, status: string) {
    const order = await this.findOne(tenantId, orderId);
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
      READY: ['SERVED'],
      SERVED: ['BILLED'],
      BILLED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${status}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
      include: { orderItems: { include: { menuItem: true } }, table: true, payments: true },
    });

    if (status === 'BILLED' && order.tableId) {
      const activeOrders = await this.prisma.order.count({
        where: {
          tableId: order.tableId,
          id: { not: orderId },
          status: { in: ['DRAFT', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'] },
        },
      });
      if (activeOrders === 0) {
        await this.prisma.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: TableStatus.FREE },
        });
      }
    }

    if (status === 'CANCELLED' && order.tableId) {
      const activeOrders = await this.prisma.order.count({
        where: {
          tableId: order.tableId,
          id: { not: orderId },
          status: { in: ['DRAFT', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'] },
        },
      });
      if (activeOrders === 0) {
        await this.prisma.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: TableStatus.FREE },
        });
      }
    }

    return updated;
  }

  async applyDiscount(tenantId: string, orderId: string, dto: ApplyDiscountDto) {
    await this.findOne(tenantId, orderId);
    await this.prisma.order.update({
      where: { id: orderId },
      data: { discountAmount: dto.discountAmount },
    });
    return this.recalculateTotals(tenantId, orderId);
  }

  async recordPayment(tenantId: string, orderId: string, dto: RecordPaymentDto) {
    const order = await this.findOne(tenantId, orderId);
    if (!['SERVED', 'BILLED', 'DRAFT', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException('Order not ready for payment');
    }

    await this.prisma.payment.create({
      data: {
        orderId,
        mode: dto.mode as PaymentMode,
        amount: dto.amount,
        transactionRef: dto.transactionRef,
      },
    });

    const payments = await this.prisma.payment.findMany({ where: { orderId } });
    const totalPaid = payments.reduce(
      (sum, p) => sum.add(p.amount),
      new Decimal(0),
    );

    if (totalPaid.gte(order.netAmount)) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.BILLED },
      });

      if (order.tableId) {
        const activeOrders = await this.prisma.order.count({
          where: {
            tableId: order.tableId,
            id: { not: orderId },
            status: { in: ['DRAFT', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'] },
          },
        });
        if (activeOrders === 0) {
          await this.prisma.restaurantTable.update({
            where: { id: order.tableId },
            data: { status: TableStatus.FREE },
          });
        }
      }
    }

    return this.findOne(tenantId, orderId);
  }

  private async recalculateTotals(tenantId: string, orderId: string) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });
    const totalAmount = items.reduce(
      (sum, i) => sum.add(i.totalPrice),
      new Decimal(0),
    );

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { outlet: true },
    });
    const settings = (order?.outlet?.settings as any) || {};
    const taxRate = new Decimal(settings.taxRate || 0).div(100);
    const discountAmount = order?.discountAmount || new Decimal(0);
    const taxableAmount = totalAmount.sub(discountAmount);
    const taxAmount = taxableAmount.mul(taxRate);
    const netAmount = taxableAmount.add(taxAmount);

    return this.prisma.order.update({
      where: { id: orderId },
      data: { totalAmount, taxAmount, netAmount },
      include: {
        orderItems: { include: { menuItem: true } },
        table: true,
        payments: true,
      },
    });
  }
}
