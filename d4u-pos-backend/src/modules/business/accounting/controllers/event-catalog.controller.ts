import { Controller, Get, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { BusinessEvent } from '../enums/business-event.enum';
import { BUSINESS_EVENT_CATALOG } from '../catalog/business-event-catalog';
import { ACCOUNTING_EVENT_MAPPING } from '../catalog/accounting-event-mapping';

@Controller('accounting/event-catalog')
export class EventCatalogController {

  @RequirePermissions('finance.system_accounts.read')
  @Get()
  getCatalog() {
    return {
      events: BUSINESS_EVENT_CATALOG,
      mappings: ACCOUNTING_EVENT_MAPPING,
    };
  }

  @RequirePermissions('finance.system_accounts.read')
  @Get(':event')
  getEventMapping(@Param('event') event: string) {
    if (!Object.values(BusinessEvent).includes(event as BusinessEvent)) {
      throw new BadRequestException(`Unknown event: ${event}`);
    }

    const businessEvent = BUSINESS_EVENT_CATALOG[event as BusinessEvent];
    const accountingMapping = ACCOUNTING_EVENT_MAPPING[event as BusinessEvent];

    if (!businessEvent) {
      throw new NotFoundException(`Business event configuration not found for: ${event}`);
    }

    if (!businessEvent.is_active) {
      throw new BadRequestException(`Event ${event} is currently inactive.`);
    }

    if (!accountingMapping) {
      throw new NotFoundException(`Accounting mapping not found for: ${event}`);
    }

    return {
      event: businessEvent,
      mapping: accountingMapping,
    };
  }
}
