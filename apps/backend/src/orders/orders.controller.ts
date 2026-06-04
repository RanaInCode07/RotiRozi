import {
  Controller,
  Get,
  Post,
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
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  AddItemsDto,
  UpdateOrderStatusDto,
  ApplyDiscountDto,
  RecordPaymentDto,
} from './dto/create-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(
      user.tenantId,
      user.outletId!,
      user.userId,
      dto,
    );
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('outletId') outletId?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.findAll(
      user.tenantId,
      outletId || user.outletId!,
      status,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.findOne(user.tenantId, id);
  }

  @Post(':id/items')
  addItems(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddItemsDto,
  ) {
    return this.ordersService.addItems(user.tenantId, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(user.tenantId, id, dto.status);
  }

  @Patch(':id/discount')
  @Roles('TENANT_OWNER', 'OUTLET_MANAGER')
  applyDiscount(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ApplyDiscountDto,
  ) {
    return this.ordersService.applyDiscount(user.tenantId, id, dto);
  }

  @Post(':id/payments')
  recordPayment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.ordersService.recordPayment(user.tenantId, id, dto);
  }
}
