/**
 * Runtime shape of a POS cart line item, as actually produced by addToCart():
 * a shallow copy of the source product/OfflineProduct record plus cart-specific
 * fields. Kept permissive (index signature) because product records carry many
 * optional catalog fields (img, desc, categories, variants, etc.) that flow
 * through unchanged — this type documents the fields the cart engine itself
 * relies on without forcing a redesign of the cart item shape.
 */
import type { CartModifier } from '../pos/types';

export interface CartLineItem {
  [key: string]: any;
  cartItemId: string;
  id: number;
  name: string;
  price: number;
  qty: number;
  variant_id?: number;
  modifiers?: CartModifier[];
}
