import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  categoryId: string;

  @IsString()
  name: string;

  @IsString()
  shortcode: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isVeg?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  preparationTime?: number;
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  shortcode?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isVeg?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  preparationTime?: number;
}
