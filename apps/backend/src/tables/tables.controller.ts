import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { TablesService } from './tables.service';
import { CreateTableDto, UpdateTableDto } from './dto/create-table.dto';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @Roles('TENANT_OWNER', 'OUTLET_MANAGER')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTableDto) {
    return this.tablesService.create(user.outletId!, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('outletId') outletId?: string,
  ) {
    return this.tablesService.findAll(outletId || user.outletId!);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tablesService.findOne(user.outletId!, id);
  }

  @Put(':id')
  @Roles('TENANT_OWNER', 'OUTLET_MANAGER')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTableDto,
  ) {
    return this.tablesService.update(user.outletId!, id, dto);
  }

  @Delete(':id')
  @Roles('TENANT_OWNER', 'OUTLET_MANAGER')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tablesService.remove(user.outletId!, id);
  }
}
