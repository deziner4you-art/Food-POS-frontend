export interface ClosingChecklistStatus {
  module: string;
  status: 'PENDING' | 'PASSED' | 'FAILED';
  validation_message?: string;
}

export interface ReopenPeriodDto {
  closing_id: number;
  reason: string;
}
