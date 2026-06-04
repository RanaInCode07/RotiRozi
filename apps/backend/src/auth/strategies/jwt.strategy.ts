import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;       // userId
  tenantId: string;
  outletId: string | null;
  role: Role;
  iat?: number;
  exp?: number;
}

/**
 * Validates the Bearer JWT on every protected request.
 * Attaches { userId, tenantId, outletId, role } to req.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): Express.User {
    if (!payload.sub || !payload.tenantId || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      outletId: payload.outletId ?? null,
      role: payload.role,
    };
  }
}
