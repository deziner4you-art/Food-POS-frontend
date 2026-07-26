import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Public, CurrentUser } from '../../../common/decorators';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, SelectWorkspaceDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ---------------------------------------------------------------
  // LOGIN — Rate limited. Public endpoint.
  // ---------------------------------------------------------------
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Headers('x-device-id') deviceId?: string,
  ) {
    return this.authService.login(body.phone, body.pin, deviceId);
  }

  // ---------------------------------------------------------------
  // REFRESH TOKEN ROTATION — Public (carries refresh token in body)
  // ---------------------------------------------------------------
  @Public()
  @Post('refresh')
  async refresh(
    @Body() body: RefreshTokenDto,
  ) {
    return this.authService.refreshTokens(body.refresh_token, body.device_id);
  }

  // ---------------------------------------------------------------
  // SELECT WORKSPACE — Authenticated. Switch context without re-login.
  // ---------------------------------------------------------------
  @Post('select-workspace')
  async selectWorkspace(
    @CurrentUser() user: any,
    @Body() body: SelectWorkspaceDto,
    @Headers('x-device-id') deviceId: string,
  ) {
    return this.authService.selectWorkspace(
      user.sub,
      parseInt(body.assignment_id),
      deviceId,
    );
  }

  // ---------------------------------------------------------------
  // LOGOUT — Revoke tokens for this device
  // ---------------------------------------------------------------
  @Post('logout')
  async logout(
    @CurrentUser() user: any,
    @Headers('x-device-id') deviceId?: string,
  ) {
    return this.authService.logout(user.sub, deviceId);
  }

  // ---------------------------------------------------------------
  // REVOKE ALL SESSIONS — Admin force-logout a user
  // ---------------------------------------------------------------
  @Post('revoke-sessions/:userId')
  async revokeSessions(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.authService.revokeAllSessions(userId);
  }

  // ---------------------------------------------------------------
  // OFFLINE CREDENTIALS — Local POS sync (backward compatible)
  // NOTE: @RequirePermissions guard deferred to EWO-I002 (PermissionsGuard sprint)
  // ---------------------------------------------------------------
  @Public()
  @Get('offline-credentials/:store_id')
  async getOfflineCredentials(
    @Param('store_id', ParseIntPipe) storeId: number,
  ) {
    return this.authService.getOfflineCredentials(storeId);
  }
}
