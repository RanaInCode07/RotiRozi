import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterTenantDto {
  @ApiProperty({ example: 'The Spice Garden', description: 'Restaurant / brand name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tenantName!: string;

  @ApiProperty({ example: 'owner@spicegarden.com' })
  @IsEmail()
  @IsNotEmpty()
  ownerEmail!: string;

  @ApiProperty({ example: 'SecurePass@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  ownerPassword!: string;

  @ApiProperty({ example: 'Rajesh Kumar' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ownerName!: string;
}
