import { Injectable } from '@nestjs/common';
import { ComplianceRepository } from '../repositories/compliance.repository';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { AuditReadinessCompletedEvent } from '../events/audit-readiness-completed.event';

@Injectable()
export class AuditReadinessService {
  constructor(
    private readonly repository: ComplianceRepository,
    private readonly eventBus: DomainEventBusService
  ) {}

  async runAudit(storeId: number, userId: number) {
    await this.repository.clearFindings(storeId);

    const unbalanced = await this.repository.checkUnbalancedJournals(storeId);
    
    let isReady = true;

    if (unbalanced.length > 0) {
      for (const jeId of unbalanced) {
        await this.repository.createFinding({
          store_id: storeId,
          finding_type: 'UNBALANCED_JOURNAL',
          severity: 'HIGH',
          description: `Journal Entry ${jeId} is unbalanced.`,
          reference_id: jeId.toString(),
          resolved: false
        });
      }
      isReady = false;
    }

    this.eventBus.publish(new AuditReadinessCompletedEvent(
      storeId, 0, userId, 'ALL', 'audit_completed', { is_ready: isReady, findings: unbalanced.length }
    ));

    return { isReady, findingsCount: unbalanced.length };
  }
}
