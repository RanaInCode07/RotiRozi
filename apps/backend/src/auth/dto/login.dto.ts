import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'owner@spicegarden.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecurePass@123' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({
    description:
      'Optional outlet UUID. If provided, the JWT will include outletId so the user is scoped to that outlet.',
  })
  @IsOptional()
  @IsUUID()
  outletId?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token issued at login' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
