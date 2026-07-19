import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { VendorService } from './vendor.service';
import { CreatePODto, ReceivePODto } from './dto';

@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @RequirePermissions('purchasing.view')
  @Get()
  getVendors(@Query('store_id') store_id: string) {
    return this.vendorService.getVendors(Number(store_id));
  }

  @RequirePermissions('purchasing.create')
  @Post('po')
  createPO(@Body() body: CreatePODto) {
    return this.vendorService.createPO(body);
  }

  @RequirePermissions('purchasing.update')
  @Patch('po/:id/receive')
  receivePO(@Param('id') id: string, @Body() body: ReceivePODto) {
    return this.vendorService.receivePO(Number(id), body);
  }
}
