import { IsOptional } from 'class-validator';

export class PostFeedbackDto {
  @IsOptional()
  rating?: number | string;

  @IsOptional()
  comment?: string;
}
