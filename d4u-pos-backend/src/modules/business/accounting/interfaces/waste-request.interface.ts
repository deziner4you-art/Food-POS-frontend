export interface CreateWasteSessionDto {
  store_id: number;
  warehouse_id?: number;
  reference_number: string;
  remarks?: string;
  created_by: number;
  transaction_date?: Date;
}

export interface AddWasteLineDto {
  product_id: number;
  batch_number?: string;
  waste_reason: 'Expired' | 'Spoiled' | 'Kitchen Waste' | 'Customer Return (Discard)' | 'Production Loss' | 'Damaged' | 'Broken' | 'Quality Failure' | 'Manual Approved Disposal';
  quantity: number;
  image_url?: string;
  remarks?: string;
}
