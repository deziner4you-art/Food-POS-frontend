import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import { CartDrawer } from '../components/shared/CartDrawer';
import { ProductQuickViewModal } from '../components/ProductQuickViewModal';
import { OrderTrackerModal } from '../components/OrderTrackerModal';
import { useStore } from '../context/StoreContext';
import { getCustomerStatusLabel, isOrderTerminal } from '../utils/orderStatusMapper';
import { ArrowRight } from 'lucide-react';
import type { Product } from '../types';

export interface PublicOutletContext {
  activeOrder: any;
  setActiveOrder: (o: any) => void;
  setQuickViewProduct: (p: Product | null) => void;
}

export default function PublicLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { 
    settings, 
    kioskMode, 
    addToCart, 
    activeOrder, 
    setActiveOrder, 
    isTrackerModalOpen, 
    setIsTrackerModalOpen 
  } = useStore();

  const ctx: PublicOutletContext = { activeOrder, setActiveOrder, setQuickViewProduct };

  return (
    <div className="min-h-screen bg-stitch-bg text-stitch-ink flex flex-col font-sans relative selection:bg-stitch-accent selection:text-stitch-accent-ink" data-mode={kioskMode ? 'kiosk' : undefined}>
      <Header onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-grow">
        <Outlet context={ctx} />
      </main>

      {!kioskMode && <Footer />}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {quickViewProduct && (
        <ProductQuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={addToCart}
          isFavorite={false}
          onToggleFavorite={() => {}}
        />
      )}

      {/* Persistent Left Floating Order Tracker Badge */}
      {!kioskMode && activeOrder && (
        <div className="fixed bottom-6 left-6 z-40 animate-fade-in">
          <button
            onClick={() => setIsTrackerModalOpen(true)}
            className="group flex items-center gap-3 bg-[#16130B]/95 hover:bg-[#1f1a10] border border-[#D4AF37]/50 hover:border-[#D4AF37] text-white px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <span className={`w-3 h-3 rounded-full ${isOrderTerminal(activeOrder.status) ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
              <span className={`absolute w-2.5 h-2.5 rounded-full ${isOrderTerminal(activeOrder.status) ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-wider">Order #{activeOrder.id}</span>
                <span className="text-[10px] text-gray-400">·</span>
                <span className="text-xs font-bold text-white font-display">{getCustomerStatusLabel(activeOrder.status)}</span>
              </div>
              <p className="text-[10px] text-gray-400 group-hover:text-gray-300 transition-colors hidden sm:block">Click to track live order</p>
            </div>
            <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-colors ml-1">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Global Order Tracker Modal */}
      {isTrackerModalOpen && activeOrder && (
        <OrderTrackerModal
          order={activeOrder}
          onClose={() => setIsTrackerModalOpen(false)}
        />
      )}

      {!kioskMode && settings?.whatsappNumber && (
        <a
          href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 animate-bounce"
        >
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}
    </div>
  );
}



