export interface ReservationResult {
  reservation_id: number;
  reservation_number: string;
  status: string;
  total_items: number;
  reserved_quantities: Record<number, number>;
}
