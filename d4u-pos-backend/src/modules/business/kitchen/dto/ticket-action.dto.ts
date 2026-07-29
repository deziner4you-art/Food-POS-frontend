import { IsNumber, IsOptional } from 'class-validator';

// Bump (-> READY) / Recall (-> PREPARING) / Cancel — no required body, just who
// did it for the kitchen audit log (SystemAuditLog).
export class TicketActionDto {
  @IsNumber()
  @IsOptional()
  user_id?: number;
}
