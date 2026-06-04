import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OutletsService } from './outlets.service';
import { CreateOutletDto, UpdateOutletDto } from './dto/create-outlet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('outlets')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('outlets')
export class OutletsController {
  constructor(private readonly outletsSvc: OutletsService) {}

  @Post()
  @Roles(Role.TENANT_OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[TENANT_OWNER] Create a new outlet' })
  create(
    @Body() dto: CreateOutletDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.outletsSvc.create(tenantId, dto);
  }

  @Get()
  @Roles(Role.BILLING_CLERK)   // any role can list their own outlet
  @ApiOperation({ summary: 'List outlets for your tenant' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('outletId') outletId: string | null,
    @CurrentUser('role') role: Role,
  ) {
    return this.outletsSvc.findAll(tenantId, outletId, role);
  }

  @Get(':id')
  @Roles(Role.BILLING_CLERK)
  @ApiOperation({ summary: 'Get a specific outlet' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('outletId') outletId: string | null,
    @CurrentUser('role') role: Role,
  ) {
    return this.outletsSvc.findOne(id, tenantId, outletId, role);
  }

  @Patch(':id')
  @Roles(Role.OUTLET_MANAGER)
  @ApiOperation({ summary: '[OUTLET_MANAGER+] Update outlet details' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOutletDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.outletsSvc.update(id, tenantId, dto);
  }

  @Delete(':id')
  @Roles(Role.TENANT_OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[TENANT_OWNER] Delete an outlet' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.outletsSvc.remove(id, tenantId);
  }
}
