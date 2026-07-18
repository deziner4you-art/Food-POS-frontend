import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { VendorService } from './vendor.service';

@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get()
  getVendors(@Query('store_id') store_id: string) {
    return this.vendorService.getVendors(Number(store_id));
  }

  @Post('po')
  createPO(@Body() body: any) {
    return this.vendorService.createPO(body);
  }

  @Patch('po/:id/receive')
  receivePO(@Param('id') id: string, @Body() body: any) {
    return this.vendorService.receivePO(Number(id), body);
  }
}
