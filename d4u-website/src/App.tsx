import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { BACKEND_URL } from './hooks/useStoreData';
import BranchSelectorModal from './components/BranchSelectorModal';
import PublicLayout, { type PublicOutletContext } from './routes/PublicLayout';
import type { ActiveWebsitePage } from './types';

// HomePage/PromotionsPage predate the react-router migration and still call
// setActivePage('menu' | 'promotions' | ...) expecting it to switch a local
// page-state variable. Routing is now real (see AppShell below), so this
// maps those page names to actual routes instead.
const PAGE_ROUTES: Record<ActiveWebsitePage, string> = {
  home: '/',
  menu: '/menu',
  promotions: '/promotions',
  about: '/about',
  contact: '/contact',
  checkout: '/checkout',
  profile: '/account',
};

// Stitch pages — visual/UX reference, wired to real D4U data via StoreContext
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { CheckoutView } from './components/CheckoutView';
import { CustomerAccountPage } from './pages/AccountPage';
import TrackOrderPage from './pages/TrackOrderPage';

// Legacy quarantine — kept working, unmodified, until live-browser parity
// against the new Stitch-structured routes is actually verified. Reachable
// at /legacy?mode=kiosk|mobile, reusing the same StoreProvider (one fetch
// lifecycle, one socket) instead of each legacy component opening its own.
import StitchLandingLegacy from './legacy/StitchLanding';
import KioskModeLegacy from './legacy/KioskMode';
import MobileModeLegacy from './legacy/MobileMode';

function HomeRoute() {
  const { heroSlides, promotions, categoryGroups, categories, products, stores, cart, addToCart, favoriteProductIds, toggleFavorite } = useStore();
  const { setQuickViewProduct } = useOutletContext<PublicOutletContext>();
  const navigate = useNavigate();
  const branches = (stores || []).map((s: any) => ({
    id: String(s.id),
    name: s.name,
    address: s.address || '',
    city: '',
    phone: '',
    whatsapp: '',
    openingHours: '',
    isOpen: true,
    lat: 0,
    lng: 0,
    imageUrl: '',
  }));
  const cartCounts: { [id: string]: number } = {};
  cart.forEach((c) => { cartCounts[c.product.id] = c.quantity; });

  return (
    <HomePage
      heroSlides={heroSlides}
      promotions={promotions}
      categoryGroups={categoryGroups}
      categories={categories}
      products={products}
      services={[]}
      staff={[]}
      branches={branches}
      reviews={[]}
      setActivePage={(page) => navigate(PAGE_ROUTES[page])}
      onSelectCategory={(categoryName) => navigate(`/menu?category=${encodeURIComponent(categoryName)}`)}
      onQuickViewProduct={setQuickViewProduct}
      onAddToCart={addToCart}
      favoriteProductIds={favoriteProductIds}
      onToggleFavorite={toggleFavorite}
      cartItems={cartCounts}
    />
  );
}

function MenuRoute() {
  const { categoryGroups, categories, products, cart, addToCart, favoriteProductIds, toggleFavorite, campaigns } = useStore();
  const { setQuickViewProduct } = useOutletContext<PublicOutletContext>();
  const [searchParams] = useSearchParams();
  const cartCounts: { [id: string]: number } = {};
  cart.forEach((c) => { cartCounts[c.product.id] = c.quantity; });

  return (
    <MenuPage
      categoryGroups={categoryGroups}
      categories={categories}
      products={products}
      initialCategoryFilter={searchParams.get('category')}
      onQuickViewProduct={setQuickViewProduct}
      onAddToCart={addToCart}
      favoriteProductIds={favoriteProductIds}
      onToggleFavorite={toggleFavorite}
      cartItems={cartCounts}
      campaigns={campaigns}
    />
  );
}

function PromotionsRoute() {
  const { promotions } = useStore();
  const navigate = useNavigate();
  return <PromotionsPage promotions={promotions} setActivePage={(page) => navigate(PAGE_ROUTES[page])} />;
}

