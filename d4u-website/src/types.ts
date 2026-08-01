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
  modifierGroups?: any[];
  categories?: any[];
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



// === STITCH TYPES ===
export type AppMode = 'website' | 'cms';
export type ActiveWebsitePage = 'home' | 'menu' | 'promotions' | 'about' | 'contact' | 'checkout' | 'profile';
export type ActiveCMSPage = 'dashboard' | 'hero' | 'promotions' | 'menu' | 'staff' | 'branches' | 'seo' | 'analytics' | 'settings';

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  options: ModifierOption[];
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Small", "Medium", "Large"
  price: number;
}

export interface Product {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  categoryId: string;
  categoryGroupId?: string;
  tags: string[]; // e.g. ["Chef Special", "Spicy", "Bestseller"]
  isBestSeller?: boolean;
  isDiscounted?: boolean;
  isAvailable: boolean;
  stockCount: number;
  calories?: number;
  prepTimeMinutes?: number;
  modifierGroups?: ModifierGroup[];
  variants?: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  imageUrl: string;
  categoryGroupId?: string;
  displayOrder: number;
  itemCount?: number;
}

export interface CategoryGroup {
  id: string;
  name: string;
  description: string;
  iconName: string;
  displayOrder: number;
  categories: Category[];
}

export interface HeroSlide {
  id: string;
  title: string;
  highlightText: string;
  subtitle: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  ctaText: string;
  ctaLink: string;
  priority: number;
  isVisible: boolean;
  scheduleStart?: string;
  scheduleEnd?: string;
}

export interface Promotion {
  id: string;
  title: string;
  code: string;
  subtitle: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'bogo';
  discountValue: number;
  bannerImageUrl: string;
  badgeText: string;
  targetCategoryIds?: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  minOrderValue?: number;
}

export interface RestaurantService {
  id: string;
  title: string;
  description: string;
  iconName: string;
  colorHex: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Chef' | 'Manager' | 'Pitmaster' | 'Sommelier' | 'Barista';
  designation: string;
  bio: string;
  photoUrl: string;
  specialtyDish?: string;
  displayOrder: number;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  openingHours: string;
  isOpen: boolean;
  lat: number;
  lng: number;
  imageUrl: string;
}

export interface CustomerReview {
  id: string;
  customerName: string;
  customerAvatar: string;
  rating: number;
  comment: string;
  date: string;
  orderedItemName: string;
  verifiedPurchase: boolean;
}

export interface CartItem {
  cartItemId: string; // unique ID for specific item + modifiers + variant combo
  product: Product;
  quantity: number;
  selectedModifiers: { [groupId: string]: ModifierOption[] };
  selectedVariant?: ProductVariant;
  specialInstructions?: string;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';
export type OrderType = 'delivery' | 'pickup' | 'dine_in';

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  orderType: OrderType;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  tableNumber?: string;
  paymentMethod: 'card' | 'apple_pay' | 'cash' | 'pos_points';
  estimatedDeliveryTime?: string;
  driverName?: string;
  driverPhone?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  loyaltyTier: 'Gold Member' | 'Platinum Member' | 'VIP';
  loyaltyPoints: number;
  savedAddresses: { id: string; label: string; address: string }[];
  favoriteProductIds: string[];
}

export interface SEOConfig {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImageUrl: string;
  canonicalUrl: string;
  schemaType: string;
}

export interface CMSAnalytics {
  totalVisitorsToday: number;
  totalOrdersToday: number;
  totalRevenueToday: number;
  activeCampaignCount: number;
  conversionRate: number;
  avgOrderValue: number;
}
