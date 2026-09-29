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
import { RequireModule, RequirePermissions, CurrentUser } from '../../../common/decorators';
import { assertTenantStoreAccess } from '../../../common/utils/tenant.util';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { VendorService } from './vendor.service';

// ============================================================
// VENDOR CONTROLLER
// ============================================================

@Controller('vendor')
@RequireModule('VENDORS')
export class VendorController {
  constructor(
    private readonly vendorService: VendorService,
    private readonly prisma: PrismaService,
  ) {}

  private async authorizeVendor(user: any, id: number) {
    const vendor = await this.vendorService.getVendorById(id);
    await assertTenantStoreAccess(this.prisma, user, vendor.store_id);
    return vendor;
  }

  private async authorizePurchaseOrder(user: any, id: number) {
    const po = await this.vendorService.getPurchaseOrderById(id);
    await assertTenantStoreAccess(this.prisma, user, po.store_id);
    return po;
  }

  private async authorizeGrn(user: any, id: number) {
    const grn = await this.vendorService.getGRNById(id);
    await assertTenantStoreAccess(this.prisma, user, grn.purchaseOrder?.store_id ?? grn.store_id);
    return grn;
  }

  // ─── Vendor CRUD ────────────────────────────────────────────

  @RequirePermissions('purchasing.view')
  @Get()
  getVendors(@CurrentUser() user: any, @Query('store_id') store_id: string) {
    return assertTenantStoreAccess(this.prisma, user, Number(store_id)).then(() =>
      this.vendorService.getVendors(Number(store_id)),
    );
  }

  @RequirePermissions('purchasing.view')
  @Get('dashboard')
  getDashboard(@CurrentUser() user: any, @Query('store_id') store_id: string) {
    return assertTenantStoreAccess(this.prisma, user, Number(store_id)).then(() =>
      this.vendorService.getDashboardStats(Number(store_id)),
    );
  }

  @RequirePermissions('purchasing.view')
  @Get(':id')
  getVendorById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.authorizeVendor(user, Number(id));
  }

  @RequirePermissions('purchasing.create')
  @Post()
  createVendor(@CurrentUser() user: any, @Body() body: any) {
    return assertTenantStoreAccess(this.prisma, user, body.store_id).then(() =>
      this.vendorService.createVendor(body),
    );
  }

  @RequirePermissions('purchasing.update')
  @Patch(':id')
  async updateVendor(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    await this.authorizeVendor(user, Number(id));
    // store_id is immutable from this endpoint. Ownership is established from
    // the server-loaded vendor row above, never from a client-supplied body.
    const { store_id: _ignoredStoreId, ...updates } = body ?? {};
    return this.vendorService.updateVendor(Number(id), updates);
  }

  @RequirePermissions('purchasing.delete')
  @Delete(':id')
  async deleteVendor(@CurrentUser() user: any, @Param('id') id: string) {
    await this.authorizeVendor(user, Number(id));
    return this.vendorService.deleteVendor(Number(id));
  }

  @RequirePermissions('purchasing.view')
  @Get(':id/ledger')
  getVendorLedger(@CurrentUser() user: any, @Param('id') id: string) {
    return this.authorizeVendor(user, Number(id)).then(() => this.vendorService.getVendorLedger(Number(id)));
  }

  // ─── Purchase Orders ────────────────────────────────────────

  @RequirePermissions('purchasing.view')
  @Get('purchase-orders/list')
  getPurchaseOrders(
    @CurrentUser() user: any,
    @Query('store_id') store_id: string,
    @Query('status') status?: string,
    @Query('vendor_id') vendor_id?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return assertTenantStoreAccess(this.prisma, user, Number(store_id)).then(() =>
      this.vendorService.getPurchaseOrders(Number(store_id), { status, vendor_id: vendor_id ? Number(vendor_id) : undefined, from, to }),
    );
  }

  @RequirePermissions('purchasing.view')
  @Get('purchase-orders/:id')
  getPurchaseOrderById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.authorizePurchaseOrder(user, Number(id));
  }

  @RequirePermissions('purchasing.create')
  @Post('purchase-orders')
  createPO(@CurrentUser() user: any, @Body() body: any) {
    return assertTenantStoreAccess(this.prisma, user, body.store_id).then(() => this.vendorService.createPO(body));
  }

  @RequirePermissions('purchasing.update')
  @Patch('purchase-orders/:id')
  async updatePO(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    await this.authorizePurchaseOrder(user, Number(id));
    return this.vendorService.updatePO(Number(id), body);
  }

  @RequirePermissions('purchasing.update')
  @Patch('purchase-orders/:id/submit')
  async submitPO(@CurrentUser() user: any, @Param('id') id: string) {
    await this.authorizePurchaseOrder(user, Number(id));
    return this.vendorService.submitPO(Number(id));
  }

  @RequirePermissions('purchasing.approve')
  @Patch('purchase-orders/:id/approve')
  async approvePO(@CurrentUser() user: any, @Param('id') id: string, @Body('approved_by') approved_by: number) {
    await this.authorizePurchaseOrder(user, Number(id));
    return this.vendorService.approvePO(Number(id), approved_by);
  }

  @RequirePermissions('purchasing.update')
  @Patch('purchase-orders/:id/cancel')
  async cancelPO(@CurrentUser() user: any, @Param('id') id: string, @Body('reason') reason?: string) {
    await this.authorizePurchaseOrder(user, Number(id));
    return this.vendorService.cancelPO(Number(id), reason);
  }

  // ─── Goods Receiving Notes (GRN) ────────────────────────────

  @RequirePermissions('purchasing.view')
  @Get('grn/list')
  getGRNs(
    @CurrentUser() user: any,
    @Query('store_id') store_id: string,
    @Query('po_id') po_id?: string,
  ) {
    return assertTenantStoreAccess(this.prisma, user, Number(store_id)).then(() =>
      this.vendorService.getGRNs(Number(store_id), po_id ? Number(po_id) : undefined),
    );
  }

  @RequirePermissions('purchasing.view')
  @Get('grn/:id')
  getGRNById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.authorizeGrn(user, Number(id));
  }

  @RequirePermissions('purchasing.create')
  @Post('grn')
  createGRN(@CurrentUser() user: any, @Body() body: any) {
    return assertTenantStoreAccess(this.prisma, user, body.store_id).then(() => this.vendorService.createGRN(body));
  }
}