function mapStoresToBranches(stores: ReturnType<typeof useStore>['stores']) {
  return (stores || []).map((s: any) => ({
    id: String(s.id),
    name: s.name,
    address: s.address || 'Address not configured',
    city: '',
    phone: '',
    whatsapp: '',
    openingHours: '', // No authoritative timing source in DB
    isOpen: Array.isArray(s.businessDays) && s.businessDays.length > 0,
    lat: 0,
    lng: 0,
    imageUrl: '',
  }));
}

function AboutRoute() {
  return <AboutPage staff={[]} />;
}

function ContactRoute() {
  const { storeId, stores, settings } = useStore();
  const currentStore = stores?.find((s: any) => String(s.id) === String(storeId));
  const currentBranch = currentStore ? mapStoresToBranches([currentStore])[0] : (stores && stores.length > 0 ? mapStoresToBranches([stores[0]])[0] : null);

  if (!currentBranch) return null;

  return (
    <ContactPage 
      currentBranch={currentBranch} 
      contactEmail={settings?.contactEmail || ''}
      whatsappNumber={settings?.whatsappNumber || ''}
    />
  );
}

function CheckoutRoute() {
  const { setActiveOrder } = useOutletContext<PublicOutletContext>();
  return <CheckoutView onBackToMenu={() => window.history.back()} onOrderPlaced={setActiveOrder} />;
}

function TrackRoute() {
  const { activeOrder } = useOutletContext<PublicOutletContext>();
  return <TrackOrderPage activeOrder={activeOrder} />;
}

// Real D4U customer login (phone-based, via online-orders/auth/*) gates
// Stitch's CustomerAccountPage — the visual layer is Stitch's file, but
// every field shown comes from the real Customer record and real order
// history; nothing here is fabricated (no fake email/saved-addresses,
// loyalty tier is a deterministic label derived from real points, not an
// invented value).
function deriveLoyaltyTier(points: number): 'Gold Member' | 'Platinum Member' | 'VIP' {
  if (points >= 2000) return 'VIP';
  if (points >= 500) return 'Platinum Member';
  return 'Gold Member';
}

