import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_PREFIX = 'refresh:';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // ── Validate user credentials (called by LocalStrategy) ─────────────────

  async validateUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    return isMatch ? user : null;
  }

  // ── Register a new Tenant + first owner user ─────────────────────────────

  async registerTenant(dto: RegisterTenantDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Omit<User, 'passwordHash' | 'refreshTokenHash'>;
    tenantId: string;
  }> {
    const emailLower = dto.ownerEmail.toLowerCase();

    // Check no user already has this email (cross-tenant email uniqueness
    // is enforced by @@unique([tenantId, email]) but we block same email
    // as owner of multiple tenants for simplicity)
    const existing = await this.prisma.user.findFirst({
      where: { email: emailLower, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.ownerPassword, BCRYPT_ROUNDS);

    const { tenant, owner } = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: dto.tenantName },
      });

      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: emailLower,
          passwordHash,
          name: dto.ownerName,
          role: Role.TENANT_OWNER,
        },
      });

      return { tenant, owner };
    });

    this.logger.log(
      `Tenant "${tenant.name}" (${tenant.id}) registered by ${owner.email}`,
    );

    const tokens = await this.generateTokens(owner, null);

    const { passwordHash: _ph, refreshTokenHash: _rth, ...safeUser } = owner;

    return { ...tokens, user: safeUser, tenantId: tenant.id };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(user: User, outletId?: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Omit<User, 'passwordHash' | 'refreshTokenHash'>;
  }> {
    // Validate outlet belongs to the user's tenant if provided
    let resolvedOutletId: string | null = null;
    if (outletId) {
      const outlet = await this.prisma.outlet.findFirst({
        where: { id: outletId, tenantId: user.tenantId, deletedAt: null },
      });
      if (!outlet) {
        throw new UnauthorizedException('Outlet not found or access denied');
      }
      // If user is scoped to a specific outlet, it must match
      if (user.outletId && user.outletId !== outletId) {
        throw new UnauthorizedException(
          'You do not have access to this outlet',
        );
      }
      resolvedOutletId = outletId;
    } else {
      resolvedOutletId = user.outletId ?? null;
    }

    const tokens = await this.generateTokens(user, resolvedOutletId);
    const { passwordHash: _ph, refreshTokenHash: _rth, ...safeUser } = user;
    return { ...tokens, user: safeUser };
  }

  // ── Refresh token ─────────────────────────────────────────────────────────

  async refreshTokens(userId: string, rawRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true, deletedAt: null },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Session expired. Please login again.');
    }

    const storedHash = await this.redis.get(
      `${REFRESH_TOKEN_PREFIX}${userId}`,
    );
    if (!storedHash) {
      throw new UnauthorizedException('Session expired. Please login again.');
    }

    const isValid = await bcrypt.compare(rawRefreshToken, storedHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateTokens(user, user.outletId ?? null);
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  async logout(userId: string): Promise<void> {
    await Promise.all([
      this.redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`),
      this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null },
      }),
    ]);
  }

  // ── Token generation ─────────────────────────────────────────────────────

  private async generateTokens(
    user: User,
    outletId: string | null,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      outletId,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    // Store hashed refresh token in Redis (TTL = 7 days)
    const refreshHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    const ttlSeconds = 7 * 24 * 60 * 60;

    await Promise.all([
      this.redis.setex(
        `${REFRESH_TOKEN_PREFIX}${user.id}`,
        ttlSeconds,
        refreshHash,
      ),
      this.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: refreshHash },
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
