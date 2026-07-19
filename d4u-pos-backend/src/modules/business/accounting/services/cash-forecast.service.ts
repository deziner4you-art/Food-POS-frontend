import { Injectable } from '@nestjs/common';
import { TreasuryRepository } from '../repositories/treasury.repository';
import { GenerateForecastInput } from '../interfaces/cash-forecast.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CashForecastGeneratedEvent } from '../events/cash-forecast-generated.event';

@Injectable()
export class CashForecastService {
  constructor(
    private readonly repository: TreasuryRepository,
    private readonly eventBus: DomainEventBusService
  ) {}

  async generateForecast(input: GenerateForecastInput, userId: number) {
    // In a real system, we'd sum all open CustomerReceivables for inflows
    // and VendorPayables for outflows due within the forecast period.
    const expectedInflows = 50000; // Mock data
    const expectedOutflows = 30000; // Mock data
    const netForecast = expectedInflows - expectedOutflows;

    const forecast = await this.repository.createCashForecast({
      store_id: input.store_id,
      forecast_date: new Date(input.forecast_date),
      expected_inflows: expectedInflows,
      expected_outflows: expectedOutflows,
      net_forecast: netForecast
    });

    this.eventBus.publish(new CashForecastGeneratedEvent(
      input.store_id, 0, userId, forecast.id.toString(), 'forecast_generated', { net_forecast: netForecast }
    ));

    return forecast;
  }
}
