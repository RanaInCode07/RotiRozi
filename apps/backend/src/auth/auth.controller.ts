import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── POST /auth/register ──────────────────────────────────────────────────

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new tenant (restaurant brand) with an owner account',
  })
  @ApiResponse({ status: 201, description: 'Tenant registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto);
  }

  // ── POST /auth/login ─────────────────────────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @ApiOperation({ summary: 'Login with email + password' })
  @ApiResponse({ status: 200, description: 'Returns JWT access + refresh tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Request() req: { user: User },
    @Body() dto: LoginDto,
  ) {
    return this.authService.login(req.user, dto.outletId);
  }

  // ── POST /auth/refresh ───────────────────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new access token' })
  @ApiResponse({ status: 200, description: 'New token pair issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @CurrentUser('userId') userId: string,
  ) {
    // Decode userId from the refresh token (without verifying expiry here,
    // the service will verify the stored hash via Redis)
    const payload = this.decodeWithoutVerify(dto.refreshToken);
    return this.authService.refreshTokens(payload.sub, dto.refreshToken);
  }

  // ── POST /auth/logout ────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 204, description: 'Logged out' })
  async logout(@CurrentUser('userId') userId: string): Promise<void> {
    await this.authService.logout(userId);
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  private decodeWithoutVerify(token: string): { sub: string } {
    try {
      const [, payloadB64] = token.split('.');
      const decoded = Buffer.from(payloadB64, 'base64url').toString('utf8');
      return JSON.parse(decoded) as { sub: string };
    } catch {
      return { sub: '' };
    }
  }
}
