import { Controller, Get, Param } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { CustomerAddressesService } from './customer-addresses.service';

// Staff-facing read access (POS live-lookup already gets addresses inline
// via CustomersService.findByPhone's include, and the CRM order-history
// panel via getCustomerOrders' include — this route exists for any staff
// UI that wants to fetch a customer's addresses on their own, e.g. the
// admin CRM screen). Mounted on the same `customers` path prefix as
// CustomersController — NestJS allows multiple controllers per prefix as
// long as routes don't collide.
@Controller('customers')
export class CustomerAddressesController {
  constructor(private readonly service: CustomerAddressesService) {}

  @RequirePermissions('crm.customers.read')
  @Get(':customerId/addresses')
  listForCustomer(@Param('customerId') customerId: string) {
    return this.service.listForCustomer(Number(customerId));
  }
}
