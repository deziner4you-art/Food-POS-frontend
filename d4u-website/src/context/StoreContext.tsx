import { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react';
import type { Category, CategoryGroup, CartItem, CustomerProfile, HeroSlide, Product, Promotion, ProductVariant } from '../types';
import { BACKEND_URL, useStoreData, useStores } from '../hooks/useStoreData';
import { getProductDiscount } from '../utils/campaignDiscount';

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
    // priceUSD (useStoreData.ts) is real_price / 280 -- a leftover from a
    // pre-PKR version of this site. `?? fi.priceRs` never actually fell back
    // since priceUSD is always a computed number, never undefined, so every
    // product on the live site has been displaying (and would have checked
    // out) at 1/280th its real price. priceRs is the actual catalog price.
    price: fi.priceRs ?? fi.priceUSD ?? 0,
    rating: 0,
    reviewCount: 0,
    imageUrl: fi.image ? (fi.image.startsWith('http') ? fi.image : `${BACKEND_URL}${fi.image}`) : '',
    categoryId: fi.category,
    categoryGroupId: fi.categoryGroup || undefined,
    tags: fi.tag ? [fi.tag] : [],
    isAvailable: true,
    stockCount: 999,
    // Raw shape from the catalog API is the ProductModifierGroup join row
    // ({modifierGroup: {id, name, is_required, min_selection, max_selection,
    // modifiers: [{id, name, additional_price}]}}) -- flattened here into
    // the website's own ModifierGroup/ModifierOption naming so
    // ProductQuickViewModal (which already expects .required/.options[].priceDelta)
    // needs no changes to consume it.
    modifierGroups: (fi.modifierGroups || []).map((mg: any) => ({
      id: mg.modifierGroup?.id,
      name: mg.modifierGroup?.name,
      required: !!mg.modifierGroup?.is_required,
      minSelections: mg.modifierGroup?.min_selection,
      maxSelections: mg.modifierGroup?.max_selection,
      options: (mg.modifierGroup?.modifiers || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        priceDelta: m.additional_price || 0,
      })),
    })),
    variants: (fi.variants || []).map((v: any) => ({ id: v.id, name: v.name, price: v.price })),
    categories: fi.categories || [],
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

