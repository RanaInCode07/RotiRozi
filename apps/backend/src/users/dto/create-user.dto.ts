import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

// Roles a manager/owner can assign (not SUPER_ADMIN)
const ASSIGNABLE_ROLES = [
  Role.TENANT_OWNER,
  Role.OUTLET_MANAGER,
  Role.BILLING_CLERK,
  Role.KITCHEN_STAFF,
] as const;

export class CreateUserDto {
  @ApiProperty({ example: 'cashier@spicegarden.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Staff@2024' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must have at least one uppercase, one lowercase, and one digit',
  })
  password!: string;

  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: Role, example: Role.BILLING_CLERK })
  @IsEnum(Role)
  role!: Role;

  @ApiPropertyOptional({
    description: 'Assign to a specific outlet. Leave null for tenant-wide access.',
  })
  @IsOptional()
  @IsUUID()
  outletId?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  outletId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  newPassword!: string;
}
