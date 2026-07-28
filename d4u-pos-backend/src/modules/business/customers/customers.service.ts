import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { LOYALTY_POINT_VALUE } from './loyalty.constants';

type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // تمام گاہک (CRM Grid)
  async getCustomers(brand_id: number, store_id?: number, search?: string) {
    const where: any = { brand_id };
    
    if (store_id) {
      where.orders = {
        some: {
          store_id: store_id
        }
      };
    }

    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.customer.findMany({
      where,
      orderBy: { total_orders: 'desc' },
    });
  }

  // فون نمبر سے گاہک تلاش
  async findByPhone(phone: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { phone },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  // ایک گاہک کی تمام آرڈر ہسٹری
  async getCustomerOrders(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: { items: { include: { product: true } } },
          orderBy: { id: 'desc' },
          take: 50,
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const onlineOrders = await this.prisma.onlineOrder.findMany({
      where: { customerPhone: customer.phone },
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
    const existing = await this.prisma.customer.findUnique({
      where: { phone: body.phone },
    });
    if (existing)
      throw new ConflictException(
        `Customer with phone ${body.phone} already exists`,
      );

    const customer = await this.prisma.customer.create({
      data: {
        brand_id: body.brand_id,
        phone: body.phone,
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
  ) {
    // ہر 100 روپے پر 5 پوائنٹس
    const points = Math.floor(order_amount / 100) * 5;
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
          type: 'REDEEM',
          points: -points,
          description: 'Points redeemed at POS',
        },
      });
      await tx.customer.update({
        where: { id: customer_id },
        data: { loyalty_points: { decrement: points } },
      });

      const discount = points * LOYALTY_POINT_VALUE;
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
