import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto, UpdateTableDto } from './dto/create-table.dto';
import { TableStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async create(outletId: string, dto: CreateTableDto) {
    return this.prisma.restaurantTable.create({
      data: {
        outletId,
        name: dto.name,
        capacity: dto.capacity ?? 4,
        floor: dto.floor,
      },
    });
  }

  async findAll(outletId: string) {
    return this.prisma.restaurantTable.findMany({
      where: { outletId },
      orderBy: [{ floor: 'asc' }, { name: 'asc' }],
      include: {
        orders: {
          where: { status: { in: ['DRAFT', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'] } },
          select: { id: true, status: true, netAmount: true },
        },
      },
    });
  }

  async findOne(outletId: string, id: string) {
    const table = await this.prisma.restaurantTable.findFirst({
      where: { id, outletId },
      include: {
        orders: {
          where: { status: { in: ['DRAFT', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'] } },
          include: { orderItems: { include: { menuItem: true } } },
        },
      },
    });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async update(outletId: string, id: string, dto: UpdateTableDto) {
    await this.findOne(outletId, id);
    return this.prisma.restaurantTable.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.capacity && { capacity: dto.capacity }),
        ...(dto.floor !== undefined && { floor: dto.floor }),
        ...(dto.status && { status: dto.status as TableStatus }),
      },
    });
  }

  async remove(outletId: string, id: string) {
    await this.findOne(outletId, id);
    return this.prisma.restaurantTable.delete({ where: { id } });
  }

  async updateStatus(outletId: string, id: string, status: TableStatus) {
    await this.findOne(outletId, id);
    return this.prisma.restaurantTable.update({
      where: { id },
      data: { status },
    });
  }
}
