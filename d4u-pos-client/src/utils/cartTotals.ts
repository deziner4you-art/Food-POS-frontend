export type LineItem = { price: number; qty: number };

/** Sum of price * qty across line items — used for cart/delivery/order subtotals. */
export function sumLineItems(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/** Subtotal + the branch's real per-branch tax rate, used at settlement time. */
export function calculateSubtotalWithTax(items: LineItem[], taxRate: number = 0.1) {
  const subTotal = sumLineItems(items);
  const tax = Math.round(subTotal * taxRate * 100) / 100;
  const grandTotal = Math.round((subTotal + tax) * 100) / 100;
  return { subTotal, tax, grandTotal };
}
