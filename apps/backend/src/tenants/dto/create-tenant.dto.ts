import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantPlan } from '@prisma/client';

export class CreateTenantDto {
  @ApiProperty({ example: 'The Spice Garden' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ enum: TenantPlan, default: TenantPlan.FREE })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Spice Garden Premium' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: TenantPlan })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}
