import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@pos/shared';
import { MenuItemsService } from './menu-items.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/create-menu-item.dto';

@Controller('menu-items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Post()
  @Roles('TENANT_OWNER', 'OUTLET_MANAGER')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMenuItemDto) {
    return this.menuItemsService.create(user.tenantId, user.outletId!, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('outletId') outletId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const oid = outletId || user.outletId!;
    return this.menuItemsService.findAll(user.tenantId, oid, categoryId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.menuItemsService.findOne(user.tenantId, id);
  }

  @Put(':id')
  @Roles('TENANT_OWNER', 'OUTLET_MANAGER')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuItemsService.update(user.tenantId, id, dto);
  }

  @Patch(':id/toggle-availability')
  @Roles('TENANT_OWNER', 'OUTLET_MANAGER')
  toggleAvailability(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.menuItemsService.toggleAvailability(user.tenantId, id);
  }

  @Delete(':id')
  @Roles('TENANT_OWNER', 'OUTLET_MANAGER')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.menuItemsService.remove(user.tenantId, id);
  }
}
