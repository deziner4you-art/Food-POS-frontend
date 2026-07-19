import { VoucherType } from '../enums/voucher-type.enum';
import { VoucherStatus } from '../enums/voucher-status.enum';

export interface IVoucher {
  id: number;
  store_id: number;
  voucher_type: VoucherType;
  voucher_number: string;
  date: Date;
  amount: number;
  notes?: string | null;
  status: VoucherStatus;
  created_by?: number | null;
  created_at: Date;
  updated_at: Date;
}
