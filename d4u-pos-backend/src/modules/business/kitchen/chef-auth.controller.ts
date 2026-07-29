import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { ChefSessionService } from './chef-session.service';
import { GenerateChefPinDto, ChefLoginDto, ResumeChefSessionDto, ChefHeartbeatDto } from './dto';

@Controller('kitchen/chef-auth')
export class ChefAuthController {
  constructor(private readonly service: ChefSessionService) {}

  @RequirePermissions('kitchen.sessions.create')
  @Post('generate')
  generatePin(@Body() body: GenerateChefPinDto) {
    return this.service.generatePin(body.store_id, body.chef_name, body.kitchen_station_id);
  }

  @RequirePermissions('kitchen.sessions.create')
  @Post('login')
  login(@Body() body: ChefLoginDto) {
    return this.service.loginByPin(body.pin, body.device_id, body.device_name);
  }

  @RequirePermissions('kitchen.sessions.create')
  @Post('resume')
  resume(@Body() body: ResumeChefSessionDto) {
    return this.service.resumeSession(body.session_id, body.device_id);
  }

  @RequirePermissions('kitchen.sessions.create')
  @Post('heartbeat')
  async heartbeat(@Body() body: ChefHeartbeatDto) {
    await this.service.touchActivity(body.session_id);
    return { success: true };
  }

  @RequirePermissions('kitchen.sessions.read')
  @Get('sessions')
  listSessions(@Query('store_id') store_id: string) {
    return this.service.listSessions(Number(store_id));
  }

  @RequirePermissions('kitchen.sessions.manage')
  @Post('sessions/:id/disconnect')
  disconnect(@Param('id') id: string) {
    return this.service.disconnect(Number(id));
  }

  @RequirePermissions('kitchen.sessions.manage')
  @Post('sessions/disconnect-all')
  disconnectAll(@Query('store_id') store_id: string) {
    return this.service.disconnectAll(Number(store_id));
  }

  @RequirePermissions('kitchen.sessions.create')
  @Post('sessions/:id/reconnect')
  reconnect(@Param('id') id: string) {
    return this.service.reconnect(Number(id));
  }

  @RequirePermissions('kitchen.sessions.manage')
  @Post('sessions/:id/logout')
  logout(@Param('id') id: string) {
    return this.service.logout(Number(id));
  }
}
