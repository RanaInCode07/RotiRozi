import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  MaxLength,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOutletDto {
  @ApiProperty({ example: 'Koramangala Branch' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: '5th Block, Koramangala, Bengaluru' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Outlet configuration (taxRate, currency, etc.)',
    example: { taxRate: 5, currency: 'INR', timezone: 'Asia/Kolkata' },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class UpdateOutletDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}
