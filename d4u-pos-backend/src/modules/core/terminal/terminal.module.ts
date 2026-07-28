import { Global, Module } from '@nestjs/common';
import { TerminalController } from './terminal.controller';
import { TerminalService } from './terminal.service';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { AppGateway } from '../../../app.gateway';

// @Global() — many existing modules (InventoryModule, PosOrdersModule,
// KotsModule, ...) each provide their own AppGateway instance directly
// (pre-existing pattern, not introduced here). AppGateway now depends on
// TerminalService, so TerminalModule must be global; otherwise every one of
// those unrelated modules would fail to resolve AppGateway's dependencies.
@Global()
@Module({
  imports: [PrismaModule],
  controllers: [TerminalController],
  providers: [TerminalService, AppGateway],
  exports: [TerminalService],
})
export class TerminalModule {}
