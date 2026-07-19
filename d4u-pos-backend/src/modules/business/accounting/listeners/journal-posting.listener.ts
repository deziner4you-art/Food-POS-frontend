import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { EVENT_REGISTRY } from '../events/event-registry';
import { PostingEngineService } from '../services/posting-engine.service';
import { DomainEvent } from '../events/domain-event.interface';

@Injectable()
export class JournalPostingListener implements OnModuleInit {
  private readonly logger = new Logger(JournalPostingListener.name);

  constructor(
    private readonly eventBus: DomainEventBusService,
    private readonly postingEngine: PostingEngineService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe(EVENT_REGISTRY.JOURNAL_ENTRY_POSTED, this.handleJournalEntryPosted.bind(this));
  }

  async handleJournalEntryPosted(event: DomainEvent) {
    this.logger.log(`Received ${event.event_name} for JE ${event.entity_id}`);
    try {
      const jeId = parseInt(event.entity_id, 10);
      // We pass 0 as user_id to postManualEntry for now since it's internal
      await this.postingEngine.postManualEntry(event.store_id, jeId);
    } catch (e) {
      this.logger.error(`Failed to handle ${event.event_name}: ${e instanceof Error ? e.message : e}`);
    }
  }
}
