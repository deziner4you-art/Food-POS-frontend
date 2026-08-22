import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { RequirePermissions, CurrentUser } from '../../../common/decorators';
import { validateTenantAccess } from '../../../common/utils/tenant.util';
import { TablesService } from './tables.service';
import { ReleaseTableDto } from './dto';

@Controller('tables')
export class TablesController {
  constructor(private readonly service: TablesService) {}

  // GET /tables?store_id=1
  @RequirePermissions('pos.tables.manage')
  @Get()
  list(@CurrentUser() user: any, @Query('store_id') store_id: string) {
    validateTenantAccess(user, Number(store_id));
    return this.service.listTables(Number(store_id));
  }

  // PATCH /tables/:id/release — manual release (Manager permission)
  @RequirePermissions('pos.tables.manage')
  @Patch(':id/release')
  release(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: ReleaseTableDto,
  ) {
    validateTenantAccess(user, body.store_id);
    return this.service.releaseTable(body.store_id, Number(id));
  }
}
