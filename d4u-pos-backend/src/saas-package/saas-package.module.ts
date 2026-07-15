import { Module } from '@nestjs/common';
import { SaasPackageController } from './saas-package.controller';
import { SaasPackageService } from './saas-package.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SaasPackageController],
  providers: [SaasPackageService],
})
export class SaasPackageModule {}
