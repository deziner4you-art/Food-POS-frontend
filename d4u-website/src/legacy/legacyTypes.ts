// Frozen copy of the pre-migration FoodItem/CartItem shapes, used only by
// the quarantined legacy/ components. The live app's ../types.ts now uses
// Stitch's Product/CartItem shape instead — kept separate so the legacy
// rollback path compiles without touching a single line of legacy logic.
export interface FoodItem {
  id: string;
  name: string;
  priceUSD: number;
  priceRs: number;
  description: string;
  image: string;
  category: string;
  tag?: string;
  preparationTime?: string;
  calories?: number;
  categoryGroup?: string;
  variants?: any[];
  categories?: any[];
}

export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
  customization?: string;
}
