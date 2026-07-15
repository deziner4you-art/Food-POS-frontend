import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SaasPackageService } from './saas-package.service';

@Controller('saas-package')
export class SaasPackageController {
  constructor(private readonly saasPackageService: SaasPackageService) {}

  @Post()
  create(@Body() body: any) {
    return this.saasPackageService.createPackage(body);
  }

  @Get()
  findAll() {
    return this.saasPackageService.getAllPackages();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.saasPackageService.getPackage(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.saasPackageService.updatePackage(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.saasPackageService.deletePackage(+id);
  }
}