function makeCartItemId(product: Product, selectedModifiers: { [groupId: string]: any[] }, selectedVariant?: ProductVariant): string {
  const modifierIds = Object.values(selectedModifiers)
    .flat()
    .map((o: any) => o.id)
    .sort()
    .join(',');
  const base = selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id;
  return modifierIds ? `${base}::${modifierIds}` : base;
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
  addToCart: (product: Product, selectedModifiers?: { [groupId: string]: any[] }, quantity?: number, specialInstructions?: string, selectedVariant?: ProductVariant) => void;
  increaseQuantity: (cartItemId: string) => void;
  decreaseQuantity: (cartItemId: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  // "Redeem all eligible loyalty points" -- shared between CartDrawer and
  // CheckoutView so toggling it in one is reflected in the other.
  redeemPoints: boolean;
  setRedeemPoints: (value: boolean) => void;

  loggedInUser: CustomerProfile | null;
  loginOrRegister: (phone: string, name?: string) => Promise<{ success: boolean; needsName?: boolean; message?: string }>;
  logout: () => void;
  addAddress: (label: string, address: string, isDefault?: boolean) => Promise<{ success: boolean; message?: string }>;
  updateAddress: (id: number, patch: { label?: string; address?: string; is_default?: boolean }) => Promise<{ success: boolean; message?: string }>;
  deleteAddress: (id: number) => Promise<{ success: boolean; message?: string }>;

  // Wishlist -- synced to the backend for a logged-in customer, kept in
  // localStorage only for a guest (merged into the backend list on login).
  favoriteProductIds: string[];
  toggleFavorite: (productId: string) => void;

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
  // Shared between CartDrawer and CheckoutView so the choice made in one
  // carries through to the other instead of resetting on navigation.
  const [redeemPoints, setRedeemPoints] = useState(false);
  const { foodItems, banners, campaigns, settings, categoryMeta, orderUpdate, riderPosition } = useStoreData(storeId);

  const [loggedInUser, setLoggedInUser] = useState<CustomerProfile | null>(() => {
    const saved = localStorage.getItem('d4u_web_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Wishlist. Guests get a local-only list so the heart icon still works
  // before logging in; logging in fetches (and one-time merges any local
  // guest picks into) the real backend list, then everything after that
  // point goes straight to the backend.
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('d4u_web_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!loggedInUser) return;
    let cancelled = false;
    fetch(`${BACKEND_URL}/online-orders/favorites/${loggedInUser.id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(async (remoteIds: number[]) => {
        if (cancelled) return;
        const remoteSet = new Set(remoteIds.map(String));
        // One-time merge: anything favorited as a guest (in localStorage)
        // that isn't already on the backend gets pushed up, so switching
        // from guest to logged-in doesn't silently drop picks.
        const guestOnly = favoriteProductIds.filter((id) => !remoteSet.has(id));
        for (const id of guestOnly) {
          try {
            await fetch(`${BACKEND_URL}/online-orders/favorites/toggle`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ customer_id: loggedInUser.id, product_id: Number(id) }),
            });
          } catch {
            // Best-effort merge -- a failed one just stays guest-local this session.
          }
        }
        if (!cancelled) setFavoriteProductIds([...remoteIds.map(String), ...guestOnly]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // Only re-run when the logged-in identity changes -- this intentionally
    // does not depend on favoriteProductIds (that would refire the merge
    // effect on every toggle).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser?.id]);

  const toggleFavorite = (productId: string) => {
    const isCurrentlyFavorite = favoriteProductIds.includes(productId);
    const next = isCurrentlyFavorite
      ? favoriteProductIds.filter((id) => id !== productId)
      : [...favoriteProductIds, productId];
    setFavoriteProductIds(next);

    if (!loggedInUser) {
      localStorage.setItem('d4u_web_favorites', JSON.stringify(next));
      return;
    }
    fetch(`${BACKEND_URL}/online-orders/favorites/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: loggedInUser.id, product_id: Number(productId) }),
    }).catch(() => {
      // Revert the optimistic update on network failure.
      setFavoriteProductIds(favoriteProductIds);
    });
  };

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
    selectedVariant?: ProductVariant,
  ) => {
    const cartItemId = makeCartItemId(product, selectedModifiers, selectedVariant);
    const modifierTotal = Object.values(selectedModifiers)
      .flat()
      .reduce((sum: number, opt: any) => sum + (opt.priceDelta || 0), 0);
    const unitPrice = (selectedVariant ? selectedVariant.price : product.price) + modifierTotal;

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
          selectedVariant,
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

  const clearCart = () => { setCart([]); setRedeemPoints(false); };

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
    // Without this, favoriteProductIds keeps holding this account's full
    // backend wishlist in memory after logout (it's only ever written back
    // to localStorage while logged OUT -- see toggleFavorite). The next
    // login's merge effect treats leftover React state as "guest picks made
    // before logging in" and pushes every one of them onto the NEW account,
    // so a brand-new user could see the previous account's wishlist. Wiping
    // both the state and the localStorage guest list on logout gives every
    // subsequent login (same device, same or different account) a clean
    // slate to merge from.
    setFavoriteProductIds([]);
    localStorage.removeItem('d4u_web_favorites');
    setRedeemPoints(false);
  };

  // Saved delivery addresses -- persist the updated customer object back to
  // state/localStorage the same way loginOrRegister already does, so every
  // consumer (AccountPage's Addresses tab, CheckoutView's picker) stays in
  // sync from one source without a separate re-fetch.
  const persistLoggedInUser = (customer: CustomerProfile) => {
    setLoggedInUser(customer);
    localStorage.setItem('d4u_web_user', JSON.stringify(customer));
  };

  const addAddress = async (label: string, address: string, isDefault = false) => {
    if (!loggedInUser) return { success: false, message: 'Not logged in' };
    try {
      const res = await fetch(`${BACKEND_URL}/online-orders/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: loggedInUser.id, label, address, is_default: isDefault }),
      });
      if (!res.ok) return { success: false, message: 'Could not save address' };
      const created = await res.json();
      const addresses = isDefault
        ? [...(loggedInUser.addresses || []).map((a) => ({ ...a, is_default: false })), created]
        : [...(loggedInUser.addresses || []), created];
      persistLoggedInUser({ ...loggedInUser, addresses });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const updateAddress = async (id: number, patch: { label?: string; address?: string; is_default?: boolean }) => {
    if (!loggedInUser) return { success: false, message: 'Not logged in' };
    try {
      const res = await fetch(`${BACKEND_URL}/online-orders/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: loggedInUser.id, ...patch }),
      });
      if (!res.ok) return { success: false, message: 'Could not update address' };
      const updated = await res.json();
      const addresses = (loggedInUser.addresses || []).map((a) =>
        a.id === id ? updated : patch.is_default ? { ...a, is_default: false } : a,
      );
      persistLoggedInUser({ ...loggedInUser, addresses });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const deleteAddress = async (id: number) => {
    if (!loggedInUser) return { success: false, message: 'Not logged in' };
    try {
      const res = await fetch(`${BACKEND_URL}/online-orders/addresses/${id}?customer_id=${loggedInUser.id}`, { method: 'DELETE' });
      if (!res.ok) return { success: false, message: 'Could not delete address' };
      const addresses = (loggedInUser.addresses || []).filter((a) => a.id !== id);
      persistLoggedInUser({ ...loggedInUser, addresses });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const selectedStore = stores.find((s) => s.id === storeId);
  const storeName = selectedStore ? selectedStore.name : 'D4U';

  const products = useMemo(() => (foodItems || []).map(mapFoodItemToProduct), [foodItems]);

  // Live discount badges — was previously an orphaned static field
  // (product.isDiscounted/discountPercentage/originalPrice were declared in
  // types.ts and read by ProductCard/MenuPage/ProductQuickViewModal, but
  // nothing anywhere ever set them, so every badge silently stayed off).
  // Mirrors POS's cartEngine.getProductDiscount so the same campaign
  // produces the same % on both surfaces. Overwriting `price` here (not just
  // adding originalPrice) means the cart/checkout math in StoreContext's own
  // addToCart (unitPrice = product.price) and cartMath.ts automatically
  // check out at the discounted price — no changes needed there.
  const discountedProducts = useMemo<Product[]>(() => {
    if (!campaigns || campaigns.length === 0) return products;
    return products.map((p) => {
      const categoryNumericId = categoryMeta[p.categoryId]?.id;
      const pct = getProductDiscount(p.price, Number(p.id), categoryNumericId, campaigns, storeId ?? undefined);
      if (pct <= 0) return p;
      return {
        ...p,
        price: Math.round(p.price * (1 - pct / 100) * 100) / 100,
        originalPrice: p.price,
        discountPercentage: pct,
        isDiscounted: true,
      };
    });
  }, [products, campaigns, categoryMeta, storeId]);

  // categoryGroupId here comes from the first product found in that category
  // -- every product sharing a categoryId already shares the same
  // categoryGroupId (both are just the group/category name string stamped
  // onto each product by mapFoodItemToProduct), so this is a safe 1:1 lookup,
  // not an arbitrary pick.
  const categories = useMemo<Category[]>(() => {
    const names = Array.from(new Set(products.map((p) => p.categoryId).filter(Boolean))) as string[];
    return names.map((name) => {
      const meta = categoryMeta[name];
      return {
        id: name,
        name,
        iconName: 'Utensils',
        imageUrl: meta?.imageUrl || '',
        categoryGroupId: products.find((p) => p.categoryId === name)?.categoryGroupId,
        displayOrder: meta?.sortOrder ?? 0,
        itemCount: products.filter((p) => p.categoryId === name).length,
        isFeatured: meta?.isFeatured ?? false,
      };
    });
  }, [products, categoryMeta]);

  // Was always created with categories: [] -- MenuPage's group-expand tree
  // depended on group.categories to list a group's children and could never
  // show any, regardless of expand state. Populated here from `categories`
  // (computed above) instead of duplicating the products.filter logic.
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const names = Array.from(new Set(products.map((p) => p.categoryGroupId).filter(Boolean))) as string[];
    return names.map((name) => ({
      id: name,
      name,
      description: '',
      iconName: 'Menu',
      displayOrder: 0,
      categories: categories.filter((c) => c.categoryGroupId === name),
    }));
  }, [products, categories]);

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
      products: discountedProducts,
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
      redeemPoints,
      setRedeemPoints,
      loggedInUser,
      loginOrRegister,
      logout,
      addAddress,
      updateAddress,
      deleteAddress,
      favoriteProductIds,
      toggleFavorite,
      kioskMode,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stores, storeId, storeName, foodItems, banners, campaigns, settings, orderUpdate, riderPosition, discountedProducts, categories, categoryGroups, heroSlides, promotions, cart, redeemPoints, loggedInUser, favoriteProductIds, kioskMode],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}



