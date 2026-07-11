import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // تمام گاہک (CRM Grid)
  async getCustomers(brand_id: number, search?: string) {
    const where: any = { brand_id };
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
    const customer = await this.prisma.customer.findUnique({ where: { phone } });
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
    return customer;
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
    if (existing) throw new ConflictException(`Customer with phone ${body.phone} already exists`);

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
  async earnPoints(customer_id: number, order_id: number, order_amount: number) {
    // ہر 100 روپے پر 5 پوائنٹس
    const points = Math.floor(order_amount / 100) * 5;
    if (points <= 0) return { points: 0 };

    await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.create({
        data: { customer_id, order_id, type: 'EARN', points, description: `Order #${order_id}` },
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
  async redeemPoints(customer_id: number, points: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customer_id } });
    if (!customer) throw new NotFoundException('Customer not found');
    if (customer.loyalty_points < points) {
      throw new ConflictException(`Insufficient points. Available: ${customer.loyalty_points}`);
    }

    await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.create({
        data: { customer_id, type: 'REDEEM', points: -points, description: 'Points redeemed at POS' },
      }),
      this.prisma.customer.update({
        where: { id: customer_id },
        data: { loyalty_points: { decrement: points } },
      }),
    ]);

    // 1 point = Rs.0.20 (or configure as needed)
    const discount = points * 0.2;
    console.log(`[LOYALTY REDEEM] Customer #${customer_id} used ${points} points = Rs.${discount}`);
    return { success: true, points_used: points, discount_amount: discount };
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
}
