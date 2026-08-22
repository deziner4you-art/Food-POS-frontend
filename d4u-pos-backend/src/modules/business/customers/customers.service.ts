import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { LOYALTY_POINT_VALUE } from './loyalty.constants';
import { normalizePhone } from '../../../common/utils/phone.util';

type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // تمام گاہک (CRM Grid)
  //
  // Task #2Q-D1: brand_id used to be a client-supplied argument, trusted
  // outright -- any caller holding crm.customers.read could list/search
  // another brand's entire customer base just by passing a different
  // brand_id query param. It's now resolved server-side from the
  // authenticated session's own active_brand_id (same JWT claim
  // AuthService.buildTokenPayload already sets), never from the request.
  // store_id, if supplied, is verified to actually belong to that brand
  // before being used as the existing in-brand narrowing filter below --
  // otherwise a caller could still probe another brand's stores indirectly.
  async getCustomers(authenticatedUser: any, store_id?: number, search?: string) {
    const brand_id = Number(authenticatedUser?.active_brand_id);
    if (!authenticatedUser || !Number.isFinite(brand_id) || brand_id <= 0) {
      throw new BadRequestException('A valid authenticated brand context is required.');
    }

    if (store_id) {
      const store = await this.prisma.store.findUnique({
        where: { id: store_id },
        select: { brand_id: true },
      });
      if (!store || store.brand_id !== brand_id) {
        throw new BadRequestException('Store not found for authenticated brand.');
      }
    }

    const where: any = { brand_id };
    // Both conditions below are their own OR clause -- combined via AND (not
    // both assigned to where.OR, which would let whichever runs second
    // silently discard the other) so store-scoping and search both apply
    // together when both are given.
    const and: any[] = [];

    // Customer has no store_id of its own -- "belongs to this branch" was
    // being inferred purely from having a past POS Order at that store,
    // which made a brand-new customer (0 orders so far, e.g. one just
    // created via "New Customer" or via a Delivery order still awaiting
    // sync) invisible in the CRM grid the instant they were added, since
    // they don't have a qualifying order yet. Always include customers with
    // no order history at all so they show up immediately; customers who
    // do have real order history stay scoped to the branch they actually
    // ordered from, unchanged.
    if (store_id) {
      and.push({ OR: [{ orders: { some: { store_id } } }, { total_orders: 0 }] });
    }

    if (search) {
      and.push({
        OR: [
          { phone: { contains: search } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (and.length > 0) where.AND = and;

    return this.prisma.customer.findMany({
      where,
      orderBy: { total_orders: 'desc' },
      include: { _count: { select: { addresses: true } } },
    });
  }

  // فون نمبر سے گاہک تلاش
  //
  // Task #2M: this used to filter by phone alone -- any caller holding
  // crm.customers.read could look up any customer at any brand just by
  // knowing (or guessing) their phone number. Customer.phone is globally
  // unique (see schema.prisma), so two different brands can never actually
  // have two different customers sharing one phone -- the real risk was a
  // wrong-brand caller being able to see the one real customer that phone
  // belongs to, even though they have no authorization over that brand at
  // all. The fix resolves the caller's own brand server-side (from their
  // authenticated store, never from anything client-supplied) and treats a
  // cross-brand match exactly like no match -- same NotFoundException,
  // same message, so a wrong-brand caller can't distinguish "doesn't exist"
  // from "exists somewhere I can't see" via a different response shape.
  //
  // Real staff sessions carry active_store_id; Waiter/Chef's synthetic
  // terminal-session tokens carry only store_id (see TerminalService/
  // ChefSessionService) -- neither shape has a brand_id claim on Waiter's
  // token at all, so the brand is derived from Store.brand_id rather than
  // trusting (or requiring) a brand claim on the token.
  async findByPhone(phone: string, authenticatedUser: any) {
    const storeId = Number(authenticatedUser?.active_store_id ?? authenticatedUser?.store_id);
    if (!authenticatedUser || !Number.isFinite(storeId) || storeId <= 0) {
      throw new BadRequestException('A valid authenticated store context is required.');
    }

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { brand_id: true },
    });
    if (!store) {
      throw new BadRequestException('Store not found for authenticated session.');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { phone: normalizePhone(phone) },
      include: { addresses: { orderBy: [{ is_default: 'desc' }, { id: 'asc' }] } },
    });

    if (!customer || customer.brand_id !== store.brand_id) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  // ایک گاہک کی تمام آرڈر ہسٹری
  // Task #2Q-D1: the internal OnlineOrder lookup below used to be unscoped
  // by any tenant boundary -- the same class of leak as
  // OnlineOrdersService.getOrdersByPhone (see #2Q-D's audit), just reached
  // through a customer id instead of a phone query param. The customer
  // lookup itself is unchanged -- only the OnlineOrder query gets the fix.
  async getCustomerOrders(id: number, authenticatedUser?: any) {
    const storeId = Number(authenticatedUser?.active_store_id ?? authenticatedUser?.store_id);
    if (!authenticatedUser || !Number.isFinite(storeId) || storeId <= 0) {
      throw new BadRequestException('A valid authenticated store context is required.');
    }

    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new BadRequestException('Store not found for authenticated session.');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: { items: { include: { product: true } } },
          orderBy: { id: 'desc' },
          take: 50,
        },
        addresses: { orderBy: [{ is_default: 'desc' }, { id: 'asc' }] },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const onlineOrders = await this.prisma.onlineOrder.findMany({
      where: { customerPhone: normalizePhone(customer.phone), store_id: storeId },
      orderBy: { id: 'desc' },
      take: 50,
    });

    return { ...customer, onlineOrders };
  }

  // نیا گاہک رجسٹر
  async createCustomer(body: {
    brand_id: number;
    phone: string;
    name: string;
    address?: string;
  }) {
    // Find-or-create: phone is globally unique (not per-brand), so a
    // cashier typing a number that's already registered under ANY brand
    // used to hard-fail with "already exists" even though, from the
    // cashier's point of view, they just typed a genuinely new customer for
    // THIS brand. Returning the existing record instead (matching
    // lookupCustomerByPhone's own behavior) means "Add Customer" is
    // idempotent: an existing number resolves to that customer, a new one
    // creates a real new row.
    const phone = normalizePhone(body.phone);
    const existing = await this.prisma.customer.findUnique({
      where: { phone },
      include: { addresses: { orderBy: [{ is_default: 'desc' }, { id: 'asc' }] } },
    });
    if (existing) {
      return { success: true, customer: existing, alreadyExisted: true };
    }

    const customer = await this.prisma.customer.create({
      data: {
        brand_id: body.brand_id,
        phone,
        name: body.name,
        address: body.address ?? null,
      },
    });

    console.log(`[NEW CUSTOMER] ${customer.name} — ${customer.phone}`);
    return { success: true, customer };
  }

  // گاہک کی معلومات اپڈیٹ
  async updateCustomer(id: number, body: { name?: string; address?: string }) {
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.address && { address: body.address }),
      },
    });
    return { success: true, customer };
  }

  // Loyalty Points کمائیں
  async earnPoints(
    customer_id: number,
    order_id: number,
    order_amount: number,
    store_id?: number,
  ) {
    const settings = store_id
      ? await this.prisma.cmsSettings.findUnique({ where: { store_id } })
      : null;
    // No settings row at all -- never explicitly configured either way --
    // defaults to enabled, matching the pre-toggle historical behavior.
    const loyaltyModuleEnabled = settings ? settings.module_loyalty_enabled : true;
    if (!loyaltyModuleEnabled) return { points: 0 };

    const pointsPerPurchase = settings?.loyalty_points_per_purchase ?? 5;
    const purchaseAmount = settings?.loyalty_purchase_amount ?? 100;
    if (purchaseAmount <= 0) return { points: 0 };
    const points = Math.floor(order_amount / purchaseAmount) * pointsPerPurchase;
    if (points <= 0) return { points: 0 };

    await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.create({
        data: {
          customer_id,
          order_id,
          type: 'EARN',
          points,
          description: `Order #${order_id}`,
        },
      }),
      this.prisma.customer.update({
        where: { id: customer_id },
        data: { loyalty_points: { increment: points } },
      }),
    ]);

    console.log(`[LOYALTY] Customer #${customer_id} earned ${points} points`);
    return { success: true, points };
  }

  // Loyalty Points استعمال کریں
  // Accepts an optional Prisma transaction client so the caller (e.g.
  // PosOrdersService.createOrder) can run the redemption atomically together
  // with the order it belongs to — either both commit or neither does. Called
  // without a client (the standalone POST /customers/:id/redeem route), it
  // wraps itself in its own transaction exactly as before.
  async redeemPoints(
    customer_id: number,
    points: number,
    client?: Prisma.TransactionClient,
    pointValue: number = LOYALTY_POINT_VALUE,
    order_id?: number,
  ) {
    const run = async (tx: PrismaClientOrTx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customer_id },
      });
      if (!customer) throw new NotFoundException('Customer not found');
      if (customer.loyalty_points < points) {
        throw new ConflictException(
          `Insufficient points. Available: ${customer.loyalty_points}`,
        );
      }

      await tx.loyaltyTransaction.create({
        data: {
          customer_id,
          order_id,
          type: 'REDEEM',
          points: -points,
          description: order_id ? `Points redeemed on Order #${order_id}` : 'Points redeemed at POS',
        },
      });
      await tx.customer.update({
        where: { id: customer_id },
        data: { loyalty_points: { decrement: points } },
      });

      const discount = points * pointValue;
      console.log(
        `[LOYALTY REDEEM] Customer #${customer_id} used ${points} points = Rs.${discount}`,
      );
      return { success: true, points_used: points, discount_amount: discount };
    };

    if (client) return run(client);
    return this.prisma.$transaction((tx) => run(tx));
  }

  // گاہک کا Wallet Balance
  async getWalletBalance(customer_id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customer_id },
      select: { id: true, name: true, phone: true, loyalty_points: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { customer_id },
      orderBy: { id: 'desc' },
      take: 20,
    });

    return { ...customer, transactions };
  }

  // delete customer
  async deleteCustomer(id: number) {
    await this.prisma.customer.delete({ where: { id } });
    return { success: true };
  }
}
