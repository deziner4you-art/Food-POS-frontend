import { Controller, Post, Get, Body, Param, Query, Delete } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { AppGateway } from '../../../app.gateway';
import { TerminalService } from './terminal.service';
import { TerminalLoginDto, GenerateTerminalDto, ResumeSessionDto, HeartbeatDto } from './dto';

@Controller('terminal')
export class TerminalController {
  constructor(
    private readonly service: TerminalService,
    private readonly gateway: AppGateway,
  ) {}

  @RequirePermissions('system.create')
  @Post('login')
  async login(@Body() body: TerminalLoginDto) {
    return this.service.loginByPin(body.pin, body.device_id, body.device_name);
  }

  @RequirePermissions('system.create')
  @Post('resume')
  async resume(@Body() body: ResumeSessionDto) {
    return this.service.resumeSession(body.session_id, body.device_id);
  }

  @RequirePermissions('system.create')
  @Post('heartbeat')
  async heartbeat(@Body() body: HeartbeatDto) {
    await this.service.touchActivity(body.session_id);
    return { success: true };
  }

  @RequirePermissions('system.create')
  @Post('generate')
  async generatePin(@Body() body: GenerateTerminalDto) {
    return this.service.generatePin(body.store_id, body.waiter_name);
  }

  // GET /terminal/sessions?store_id=1 — Connected Waiters list for the cashier's Terminal tab
  @RequirePermissions('system.view')
  @Get('sessions')
  async listSessions(@Query('store_id') store_id: string) {
    return this.service.listSessions(Number(store_id));
  }

  @RequirePermissions('system.delete')
  @Post('sessions/:id/disconnect')
  async disconnect(@Param('id') id: string) {
    const result = await this.service.disconnect(Number(id));
    this.gateway.forceLogoutSession(Number(id));
    return result;
  }

  @RequirePermissions('system.delete')
  @Post('sessions/disconnect-all')
  async disconnectAll(@Query('store_id') store_id: string) {
    const result = await this.service.disconnectAll(Number(store_id));
    for (const s of result.sessions) this.gateway.forceLogoutSession(s.id);
    return result;
  }

  @RequirePermissions('system.create')
  @Post('sessions/:id/reconnect')
  async reconnect(@Param('id') id: string) {
    return this.service.reconnect(Number(id));
  }

  @RequirePermissions('system.create')
  @Post('sessions/:id/logout')
  async logout(@Param('id') id: string) {
    const result = await this.service.logout(Number(id));
    this.gateway.forceLogoutSession(Number(id));
    return result;
  }

  // Legacy endpoint, kept for backward compatibility.
  @RequirePermissions('system.delete')
  @Delete(':pin')
  async killSession(@Param('pin') pin: string) {
    const result = await this.service.disconnectByPin(pin);
    return result;
  }
}
