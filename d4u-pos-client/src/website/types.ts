export interface FoodItem {
  id: string;
  name: string;
  priceUSD: number;
  priceRs: number;
  description: string;
  image: string;
  category: 'Burgers' | 'Pizzas' | 'Sides' | 'Drinks' | 'Desserts';
  tag?: 'Bestseller' | 'New Arrival' | 'Limited Edition' | 'CHEF\'S SPECIAL' | 'VEGETARIAN' | 'BEST SELLER';
  preparationTime?: string;
  calories?: number;
}

export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
  customization?: string;
}

export type ViewMode = 'kiosk' | 'mobile' | 'landing';
