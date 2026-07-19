import { JournalType } from '../enums/journal-type.enum';

export interface IJournal {
  id: number;
  store_id: number;
  name: string;
  type: JournalType;
  prefix: string;
  created_at: Date;
  updated_at: Date;
}
