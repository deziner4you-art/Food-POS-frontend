import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { RequirePermissions, Public, CurrentUser } from '../../../common/decorators';
import { OnlineOrdersService } from './online-orders.service';
import { CustomerAddressesService } from '../customer-addresses/customer-addresses.service';
import { CustomerFavoritesService } from '../customer-favorites/customer-favorites.service';
import {
  CreateOnlineOrderDto,
  UpdateOnlineOrderStatusDto,
  PostFeedbackDto,
} from './dto';
import { CreateCustomerAddressDto, UpdateCustomerAddressDto } from '../customer-addresses/dto';
import { ToggleFavoriteDto } from '../customer-favorites/dto';
import { normalizePhone } from '../../../common/utils/phone.util';

@Controller('online-orders')
export class OnlineOrdersController {
  constructor(
    private readonly service: OnlineOrdersService,
    private readonly addresses: CustomerAddressesService,
    private readonly favorites: CustomerFavoritesService,
  ) {}

  // activeOnly=true additionally returns orders past PENDING (accepted,
  // in kitchen, out for delivery, etc.) up to but excluding SETTLED —
  // opt-in, default omitted (false) preserves the exact prior response
  // for any caller not passing it. See getAllOnlineOrders.
  // Task #2R-B1: 'sales.view' kept alongside the real 'pos.orders.read' grant
  // (additive OR, same pattern as #2Q-B2) -- a straight swap would drop
  // bridge-based access for Business Admin/Business Owner/Branch Owner, none
  // of which hold pos.orders.read as a real grant (Cashier/Manager/Branch
  // Manager/Waiter already do, so they're unaffected either way).
  @RequirePermissions('sales.view', 'pos.orders.read')
  @Get()
  getOrders(
    @Query('phone') phone?: string,
    @Query('store_id') store_id?: string,
    @Query('activeOnly') activeOnly?: string,
    @CurrentUser() authenticatedUser?: any,
  ) {
    if (phone) {
      return this.service.getOrdersByPhone(phone, authenticatedUser);
    }
    return this.service.getAllOnlineOrders(
      store_id ? Number(store_id) : undefined,
      activeOnly === 'true',
    );
  }

