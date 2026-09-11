import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
} from '@nestjs/common';
import { RequirePermissions, CurrentUser } from '../../../common/decorators';
import { validateTenantAccess, assertOwnStore } from '../../../common/utils/tenant.util';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  SyncOfflineDto,
  RecordPurchaseDto,
} from './dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Task #2R-G1b1: migrated to assertOwnStore -- #2R-G1b confirmed zero
  // frontend caller in either d4u-pos-client or d4u-admin calls this route
  // today, so there is no HQ/brand-wide workflow to conflict with.
  @RequirePermissions('inventory.create')
  @Post('sync-offline')
  async syncOffline(
    @CurrentUser() user: any,
    @Body() body: SyncOfflineDto
  ) {
    assertOwnStore(user, body.store_id);
    return this.inventoryService.syncOfflineTransactions(
      body.store_id,
      body.transactions,
    );
  }

  // Task #2R-G1b1: migrated to assertOwnStore -- zero frontend caller in
  // either app (see syncOffline above).
  @RequirePermissions('inventory.view')
  @Get('red-alerts/:store_id')
  async getNegativeInventory(
    @CurrentUser() user: any,
    @Param('store_id', ParseIntPipe) storeId: number
  ) {
    assertOwnStore(user, storeId);
    return this.inventoryService.getNegativeInventory(storeId);
  }

  // Task #2R-G1b1: migrated to assertOwnStore -- zero frontend caller in
  // either app (see syncOffline above).
  @RequirePermissions('inventory.view')
  @Get('low-stock/:store_id')
  async getLowStockItems(
    @CurrentUser() user: any,
    @Param('store_id', ParseIntPipe) storeId: number
  ) {
    assertOwnStore(user, storeId);
    return this.inventoryService.getLowStockItems(storeId);
  }

  // --- CRUD for Inventory Items ---
  // Task #2R-B1: migrated off the legacy 2-segment 'inventory.*' strings onto
  // the real 'inventory.products.*' catalog permissions (#2R-A confirmed these
  // already exist and are already granted to Inventory Manager/Branch Manager).
  // Straight swap, not additive -- 'inventory.*' was never in the posPermissions
  // bridge, so nobody had access via any path except Super Admin before this;
  // this is a pure widening (Inventory Manager/Branch Manager gain access),
  // never a narrowing.
  // Task #2R-G1b1: STOP -- NOT migrated. #2R-G1b1's pre-flight fresh-traced
  // both frontends and confirmed this exact route is dual-served: d4u-admin's
  // InventoryManager.tsx/RecipeManager.tsx/PurchaseManager.tsx all call
  // `/inventory/items/${selectedBranchId}` (brand-switchable), while
  // d4u-pos-client's StitchKDS.tsx and embedded admin/InventoryManager.tsx
  // call `/inventory/items/${storeId|currentUser.store_id}` (fixed own-store).
  // Migrating this to assertOwnStore would break the d4u-admin HQ workflow
  // for whichever role uses it (per #2R-G1-D, unconfirmed whether that's
  // real live usage or dormant code -- exactly the ambiguity #2R-G1b1 was
  // told not to guess through). Left calling the pre-existing (broken)
  // validateTenantAccess, unchanged, pending a business decision (#2R-G1b2).
  @RequirePermissions('inventory.products.read')
  @Get('items/:store_id')
  async getInventoryItems(
    @CurrentUser() user: any,
    @Param('store_id', ParseIntPipe) storeId: number
  ) {
    validateTenantAccess(user, storeId);
    return this.inventoryService.getInventoryItems(storeId);
  }

  // Task #2R-G1b1: migrated to assertOwnStore -- #2R-G1b1 confirmed zero
  // frontend caller for this singular by-ID route in either app (only the
  // plural /items/:store_id list route is called), so there is no dual-use
  // conflict here despite sharing a permission with getInventoryItems above.
  @RequirePermissions('inventory.products.read')
  @Get('item/:id')
  async getInventoryItem(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number
  ) {
    const item = await this.inventoryService.getInventoryItem(id);
    if (item) assertOwnStore(user, item.store_id);
    return item;
  }

  // Task #2R-G1b1: STOP -- NOT migrated. Same dual-served conflict as
  // getInventoryItems above -- d4u-admin's InventoryManager.tsx POSTs here
  // with `store_id: currentUser?.store_id` from ITS OWN currentUser (a
  // d4u-admin session), which is a different value space than a POS
  // terminal's active_store_id; both InventoryManager.tsx implementations
  // (d4u-admin and d4u-pos-client/admin) call this identical route. Left
  // unchanged pending #2R-G1b2's business decision.
  @RequirePermissions('inventory.products.create')
  @Post('items')
  async createInventoryItem(
    @CurrentUser() user: any,
    @Body() body: CreateInventoryDto
  ) {
    validateTenantAccess(user, body.store_id);
    return this.inventoryService.createInventoryItem(body);
  }

  // Task #2R-G1b1: STOP -- NOT migrated. Same dual-served conflict --
  // both InventoryManager.tsx implementations PATCH `/inventory/items/:id`
  // for inline edits. Left unchanged pending #2R-G1b2's business decision.
  @RequirePermissions('inventory.products.update')
  @Patch('items/:id')
  async updateInventoryItem(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateInventoryDto,
  ) {
    const item = await this.inventoryService.getInventoryItem(id);
    if (item) validateTenantAccess(user, item.store_id);
    return this.inventoryService.updateInventoryItem(id, body);
  }

  // Task #2R-G1b1: STOP -- NOT migrated. Same dual-served conflict --
  // both InventoryManager.tsx implementations DELETE `/inventory/items/:id`.
  // Left unchanged pending #2R-G1b2's business decision. (Currently latent
  // regardless -- inventory.products.delete is granted to no role today.)
  @RequirePermissions('inventory.products.delete')
  @Delete('items/:id')
  async deleteInventoryItem(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number
  ) {
    const item = await this.inventoryService.getInventoryItem(id);
    if (item) validateTenantAccess(user, item.store_id);
    return this.inventoryService.deleteInventoryItem(id);
  }

  // Task #2R-G1b1: the OUTER store_id check is STOP -- NOT migrated to
  // assertOwnStore. Both InventoryManager.tsx implementations POST here
  // (d4u-admin's PurchaseTab and d4u-pos-client/admin/InventoryManager.tsx's
  // Purchase tab), same dual-served conflict as the routes above. However,
  // the CRITICAL inventory_id IDOR (recordPurchase never verified the
  // purchased item actually belongs to the declared store_id at all) is an
  // internal-consistency defect independent of that unresolved boundary
  // question -- fixed at the service layer below regardless of which store
  // scope policy #2R-G1b2 eventually settles on.
  @RequirePermissions('inventory.create')
  @Post('purchase')
  async recordPurchase(
    @CurrentUser() user: any,
    @Body() body: RecordPurchaseDto
  ) {
    validateTenantAccess(user, body.store_id);
    return this.inventoryService.recordPurchase(
      body.store_id,
      body.inventory_id,
      body.quantity,
      body.total_cost,
    );
  }

  @RequirePermissions('inventory.create')
  @Post('import-excel')
  async importExcel() {
    return this.inventoryService.importExcelData();
  }

  @RequirePermissions('inventory.update')
  @Post('adjust')
  async adjustStock(
    @CurrentUser() user: any,
    @Body() body: { inventory_id: number; operation: 'ADD' | 'SUBTRACT'; amount: number; reason: string },
  ) {
    return this.inventoryService.adjustStock({
      ...body,
      changed_by: user?.sub,
    });
  }

  @RequirePermissions('inventory.view')
  @Get('items/:id/history')
  async getItemHistory(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inventoryService.getItemHistory(id);
  }
}
