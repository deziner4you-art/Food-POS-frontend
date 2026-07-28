import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { ModifierService } from './modifier.service';
import { ModifierController } from './modifier.controller';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { PrismaModule } from '../../../database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CatalogService, ModifierService, AvailabilityService],
  controllers: [CatalogController, ModifierController, AvailabilityController],
  exports: [CatalogService],
})
export class CatalogModule {}
