import { Controller, Post, Body, Delete, Param } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { TerminalLoginDto, GenerateTerminalDto } from './dto';

@Controller('terminal')
export class TerminalController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('login')
  async login(@Body() body: TerminalLoginDto) {
    const session = await this.prisma.terminalSession.findUnique({
      where: { pin: body.pin },
    });

    if (!session || !session.is_active) {
      return { success: false, message: 'Invalid or expired PIN' };
    }

    return {
      success: true,
      waiter_name: session.waiter_name,
      store_id: session.store_id,
    };
  }

  @Post('generate')
  async generatePin(@Body() body: GenerateTerminalDto) {
    // Generate a random 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.terminalSession.create({
      data: {
        store_id: body.store_id,
        waiter_name: body.waiter_name,
        pin,
        is_active: true,
      },
    });

    return { success: true, pin };
  }

  @Delete(':pin')
  async killSession(@Param('pin') pin: string) {
    await this.prisma.terminalSession
      .delete({
        where: { pin },
      })
      .catch(() => null);

    return { success: true };
  }
}
