export interface MonthEndClosingInput {
  store_id: number;
  accounting_period_id: number;
}

export interface ClosingTaskResult {
  task_name: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  message?: string;
  executed_at?: Date;
}

export interface ClosingExceptionResult {
  entity_type: string;
  entity_id: string;
  description: string;
  severity: 'WARNING' | 'BLOCKER';
}

export interface MonthEndClosingResult {
  id: number;
  store_id: number;
  accounting_period_id: number;
  status: string;
  started_at?: Date;
  completed_at?: Date;
  tasks: ClosingTaskResult[];
  exceptions: ClosingExceptionResult[];
}
