import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { BACKEND_URL } from './hooks/useStoreData';
import BranchSelectorModal from './components/BranchSelectorModal';
import { customSuccess, customAlert } from './utils/alerts';
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

// POS Order and website OnlineOrder are different Prisma models -- Order has
// total_amount/business_date and a real items relation (product.name
// included); OnlineOrder has totalAmount (string)/createdAt and items as a
// JSON string of {product_id, quantity, price} with no product name stored
// at all. Was previously always mapped as if every order were the OnlineOrder
// shape, so every POS-originated order in this history showed Rs. 0 and a
// blank placed-date.
function mapOrderForHistoryDisplay(o: any, customerName: string, customerPhone: string) {
  const isPos = o.__source === 'pos';
  const totalAmount = isPos ? Number(o.total_amount) || 0 : Number(o.totalAmount) || 0;
  const createdAt = isPos ? o.business_date : o.createdAt;
  // productId carried through for Re-Order to look up the current catalog
  // product and re-add it at today's price -- previously dropped here, so
  // Re-Order had no way to know which product a historic line even was.
  const items = isPos
    ? (o.items || []).map((i: any) => ({
        cartItemId: String(i.id),
        quantity: i.quantity,
        totalPrice: i.price * i.quantity,
        productId: i.product?.id ?? i.product_id,
        product: { name: i.product?.name || `Item #${i.product_id}` },
      }))
    : (() => {
        try {
          const parsed = JSON.parse(o.items || '[]');
          return (Array.isArray(parsed) ? parsed : []).map((i: any, idx: number) => ({
            cartItemId: `${o.id}-${idx}`,
            quantity: i.quantity || 1,
            totalPrice: (i.price || 0) * (i.quantity || 1),
            productId: i.product_id,
            // Online-order line items only ever stored product_id, never a
            // name -- an honest fallback label, not a fabricated one.
            product: { name: `Item #${i.product_id}` },
          }));
        } catch {
          return [];
        }
      })();

  return {
    id: String(o.id),
    orderNumber: String(o.id),
    createdAt: createdAt ? new Date(createdAt).toLocaleString() : '',
    status: (o.status || 'pending').toLowerCase(),
    orderType: 'delivery',
    items,
    subtotal: totalAmount,
    discount: 0,
    tax: 0,
    deliveryFee: 0,
    totalAmount,
    customerName,
    customerPhone,
    paymentMethod: 'cash',
  };
}

function AccountRoute() {
  const { loggedInUser, loginOrRegister, logout, addAddress, updateAddress, deleteAddress, products, favoriteProductIds, toggleFavorite, addToCart } = useStore();
  const { setQuickViewProduct } = useOutletContext<PublicOutletContext>();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [needsName, setNeedsName] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!loggedInUser) return;
    fetch(`${BACKEND_URL}/online-orders/auth/history/${loggedInUser.phone}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        // POS Order and website OnlineOrder are different Prisma models with
        // different field names (total_amount vs totalAmount, business_date
        // vs createdAt, a real items relation vs a JSON string with no
        // product name embedded) -- tag the source so the mapping below can
        // read the right field from each instead of assuming one shape.
        const all = [
          ...(data.orders || []).map((o: any) => ({ ...o, __source: 'pos' })),
          ...(data.onlineOrders || []).map((o: any) => ({ ...o, __source: 'online' })),
        ];
        setOrders(
          all
            .sort((a: any, b: any) => b.id - a.id)
            .map((o: any) => mapOrderForHistoryDisplay(o, loggedInUser.name, loggedInUser.phone)),
        );
        setLoyaltyTransactions(data.loyaltyTransactions || []);
      })
      .catch(() => {});
  }, [loggedInUser]);

  // Re-adds a historic order's items to the cart at TODAY's catalog price
  // (addToCart always prices off the live Product, never a stored historic
  // price) -- items whose product no longer exists in the catalog are
  // skipped rather than added at a stale/guessed price.
  const handleReorder = (order: any) => {
    let addedCount = 0;
    let skippedCount = 0;
    for (const item of order.items || []) {
      const product = products.find((p: any) => p.id === String(item.productId));
      if (product) {
        addToCart(product, {}, item.quantity || 1);
        addedCount++;
      } else {
        skippedCount++;
      }
    }
    if (addedCount === 0) {
      customAlert('None of these items are available anymore.');
    } else if (skippedCount > 0) {
      customSuccess(`${addedCount} item(s) added to cart at today's prices (${skippedCount} no longer available).`);
    } else {
      customSuccess(`${addedCount} item(s) added to cart at today's prices.`);
    }
  };

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
      onReorder={handleReorder}
      favoriteProductIds={favoriteProductIds}
      onQuickViewProduct={setQuickViewProduct}
      loyaltyTransactions={loyaltyTransactions}
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
