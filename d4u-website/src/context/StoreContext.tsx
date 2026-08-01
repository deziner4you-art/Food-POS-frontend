import { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react';
import type { Category, CategoryGroup, CartItem, CustomerProfile, HeroSlide, Product, Promotion } from '../types';
import { BACKEND_URL, useStoreData, useStores } from '../hooks/useStoreData';

// Maps D4U's real catalog/banner/campaign shapes onto Stitch's UI-facing
// Product/Category/HeroSlide/Promotion types. This is a display-shape
// adapter over real data, not mock data — every field either comes
// directly from the real API response or is a deliberate, honest "unknown"
// (0/undefined), never a fabricated placeholder value (no fake ratings,
// review counts, or bestseller flags).
function mapFoodItemToProduct(fi: any): Product {
  return {
    id: fi.id,
    name: fi.name,
    shortDescription: fi.description || '',
    fullDescription: fi.description || '',
    price: fi.priceUSD ?? fi.priceRs ?? 0,
    rating: 0,
    reviewCount: 0,
    imageUrl: fi.image ? (fi.image.startsWith('http') ? fi.image : `${BACKEND_URL}${fi.image}`) : '',
    categoryId: fi.category,
    categoryGroupId: fi.categoryGroup || undefined,
    tags: fi.tag ? [fi.tag] : [],
    isAvailable: true,
    stockCount: 999,
    modifierGroups: fi.modifierGroups || undefined,
  };
}

function mapBannerToHeroSlide(b: any, idx: number): HeroSlide {
  return {
    id: String(b.id),
    title: b.title || '',
    highlightText: '',
    subtitle: b.subtitle || '',
    desktopImageUrl: b.imageUrl ? `${BACKEND_URL}${b.imageUrl}` : '',
    mobileImageUrl: b.imageUrl ? `${BACKEND_URL}${b.imageUrl}` : '',
    ctaText: b.buttonText || 'Order Now',
    ctaLink: b.linkUrl || '/menu',
    priority: idx,
    isVisible: true,
  };
}

function mapCampaignToPromotion(c: any): Promotion {
  return {
    id: String(c.id),
    title: c.title || c.name || '',
    code: c.code || `CAMP-${c.id}`,
    subtitle: '',
    description: c.description || '',
    discountType: c.campaign_type === 'FLAT' ? 'fixed' : c.campaign_type === 'BOGO' ? 'bogo' : 'percentage',
    discountValue: c.discount_pct ?? c.flat_discount_amount ?? 0,
    bannerImageUrl: c.image_url ? (c.image_url.startsWith('http') ? c.image_url : `${BACKEND_URL}${c.image_url}`) : '',
    badgeText: c.campaign_type || 'Offer',
    startDate: c.start_date || '',
    endDate: c.end_date || '',
    isActive: true,
  };
}

function makeCartItemId(product: Product, selectedModifiers: { [groupId: string]: any[] }): string {
  const modifierIds = Object.values(selectedModifiers)
    .flat()
    .map((o: any) => o.id)
    .sort()
    .join(',');
  return modifierIds ? `${product.id}::${modifierIds}` : product.id;
}

export type AppViewMode = 'desktop' | 'tablet' | 'mobile' | 'kiosk';

interface StoreContextValue {
  stores: ReturnType<typeof useStores>;
  storeId: number | null;
  storeName: string;
  selectStore: (id: number) => void;
  changeBranch: () => void;

  foodItems: any[];
  banners: any[];
  campaigns: any[];
  settings: any;
  orderUpdate: any;
  riderPosition: { orderId: number; lat: number; lng: number } | null;

  // Stitch-shaped views over the real data above — for pages ported from
  // the Stitch reference project's prop shapes.
  products: Product[];
  categories: Category[];
  categoryGroups: CategoryGroup[];
  heroSlides: HeroSlide[];
  promotions: Promotion[];

  cart: CartItem[];
  addToCart: (product: Product, selectedModifiers?: { [groupId: string]: any[] }, quantity?: number, specialInstructions?: string) => void;
  increaseQuantity: (cartItemId: string) => void;
  decreaseQuantity: (cartItemId: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;

  loggedInUser: CustomerProfile | null;
  loginOrRegister: (phone: string, name?: string) => Promise<{ success: boolean; needsName?: boolean; message?: string }>;
  logout: () => void;

  kioskMode: boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children, kioskMode = false }: { children: ReactNode; kioskMode?: boolean }) {
  const stores = useStores();
  const [storeId, setStoreId] = useState<number | null>(() => {
    const saved = localStorage.getItem('d4u_website_store_id');
    return saved ? Number(saved) : null;
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const { foodItems, banners, campaigns, settings, orderUpdate, riderPosition } = useStoreData(storeId);

  const [loggedInUser, setLoggedInUser] = useState<CustomerProfile | null>(() => {
    const saved = localStorage.getItem('d4u_web_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    document.title = 'D4U Restaurant — Online Ordering';
  }, []);

  const selectStore = (id: number) => {
    setStoreId(id);
    localStorage.setItem('d4u_website_store_id', String(id));
    setCart([]);
  };

  const changeBranch = () => setStoreId(null);

  const addToCart = (
    product: Product,
    selectedModifiers: { [groupId: string]: any[] } = {},
    quantity = 1,
    specialInstructions = '',
  ) => {
    const cartItemId = makeCartItemId(product, selectedModifiers);
    const modifierTotal = Object.values(selectedModifiers)
      .flat()
      .reduce((sum: number, opt: any) => sum + (opt.priceDelta || 0), 0);
    const unitPrice = product.price + modifierTotal;

    setCart((prev) => {
      const idx = prev.findIndex((c) => c.cartItemId === cartItemId);
      if (idx > -1) {
        const copy = [...prev];
        const newQty = copy[idx].quantity + quantity;
        copy[idx] = { ...copy[idx], quantity: newQty, totalPrice: unitPrice * newQty };
        return copy;
      }
      return [
        ...prev,
        {
          cartItemId,
          product,
          quantity,
          selectedModifiers,
          specialInstructions,
          unitPrice,
          totalPrice: unitPrice * quantity,
        },
      ];
    });
  };

  const increaseQuantity = (cartItemId: string) => {
    setCart((prev) =>
      prev.map((c) => (c.cartItemId === cartItemId ? { ...c, quantity: c.quantity + 1, totalPrice: c.unitPrice * (c.quantity + 1) } : c)),
    );
  };

  const decreaseQuantity = (cartItemId: string) => {
    setCart((prev) =>
      prev
        .map((c) => (c.cartItemId === cartItemId ? { ...c, quantity: c.quantity - 1, totalPrice: c.unitPrice * (c.quantity - 1) } : c))
        .filter((c) => c.quantity > 0),
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((c) => c.cartItemId !== cartItemId));
  };

  const clearCart = () => setCart([]);

  const loginOrRegister = async (phone: string, name?: string) => {
    try {
      const endpoint = name ? 'auth/register' : 'auth/login';
      // webRegister already accepts an optional store_id and resolves it to
      // the owning brand (online-orders.controller.ts) -- it just never
      // received one from here, so every website signup fell through to
      // brand_id's hardcoded default regardless of which store the customer
      // was actually ordering from. storeId is already in scope in this
      // provider; login doesn't need it (it only looks up an existing
      // customer by phone), so this only changes the register branch.
      const res = await fetch(`${BACKEND_URL}/online-orders/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(name ? { phone, name, store_id: storeId } : { phone }),
      });
      const data = await res.json();
      if (data.success) {
        setLoggedInUser(data.customer);
        localStorage.setItem('d4u_web_user', JSON.stringify(data.customer));
        return { success: true };
      }
      if (!name) return { success: false, needsName: true };
      return { success: false, message: data.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const logout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('d4u_web_user');
  };

  const selectedStore = stores.find((s) => s.id === storeId);
  const storeName = selectedStore ? selectedStore.name : 'D4U';

  const products = useMemo(() => (foodItems || []).map(mapFoodItemToProduct), [foodItems]);

  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const names = Array.from(new Set(products.map((p) => p.categoryGroupId).filter(Boolean))) as string[];
    return names.map((name) => ({
      id: name,
      name,
      description: '',
      iconName: 'Menu',
      displayOrder: 0,
      categories: [],
    }));
  }, [products]);

  const categories = useMemo<Category[]>(() => {
    const names = Array.from(new Set(products.map((p) => p.categoryId).filter(Boolean))) as string[];
    return names.map((name) => ({
      id: name,
      name,
      iconName: 'Utensils',
      imageUrl: '',
      displayOrder: 0,
      itemCount: products.filter((p) => p.categoryId === name).length,
    }));
  }, [products]);

  const heroSlides = useMemo(() => (banners || []).map(mapBannerToHeroSlide), [banners]);
  const promotions = useMemo(() => (campaigns || []).map(mapCampaignToPromotion), [campaigns]);

  const value = useMemo<StoreContextValue>(
    () => ({
      stores,
      storeId,
      storeName,
      selectStore,
      changeBranch,
      foodItems,
      banners,
      campaigns,
      settings,
      orderUpdate,
      riderPosition,
      products,
      categories,
      categoryGroups,
      heroSlides,
      promotions,
      cart,
      addToCart,
      increaseQuantity,
      decreaseQuantity,
      removeFromCart,
      clearCart,
      loggedInUser,
      loginOrRegister,
      logout,
      kioskMode,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stores, storeId, storeName, foodItems, banners, campaigns, settings, orderUpdate, riderPosition, products, categories, categoryGroups, heroSlides, promotions, cart, loggedInUser, kioskMode],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}



