export interface DisposeAssetInput {
  asset_id: number;
  disposal_type: 'SALE' | 'WRITE_OFF';
  sale_value?: number;
  reason?: string;
}
