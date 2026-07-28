import { IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export const REVIEW_STAGES = ['UNDER_REVIEW', 'RECIPE_REVIEW', 'COSTING_REVIEW'] as const;

export class SubmitProductRequestDto {
  @IsNumber()
  @IsNotEmpty()
  submitted_by: number;
}

export class ReviewProductRequestDto {
  @IsIn(REVIEW_STAGES)
  status: (typeof REVIEW_STAGES)[number];

  @IsNumber()
  @IsNotEmpty()
  reviewed_by: number;

  @IsString()
  @IsOptional()
  comments?: string;
}

export class ApproveProductRequestDto {
  @IsNumber()
  @IsNotEmpty()
  approved_by: number;

  @IsArray()
  @IsNotEmpty()
  target_store_ids: number[];

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsNumber()
  @IsOptional()
  margin_pct?: number;

  @IsNumber()
  @IsOptional()
  recipe_id?: number;

  @IsString()
  @IsOptional()
  comments?: string;
}

export class RejectProductRequestDto {
  @IsNumber()
  @IsNotEmpty()
  rejected_by: number;

  @IsString()
  @IsNotEmpty()
  comments: string;
}

export class ReturnProductRequestDto {
  @IsNumber()
  @IsNotEmpty()
  returned_by: number;

  @IsString()
  @IsNotEmpty()
  comments: string;
}

export class PublishProductRequestDto {
  @IsNumber()
  @IsNotEmpty()
  published_by: number;

  @IsArray()
  @IsNotEmpty()
  target_store_ids: number[];
}
