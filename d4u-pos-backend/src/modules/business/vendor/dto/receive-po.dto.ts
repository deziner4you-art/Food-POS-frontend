import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReceivePOItemDto {
  @IsInt()
  @IsNotEmpty()
  po_item_id: number;

  @IsNumber()
  @IsNotEmpty()
  received_qty: number;
}

export class ReceivePODto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivePOItemDto)
  @IsNotEmpty()
  received_items: ReceivePOItemDto[];

  @IsString()
  @IsNotEmpty()
  payment_status: string;
}
