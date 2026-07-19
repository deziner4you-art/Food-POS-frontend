import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Public, RequirePermissions, CurrentUser } from '../../../common/decorators';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.phone, body.pin);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() body: { userId: number; refreshToken: string }) {
    return this.authService.refreshTokens(body.userId, body.refreshToken);
  }

  @Post('logout')
  async logout(@CurrentUser() user: any) {
    return this.authService.logout(user.sub);
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
