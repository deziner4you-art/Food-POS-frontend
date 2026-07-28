import { Module } from '@nestjs/common';
import { ProductRequestsController } from './product-requests.controller';
import { ProductRequestsService } from './product-requests.service';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [PrismaModule, CatalogModule],
  controllers: [ProductRequestsController],
  providers: [ProductRequestsService],
  exports: [ProductRequestsService],
})
export class ProductRequestsModule {}
