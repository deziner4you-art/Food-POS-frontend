import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { phone: string; pin: string }) {
    return this.authService.login(body.phone, body.pin);
  }

  @Get('offline-credentials/:store_id')
  async getOfflineCredentials(@Param('store_id', ParseIntPipe) storeId: number) {
    // This endpoint syncs hashed PINs to the local POS for offline shift changes
    return this.authService.getOfflineCredentials(storeId);
  }
}
