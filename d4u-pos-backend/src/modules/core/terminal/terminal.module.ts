import { Module } from '@nestjs/common';
import { TerminalController } from './terminal.controller';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Module({
  controllers: [TerminalController],
  providers: [PrismaService],
})
export class TerminalModule {}
