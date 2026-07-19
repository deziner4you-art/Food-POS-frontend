const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Interfaces
  'events/domain-event.interface.ts': `export interface DomainEvent<T = any> {
  event_id: string;
  event_name: string;
  occurred_at: Date;
  store_id: number;
  tenant_id: number;
  user_id: number;
  entity_type: string;
  entity_id: string;
  correlation_id: string;
  payload: T;
}
`,

  // Registry
  'events/event-registry.ts': `export const EVENT_REGISTRY = {
  VOUCHER_APPROVED: 'VOUCHER_APPROVED',
  JOURNAL_ENTRY_POSTED: 'JOURNAL_ENTRY_POSTED',
  POSTING_COMPLETED: 'POSTING_COMPLETED',
  POSTING_FAILED: 'POSTING_FAILED',
};
`,

  // Bus
  'events/domain-event-bus.service.ts': `import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { DomainEvent } from './domain-event.interface';

@Injectable()
export class DomainEventBusService implements OnModuleInit {
  private readonly logger = new Logger(DomainEventBusService.name);
  private emitter: EventEmitter;

  onModuleInit() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
  }

  publish(event: DomainEvent) {
    this.logger.log(\`Publishing Event: \${event.event_name} [\${event.event_id}]\`);
    try {
      this.emitter.emit(event.event_name, event);
    } catch (e) {
      this.logger.error(\`Error dispatching event \${event.event_name}: \${e instanceof Error ? e.message : e}\`);
    }
  }

  subscribe(eventName: string, handler: (event: DomainEvent) => void | Promise<void>) {
    this.emitter.on(eventName, async (event: DomainEvent) => {
      try {
        await handler(event);
      } catch (e) {
        this.logger.error(\`Error in listener for \${eventName}: \${e instanceof Error ? e.message : e}\`);
      }
    });
  }
}
`,

  // Specific Events
  'events/voucher-approved.event.ts': `import { DomainEvent } from './domain-event.interface';
import { EVENT_REGISTRY } from './event-registry';
import { randomUUID } from 'crypto';

export class VoucherApprovedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = EVENT_REGISTRY.VOUCHER_APPROVED;
  occurred_at = new Date();

  constructor(
    public store_id: number,
    public tenant_id: number,
    public user_id: number,
    public entity_id: string,
    public correlation_id: string,
    public payload: any,
  ) {}
  entity_type = 'VOUCHER';
}
`,
  'events/journal-entry-posted.event.ts': `import { DomainEvent } from './domain-event.interface';
import { EVENT_REGISTRY } from './event-registry';
import { randomUUID } from 'crypto';

export class JournalEntryPostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = EVENT_REGISTRY.JOURNAL_ENTRY_POSTED;
  occurred_at = new Date();

  constructor(
    public store_id: number,
    public tenant_id: number,
    public user_id: number,
    public entity_id: string,
    public correlation_id: string,
    public payload: any,
  ) {}
  entity_type = 'JOURNAL_ENTRY';
}
`,
  'events/posting-completed.event.ts': `import { DomainEvent } from './domain-event.interface';
import { EVENT_REGISTRY } from './event-registry';
import { randomUUID } from 'crypto';

export class PostingCompletedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = EVENT_REGISTRY.POSTING_COMPLETED;
  occurred_at = new Date();

  constructor(
    public store_id: number,
    public tenant_id: number,
    public user_id: number,
    public entity_id: string,
    public correlation_id: string,
    public payload: any,
  ) {}
  entity_type = 'GENERAL_LEDGER';
}
`,
  'events/posting-failed.event.ts': `import { DomainEvent } from './domain-event.interface';
import { EVENT_REGISTRY } from './event-registry';
import { randomUUID } from 'crypto';

export class PostingFailedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = EVENT_REGISTRY.POSTING_FAILED;
  occurred_at = new Date();

  constructor(
    public store_id: number,
    public tenant_id: number,
    public user_id: number,
    public entity_id: string,
    public correlation_id: string,
    public payload: { reason: string },
  ) {}
  entity_type = 'GENERAL_LEDGER';
}
`,

  // Listeners
  'listeners/journal-posting.listener.ts': `import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
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
    this.logger.log(\`Received \${event.event_name} for JE \${event.entity_id}\`);
    try {
      const jeId = parseInt(event.entity_id, 10);
      // We pass 0 as user_id to postManualEntry for now since it's internal
      await this.postingEngine.postManualEntry(event.store_id, jeId);
    } catch (e) {
      this.logger.error(\`Failed to handle \${event.event_name}: \${e instanceof Error ? e.message : e}\`);
    }
  }
}
`,

  'listeners/voucher.listener.ts': `import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
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
    this.logger.log(\`Received \${event.event_name} for Voucher \${event.entity_id}\`);
    // Business Rule: prepares Journal Entry workflow only
    // DO NOT generate accounting entries yet
    this.logger.log(\`[Idempotent Workflow] Preparing JE workflow for Voucher \${event.entity_id}...\`);
  }
}
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
