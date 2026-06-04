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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersSvc: UsersService) {}

  // ── Create staff member ──────────────────────────────────────────────────

  @Post()
  @Roles(Role.OUTLET_MANAGER)   // OM+ can create staff
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a staff user within your tenant/outlet' })
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: Express.User,
  ) {
    return this.usersSvc.create(dto, user);
  }

  // ── List users ────────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.OUTLET_MANAGER)
  @ApiOperation({ summary: 'List users in your tenant (scoped to your outlet if applicable)' })
  findAll(@CurrentUser() user: Express.User) {
    return this.usersSvc.findAll(user);
  }

  // ── Get current user (me) ─────────────────────────────────────────────────

  @Get('me')
  @Roles(Role.KITCHEN_STAFF)   // any authenticated user
  @ApiOperation({ summary: 'Get your own profile' })
  getMe(@CurrentUser() user: Express.User) {
    return this.usersSvc.findOne(user.userId, user);
  }

  // ── Change own password ───────────────────────────────────────────────────

  @Patch('me/password')
  @Roles(Role.KITCHEN_STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change your own password' })
  changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.usersSvc.changePassword(userId, dto);
  }

  // ── Get by id ─────────────────────────────────────────────────────────────

  @Get(':id')
  @Roles(Role.OUTLET_MANAGER)
  @ApiOperation({ summary: 'Get a specific staff member' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: Express.User,
  ) {
    return this.usersSvc.findOne(id, user);
  }

  // ── Update user ───────────────────────────────────────────────────────────

  @Patch(':id')
  @Roles(Role.OUTLET_MANAGER)
  @ApiOperation({ summary: 'Update a staff member' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: Express.User,
  ) {
    return this.usersSvc.update(id, dto, user);
  }

  // ── Delete user ───────────────────────────────────────────────────────────

  @Delete(':id')
  @Roles(Role.OUTLET_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate (soft-delete) a staff member' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: Express.User,
  ) {
    return this.usersSvc.remove(id, user);
  }
}
