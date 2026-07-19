export interface GenerateScheduleInput {
  asset_id: number;
  method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'DOUBLE_DECLINING';
  rate?: number;
}
