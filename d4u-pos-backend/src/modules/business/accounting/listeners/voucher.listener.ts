import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { EVENT_REGISTRY } from '../events/event-registry';
import { DomainEvent } from '../events/domain-event.interface';

@Injectable()
export class VoucherListener implements OnModuleInit {
  private readonly logger = new Logger(VoucherListener.name);

  constructor(
    private readonly eventBus: DomainEventBusService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe(EVENT_REGISTRY.VOUCHER_APPROVED, this.handleVoucherApproved.bind(this));
  }

  async handleVoucherApproved(event: DomainEvent) {
    this.logger.log(`Received ${event.event_name} for Voucher ${event.entity_id}`);
    // Business Rule: prepares Journal Entry workflow only
    // DO NOT generate accounting entries yet
    this.logger.log(`[Idempotent Workflow] Preparing JE workflow for Voucher ${event.entity_id}...`);
  }
}
