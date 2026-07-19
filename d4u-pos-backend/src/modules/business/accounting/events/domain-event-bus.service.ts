import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
    this.logger.log(`Publishing Event: ${event.event_name} [${event.event_id}]`);
    try {
      this.emitter.emit(event.event_name, event);
    } catch (e) {
      this.logger.error(`Error dispatching event ${event.event_name}: ${e instanceof Error ? e.message : e}`);
    }
  }

  subscribe(eventName: string, handler: (event: DomainEvent) => void | Promise<void>) {
    this.emitter.on(eventName, async (event: DomainEvent) => {
      try {
        await handler(event);
      } catch (e) {
        this.logger.error(`Error in listener for ${eventName}: ${e instanceof Error ? e.message : e}`);
      }
    });
  }
}
