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

export type ViewMode = 'landing' | 'kiosk' | 'mobile';

export interface StoreSummary {
  id: number;
  name: string;
  [key: string]: any;
}

export interface CustomerProfile {
  id: number;
  name: string;
  phone: string;
  loyalty_points?: number;
  [key: string]: any;
}

