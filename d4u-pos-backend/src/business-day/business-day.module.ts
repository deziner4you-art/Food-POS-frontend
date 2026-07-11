import { Module } from '@nestjs/common';
import { BusinessDayController } from './business-day.controller';
import { BusinessDayService } from './business-day.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BusinessDayController],
  providers: [BusinessDayService],
  exports: [BusinessDayService],
})
export class BusinessDayModule {}
