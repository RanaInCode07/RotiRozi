import { IsString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';

export class CreateTableDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  floor?: string;
}

export class UpdateTableDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsEnum(['FREE', 'OCCUPIED', 'RESERVED', 'BLOCKED'])
  status?: string;
}
