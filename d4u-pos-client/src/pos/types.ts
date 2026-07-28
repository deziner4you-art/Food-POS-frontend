export type OrderType = 'DINE_IN' | 'TAKE_AWAY' | 'DELIVERY';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export type CustomerMode = 'GUEST' | 'EXISTING';

export type ApiSettings = {
  brand?: {
    id?: number;
    currency?: string;
    vat_percentage?: number;
  };
};

export type PosUser = {
  id: number;
  name: string;
  role: string;
  store_id: number;
};

export type CatalogCategory = {
  id: number;
  store_id: number;
  name: string;
  is_active?: boolean;
  sort_order?: number;
  image_url?: string | null;
};

export type ProductVariant = {
  id: number;
  product_id: number;
  name: string;
  price: number;
};

export type Modifier = {
  id: number;
  modifier_group_id: number;
  name: string;
  additional_price: number;
};

export type ModifierGroup = {
  id: number;
  store_id: number;
  name: string;
  is_required: boolean;
  min_selection: number;
  max_selection: number;
  modifiers: Modifier[];
};

export type ProductModifierLink = {
  modifierGroup: ModifierGroup;
};

export type CatalogProduct = {
  id: number;
  store_id: number;
  name: string;
  price: number;
  sku?: string | null;
  description?: string | null;
  image_url?: string | null;
  tax_rate?: number;
  categories?: CatalogCategory[];
  variants?: ProductVariant[];
  modifierGroups?: ProductModifierLink[];
};

export type CatalogSyncResponse = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
  synced_at: string;
};

export type Customer = {
  id: number;
  brand_id: number;
  phone: string;
  name: string;
  address?: string | null;
  loyalty_points?: number;
  total_orders?: number;
};

export type CartModifier = {
  groupId: number;
  groupName: string;
  modifierId: number;
  name: string;
  price: number;
};

export type CartItem = {
  cartId: string;
  productId: number;
  productName: string;
  imageUrl?: string | null;
  quantity: number;
  basePrice: number;
  variant?: {
    id: number;
    name: string;
    price: number;
  };
  modifiers: CartModifier[];
  notes: string;
  taxRate: number;
};

export type HeldOrder = {
  id: string;
  orderType: OrderType;
  tableNo?: string;
  customerMode: CustomerMode;
  customer?: Customer;
  cart: CartItem[];
  discountPercent: number;
  heldAt: string;
};

export type RestaurantTable = {
  id: string;
  label: string;
  seats: number;
  status: TableStatus;
};
