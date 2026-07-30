import { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react';
import type { CartItem, CustomerProfile, FoodItem } from '../types';
import { BACKEND_URL, useStoreData, useStores } from '../hooks/useStoreData';

export type AppViewMode = 'desktop' | 'tablet' | 'mobile' | 'kiosk';

interface StoreContextValue {
  stores: ReturnType<typeof useStores>;
  storeId: number | null;
  storeName: string;
  selectStore: (id: number) => void;
  changeBranch: () => void;

  foodItems: FoodItem[];
  banners: any[];
  campaigns: any[];
  settings: any;
  orderUpdate: any;

  cart: CartItem[];
  addToCart: (item: FoodItem) => void;
  increaseQuantity: (itemId: string) => void;
  decreaseQuantity: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
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
  const { foodItems, banners, campaigns, settings, orderUpdate } = useStoreData(storeId);

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

  const addToCart = (item: FoodItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.foodItem.id === item.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { foodItem: item, quantity: 1 }];
    });
  };

  const increaseQuantity = (itemId: string) => {
    setCart((prev) => prev.map((c) => (c.foodItem.id === itemId ? { ...c, quantity: c.quantity + 1 } : c)));
  };

  const decreaseQuantity = (itemId: string) => {
    setCart((prev) =>
      prev.map((c) => (c.foodItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)).filter((c) => c.quantity > 0),
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.foodItem.id !== itemId));
  };

  const clearCart = () => setCart([]);

  const loginOrRegister = async (phone: string, name?: string) => {
    try {
      const endpoint = name ? 'auth/register' : 'auth/login';
      const res = await fetch(`${BACKEND_URL}/online-orders/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(name ? { phone, name } : { phone }),
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
    [stores, storeId, storeName, foodItems, banners, campaigns, settings, orderUpdate, cart, loggedInUser, kioskMode],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
