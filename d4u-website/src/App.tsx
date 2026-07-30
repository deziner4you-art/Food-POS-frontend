import { useOutletContext } from 'react-router-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import BranchSelectorModal from './components/BranchSelectorModal';
import PublicLayout, { type PublicOutletContext } from './routes/PublicLayout';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import PromotionsPage from './pages/PromotionsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import AccountPage from './pages/AccountPage';
import CheckoutPage from './pages/CheckoutPage';
import TrackOrderPage from './pages/TrackOrderPage';

// Legacy quarantine — kept working, unmodified, until Phase 1's parity gate
// is confirmed. Reachable at /legacy?mode=kiosk|mobile|landing exactly as
// the old root-level `?mode=` contract worked, for rollback during
// verification. Reuses the same StoreProvider (one socket, one fetch
// lifecycle) instead of each legacy component opening its own.
import StitchLanding from './legacy/StitchLanding';
import KioskMode from './legacy/KioskMode';
import MobileMode from './legacy/MobileMode';

function PromotionsRoute() {
  const { setAppliedCoupon } = useOutletContext<PublicOutletContext>();
  return <PromotionsPage onApplyCoupon={setAppliedCoupon} />;
}

function CheckoutRoute() {
  const { appliedCoupon, setActiveOrder } = useOutletContext<PublicOutletContext>();
  return <CheckoutPage appliedCoupon={appliedCoupon} onOrderPlaced={setActiveOrder} />;
}

function TrackRoute() {
  const { activeOrder } = useOutletContext<PublicOutletContext>();
  return <TrackOrderPage activeOrder={activeOrder} />;
}

function LegacyRoute() {
  const { storeId, storeName, stores, selectStore, changeBranch, foodItems, cart, addToCart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart, banners, campaigns, settings } = useStore();
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');

  const sharedProps = {
    storeId: storeId as number,
    foodItems,
    cart,
    onAddToCart: addToCart,
    onRemoveFromCart: removeFromCart,
    onDecreaseQuantity: decreaseQuantity,
    onIncreaseQuantity: increaseQuantity,
    onClearCart: clearCart,
  };

  if (mode === 'mobile') return <MobileMode {...sharedProps} storeName={storeName} campaigns={campaigns} />;
  if (mode === 'kiosk') return <KioskMode {...sharedProps} />;
  return (
    <StitchLanding
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
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/promotions" element={<PromotionsRoute />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/checkout" element={<CheckoutRoute />} />
        <Route path="/track" element={<TrackRoute />} />
        <Route path="*" element={<HomePage />} />
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
