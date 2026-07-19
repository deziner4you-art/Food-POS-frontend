import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { SaasPackageService } from './saas-package.service';
import { CreateSaasPackageDto, UpdateSaasPackageDto } from './dto';

@Controller('saas-package')
export class SaasPackageController {
  constructor(private readonly saasPackageService: SaasPackageService) {}

  @RequirePermissions('system.create')
  @Post()
  create(@Body() body: CreateSaasPackageDto) {
    return this.saasPackageService.createPackage(body);
  }

  @RequirePermissions('system.view')
  @Get()
  findAll() {
    return this.saasPackageService.getAllPackages();
  }

  @RequirePermissions('system.view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.saasPackageService.getPackage(+id);
  }

  @RequirePermissions('system.update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateSaasPackageDto) {
    return this.saasPackageService.updatePackage(+id, body);
  }

  @RequirePermissions('system.delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.saasPackageService.deletePackage(+id);
  }
}
