/**
 * Shapes a POS Order (delivery-sourced) to look exactly like an OnlineOrder
 * row, since the Rider App's realtime handler and REST list only understand
 * that shape (see RiderService.getRiderOrders, which used to duplicate this
 * inline, and AppGateway's order_updated payload for OnlineOrders, which
 * already matches this shape natively). One formatter, used by both the
 * REST endpoint and the KOT-status-driven realtime broadcast (Sprint 28.9),
 * so the two paths can never drift apart again.
 */
export function formatPosOrderForRider(order: any) {
  return {
    id: order.id,
    store_id: order.store_id,
    orderId: order.id,
    status: order.status,
    kdsStatus: order.status,
    type: 'Delivery',
    source: 'POS',
    customer: order.customer ? order.customer.name : 'Guest',
    customerPhone: order.customer ? order.customer.phone : '',
    customerAddress: order.delivery_address || 'No Address Provided',
    items: order.items.map((i: any) => `${i.quantity}x ${i.product.name}`).join(', '),
    totalAmount: String(order.total_amount),
    notes: order.customer_feedback || '',
    prepTimeMinutes: 0,
    estimatedReadyAt: '',
    timePlaced: order.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    riderAssigned: !!order.rider_id,
    feedback: null,
    delivery: order.delivery_info,
    createdAt: order.createdAt,
    isPos: true,
  };
}
