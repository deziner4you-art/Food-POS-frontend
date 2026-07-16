import { useState, useEffect } from 'react';
import type { CartItem, FoodItem } from './types';
import StitchLanding from './components/StitchLanding';
import KioskMode from './components/KioskMode';
import MobileMode from './components/MobileMode';
import BranchSelectorModal from './components/BranchSelectorModal';

const BACKEND_URL = 'https://pos-api.deziner4you.com';

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  
  const [banners, setBanners] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const [viewMode, setViewMode] = useState<'landing' | 'kiosk' | 'mobile'>(() => {
    const w = window.innerWidth;
    if (w <= 640) return 'mobile';
    if (w <= 1024) return 'kiosk';
    return 'landing';
  });

  useEffect(() => {
    document.title = 'D4U Restaurant — Online Ordering';
    const onResize = () => {
      const w = window.innerWidth;
      if (w <= 640) setViewMode('mobile');
      else if (w <= 1024) setViewMode('kiosk');
      else setViewMode('landing');
    };
    window.addEventListener('resize', onResize);

    // Fetch Stores
    const fetchStores = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/stores`);
        if (res.ok) setStores(await res.json());
      } catch (err) { console.error('Failed to fetch stores:', err); }
    };
    fetchStores();

    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!selectedStoreId) return;
    
    // Fetch dynamic catalog for selected store
    const fetchCatalog = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/catalog/sync/${selectedStoreId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.products && data.categories) {
            const mappedItems: FoodItem[] = (data.products || []).map((p: any) => {
              const catName = p.categories && p.categories.length > 0 ? p.categories[0].name : 'Uncategorized';
              return {
                id: String(p.id),
                name: p.name,
                priceRs: p.price,
                priceUSD: parseFloat((p.price / 280).toFixed(2)),
                description: p.sku || 'Delicious item from our menu',
                image: p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
                category: catName,
                tag: 'New',
                preparationTime: '10 mins',
                calories: 500
              };
            });
            setFoodItems(mappedItems);
          }
        }
      } catch (err) {
        console.error('Failed to fetch catalog:', err);
      }
    };

    const fetchCMS = async () => {
      try {
        const [bannersRes, settingsRes, campaignsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/cms/banners`), 
          fetch(`${BACKEND_URL}/cms/settings/${selectedStoreId}`),
          fetch(`${BACKEND_URL}/marketing/campaign`)
        ]);
        if (bannersRes.ok) setBanners(await bannersRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
        if (campaignsRes.ok) {
          const allCamps = await campaignsRes.json();
          setCampaigns(allCamps.filter((c: any) => c.published_web));
        }
      } catch (e) { console.error(e); }
    };

    fetchCatalog();
    fetchCMS();
  }, [selectedStoreId]);

  const handleSelectStore = (id: number) => {
    setSelectedStoreId(id);
    localStorage.setItem('d4u_website_store_id', String(id));
    setCart([]); // Clear cart when switching branch
  };

  const handleAddToCart = (item: FoodItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.foodItem.id === item.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { foodItem: item, quantity: 1 }];
    });
  };

  const handleDecreaseQuantity = (itemId: string) => {
    setCart(prev =>
      prev.map(c => c.foodItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)
         .filter(c => c.quantity > 0)
    );
  };

  const handleIncreaseQuantity = (itemId: string) => {
    setCart(prev =>
      prev.map(c => c.foodItem.id === itemId ? { ...c, quantity: c.quantity + 1 } : c)
    );
  };

  const handleRemoveFromCart = (itemId: string, removeAll?: boolean) => {
    if (removeAll) {
      setCart(prev => prev.filter(c => c.foodItem.id !== itemId));
    } else {
      setCart(prev => prev.filter(c => c.foodItem.id !== itemId));
    }
  };

  const handleClearCart = () => setCart([]);

  const selectedStore = (stores || []).find(s => s.id === selectedStoreId);
  const storeName = selectedStore ? selectedStore.name : 'D4U';

  if (!selectedStoreId) {
    return <BranchSelectorModal stores={stores || []} onSelect={handleSelectStore} />;
  }

  if (viewMode === 'mobile') {
    return (
      <MobileMode
        storeId={selectedStoreId}
        storeName={storeName}
        foodItems={foodItems}
        cart={cart}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onDecreaseQuantity={handleDecreaseQuantity}
        onIncreaseQuantity={handleIncreaseQuantity}
        onClearCart={handleClearCart}
        campaigns={campaigns}
      />
    );
  }

  if (viewMode === 'kiosk') {
    return (
      <KioskMode
        storeId={selectedStoreId}
        foodItems={foodItems}
        cart={cart}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onDecreaseQuantity={handleDecreaseQuantity}
        onIncreaseQuantity={handleIncreaseQuantity}
        onClearCart={handleClearCart}
      />
    );
  }

  return (
    <>
      <StitchLanding
        storeId={selectedStoreId}
        storeName={storeName}
        stores={stores}
        onStoreChange={handleSelectStore}
        onChangeBranch={() => setSelectedStoreId(null)}
        foodItems={foodItems}
        cart={cart}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onDecreaseQuantity={handleDecreaseQuantity}
        onIncreaseQuantity={handleIncreaseQuantity}
        onClearCart={handleClearCart}
        banners={banners}
        campaigns={campaigns}
        settings={settings}
      />
      {settings?.whatsappNumber && (
        <a 
          href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`} 
          target="_blank" 
          rel="noreferrer"
          className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 animate-bounce"
        >
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </>
  );
}
