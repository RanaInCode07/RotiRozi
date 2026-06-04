import { IsString, IsArray, IsEnum, IsInt, Min, ArrayMinSize } from 'class-validator';

export class KotItemDto {
  @IsString()
  orderItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateKotDto {
  @IsString()
  orderId: string;

  @IsArray()
  @ArrayMinSize(1)
  items: KotItemDto[];
}

export class UpdateKotStatusDto {
  @IsEnum(['PREPARING', 'COMPLETED', 'CANCELLED'])
  status: string;
}

export class UpdateKotItemStatusDto {
  @IsEnum(['SENT_TO_KOT', 'PREPARED', 'DISPATCHED'])
  status: string;
}
