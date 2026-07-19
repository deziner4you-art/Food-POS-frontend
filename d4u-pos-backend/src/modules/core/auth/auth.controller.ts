import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { Public, RequirePermissions } from '../../../common/decorators';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.phone, body.pin);
  }

  @RequirePermissions('system.manage')
  @Get('offline-credentials/:store_id')
  async getOfflineCredentials(
    @Param('store_id', ParseIntPipe) storeId: number,
  ) {
    // This endpoint syncs hashed PINs to the local POS for offline shift changes
    return this.authService.getOfflineCredentials(storeId);
  }
}