  @RequirePermissions('sales.view', 'pos.orders.read')
  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.service.getOrder(Number(id));
  }

  @Public()
  @Get('track/:query')
  trackOrder(@Param('query') query: string) {
    return this.service.trackOrder(query);
  }

  @Public()
  @Post('auth/login')
  async webLogin(@Body() body: { phone: string }) {
    // Basic phone login without password (for prototype)
    const customer = await this.service['prisma'].customer.findUnique({
      where: { phone: normalizePhone(body.phone) },
      include: { addresses: { orderBy: [{ is_default: 'desc' }, { id: 'asc' }] } },
    });
    if (!customer) {
      return { success: false, message: 'Customer not found' };
    }
    return { success: true, customer };
  }

  @Public()
  @Post('auth/register')
  async webRegister(@Body() body: { phone: string; name: string; brand_id?: number; store_id?: number }) {
    const normalizedPhone = normalizePhone(body.phone);
    let customer: any = await this.service['prisma'].customer.findUnique({
      where: { phone: normalizedPhone },
      include: { addresses: { orderBy: [{ is_default: 'desc' }, { id: 'asc' }] } },
    });
    if (!customer) {
      // Sprint 28.9: no website surface sends brand/store context to this
      // endpoint today, so it can't reliably scope new customers — hardcoded
      // brand_id: 1 is a known gap here (see multi-tenant audit report),
      // preserved as-is rather than half-fixed without a frontend change to
      // actually supply real context. Accepts either field if a future
      // caller does provide it, resolving store_id -> its brand.
      let brandId = body.brand_id;
      if (!brandId && body.store_id) {
        const store = await this.service['prisma'].store.findUnique({ where: { id: body.store_id }, select: { brand_id: true } });
        brandId = store?.brand_id;
      }
      customer = await this.service['prisma'].customer.create({
        data: {
          brand_id: brandId ?? 1,
          phone: normalizedPhone,
          name: body.name,
        },
      });
      customer.addresses = [];
    }
    return { success: true, customer };
  }

  @Public()
  @Get('auth/history/:phone')
  async webHistory(@Param('phone') phone: string) {
    const normalizedPhone = normalizePhone(phone);
    const customer = await this.service['prisma'].customer.findUnique({
      where: { phone: normalizedPhone },
      include: {
        orders: {
          include: { items: { include: { product: true } } },
          orderBy: { id: 'desc' },
          take: 50,
        },
        addresses: { orderBy: [{ is_default: 'desc' }, { id: 'asc' }] },
        // Points earn/redeem ledger -- same phone-verified trust boundary as
        // everything else this endpoint already returns, so the website's
        // own Loyalty tab can show it without needing staff-only
        // GET /customers/:id/wallet (which requires crm.customers.read).
        loyaltyTransactions: { orderBy: { id: 'desc' }, take: 20 },
      },
    });
    if (!customer) {
      return { success: false, message: 'Not found' };
    }
    const onlineOrders = await this.service['prisma'].onlineOrder.findMany({
      where: { customerPhone: normalizedPhone },
      orderBy: { id: 'desc' },
      take: 50,
    });
    return { success: true, ...customer, onlineOrders };
  }

  // Saved delivery addresses — public, same prototype-grade trust model as
  // auth/login above (client holds customer_id from login, sends it on
  // every call). CustomerAddressesService.update/remove verify the address
  // row's own customer_id matches before mutating, which is what actually
  // stops one customer's client from touching another's address.
  @Public()
  @Get('addresses/:customerId')
  listAddresses(@Param('customerId') customerId: string) {
    return this.addresses.listForCustomer(Number(customerId));
  }

  @Public()
  @Post('addresses')
  createAddress(@Body() body: CreateCustomerAddressDto) {
    return this.addresses.create(body);
  }

  @Public()
  @Patch('addresses/:id')
  updateAddress(@Param('id') id: string, @Body() body: UpdateCustomerAddressDto) {
    return this.addresses.update(Number(id), body);
  }

  @Public()
  @Delete('addresses/:id')
  deleteAddress(@Param('id') id: string, @Query('customer_id') customer_id: string) {
    return this.addresses.remove(Number(id), Number(customer_id));
  }

  // Wishlist -- public, same trust model as everything else here.
  @Public()
  @Get('favorites/:customerId')
  listFavorites(@Param('customerId') customerId: string) {
    return this.favorites.listForCustomer(Number(customerId));
  }

  @Public()
  @Post('favorites/toggle')
  toggleFavorite(@Body() body: ToggleFavoriteDto) {
    return this.favorites.toggle(body.customer_id, body.product_id);
  }

  @Public()
  @Post()
  createOrder(@Body() body: CreateOnlineOrderDto) {
    return this.service.createOrder(body);
  }

  // Task #2Q-B2: delivery.dispatch.update_status added as an additional
  // accepted permission (OR semantics -- PermissionsGuard passes if the
  // caller holds ANY listed permission) so a Rider progressing their own
  // claimed delivery (RIDER_ARRIVED/OUT_FOR_DELIVERY/DELIVERED/etc., see
  // d4u-rider's updateBridgeStatus) can reach this route without touching
  // staff's existing sales.update-based access at all. Per-order rider
  // ownership enforcement (claimedByRiderId match) is Task #2Q-B3, lives in
  // OnlineOrdersService.updateOrderStatus -- untouched by #2R-B2.
  //
  // Task #2R-B2: pos.orders.update added alongside sales.update (still
  // additive OR, not a swap). #2R-A found sales.update is only reachable via
  // the posPermissions bridge; pos.orders.update is a real grant already
  // held by Cashier/Manager/Branch Manager. sales.update is kept, not
  // removed, because Business Admin/Business Owner/Branch Owner reach this
  // route via the bridge today and hold no real pos.orders.update grant -- a
  // straight swap would have silently dropped their access.
  @RequirePermissions('sales.update', 'pos.orders.update', 'delivery.dispatch.update_status')
  @Patch(':id')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() body: UpdateOnlineOrderStatusDto,
    @CurrentUser() user?: any,
  ) {
    return this.service.updateOrderStatus(Number(id), body, user);
  }

  // Task #2Q-E1: matches its 11 sibling customer-self-service routes in
  // this controller (trackOrder, webLogin, webRegister, webHistory,
  // addresses/*, favorites/*, createOrder) -- see #2Q-E's audit for why
  // staff-only sales.create was almost certainly an unintentional omission
  // from that pattern (the original frontend caller never attached an auth
  // token, and the project's own migration handover doc describes this as
  // a customer-facing "working post-delivery star-rating + comment flow").
  @Public()
  @Post(':id/feedback')
  postFeedback(@Param('id') id: string, @Body() body: PostFeedbackDto) {
    return this.service.postFeedback(
      Number(id),
      body.rating as any,
      body.comment as any,
    );
  }
}
