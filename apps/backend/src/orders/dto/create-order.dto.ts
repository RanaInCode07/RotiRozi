import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsNumber,
  IsEnum,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  menuItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  tableId?: string;

  @IsEnum(['DINE_IN', 'TAKEAWAY', 'DELIVERY'])
  orderType: string;

  @IsOptional()
  @IsEnum(['POS', 'ZOMATO', 'SWIGGY', 'WEBSITE'])
  source?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsEnum(['CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'BILLED', 'CANCELLED'])
  status: string;
}

export class ApplyDiscountDto {
  @IsNumber()
  @Min(0)
  discountAmount: number;
}

export class RecordPaymentDto {
  @IsEnum(['CASH', 'UPI', 'CARD', 'WALLET', 'CREDIT'])
  mode: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  transactionRef?: string;
}
