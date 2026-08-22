import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { ComplianceService } from '../services/compliance.service';
import { SystemCertificationService } from '../services/system-certification.service';
import { getSessionStoreId, getSessionUserId } from '../../../../common/utils/session-context.util';

@Controller('system')
export class ComplianceController {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly certificationService: SystemCertificationService
  ) {}

  @RequirePermissions('finance.compliance.create')
  @Post('compliance/run')
  async runCompliance(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.complianceService.runChecks({ store_id: getSessionStoreId(req.user) }, userId);
  }

  @RequirePermissions('finance.compliance.create')
  @Post('certification/run')
  async runCertification(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.certificationService.runCertification(getSessionStoreId(req.user), userId);
  }

  @RequirePermissions('finance.compliance.read')
  @Get('compliance')
  async getComplianceChecks(@Req() req: any) {
    return this.complianceService.getChecks(getSessionStoreId(req.user));
  }

  @RequirePermissions('finance.compliance.read')
  @Get('certification')
  async getCertification(@Req() req: any) {
    return this.certificationService.getStatus(getSessionStoreId(req.user));
  }

  @RequirePermissions('finance.compliance.read')
  @Get('golive-status')
  async getGoLiveStatus(@Req() req: any) {
    return this.certificationService.getStatus(getSessionStoreId(req.user));
  }
}
