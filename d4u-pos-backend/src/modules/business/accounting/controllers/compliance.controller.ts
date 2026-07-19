import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { ComplianceService } from '../services/compliance.service';
import { SystemCertificationService } from '../services/system-certification.service';

@Controller('system')
export class ComplianceController {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly certificationService: SystemCertificationService
  ) {}

  @RequirePermissions('finance.accounting.create')
  @Post('compliance/run')
  async runCompliance(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.complianceService.runChecks({ store_id: req.user?.store_id || 1 }, userId);
  }

  @RequirePermissions('finance.accounting.create')
  @Post('certification/run')
  async runCertification(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.certificationService.runCertification(req.user?.store_id || 1, userId);
  }

  @RequirePermissions('finance.accounting.view')
  @Get('compliance')
  async getComplianceChecks(@Req() req: any) {
    return this.complianceService.getChecks(req.user?.store_id || 1);
  }

  @RequirePermissions('finance.accounting.view')
  @Get('certification')
  async getCertification(@Req() req: any) {
    return this.certificationService.getStatus(req.user?.store_id || 1);
  }

  @RequirePermissions('finance.accounting.view')
  @Get('golive-status')
  async getGoLiveStatus(@Req() req: any) {
    return this.certificationService.getStatus(req.user?.store_id || 1);
  }
}
