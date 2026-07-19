export interface CreateReservationDto {
  reservation_number: string;
  source: 'POS_ORDER' | 'KITCHEN_ORDER' | 'ONLINE_ORDER' | 'DELIVERY_ORDER' | 'MANUAL';
  reference_module: string;
  reference_id: string;
  store_id: number;
  warehouse_id?: number;
  expiry_date?: Date;
  remarks?: string;
  created_by: number;
}

export interface AddReservationLineDto {
  product_id: number;
  reserved_quantity: number;
}
