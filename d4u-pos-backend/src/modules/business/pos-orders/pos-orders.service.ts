import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { PricingService } from './pricing.service';
import { TablesService } from '../tables/tables.service';
import { formatPosOrderForRider } from '../../../common/utils/rider-order.util';
import { normalizePhone } from '../../../common/utils/phone.util';

@Injectable()
export class PosOrdersService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
    private inventoryService: InventoryService,
    private customersService: CustomersService,
    private pricing: PricingService,
    private tablesService: TablesService,
  ) {}

  // تمام آرڈرز — آج کی Business Day کے
  async getOrders(store_id: number, business_day_id?: number, terminal_session_id?: number) {
    const where: any = { store_id };
    if (business_day_id) where.business_day_id = business_day_id;
    else {
      // اگر business_day_id نہ دیا تو آج کے open day کے آرڈرز
      const openDay = await this.prisma.businessDay.findFirst({
        where: { store_id, status: 'OPEN' },
        orderBy: { id: 'desc' },
      });
      if (openDay) where.business_day_id = openDay.id;
    }
    // Waiter's "My Orders" tab — only orders created from their own terminal session.
    if (terminal_session_id) where.terminal_session_id = terminal_session_id;

    return this.prisma.order.findMany({
      where,
      include: { items: { include: { product: true } }, customer: true, kot: true },
      orderBy: { id: 'desc' },
    });
  }

  // ایک آرڈر کی تفصیل
  async getOrder(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        customer: true,
        kot: true,
      },
    });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }

  // نیا Walk-in آرڈر بنائیں
  async createOrder(body: {
    store_id: number;
    created_by: number;
    customer_id?: number;
    // How many points the cashier chose to redeem -- calculatePricing still
    // re-caps this against the real balance and the real eligible
    // (non-campaign-discounted subtotal + delivery fee) amount itself, so
    // this can never over-redeem past what's actually usable.
    redeem_points?: number;
    items: {
      product_id: number;
      variant_id?: number;
      quantity: number;
      price: number;
      special_inst?: string;
    }[];
    discount?: number;
    payment_method?: string;
    order_source?: string;
    table_no?: string;
    terminal_session_id?: number;
    is_offline?: boolean;
    delivery_address?: string;
    notes?: string;
    couponCode?: string;
    manager_override_by?: number;
    coupon_blocked?: boolean;
    loyalty_blocked?: boolean;
    rejected_promotions?: { type: string; reason: string }[];
  }) {
    // Active Business Day تلاش کریں
    const openDay = await this.prisma.businessDay.findFirst({
      where: { store_id: body.store_id, status: 'OPEN' },
      orderBy: { id: 'desc' },
    });
    const pricingResult = await this.pricing.calculatePricing({
      store_id: body.store_id,
      items: body.items,
      couponCode: body.couponCode,
      orderType: body.order_source === 'Delivery' ? 'DELIVERY' : 'OTHER',
      customer_id: body.customer_id,
      pointsToRedeem: body.redeem_points,
    });

    const total_amount = pricingResult.total;
    const discount = pricingResult.discount;
    const tax_amount = pricingResult.tax;
    const delivery_fee = pricingResult.deliveryFee;
    const loyalty_discount = pricingResult.loyaltyDiscount;
    const points_redeemed = pricingResult.pointsRedeemed;

    // Order + Items + KOT ایک ہی transaction میں
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          store_id: body.store_id,
          business_day_id: openDay?.id ?? null,
          customer_id: body.customer_id ?? null,
          created_by: body.created_by,
          business_date: new Date(),
          total_amount,
          discount: discount,
          tax_amount,
          delivery_fee,
          loyalty_discount,
          points_redeemed,
          status: 'PENDING',
          order_source: body.order_source ?? 'WALKIN',
          payment_method: body.payment_method ?? 'CASH',
          payment_status: 'PAID',
          table_no: body.table_no ?? null,
          terminal_session_id: body.terminal_session_id ?? null,
          is_offline: body.is_offline ?? false,
          delivery_address: body.delivery_address ?? null,
          // MARKETING-002: Promotion Execution Engine attribution
          promotion_id: pricingResult.promotionId ?? null,
          promotion_type: pricingResult.promotionType ?? null,
          promotion_name: pricingResult.promotionName ?? null,
          promotion_discount: pricingResult.promotionDiscount ?? 0,
          gift_items: pricingResult.giftItems.length > 0 ? pricingResult.giftItems : undefined,
          bogo_items: pricingResult.bogoItems.length > 0 ? pricingResult.bogoItems : undefined,
          bundle_id: pricingResult.bundleId ?? null,
          combo_id: pricingResult.comboId ?? null,
          // MARKETING-003 §9: full promotion-decision audit trail
          applied_rules: pricingResult.appliedRules?.length > 0 ? pricingResult.appliedRules : undefined,
          rejected_promotions: body.rejected_promotions && body.rejected_promotions.length > 0 ? body.rejected_promotions : undefined,
          manager_override_by: body.manager_override_by ?? null,
          coupon_blocked: body.coupon_blocked ?? false,
          loyalty_blocked: body.loyalty_blocked ?? false,
          items: {
            create: body.items.map((i) => ({
              product_id: i.product_id,
              variant_id: i.variant_id ?? null,
              quantity: i.quantity,
              price: i.price,
              special_inst: i.special_inst ?? null,
            })),
          },
        },
        include: { items: { include: { product: true, variant: true } } },
      });

      // Dine-in table assignment — validates the table isn't already occupied
      // by a different active order; rolls back the whole order on conflict.
      if (body.table_no) {
        await this.tablesService.assignTable(
          body.store_id,
          body.table_no,
          order.id,
          tx,
        );
      }

      // KOT خودکار بنائیں
      // product_id/kitchen_station_id are additive fields (KDS Backend
      // Foundation) — older KOT rows simply won't have them, and every
      // existing consumer of `items` only reads name/qty/price/specialInst,
      // so this is purely additive, not a breaking shape change.
      const kotItems = order.items.map((i) => ({
        // Appends the chosen size so the chef sees "Mughlai Pizza (Medium)"
        // on the ticket, not just the base product name.
        name: i.variant ? `${i.product.name} (${i.variant.name})` : i.product.name,
        qty: i.quantity,
        price: i.price,
        specialInst: i.special_inst ?? '',
        product_id: i.product_id,
        kitchen_station_id: i.product.kitchen_station_id ?? null,
      }));

      await tx.kOT.create({
        data: {
          store_id: body.store_id,
          order_id: order.id,
          business_day_id: openDay?.id ?? null,
          items: kotItems,
          status: 'NEW',
        },
      });

      // Loyalty redemption — atomic with order creation: if the customer
      // doesn't actually have enough points (e.g. a race with another
      // redemption), this throws and the whole order rolls back instead of
      // the order succeeding while the points deduction silently fails.
      // Uses pricingResult.pointsRedeemed (the real, capped number computed
      // by calculatePricing), never a raw client-supplied points count —
      // previously this used body.redeem_points directly, so a customer
      // with more points than their eligible subtotal had their ENTIRE
      // balance deducted even though total_amount only ever reflected the
      // properly capped discount.
      if (body.customer_id && points_redeemed > 0) {
        await this.customersService.redeemPoints(
          body.customer_id,
          points_redeemed,
          tx,
          undefined,
          order.id,
        );
      }

      // Customer کا آرڈر count بڑھائیں
      if (body.customer_id) {
        await tx.customer.update({
          where: { id: body.customer_id },
          data: { total_orders: { increment: 1 } },
        });
      }

      return order;
    });

    console.log(
      `[NEW POS ORDER] #${result.id} | Total: Rs.${total_amount} | Store: ${body.store_id}`,
    );

    // Socket event — KDS اسکرین کو بتائیں
    this.gateway.broadcast('new_kot', {
      order_id: result.id,
      store_id: body.store_id,
      items: result.items,
    });

    // Auto-deduct inventory
    this.inventoryService
      .deductForOrder(result.id)
      .catch((err) =>
        console.error(
          `[PosOrders] Failed to deduct inventory for #${result.id}:`,
          err,
        ),
      );

    // Auto-credit Loyalty Points — skipped when this same order also
    // redeemed points. Without this, a customer could redeem points for a
    // discount and simultaneously earn back a similar (sometimes larger)
    // amount from the same order's total, so their balance barely moved (or
    // even went up) instead of dropping by exactly what they redeemed.
    if (body.customer_id && points_redeemed === 0) {
      this.customersService
        .earnPoints(body.customer_id, result.id, total_amount, body.store_id)
        .catch((err) =>
          console.error(
            `[PosOrders] Failed to credit loyalty points for #${result.id}:`,
            err,
          ),
        );
    }

    return { success: true, order: result };
  }

  // آرڈر VOID کریں (مینیجر PIN لازمی)
  async voidOrder(
    id: number,
    body: { void_reason: string; manager_pin: string; approved_by: number },
  ) {
    // مینیجر PIN چیک کریں
    const manager = await this.prisma.user.findUnique({
      where: { id: body.approved_by },
      include: { role: true },
    });

    if (!manager) {
      throw new ForbiddenException('Invalid manager');
    }

    let isMatch = false;
    if (manager.hashedPin.startsWith('$2')) {
      isMatch = await bcrypt.compare(body.manager_pin, manager.hashedPin);
    } else {
      isMatch = (manager.hashedPin === body.manager_pin);
    }

    if (!isMatch) {
      throw new ForbiddenException('Invalid manager PIN');
    }

    const { count } = await this.prisma.order.updateMany({
      where: { id, status: { not: 'VOIDED' } },
      data: {
        status: 'VOIDED',
        void_reason: body.void_reason,
        void_approved_by: body.approved_by,
      },
    });

    const order = await this.prisma.order.findUnique({ where: { id } });
    if (count === 0) {
      return { success: true, order };
    }

    // KOT بھی CANCELLED کریں
    await this.prisma.kOT.updateMany({
      where: { order_id: id },
      data: { status: 'CANCELLED' },
    });

    // Free the dine-in table (if any) this order was holding.
    await this.tablesService.releaseTableByOrderId(id);

    console.log(
      `[VOID] Order #${id} — Reason: ${body.void_reason} — By Manager: ${manager.name}`,
    );
    this.gateway.broadcast('order_voided', { order_id: id });

    return { success: true, order };
  }

  // آرڈر SETTLE کریں (پیمنٹ وصول)
  async settleOrder(
    id: number,
    body: { payment_method: string; amount_received?: number },
  ) {
    const { count } = await this.prisma.order.updateMany({
      where: { id, status: { not: 'SETTLED' } },
      data: {
        status: 'SETTLED',
        payment_method: body.payment_method,
        payment_status: 'PAID',
      },
    });

    const order = await this.prisma.order.findUnique({ where: { id } });
    
    if (count === 0) {
      return { success: true, order };
    }

    // Free the dine-in table (if any) this order was holding.
    await this.tablesService.releaseTableByOrderId(id);

    console.log(`[SETTLED] POS Order #${id} | Method: ${body.payment_method}`);
    this.gateway.broadcast('order_settled', { order_id: id });

    return { success: true, order };
  }

  // آج کی Sales Summary
  async getSalesSummary(store_id: number, business_day_id?: number) {
    const openDay = business_day_id
      ? { id: business_day_id }
      : await this.prisma.businessDay.findFirst({
          where: { store_id, status: 'OPEN' },
          orderBy: { id: 'desc' },
        });

    if (!openDay) return { total: 0, orders: 0, voids: 0 };

    const orders = await this.prisma.order.findMany({
      where: {
        store_id,
        business_day_id: openDay.id,
        status: { not: 'VOIDED' },
      },
    });

    const voids = await this.prisma.order.count({
      where: { store_id, business_day_id: openDay.id, status: 'VOIDED' },
    });

    const total = orders.reduce((s, o) => s + o.total_amount, 0);
    return { total, orders: orders.length, voids, business_day_id: openDay.id };
  }

  // Sync locally stored Dexie offline orders
  async syncOfflineOrders(orders: any[]) {
    // We will use a transaction to insert all orders safely
    return this.prisma.$transaction(async (tx) => {
      let syncedCount = 0;
      for (const order of orders) {
        // Parse itemsData if available, otherwise fallback to empty array
        let items: any[] = [];
        try {
          if (order.itemsData) items = JSON.parse(order.itemsData);
        } catch (e) {
          console.error('Failed to parse offline itemsData', e);
        }

        if (!order.store_id) throw new Error('Missing store_id in offline sync order');

        // business_day_id used to be REQUIRED from the client, but neither
        // local-fallback KOT object anywhere in the POS ever actually set
        // it (it's not even declared on the OfflineKOT type) -- meaning
        // this line threw on literally every sync attempt, forever, for
        // every locally-queued order regardless of type. createOrder()
        // (the live path) never asked the client for this either -- it
        // resolves the currently open business day itself. Do the same
        // here instead of trusting a field that was never actually sent.
        const openDay = await tx.businessDay.findFirst({
          where: { store_id: order.store_id, status: 'OPEN' },
          orderBy: { id: 'desc' },
        });

        // This is the ONLY path that ever persists a KOT'd order to the real
        // Order table (the offline-sync engine flushes every local KOT here
        // every ~30s, online or not) -- it hardcoded customer_id: null
        // unconditionally, so no POS order that went through "KOT" (rather
        // than an immediate "Pay") ever linked to a Customer, no matter what
        // phone/customer was selected. Prefer the id the frontend already
        // resolved (cashier picked/confirmed a customer in Delivery
        // Details); fall back to a phone lookup for older queued KOTs that
        // predate this fix and never captured customer_id directly.
        let resolvedCustomerId: number | null = order.customer_id ?? null;
        if (!resolvedCustomerId && order.customerPhone) {
          const matched = await tx.customer.findUnique({ where: { phone: normalizePhone(order.customerPhone) } });
          resolvedCustomerId = matched?.id ?? null;
        }

        // A queued Delivery order (either KOT'd for later, or a "Pay Now"
        // attempt that fell back to the offline queue on a network blip)
        // used to always land here as a bare Order with NO linked KOT row
        // at all, order_source hardcoded to 'OFFLINE_SYNC', and status
        // jumped straight to a terminal DELIVERED/PAID -- silently skipping
        // the entire kitchen -> rider pipeline a live-created Delivery
        // order goes through (never shows on a real Kitchen Display, never
        // reaches Active Deliveries). Give it the exact same real lifecycle
        // instead: its real order_source, a genuine KOT, and its actual
        // current status rather than a forced terminal one. Non-Delivery
        // types (Dine In / Take Away) keep their existing behavior
        // unchanged -- this is scoped to the one thing that was reported
        // broken, not a rewrite of the whole sync path.
        const isDelivery = typeof order.type === 'string' && order.type.toUpperCase() === 'DELIVERY';
        const kotStatus: 'NEW' | 'PREPARING' | 'READY' =
          isDelivery && ['NEW', 'PREPARING', 'READY'].includes(order.status) ? order.status : 'NEW';
        const orderStatus = isDelivery
          ? (kotStatus === 'NEW' ? 'PENDING' : kotStatus) // matches createOrder's own PENDING->PREPARING->READY progression
          : (order.status === 'READY' ? 'DELIVERED' : 'PAID'); // unchanged for Dine In / Take Away

        const newOrder = await tx.order.create({
          data: {
            store_id: order.store_id,
            business_day_id: openDay?.id ?? null,
            business_date: new Date(),
            customer_id: resolvedCustomerId,
            order_source: isDelivery ? 'Delivery' : 'OFFLINE_SYNC',
            status: orderStatus,
            total_amount: order.totalAmount || 0,
            payment_status: 'PAID',
            payment_method: order.paymentMethod || 'CASH',
            is_offline: true,
            // created_by is a required (non-nullable) relation to User --
            // neither local-fallback KOT object anywhere in the POS ever
            // actually set this field, so it was always `undefined ||
            // null`, which Prisma rejects. Confusingly, Prisma's own error
            // message for this pointed at the unrelated `store` field
            // instead of the real cause, which is what made this so hard
            // to track down. `|| 1` is the same last-resort fallback
            // createOrder() itself already uses elsewhere in this file.
            created_by: order.created_by || 1,
            // Same gap as customer_id above -- the cashier-entered delivery
            // address was captured on the local KOT but never made it onto
            // the real Order.
            delivery_address: order.customerAddress || null,
            items: {
              create: items.map((i: any) => ({
                product_id: i.id || 1, // Extract product_id from structured local cart
                quantity: i.qty || 1,
                price: i.price || 0,
              })),
            },
          },
          include: { items: { include: { product: true } }, customer: true },
        });

        if (isDelivery) {
          await tx.kOT.create({
            data: {
              store_id: order.store_id,
              order_id: newOrder.id,
              business_day_id: openDay?.id ?? null,
              items: items.map((i: any) => ({
                name: i.name || 'Item',
                qty: i.qty || 1,
                price: i.price || 0,
                specialInst: '',
                product_id: i.id || 1,
              })),
              status: kotStatus,
              ...(kotStatus !== 'NEW' ? { acceptedAt: new Date() } : {}),
              ...(kotStatus === 'READY' ? { readyAt: new Date() } : {}),
            },
          });

          // If this order was already marked READY locally (finished
          // cooking while genuinely offline) before it ever reached the
          // backend, fire the same Rider-facing broadcast a live
          // updateKotStatus(..., 'READY') call would have -- otherwise it
          // would sync in "ready" but never actually notify a rider.
          if (kotStatus === 'READY') {
            this.gateway.broadcast('order_updated', formatPosOrderForRider(newOrder), `store_${order.store_id}`);
          }
        }

        syncedCount++;
      }
      return { success: true, syncedCount };
    });
  }

  // Delivery lifecycle progression for POS-native delivery orders
  // (order_source === 'Delivery') -- mirrors the slice of
  // OnlineOrdersService.updateOrderStatus's state machine the cashier's own
  // Active Deliveries panel actually drives (Rider Arrived / Print Bill /
  // Dispatch / Settle Cash). Those buttons used to always PATCH
  // /online-orders/:id regardless of order source, which is a different
  // table (OnlineOrder) — for a POS-native card that id is really this
  // Order's own id, so the call 404'd as "Order not found". Broadcasts via
  // the same formatPosOrderForRider shape the READY broadcast in
  // KotsService.updateKotStatus already uses, so the frontend's existing
  // order_updated handler needs no extra branching to pick it up.
  private static readonly DELIVERY_STATUSES = [
    'RIDER_ARRIVED',
    'PRINT_BILL',
    'DISPATCHED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'WAITING_CASH_SETTLEMENT',
    'SETTLED',
  ];

  async updateDeliveryStatus(id: number, status: string) {
    if (!PosOrdersService.DELIVERY_STATUSES.includes(status)) {
      throw new BadRequestException(`Invalid delivery status: ${status}`);
    }

    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Order #${id} not found`);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { customer: true, items: { include: { product: true } }, rider: true },
    });

    this.gateway.broadcast('order_updated', formatPosOrderForRider(updated), `store_${updated.store_id}`);
    return { success: true, order: updated };
  }
}
