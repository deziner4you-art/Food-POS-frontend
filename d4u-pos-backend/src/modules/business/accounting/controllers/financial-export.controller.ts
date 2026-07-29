import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { FinancialExportService } from '../services/financial-export.service';
import { ExportRequest } from '../interfaces/financial-export.interface';
import { getSessionStoreId, getSessionUserId } from '../../../../common/utils/session-context.util';

@Controller('accounting/export')
export class FinancialExportController {
  constructor(private readonly exportService: FinancialExportService) {}

  @RequirePermissions('finance.accounting.create')
  @Post()
  async exportReport(@Body() request: any, @Req() req: any, @Res() res: any) {
    const storeId = req.body.store_id ?? getSessionStoreId(req.user);
    const userId = getSessionUserId(req.user);

    const result = await this.exportService.generateExport(request, storeId, userId);

    res.setHeader('Content-Type', result.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${result.file_name}"`);
    return res.send(result.content);
  }
}
