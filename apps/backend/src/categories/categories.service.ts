import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, outletId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        tenantId,
        outletId,
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findAll(tenantId: string, outletId: string) {
    return this.prisma.category.findMany({
      where: { tenantId, outletId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { menuItems: true } } },
    });
  }

  async findOne(tenantId: string, id: string) {
    const cat = await this.prisma.category.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { menuItems: { where: { deletedAt: null } } },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async update(tenantId: string, id: string, dto: UpdateCategoryDto) {
    await this.findOne(tenantId, id);
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
