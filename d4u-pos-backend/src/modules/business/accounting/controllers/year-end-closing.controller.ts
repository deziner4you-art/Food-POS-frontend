import { Controller, Post, Body, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { YearEndClosingService } from '../services/year-end-closing.service';

@RequirePermissions('finance.accounting.manage')
@Controller('accounting/year-end')
export class YearEndClosingController {
  constructor(private readonly yearEndService: YearEndClosingService) {}

  @Post('execute')
  async executeYearEndClosing(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.yearEndService.executeYearEndClosing(body, userId);
  }
}
