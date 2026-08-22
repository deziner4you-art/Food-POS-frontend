import { IsOptional } from 'class-validator';

export class ClaimOrderDto {
  // Task #2J: the server now derives the claiming rider's identity from the
  // authenticated JWT (request.user.sub), never from this field -- it's
  // accepted-but-ignored, kept optional only so the existing rider app's
  // request body (which still sends its own riderId) doesn't fail
  // validation. Do not read this field for authorization/identity purposes.
  @IsOptional()
  riderId?: number | string;

  @IsOptional()
  riderName?: string;
}
