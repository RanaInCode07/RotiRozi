import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/create-menu-item.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MenuItemsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, outletId: string, dto: CreateMenuItemDto) {
    try {
      return await this.prisma.menuItem.create({
        data: {
          tenantId,
          outletId,
          categoryId: dto.categoryId,
          name: dto.name,
          shortcode: dto.shortcode,
          description: dto.description,
          price: dto.price,
          imageUrl: dto.imageUrl,
          isVeg: dto.isVeg ?? true,
          preparationTime: dto.preparationTime,
        },
        include: { category: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Shortcode "${dto.shortcode}" already exists in this outlet`);
      }
      throw e;
    }
  }

  async findAll(tenantId: string, outletId: string, categoryId?: string) {
    return this.prisma.menuItem.findMany({
      where: {
        tenantId,
        outletId,
        deletedAt: null,
        ...(categoryId && { categoryId }),
      },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { category: true },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async update(tenantId: string, id: string, dto: UpdateMenuItemDto) {
    await this.findOne(tenantId, id);
    try {
      return await this.prisma.menuItem.update({
        where: { id },
        data: dto as any,
        include: { category: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Shortcode "${dto.shortcode}" already exists in this outlet`);
      }
      throw e;
    }
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async toggleAvailability(tenantId: string, id: string) {
    const item = await this.findOne(tenantId, id);
    return this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
    });
  }
}
