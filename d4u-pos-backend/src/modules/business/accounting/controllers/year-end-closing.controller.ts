import { Controller, Post, Body, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { YearEndClosingService } from '../services/year-end-closing.service';
import { getSessionUserId } from '../../../../common/utils/session-context.util';

@Controller('accounting/year-end')
export class YearEndClosingController {
  constructor(private readonly yearEndService: YearEndClosingService) {}

  @RequirePermissions('finance.accounting.create')
  @Post('execute')
  async executeYearEndClosing(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.yearEndService.executeYearEndClosing(body, userId);
  }
}
