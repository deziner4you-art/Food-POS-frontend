import { IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateGpsDto {
  @IsNotEmpty()
  orderId: number | string;

  @IsNotEmpty()
  lat: number | string;

  @IsNotEmpty()
  lng: number | string;

  // Task #2K: no longer read for identity/authorization purposes -- the
  // server derives the rider identity from the authenticated JWT instead
  // (RiderService.updateRiderGps). Kept optional here only for backward
  // compatibility; confirmed the real rider app doesn't currently send this
  // field on this call at all.
  @IsOptional()
  riderId?: string;
}
