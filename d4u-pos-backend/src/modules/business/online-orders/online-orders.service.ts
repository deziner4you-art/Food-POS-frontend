import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppGateway } from '../../../app.gateway';
import { PricingService } from '../pos-orders/pricing.service';

@Injectable()
export class OnlineOrdersService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
    private pricing: PricingService,
  ) {}

  async createOrder(body: any) {
    const storeId = body.store_id ? Number(body.store_id) : 1;
    let parsedItems = typeof body.items === 'string' ? JSON.parse(body.items) : body.items;

    const pricingResult = await this.pricing.calculatePricing({
      store_id: storeId,
      items: parsedItems,
      couponCode: body.couponCode
    });

    const order = await this.prisma.onlineOrder.create({
      data: {
        store_id: storeId,
        customer: body.customer || 'Online Guest',
        customerPhone: body.customerPhone || '',
        customerAddress: body.customerAddress || 'No Address Provided',
        items: JSON.stringify(parsedItems),
        totalAmount: String(pricingResult.total.toFixed(2)),
        source: body.source || 'Website',
        notes: body.notes || '',
        status: 'PENDING',
        kdsStatus: 'PENDING',
        type: 'Online',
        timePlaced: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    });

    const updatedOrder = await this.prisma.onlineOrder.update({
      where: { id: order.id },
      data: { orderId: order.id },
    });

    console.log(
      `[NEW ORDER] #${updatedOrder.id} — Store: ${storeId} — ${updatedOrder.items}`,
    );
    this.gateway.broadcast('new_order', updatedOrder, `store_${storeId}`);

    // Award Loyalty Points
    if (body.customerPhone) {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { phone: body.customerPhone },
      });
      if (existingCustomer) {
        const pointsEarned = Math.floor(parseFloat(body.totalAmount || '0'));
        if (pointsEarned > 0) {
          await this.prisma.customer.update({
            where: { id: existingCustomer.id },
            data: {
              loyalty_points: { increment: pointsEarned },
              total_orders: { increment: 1 },
            },
          });
          console.log(
            `[LOYALTY] Awarded ${pointsEarned} points to ${existingCustomer.name}`,
          );
        }
      } else {
        // Auto-create customer
        await this.prisma.customer.create({
          data: {
            brand_id: 1, // Default brand
            phone: body.customerPhone,
            name: body.customer || 'Online Guest',
            address: body.customerAddress || '',
            total_orders: 1,
            loyalty_points: Math.floor(parseFloat(body.totalAmount || '0')),
          }
        });
        console.log(`[CRM] Auto-created new customer for ${body.customerPhone}`);
      }
    }

    return { success: true, order: updatedOrder };
  }

  async getOrdersByPhone(phone: string) {
    return this.prisma.onlineOrder.findMany({
      where: { customerPhone: phone },
      orderBy: { id: 'desc' },
    });
  }

  async getAllOnlineOrders(store_id?: number) {
    const whereClause: any = { status: 'PENDING' };
    if (store_id) {
      whereClause.store_id = store_id;
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
        where: { customerPhone: query },
        orderBy: { id: 'desc' }
      });
    }

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateOrderStatus(id: number, data: any, userStoreId?: number) {
    const allowedKeys = [
      'orderId',
      'status',
      'kdsStatus',
      'type',
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

      // --- SECURITY ENFORCEMENT ---
      if (userStoreId && existingOrder.store_id !== userStoreId) {
        throw new Error('Unauthorized: Cannot modify orders belonging to another branch.');
      }

      // --- STATE MACHINE ENFORCEMENT ---
      const STATE_SEQUENCE = [
        'ONLINE_ORDER_RECEIVED',
        'CONFIRMED',
        'KITCHEN_PREPARING',
        'READY',
        'RIDER_ARRIVED',
        'PRINT_BILL',
        'DISPATCHED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'WAITING_CASH_SETTLEMENT',
        'SETTLED'
      ];

      // Automatically map incoming legacy statuses to the new sequence
      let incomingStatus = updateData.status || updateData.kdsStatus;
      if (incomingStatus) {
        if (incomingStatus === 'ACCEPTED' && existingOrder.status !== 'CONFIRMED') incomingStatus = 'CONFIRMED';
        if (incomingStatus === 'NEW_KOT') incomingStatus = 'CONFIRMED';
        if (incomingStatus === 'PREPARING') incomingStatus = 'KITCHEN_PREPARING';
        if (incomingStatus === 'PENDING') incomingStatus = 'ONLINE_ORDER_RECEIVED';

        const currentIndex = STATE_SEQUENCE.indexOf(existingOrder.status);
        const targetIndex = STATE_SEQUENCE.indexOf(incomingStatus);

        // Strict enforcement: Do not allow skipping states (except falling back or if status not in sequence)
        if (currentIndex !== -1 && targetIndex !== -1) {
          if (targetIndex > currentIndex + 1) {
            throw new Error(`Invalid state transition from ${existingOrder.status} to ${incomingStatus}. States must be sequential.`);
          }
        }
        updateData.status = incomingStatus;
      }
      // ---------------------------------

      const updated = await this.prisma.onlineOrder.update({
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
              include: { recipeItems: true },
            });

            if (product && product.recipeItems.length > 0) {
              for (const recipe of product.recipeItems) {
                const qtyToDeduct = recipe.quantity * (item.qty || 1);

                await this.prisma.inventoryItem.update({
                  where: { id: recipe.inventory_id },
                  data: { quantity: { decrement: qtyToDeduct } },
                });

                // Log the deduction
                await this.prisma.inventoryTransactionLog.create({
                  data: {
                    inventory_id: recipe.inventory_id,
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
                payment_method: 'CASH',
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

  async acceptOnlineOrder(id: number) {
    try {
      const updated = await this.prisma.onlineOrder.update({
        where: { id },
        data: { status: 'ACCEPTED', kdsStatus: 'ACCEPTED' },
      });

      console.log(`[ACCEPTED] Order #${id}`);
      this.gateway.broadcast(
        'order_updated',
        updated,
        `store_${updated.store_id}`,
      );

      return { success: true };
    } catch (error) {
      throw new NotFoundException('Order not found');
    }
  }
}
