import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { RequirePermissions, CurrentUser } from '../../../common/decorators';
import { assertOwnStore } from '../../../common/utils/tenant.util';
import { TablesService } from './tables.service';
import { ReleaseTableDto } from './dto';

@Controller('tables')
export class TablesController {
  constructor(private readonly service: TablesService) {}

  // GET /tables?store_id=1
  // Task #2R-G1a: migrated off validateTenantAccess (a no-op for real
  // sessions -- see tenant.util.ts) onto strict active-store authorization.
  @RequirePermissions('pos.tables.manage')
  @Get()
  list(@CurrentUser() user: any, @Query('store_id') store_id: string) {
    assertOwnStore(user, Number(store_id));
    return this.service.listTables(Number(store_id));
  }

  // PATCH /tables/:id/release — manual release (Manager permission)
  // Task #2R-G1a: assertOwnStore protects body.store_id itself; the table
  // id/store pairing is still independently verified by
  // TablesService.releaseTable's own findFirst({ id, store_id }) lookup,
  // unchanged here.
  @RequirePermissions('pos.tables.manage')
  @Patch(':id/release')
  release(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: ReleaseTableDto,
  ) {
    assertOwnStore(user, body.store_id);
    return this.service.releaseTable(body.store_id, Number(id));
  }
}
