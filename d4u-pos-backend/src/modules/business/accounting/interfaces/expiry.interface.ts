export interface ExpiryMonitorResult {
  store_id: number;
  scan_date: Date;
  expired_today: number;
  expiring_7_days: number;
  expiring_30_days: number;
  already_expired: number;
  batches_updated: number;
}
