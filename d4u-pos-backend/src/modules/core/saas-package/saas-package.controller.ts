import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SaasPackageService } from './saas-package.service';
import { CreateSaasPackageDto, UpdateSaasPackageDto } from './dto';

@Controller('saas-package')
export class SaasPackageController {
  constructor(private readonly saasPackageService: SaasPackageService) {}

  @Post()
  create(@Body() body: CreateSaasPackageDto) {
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
  update(@Param('id') id: string, @Body() body: UpdateSaasPackageDto) {
    return this.saasPackageService.updatePackage(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.saasPackageService.deletePackage(+id);
  }
}
