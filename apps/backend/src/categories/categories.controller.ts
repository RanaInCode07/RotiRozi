import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@pos/shared';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles('TENANT_OWNER', 'OUTLET_MANAGER')
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(user.tenantId, user.outletId!, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('outletId') outletId?: string,
  ) {
    const oid = outletId || user.outletId!;
    return this.categoriesService.findAll(user.tenantId, oid);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.categoriesService.findOne(user.tenantId, id);
  }

  @Put(':id')
  @Roles('TENANT_OWNER', 'OUTLET_MANAGER')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('TENANT_OWNER', 'OUTLET_MANAGER')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.categoriesService.remove(user.tenantId, id);
  }
}
