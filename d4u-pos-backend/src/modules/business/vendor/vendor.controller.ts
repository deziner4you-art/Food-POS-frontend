import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { VendorService } from './vendor.service';

// ============================================================
// VENDOR CONTROLLER
// ============================================================

@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  // ─── Vendor CRUD ────────────────────────────────────────────

  @RequirePermissions('purchasing.view')
  @Get()
  getVendors(@Query('store_id') store_id: string) {
    return this.vendorService.getVendors(Number(store_id));
  }

  @RequirePermissions('purchasing.view')
  @Get('dashboard')
  getDashboard(@Query('store_id') store_id: string) {
    return this.vendorService.getDashboardStats(Number(store_id));
  }

  @RequirePermissions('purchasing.view')
  @Get(':id')
  getVendorById(@Param('id') id: string) {
    return this.vendorService.getVendorById(Number(id));
  }

  @RequirePermissions('purchasing.create')
  @Post()
  createVendor(@Body() body: any) {
    return this.vendorService.createVendor(body);
  }

  @RequirePermissions('purchasing.update')
  @Patch(':id')
  updateVendor(@Param('id') id: string, @Body() body: any) {
    return this.vendorService.updateVendor(Number(id), body);
  }

  @RequirePermissions('purchasing.delete')
  @Delete(':id')
  deleteVendor(@Param('id') id: string) {
    return this.vendorService.deleteVendor(Number(id));
  }

  @RequirePermissions('purchasing.view')
  @Get(':id/ledger')
  getVendorLedger(@Param('id') id: string) {
    return this.vendorService.getVendorLedger(Number(id));
  }

  // ─── Purchase Orders ────────────────────────────────────────

  @RequirePermissions('purchasing.view')
  @Get('purchase-orders/list')
  getPurchaseOrders(
    @Query('store_id') store_id: string,
    @Query('status') status?: string,
    @Query('vendor_id') vendor_id?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.vendorService.getPurchaseOrders(Number(store_id), { status, vendor_id: vendor_id ? Number(vendor_id) : undefined, from, to });
  }

  @RequirePermissions('purchasing.view')
  @Get('purchase-orders/:id')
  getPurchaseOrderById(@Param('id') id: string) {
    return this.vendorService.getPurchaseOrderById(Number(id));
  }

  @RequirePermissions('purchasing.create')
  @Post('purchase-orders')
  createPO(@Body() body: any) {
    return this.vendorService.createPO(body);
  }

  @RequirePermissions('purchasing.update')
  @Patch('purchase-orders/:id')
  updatePO(@Param('id') id: string, @Body() body: any) {
    return this.vendorService.updatePO(Number(id), body);
  }

  @RequirePermissions('purchasing.update')
  @Patch('purchase-orders/:id/submit')
  submitPO(@Param('id') id: string) {
    return this.vendorService.submitPO(Number(id));
  }

  @RequirePermissions('purchasing.approve')
  @Patch('purchase-orders/:id/approve')
  approvePO(@Param('id') id: string, @Body('approved_by') approved_by: number) {
    return this.vendorService.approvePO(Number(id), approved_by);
  }

  @RequirePermissions('purchasing.update')
  @Patch('purchase-orders/:id/cancel')
  cancelPO(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.vendorService.cancelPO(Number(id), reason);
  }

  // ─── Goods Receiving Notes (GRN) ────────────────────────────

  @RequirePermissions('purchasing.view')
  @Get('grn/list')
  getGRNs(
    @Query('store_id') store_id: string,
    @Query('po_id') po_id?: string,
  ) {
    return this.vendorService.getGRNs(Number(store_id), po_id ? Number(po_id) : undefined);
  }

  @RequirePermissions('purchasing.view')
  @Get('grn/:id')
  getGRNById(@Param('id') id: string) {
    return this.vendorService.getGRNById(Number(id));
  }

  @RequirePermissions('purchasing.create')
  @Post('grn')
  createGRN(@Body() body: any) {
    return this.vendorService.createGRN(body);
  }
}
