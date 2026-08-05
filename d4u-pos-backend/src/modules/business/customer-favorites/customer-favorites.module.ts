import { Module } from '@nestjs/common';
import { CustomerFavoritesService } from './customer-favorites.service';
import { PrismaModule } from '../../../database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CustomerFavoritesService],
  exports: [CustomerFavoritesService],
})
export class CustomerFavoritesModule {}
