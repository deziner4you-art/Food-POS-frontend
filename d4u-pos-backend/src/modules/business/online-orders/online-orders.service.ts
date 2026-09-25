import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { PricingService } from '../pos-orders/pricing.service';
import { CustomersService } from '../customers/customers.service';
import { normalizePhone } from '../../../common/utils/phone.util';

@Injectable()
export class OnlineOrdersService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
    private pricing: PricingService,
    private customers: CustomersService,
  ) {}

  async createOrder(body: any) {
    // Sprint 28.9: no hardcoded branch — a missing store_id must fail loudly,
    // not silently route the order (and any auto-created customer, loyalty
    // points, etc.) to whichever store happens to be id #1.
    if (!body.store_id) {
      throw new BadRequestException('store_id is required to place an order.');
    }
    const storeId = Number(body.store_id);
    const store = await this.prisma.store.findUnique({ where: { id: storeId }, select: { brand_id: true } });
    if (!store) throw new BadRequestException(`Store #${storeId} not found.`);
    let parsedItems = typeof body.items === 'string' ? JSON.parse(body.items) : body.items;
    // Same normalized identity Customer.phone lookups use everywhere else
    // (customers.service.ts) -- website and POS both capture phone via a
    // free-text input with no enforced format, so without this the same
    // real person could resolve to two different customer rows depending on
    // whether they typed dashes.
    const normalizedPhone = body.customerPhone ? normalizePhone(body.customerPhone) : '';

    // Resolve the real customer BEFORE pricing -- Loyalty Points redemption
    // needs a real customer_id to look up the balance against. A logged-in
    // customer already sends their own id directly; a guest/phone-only
    // checkout resolves (or auto-creates) by phone, same as this method
    // already did after order creation for earnPoints -- moved earlier so
    // both earn and redeem can share one resolved customer.
    let resolvedCustomerId: number | undefined = body.customer_id ? Number(body.customer_id) : undefined;
    let isNewCustomer = false;
    if (!resolvedCustomerId && normalizedPhone) {
      const existingCustomer = await this.prisma.customer.findUnique({ where: { phone: normalizedPhone } });
      if (existingCustomer) {
        resolvedCustomerId = existingCustomer.id;
      } else {
        const newCustomer = await this.prisma.customer.create({
          data: {
            brand_id: store.brand_id,
            phone: normalizedPhone,
            name: body.customer || 'Online Guest',
            address: body.customerAddress || '',
            total_orders: 1,
            loyalty_points: 0,
          },
        });
        console.log(`[CRM] Auto-created new customer for ${normalizedPhone}`);
        resolvedCustomerId = newCustomer.id;
        isNewCustomer = true;
      }
    }

    const orderType = (body.order_type || 'DELIVERY').toUpperCase();
    const pricingResult = await this.pricing.calculatePricing({
      store_id: storeId,
      items: parsedItems,
      couponCode: body.couponCode,
      orderType: orderType === 'DELIVERY' ? 'DELIVERY' : 'OTHER',
      customer_id: resolvedCustomerId,
      pointsToRedeem: body.redeem_points,
    });

    // Order creation + Loyalty Points redemption in one transaction — either
    // both commit or neither does, matching PosOrdersService.createOrder's
    // pattern (previously redeemPoints ran as a separate call after the
    // order insert had already committed, so a redemption failure could
    // leave an order charging a discounted total without ever deducting the
    // points that justified it).
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.onlineOrder.create({
        data: {
          store_id: storeId,
          customer: body.customer || 'Online Guest',
          customerPhone: normalizedPhone,
          customerAddress: body.customerAddress || 'No Address Provided',
          items: JSON.stringify(parsedItems),
          totalAmount: String(pricingResult.total.toFixed(2)),
          tax_amount: pricingResult.tax,
          delivery_fee: pricingResult.deliveryFee,
          loyalty_discount: pricingResult.loyaltyDiscount,
          points_redeemed: pricingResult.pointsRedeemed,
          paymentMethod: body.payment_method || null,
          source: body.source || 'Website',
          notes: body.notes || '',
          status: 'PENDING',
          kdsStatus: 'PENDING',
          // DELIVERY/PICKUP/DINE_IN -- drives the Walk-in/Pickup/Online
          // territory label on the POS Kitchen Display (see
          // KotsService.getActiveKots). Previously hardcoded to "Online",
          // which nothing else read or matched.
          type: body.order_type || 'DELIVERY',
          timePlaced: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      });

      const updated = await tx.onlineOrder.update({
        where: { id: order.id },
        data: { orderId: order.id },
      });

      // Redeem Loyalty Points — uses pricingResult.pointsRedeemed (the real,
      // capped number computed by calculatePricing from the customer's
      // actual balance and their eligible, non-campaign-discounted subtotal
      // + delivery fee), never a raw client-supplied points count.
      if (resolvedCustomerId && pricingResult.pointsRedeemed > 0) {
        await this.customers.redeemPoints(resolvedCustomerId, pricingResult.pointsRedeemed, tx, undefined, order.id);
      }

      return updated;
    });

    console.log(
      `[NEW ORDER] #${updatedOrder.id} — Store: ${storeId} — ${updatedOrder.items}`,
    );
    this.gateway.broadcast('new_order', updatedOrder, `store_${storeId}`);

    // Award Loyalty Points — via the same CustomersService.earnPoints used by
    // PosOrdersService.createOrder, not a second, independent formula. The
    // previous inline version read body.totalAmount, a field the website
    // never sends, so it always computed 0; it also hardcoded a 1-point-per-
    // rupee rate that doesn't match earnPoints' real configurable rate, and
    // never wrote a LoyaltyTransaction audit row. pricingResult.total is the
    // same value already stored as this order's own totalAmount above.
    if (resolvedCustomerId) {
      // total_orders counts orders placed, independent of whether this
      // particular order's total cleared the minimum to earn a point.
      // (A brand-new customer already starts at total_orders: 1 -- see
      // creation above -- so it isn't incremented a second time here.)
      if (!isNewCustomer) {
        await this.prisma.customer.update({
          where: { id: resolvedCustomerId },
          data: { total_orders: { increment: 1 } },
        });
      }
      // Skipped when this same order also redeemed points -- otherwise a
      // customer could redeem for a discount and simultaneously earn back a
      // similar (sometimes larger) amount from the same order's total, so
      // their balance barely moved instead of dropping by what they redeemed.
      if (pricingResult.pointsRedeemed === 0) {
        await this.customers.earnPoints(resolvedCustomerId, updatedOrder.id, pricingResult.total, storeId);
      }
    }

    return { success: true, order: updatedOrder };
  }

  // Task #2Q-D1: previously unscoped by any tenant boundary -- any caller
  // holding sales.view could retrieve any phone number's full order history
  // across every store/brand in the system. authenticatedUser is the
  // verified JWT payload (never client-supplied); its store is the only
  // tenant boundary trusted here -- see #2Q-D's audit for why store_id
  // (OnlineOrder's own native field) rather than brand_id was chosen for
  // this specific endpoint.
  async getOrdersByPhone(phone: string, authenticatedUser?: any) {
    const storeId = Number(authenticatedUser?.active_store_id ?? authenticatedUser?.store_id);
    if (!authenticatedUser || !Number.isFinite(storeId) || storeId <= 0) {
      throw new BadRequestException('A valid authenticated store context is required.');
    }

    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new BadRequestException('Store not found for authenticated session.');
    }

    return this.prisma.onlineOrder.findMany({
      where: { customerPhone: normalizePhone(phone), store_id: storeId },
      orderBy: { id: 'desc' },
    });
  }

  // activeOnly is additive and opt-in, defaulting to false so every existing
  // caller (the Incoming Online Orders panel) gets the exact same PENDING-only
  // response as before. It exists to let the POS client rehydrate its
  // Active Deliveries list on page load after a browser refresh.
  //
  // DELIVERY GATE RULE (enforced here at the data layer):
  // "READY is the gate for Delivery." Only orders that have passed the KDS
  // READY transition are eligible for the POS Delivery queue. Pre-kitchen
  // states (CONFIRMED, KITCHEN_PREPARING) and terminal states (DELIVERED,
  // SETTLED, WAITING_CASH_SETTLEMENT→already settled) must never appear as
  // Active Deliveries. We use an explicit allowlist rather than a denylist
  // so that any future status added to the state machine is excluded by
  // default until deliberately added here.
  //
  // Eligible delivery statuses (allowlist):
  //   READY                  — KDS marked ready; waiting for rider
  //   RIDER_ARRIVED          — Rider at restaurant to collect
  //   PRINT_BILL             — Bill printed; about to dispatch
  //   DISPATCHED             — Dispatched to rider
  //   OUT_FOR_DELIVERY       — Rider en route to customer
  //   DELIVERED              — Delivered to customer; awaiting cash settlement
  //   WAITING_CASH_SETTLEMENT — Explicit settlement pending state
  async getAllOnlineOrders(store_id?: number, activeOnly: boolean = false, business_day_id?: number) {
    const whereClause: any = activeOnly
      ? {
          type: { equals: 'DELIVERY', mode: 'insensitive' },
          status: {
            in: [
              'READY',
              'RIDER_ARRIVED',
              'PRINT_BILL',
              'DISPATCHED',
              'OUT_FOR_DELIVERY',
              'DELIVERED',
              'WAITING_CASH_SETTLEMENT',
            ],
          },
        }
      : { status: 'PENDING' };
    if (store_id) {
      whereClause.store_id = store_id;
    }
    if (business_day_id && activeOnly) {
      whereClause.posOrder = {
        business_day_id: business_day_id,
      };
    }
    return this.prisma.onlineOrder.findMany({
      where: whereClause,
      orderBy: { id: 'desc' },
    });
  }

  async getOrder(id: number) {
    const order = await this.prisma.onlineOrder.findUnique({
      where: { id },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async trackOrder(query: string) {
    const num = Number(query);
    let order = null;
    
    if (!isNaN(num) && query.length < 8) {
      order = await this.prisma.onlineOrder.findUnique({ where: { id: num } });
    }
    
    if (!order) {
      order = await this.prisma.onlineOrder.findFirst({
        where: { customerPhone: normalizePhone(query) },
        orderBy: { id: 'desc' }
      });
    }

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * Gives a website order a real kitchen ticket (Order + KOT) the first
   * time it's confirmed, instead of kdsStatus being a string nobody in the
   * kitchen actually drives. Once this exists, the order flows through the
   * exact same Accept/Preparing/Ready pipeline (and rider-notification
   * bridge, KotsService.updateKotStatus) that POS-created delivery orders
   * already use — see KotsService for the matching PREPARING/READY →
   * OnlineOrder sync. Mirrors PosOrdersService.createOrder's Order+KOT
   * shape exactly, but reuses the price already locked in at placement
   * time (calculatePricing already ran once in createOrder above) rather
   * than repricing.
   *
   * Must run inside the caller's transaction (see updateOrderStatus) and
   * must not catch its own errors — a ticket-creation failure needs to roll
   * back the OnlineOrder status change too, not leave the order silently
   * CONFIRMED with no Order/KOT for the kitchen to act on. Returns the
   * created Order (with items) so the caller can broadcast kds_update once
   * the transaction has actually committed.
   */
  private async createKitchenTicketForOnlineOrder(tx: Prisma.TransactionClient, onlineOrder: any) {
    const itemsArr = JSON.parse(onlineOrder.items || '[]');

    const targetDay = await tx.businessDay.findFirst({
      where: { store_id: onlineOrder.store_id, status: 'OPEN' },
      orderBy: { id: 'desc' },
    });

    const order = await tx.order.create({
      data: {
        store_id: onlineOrder.store_id,
        business_day_id: targetDay?.id ?? null,
        created_by: 1, // System — confirmed via the online-order pipeline, not a specific cashier login
        business_date: targetDay?.dayStart ?? new Date(),
        total_amount: parseFloat(onlineOrder.totalAmount) || 0,
        discount: 0,
        status: 'PENDING',
        order_source: 'ONLINE',
        payment_method: onlineOrder.paymentMethod || 'CASH',
        payment_status: 'PENDING_COD',
        delivery_address: onlineOrder.customerAddress,
        items: {
          // CheckoutView.tsx (the live website checkout) sends
          // {product_id, quantity}; only the quarantined legacy
          // StitchLanding.tsx still sends {id, qty} — accept either so a
          // real cart never resolves to product_id 0 and FK-violates.
          create: itemsArr.map((i: any) => ({
            product_id: parseInt(i.product_id ?? i.id) || 0,
            variant_id: i.variant_id ? parseInt(i.variant_id) : null,
            quantity: i.quantity ?? i.qty ?? 1,
            price: parseFloat(i.price) || 0,
            special_inst: i.special_inst || '',
          })),
        },
      },
      include: { items: { include: { product: true, variant: true } } },
    });

    const kotItems = order.items.map((i) => ({
      // Appends the chosen size so the chef sees "Mughlai Pizza (Medium)"
      // on the ticket, not just the base product name.
      name: i.variant ? `${i.product?.name || 'Unknown item'} (${i.variant.name})` : (i.product?.name || 'Unknown item'),
      qty: i.quantity,
      price: i.price,
      specialInst: i.special_inst ?? '',
      product_id: i.product_id,
      kitchen_station_id: i.product?.kitchen_station_id ?? null,
    }));

    await tx.kOT.create({
      data: {
        store_id: onlineOrder.store_id,
        order_id: order.id,
        business_day_id: targetDay?.id ?? null,
        items: kotItems,
        status: 'NEW',
      },
    });

    return order;
  }

  async updateOrderStatus(id: number, data: any, authenticatedUser?: any) {
    const userStoreId = authenticatedUser?.store_id;
    const allowedKeys = [
      'orderId',
      'status',
      'kdsStatus',
      'source',
      'customer',
      'customerPhone',
      'customerAddress',
      'items',
      'totalAmount',
      'notes',
      'prepTimeMinutes',
      'estimatedReadyAt',
      'timePlaced',
      'riderAssigned',
      'feedback',
      'delivery',
    ];

    const updateData: any = {};
    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    try {
      const existingOrder = await this.prisma.onlineOrder.findUnique({
        where: { id },
      });
      if (!existingOrder) throw new NotFoundException('Order not found');

      // --- ORDER TYPE IMMUTABILITY (Task #1) ---
      // Once an OnlineOrder is created (DELIVERY, PICKUP, DINE_IN), its type is strictly immutable.
      if (data.type !== undefined) {
        const incomingType = String(data.type).toUpperCase().trim();
        const existingType = (existingOrder.type || '').toUpperCase().trim();
        if (incomingType !== existingType) {
          throw new BadRequestException(
            `Order type is immutable and cannot be changed after creation. Existing type: '${existingOrder.type}', attempted type: '${data.type}'.`,
          );
        }
      }

      // --- SECURITY ENFORCEMENT ---
      if (userStoreId && existingOrder.store_id !== userStoreId) {
        throw new Error('Unauthorized: Cannot modify orders belonging to another branch.');
      }

      // --- RIDER OWNERSHIP ENFORCEMENT (Task #2Q-B3) ---
      // Staff (Cashier/Manager/etc.) may still update any order in their own
      // store, exactly as above -- this only activates for a caller whose
      // real, DB-resolved role is Rider. Never trust a role claim off the
      // JWT itself: real staff/rider logins carry no role in the token at
      // all (see AuthService.buildTokenPayload), so the caller's role is
      // looked up fresh, the same pattern RiderService.claimOrder/
      // updateRiderGps already use (Tasks #2J/#2K). A Rider may only
      // progress a delivery they've actually claimed (see
      // RiderService.claimOrder, which sets claimedByRiderId) -- an
      // unclaimed order, or one claimed by a different rider, is rejected
      // rather than letting one rider manipulate another's delivery.
      const callerId = Number(authenticatedUser?.sub);
      if (Number.isFinite(callerId)) {
        const callerUser = await this.prisma.user.findUnique({
          where: { id: callerId },
          select: { role: { select: { name: true } } },
        });
        if (callerUser?.role?.name === 'Rider' && existingOrder.claimedByRiderId !== callerId) {
          throw new Error('Unauthorized: This delivery is not assigned to you.');
        }
      }

      // --- AUTHORITATIVE STATE MACHINE ENFORCEMENT ---
      // Canonical order lifecycle sequence:
      // PENDING -> CONFIRMED -> KITCHEN_PREPARING -> READY -> RIDER_ARRIVED -> PRINT_BILL -> DISPATCHED -> OUT_FOR_DELIVERY -> DELIVERED -> WAITING_CASH_SETTLEMENT -> SETTLED
      const CANONICAL_STATES = [
        'PENDING',
        'CONFIRMED',
        'KITCHEN_PREPARING',
        'READY',
        'RIDER_ARRIVED',
        'PRINT_BILL',
        'DISPATCHED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'WAITING_CASH_SETTLEMENT',
        'SETTLED',
      ];

      const TERMINAL_STATES = ['SETTLED', 'CANCELLED', 'VOIDED'];

      const normalizeStatus = (status: string | undefined, currentStatus: string): string | undefined => {
        if (!status) return undefined;
        const s = status.toUpperCase().trim();
        if (s === 'ONLINE_ORDER_RECEIVED' || s === 'NEW') return 'PENDING';
        if (s === 'NEW_KOT' || s === 'PENDING_CHEF') return 'CONFIRMED';
        if (s === 'PREPARING') return 'KITCHEN_PREPARING';
        if (s === 'ACCEPTED') {
          // Cashier acceptance of incoming PENDING order -> moves to CONFIRMED
          // KDS Chef acceptance of CONFIRMED or later order -> moves to KITCHEN_PREPARING
          return currentStatus === 'PENDING' ? 'CONFIRMED' : 'KITCHEN_PREPARING';
        }
        if (s === 'RIDER_ACCEPTED') return 'RIDER_ARRIVED';
        if (s === 'PICKED_UP' || s === 'ON_WAY' || s === 'ON_THE_WAY') return 'OUT_FOR_DELIVERY';
        if (s === 'PAID' || s === 'COMPLETED') return 'SETTLED';
        return s;
      };

      const DELIVERY_LIFECYCLE_STATES = [
        'RIDER_ARRIVED',
        'PRINT_BILL',
        'DISPATCHED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'WAITING_CASH_SETTLEMENT',
      ];

      const rawIncoming = updateData.status || updateData.kdsStatus;
      if (rawIncoming) {
        const currentCanonical = normalizeStatus(existingOrder.status, 'PENDING') || existingOrder.status;
        const targetCanonical = normalizeStatus(rawIncoming, currentCanonical);

        // --- FINDING #6: Current state validation before cancellation or transitions ---
        const currentIndex = CANONICAL_STATES.indexOf(currentCanonical);
        const isCurrentTerminal = TERMINAL_STATES.includes(currentCanonical);

        if (currentIndex === -1 && !isCurrentTerminal) {
          throw new BadRequestException(`Invalid or unsupported current order state: '${existingOrder.status}'.`);
        }

        // Validate target state exists in canonical or terminal states
        const isTargetTerminal = TERMINAL_STATES.includes(targetCanonical || '');
        const targetIndex = targetCanonical ? CANONICAL_STATES.indexOf(targetCanonical) : -1;

        if (targetIndex === -1 && !isTargetTerminal) {
          throw new BadRequestException(`Invalid or unsupported target order state: '${rawIncoming}'.`);
        }

        // 1. Terminal states cannot be moved backwards or transitioned
        if (isCurrentTerminal) {
          throw new BadRequestException(
            `Order #${id} is in terminal state '${currentCanonical}' and cannot be transitioned to '${targetCanonical}'.`,
          );
        }

        // 2. Cancellation handling
        if (targetCanonical === 'CANCELLED' || targetCanonical === 'VOIDED') {
          if (['DELIVERED', 'WAITING_CASH_SETTLEMENT', 'SETTLED'].includes(currentCanonical)) {
            throw new BadRequestException(`Cannot cancel order #${id} after it has reached ${currentCanonical}.`);
          }
          updateData.status = targetCanonical;
          if (updateData.kdsStatus) {
            updateData.kdsStatus = targetCanonical;
          }
        } else {
          // --- FINDING #1: Delivery Type Isolation ---
          // Non-delivery OnlineOrders (PICKUP, DINE_IN, etc.) must NEVER enter the delivery lifecycle
          if (targetCanonical && DELIVERY_LIFECYCLE_STATES.includes(targetCanonical) && existingOrder.type?.toUpperCase() !== 'DELIVERY') {
            throw new BadRequestException(
              `Order #${id} of type '${existingOrder.type || 'NON_DELIVERY'}' cannot enter delivery lifecycle state '${targetCanonical}'. Only DELIVERY orders may enter the delivery lifecycle.`,
            );
          }

          // 3. Backwards transitions strictly rejected
          if (targetIndex < currentIndex) {
            throw new BadRequestException(
              `Cannot move order #${id} backwards from '${currentCanonical}' to '${targetCanonical}'.`,
            );
          }

          // 4. Sequential validation (no skipping states)
          if (targetIndex > currentIndex + 1) {
            // Allow direct settlement from DELIVERED -> SETTLED if WAITING_CASH_SETTLEMENT is omitted
            if (currentCanonical === 'DELIVERED' && targetCanonical === 'SETTLED') {
              // Permitted direct settlement shortcut
            } else if (currentCanonical === 'READY' && targetCanonical === 'SETTLED' && existingOrder.type?.toUpperCase() !== 'DELIVERY') {
              // Permitted counter pickup/dine-in settlement shortcut for non-delivery orders
            } else {
              throw new BadRequestException(
                `Invalid state transition from ${currentCanonical} to ${targetCanonical}. States must be sequential.`,
              );
            }
          }

          // 5. Pre-READY orders cannot enter Delivery states (RIDER_ARRIVED and beyond)
          const readyIndex = CANONICAL_STATES.indexOf('READY');
          if (currentIndex < readyIndex && targetIndex > readyIndex) {
            throw new BadRequestException(
              `Order #${id} cannot enter delivery state '${targetCanonical}' before reaching READY.`,
            );
          }

          // 6. DISPATCHED pre-condition: a rider MUST have claimed the order
          if (targetCanonical === 'DISPATCHED' && !existingOrder.claimedByRiderId) {
            throw new BadRequestException(
              'Cannot dispatch order: no rider has accepted this delivery yet. ' +
              'The rider must first claim the order before it can be dispatched.',
            );
          }

          updateData.status = targetCanonical;
          if (updateData.kdsStatus) {
            updateData.kdsStatus = targetCanonical;
          }
        }
      }
      // ---------------------------------

      // First time this order reaches CONFIRMED, it also needs a real
      // kitchen ticket (see createKitchenTicketForOnlineOrder). That step
      // used to run after the status update had already committed and
      // swallowed its own errors — a failure there left the OnlineOrder
      // silently CONFIRMED with no Order/KOT behind it: gone from Incoming
      // (no longer PENDING), never on KDS, no way for the cashier to even
      // know it happened. existingOrder.posOrderId (not updated.posOrderId)
      // is the right check — this decision is conceptually based on state
      // *before* this call, though a fresh read of the same row would agree.
      const willCreateKitchenTicket = updateData.status === 'CONFIRMED' && !existingOrder.posOrderId;

      let updated: any;
      let kitchenOrder: any = null;

      if (willCreateKitchenTicket) {
        // Status update, event log, and kitchen ticket creation (Order + KOT
        // + posOrderId link) all happen in one transaction — any failure in
        // any of them rolls back all of them, so the order stays exactly
        // PENDING and visible in Incoming, and this method throws instead of
        // returning success.
        const txResult = await this.prisma.$transaction(async (tx) => {
          const result = await tx.onlineOrder.update({
            where: { id },
            data: updateData,
          });

          await tx.orderEventLog.create({
            data: {
              orderId: result.id.toString(),
              storeId: result.store_id,
              userId: 0, // system or extract from context
              oldStatus: existingOrder.status,
              newStatus: updateData.status,
              reason: data.notes || 'State transitioned'
            }
          });

          const order = await this.createKitchenTicketForOnlineOrder(tx, result);

          const finalResult = await tx.onlineOrder.update({
            where: { id: result.id },
            data: { posOrderId: order.id },
          });

          return { onlineOrder: finalResult, order };
        });

        updated = txResult.onlineOrder;
        kitchenOrder = txResult.order;
      } else {
        updated = await this.prisma.onlineOrder.update({
          where: { id },
          data: updateData,
        });

        // Log the transition
        if (updateData.status && updateData.status !== existingOrder.status) {
          await this.prisma.orderEventLog.create({
            data: {
              orderId: updated.id.toString(),
              storeId: updated.store_id,
              userId: 0, // system or extract from context
              oldStatus: existingOrder.status,
              newStatus: updateData.status,
              reason: data.notes || 'State transitioned'
            }
          });
        }
      }

      if (kitchenOrder) {
        // Only broadcast once the transaction above has actually committed —
        // never announce a ticket that might have just been rolled back.
        console.log(`[ONLINE ORDER → KOT] Created Order #${kitchenOrder.id} + KOT for OnlineOrder #${updated.id}`);
        // KDS (StitchKDS.tsx) only ever listens for 'kds_update' to trigger its
        // resync (same event KotsService.updateKotStatus broadcasts on
        // PREPARING/READY) — broadcasting 'new_kot' here was a dead event
        // nothing in any frontend subscribes to, so a freshly-created ticket
        // never appeared on an already-open KDS screen.
        this.gateway.broadcast(
          'kds_update',
          { order_id: kitchenOrder.id, store_id: updated.store_id, items: kitchenOrder.items },
          `store_${updated.store_id}`,
        );
      }

      // Recipe Stock Deduction Logic
      if (
        (data.status === 'SETTLED' || data.status === 'PAID') &&
        existingOrder.status !== 'SETTLED' &&
        existingOrder.status !== 'PAID'
      ) {
        try {
          const itemsArr = JSON.parse(updated.items);
          for (const item of itemsArr) {
            // item.name is what we have right now (the frontend sends id as string or product name)
            // We look up the product by name and store_id to get its recipe
            const product = await this.prisma.product.findFirst({
              where: { store_id: updated.store_id, name: item.name },
              include: { recipe: { include: { ingredients: true } } },
            });

            if (product && product.recipe && product.recipe.ingredients.length > 0) {
              for (const recipeItem of product.recipe.ingredients) {
                const qtyToDeduct = recipeItem.quantity * (item.qty || 1);

                await this.prisma.inventoryItem.update({
                  where: { id: recipeItem.inventory_id },
                  data: { quantity: { decrement: qtyToDeduct } },
                });

                // Log the deduction
                await this.prisma.inventoryTransactionLog.create({
                  data: {
                    inventory_id: recipeItem.inventory_id,
                    operation: 'SUBTRACT',
                    amount: qtyToDeduct,
                    reason: `Order #${updated.id} settled`,
                    changed_by: 0, // System
                  },
                });
              }
            }
          }
        } catch (e) {
          console.error(`[STOCK DEDUCTION ERROR] Order #${id}:`, e);
        }

        // ==========================================
        // CREATE POS ORDER & MAP TO OLD BUSINESS DAY
        // ==========================================
        try {
          // Find the Business Day that was active when this order was placed
          let targetDay = await this.prisma.businessDay.findFirst({
            where: {
              store_id: updated.store_id,
              dayStart: { lte: updated.createdAt },
              OR: [
                { dayClose: null },
                { dayClose: { gte: updated.createdAt } },
              ],
            },
          });

          // Fallback: If no precise day matches, find the closest active day from the past
          if (!targetDay) {
            targetDay = await this.prisma.businessDay.findFirst({
              where: {
                store_id: updated.store_id,
                dayStart: { lte: updated.createdAt },
              },
              orderBy: { id: 'desc' },
            });
          }
          // Ultimate fallback: Just get the latest day
          if (!targetDay) {
            targetDay = await this.prisma.businessDay.findFirst({
              where: { store_id: updated.store_id },
              orderBy: { id: 'desc' },
            });
          }

          if (targetDay) {
            let total_amount = parseFloat(updated.totalAmount || '0');
            if (isNaN(total_amount)) total_amount = 0;

            let itemsArr: any[] = [];
            try {
              itemsArr = JSON.parse(updated.items || '[]');
            } catch (e) {}

            // This order may already have a real Order (created when it was
            // first CONFIRMED — see createKitchenTicketForOnlineOrder above).
            // Update that one instead of creating a second, duplicate Order
            // for the same real-world sale; only orders that somehow reach
            // settlement without ever passing through CONFIRMED (edge case)
            // fall back to the original backdated-Order creation.
            if (updated.posOrderId) {
              await this.prisma.order.update({
                where: { id: updated.posOrderId },
                data: {
                  status: 'COMPLETED',
                  payment_status: 'PAID',
                },
              });
            } else {
              // Create the official POS Order
              await this.prisma.order.create({
                data: {
                  store_id: updated.store_id,
                  business_day_id: targetDay.id,
                  created_by: 1, // System / Admin
                  business_date: targetDay.dayStart,
                  total_amount: total_amount,
                  discount: 0,
                  status: 'COMPLETED',
                  order_source: 'ONLINE',
                  payment_method: updated.paymentMethod || 'CASH',
                  payment_status: 'PAID',
                  delivery_address: updated.customerAddress,
                  items: {
                    create: itemsArr.map((i: any) => ({
                      product_id: parseInt(i.id) || 0,
                      quantity: i.qty || 1,
                      price: parseFloat(i.price) || 0,
                      special_inst: i.special_inst || '',
                    })),
                  },
                },
              });
            }

            // If the target day is ALREADY CLOSED, we retroactively update its totals
            if (targetDay.status === 'CLOSED') {
              await this.prisma.businessDay.update({
                where: { id: targetDay.id },
                data: {
                  totalSales: { increment: total_amount },
                  closingCash: { increment: total_amount },
                  totalOrders: { increment: 1 },
                },
              });
              console.log(
                `[RETROACTIVE SALES] Added ${total_amount} to Closed Day #${targetDay.id}`,
              );
            } else {
              console.log(
                `[SALES] Added ${total_amount} to Open Day #${targetDay.id}`,
              );
            }
          }
        } catch (e) {
          console.error(`[POS ORDER CREATION ERROR] Order #${id}:`, e);
        }
      }

      console.log(
        `[STATUS UPDATE] Order #${id} → kdsStatus: ${updated.kdsStatus}`,
      );
      this.gateway.broadcast(
        'order_updated',
        updated,
        `store_${updated.store_id}`,
      );
      return { success: true, order: updated };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Order not found or update failed');
    }
  }

  async postFeedback(id: number, rating: number, comment: string) {
    try {
      const updated = await this.prisma.onlineOrder.update({
        where: { id },
        data: {
          feedback: {
            rating: rating || 5,
            comment: comment || '',
            timestamp: new Date().toISOString(),
          },
        },
      });

      console.log(`[FEEDBACK] Order #${id} — Rating: ${rating}`);
      return { success: true, order: updated };
    } catch (error) {
      throw new NotFoundException('Order not found');
    }
  }
}
