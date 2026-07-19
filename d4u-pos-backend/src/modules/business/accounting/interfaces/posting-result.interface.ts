export interface PostingResult {
  success: boolean;
  journal_entry_id: number;
  message: string;
  lines_posted?: number;
  error?: any;
}
