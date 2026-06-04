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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@pos/shared';
import { KotsService } from './kots.service';
import { CreateKotDto, UpdateKotStatusDto, UpdateKotItemStatusDto } from './dto/create-kot.dto';

@Controller('kots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KotsController {
  constructor(private readonly kotsService: KotsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateKotDto) {
    return this.kotsService.create(user.tenantId, user.outletId!, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
  ) {
    return this.kotsService.findAllByOutlet(user.outletId!, status);
  }

  @Get('order/:orderId')
  findByOrder(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.kotsService.findByOrder(user.tenantId, orderId);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateKotStatusDto,
  ) {
    return this.kotsService.updateStatus(user.outletId!, id, dto.status);
  }

  @Patch('items/:itemId/status')
  updateItemStatus(
    @CurrentUser() user: AuthUser,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateKotItemStatusDto,
  ) {
    return this.kotsService.updateItemStatus(user.outletId!, itemId, dto.status);
  }
}
