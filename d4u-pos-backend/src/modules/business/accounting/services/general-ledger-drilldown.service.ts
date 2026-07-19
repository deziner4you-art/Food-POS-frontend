import { Injectable, NotFoundException } from '@nestjs/common';
import { GeneralLedgerReportRepository } from '../repositories/general-ledger-report.repository';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { GeneralLedgerDrillDownViewedEvent } from '../events/general-ledger-drilldown-viewed.event';

@Injectable()
export class GeneralLedgerDrilldownService {
  constructor(
    private readonly repository: GeneralLedgerReportRepository,
    private readonly eventBus: DomainEventBusService
  ) {}

  async getDrilldown(glLineId: number, storeId: number, userId: number) {
    const glLine: any = await this.repository.getTransactionDrilldown(glLineId);
    
    if (!glLine) {
      throw new NotFoundException('General ledger line not found.');
    }

    if (glLine.store_id !== storeId) {
      throw new NotFoundException('General ledger line not found for this store.');
    }

    const je = glLine.journal_entry;
    const response = {
      gl_line: glLine,
      journal_entry: je,
      vouchers: je?.voucher ? [je.voucher] : [],
      source_module: je?.reference_type || 'MANUAL',
      reference_number: je?.reference_number,
    };

    this.eventBus.publish(new GeneralLedgerDrillDownViewedEvent(storeId, 0, userId, glLineId.toString(), 'drilldown', { glLineId, source_module: response.source_module }));

    return response;
  }
}
