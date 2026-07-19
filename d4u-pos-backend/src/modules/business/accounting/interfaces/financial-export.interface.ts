export interface ReportMetadata {
  company_name: string;
  report_name: string;
  fiscal_period: string;
  generated_by: string;
  generated_date: Date;
  orientation?: 'portrait' | 'landscape';
}

export interface ExportRequest {
  format: 'JSON' | 'CSV' | 'EXCEL' | 'PDF';
  report_type: 'TRIAL_BALANCE' | 'GENERAL_LEDGER' | 'PROFIT_LOSS' | 'BALANCE_SHEET' | 'CASH_FLOW';
  metadata: ReportMetadata;
  data: any;
}

export interface ExportResult {
  format: string;
  mime_type: string;
  file_name: string;
  content: string | Buffer;
}