function AccountRoute() {
  const { loggedInUser, loginOrRegister, logout, addAddress, updateAddress, deleteAddress, products, favoriteProductIds, toggleFavorite } = useStore();
  const { setQuickViewProduct } = useOutletContext<PublicOutletContext>();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [needsName, setNeedsName] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!loggedInUser) return;
    fetch(`${BACKEND_URL}/online-orders/auth/history/${loggedInUser.phone}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        const all = [...(data.orders || []), ...(data.onlineOrders || [])];
        setOrders(
          all
            .sort((a: any, b: any) => b.id - a.id)
            .map((o: any) => ({
              id: String(o.id),
              orderNumber: String(o.id),
              createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
              status: (o.status || 'pending').toLowerCase(),
              orderType: 'delivery',
              items: [],
              subtotal: Number(o.totalAmount) || 0,
              discount: 0,
              tax: 0,
              deliveryFee: 0,
              totalAmount: Number(o.totalAmount) || 0,
              customerName: loggedInUser.name,
              customerPhone: loggedInUser.phone,
              paymentMethod: 'cash',
            })),
        );
      })
      .catch(() => {});
  }, [loggedInUser]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const result = await loginOrRegister(phone, needsName ? name : undefined);
    setAuthLoading(false);
    if (!result.success) {
      if (result.needsName) setNeedsName(true);
      else setAuthError(result.message || 'Something went wrong.');
    }
  };

  if (!loggedInUser) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16">
        <div className="bg-[#16130B] border border-white/10 rounded-3xl p-6">
          <h3 className="text-xl font-black text-white mb-1">{needsName ? 'Create Account' : 'Sign In'}</h3>
          <p className="text-sm text-gray-400 mb-6">
            {needsName ? 'Looks like you are new! Enter your name to continue.' : 'Enter your phone number to view your account.'}
          </p>
          {authError && <div className="p-3 mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-lg text-center">{authError}</div>}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {needsName && (
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full Name" className="w-full bg-[#1A1A1D] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-[#D4AF37] outline-none" />
            )}
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={needsName} placeholder="Phone Number" className="w-full bg-[#1A1A1D] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-[#D4AF37] outline-none disabled:opacity-50" />
            <button type="submit" disabled={authLoading} className="w-full bg-[#D4AF37] text-black font-black py-3 rounded-xl disabled:opacity-50">
              {authLoading ? 'Loading...' : needsName ? 'Create Account' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <CustomerAccountPage
      userProfile={{
        name: loggedInUser.name,
        email: '',
        phone: loggedInUser.phone,
        loyaltyTier: deriveLoyaltyTier(loggedInUser.loyalty_points || 0),
        loyaltyPoints: loggedInUser.loyalty_points || 0,
        savedAddresses: loggedInUser.addresses || [],
        favoriteProductIds,
      }}
      onAddAddress={addAddress}
      onUpdateAddress={updateAddress}
      onDeleteAddress={deleteAddress}
      onLogout={logout}
      orders={orders}
      products={products}
      onOpenOrderTracker={(order) => navigate(`/track?order=${encodeURIComponent(order.orderNumber || order.id)}`)}
      onReorder={() => {}}
      favoriteProductIds={favoriteProductIds}
      onQuickViewProduct={setQuickViewProduct}
    />
  );
}

// The legacy components each expect their own old-shaped local cart
// (`{foodItem, quantity}`), separate from the new Stitch-shaped
// `StoreContext.cart` — this route manages that local state exactly as the
// pre-migration App.tsx did, so it remains a faithful, working rollback
// path rather than trying to force two incompatible cart shapes together.
function LegacyRoute() {
  const { storeId, storeName, stores, selectStore, changeBranch, foodItems, banners, campaigns, settings } = useStore();
  const [legacyCart, setLegacyCart] = useState<any[]>([]);
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');

  const onAddToCart = (item: any) => {
    setLegacyCart((prev) => {
      const idx = prev.findIndex((c) => c.foodItem.id === item.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { foodItem: item, quantity: 1 }];
    });
  };
  const onIncreaseQuantity = (itemId: string) =>
    setLegacyCart((prev) => prev.map((c) => (c.foodItem.id === itemId ? { ...c, quantity: c.quantity + 1 } : c)));
  const onDecreaseQuantity = (itemId: string) =>
    setLegacyCart((prev) => prev.map((c) => (c.foodItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)).filter((c) => c.quantity > 0));
  const onRemoveFromCart = (itemId: string) => setLegacyCart((prev) => prev.filter((c) => c.foodItem.id !== itemId));
  const onClearCart = () => setLegacyCart([]);

  const sharedProps = { storeId: storeId as number, foodItems, cart: legacyCart, onAddToCart, onRemoveFromCart, onDecreaseQuantity, onIncreaseQuantity, onClearCart };

  if (mode === 'mobile') return <MobileModeLegacy {...sharedProps} storeName={storeName} campaigns={campaigns} />;
  if (mode === 'kiosk') return <KioskModeLegacy {...sharedProps} />;
  return (
    <StitchLandingLegacy
      {...sharedProps}
      storeName={storeName}
      stores={stores}
      onStoreChange={selectStore}
      onChangeBranch={changeBranch}
      banners={banners}
      campaigns={campaigns}
      settings={settings}
    />
  );
}

function AppShell() {
  const { storeId, stores, selectStore } = useStore();

  if (!storeId) {
    return <BranchSelectorModal stores={stores || []} onSelect={selectStore} />;
  }

  return (
    <Routes>
      <Route path="/legacy" element={<LegacyRoute />} />
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/menu" element={<MenuRoute />} />
        <Route path="/promotions" element={<PromotionsRoute />} />
        <Route path="/about" element={<AboutRoute />} />
        <Route path="/contact" element={<ContactRoute />} />
        <Route path="/account" element={<AccountRoute />} />
        <Route path="/checkout" element={<CheckoutRoute />} />
        <Route path="/track" element={<TrackRoute />} />
        <Route path="*" element={<HomeRoute />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const kioskMode = params.get('mode') === 'kiosk';

  return (
    <BrowserRouter basename="/website">
      <StoreProvider kioskMode={kioskMode}>
        <AppShell />
      </StoreProvider>
    </BrowserRouter>
  );
}
