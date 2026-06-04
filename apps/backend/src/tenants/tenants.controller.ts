import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('tenants')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ── Super Admin only ──────────────────────────────────────────────────────

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[SUPER_ADMIN] List all tenants' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.tenantsService.findAll(page, limit);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[SUPER_ADMIN] Create a new tenant' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  // ── Super Admin + Tenant Owner (own tenant) ───────────────────────────────

  @Get(':id')
  @Roles(Role.TENANT_OWNER)
  @ApiOperation({ summary: 'Get a tenant by ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.tenantsService.findOne(id, tenantId, role);
  }

  @Patch(':id')
  @Roles(Role.TENANT_OWNER)
  @ApiOperation({ summary: 'Update tenant details' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.tenantsService.update(id, dto, tenantId, role);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[SUPER_ADMIN] Soft-delete a tenant' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.remove(id);
  }
}
