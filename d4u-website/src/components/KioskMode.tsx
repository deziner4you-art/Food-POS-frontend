import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';
const socket = io(BACKEND_URL);
import type { FoodItem, CartItem } from '../types';
import { 
  Utensils, 
  Globe, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Minus, 
  X, 
  ArrowRight, 
  Check, 
  Trash2, 
  Clock 
} from 'lucide-react';

interface KioskModeProps {
  storeId: number;
  foodItems: FoodItem[];
  cart: CartItem[];
  onAddToCart: (item: FoodItem) => void;
  onRemoveFromCart: (itemId: string, removeAll?: boolean) => void;
  onDecreaseQuantity: (itemId: string) => void;
  onIncreaseQuantity: (itemId: string) => void;
  onClearCart: () => void;
}

export default function KioskMode({
  storeId,
  foodItems,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onClearCart
}: KioskModeProps) {
  // Navigation active tab
  const [activeCategory, setActiveCategory] = useState<'Burgers' | 'Pizzas' | 'Sides' | 'Drinks' | 'Desserts'>('Burgers');
  const [tableNumber, setTableNumber] = useState<number>(12);
  const [isEditingTable, setIsEditingTable] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('K-4555');
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [trackedOrderId, setTrackedOrderId] = useState<number | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<any>(null);

  // Favorites scroll ref
  const favoritesScrollRef = useRef<HTMLDivElement>(null);

  // Filter food items based on category
  const filteredFoodItems = foodItems.filter(item => item.category === activeCategory);

  // Favorites (Bestsellers / Featured list)
  const favorites = foodItems.filter(item => item.tag === 'Bestseller' || item.tag === 'New Arrival');

  // Clock Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Socket.io Sync for Guest Tracker
  useEffect(() => {
    // Initial fetch for the header badge
    if (trackedOrderId) {
      fetch(`${BACKEND_URL}/online-orders/${trackedOrderId}`)
        .then(res => res.json())
        .then(data => setTrackedOrder(data))
        .catch(() => {});
    }

    const handleOrderUpdate = (updatedOrder: any) => {
      // Auto-update Guest Tracker Badge
      setTrackedOrder((prev: any) => {
        if (prev && prev.id === updatedOrder.id) return updatedOrder;
        return prev;
      });
    };

    socket.on('order_updated', handleOrderUpdate);
    return () => {
      socket.off('order_updated', handleOrderUpdate);
    };
  }, [trackedOrderId]);

  // Scroll favorites horizontally
  const scrollFavorites = (direction: 'left' | 'right') => {
    if (favoritesScrollRef.current) {
      const scrollAmount = 350;
      favoritesScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Helper calculation
  const subtotal = cart.reduce((sum, item) => sum + item.foodItem.priceRs * item.quantity, 0);
  const serviceFee = subtotal > 0 ? 60.0 : 0;
  const total = subtotal + serviceFee;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsPaying(true);

    try {
      const res = await fetch(`${BACKEND_URL}/online-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          customerName: 'Kiosk Guest',
          customerPhone: '',
          customerAddress: 'Dine-In',
          items: cart.map(c => ({
            product_id: c.foodItem.id,
            quantity: c.quantity,
            price: c.foodItem.priceRs || 0
          })),
          notes: `Table ${tableNumber}`,
          payment_method: 'CASH'
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTrackedOrderId(data.order?.id || null);
        setTrackedOrder(data.order || null);
        setOrderId(`K-${data.order?.id || Math.floor(1000 + Math.random() * 9000)}`);
      }
    } catch {
      // Offline fallback
      setOrderId(`K-${Math.floor(1000 + Math.random() * 9000)}`);
    }

    setTimeout(() => {
      setIsPaying(false);
      setPaymentSuccess(true);
    }, 1800);
  };

  const finalizeOrder = () => {
    setPaymentSuccess(false);
    onClearCart();
    // Generate next randomized Order ID
    setOrderId(`K-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  return (
    <div id="kiosk-layout-container" className="h-screen flex flex-col bg-[#0c1322] text-[#dce2f7] select-none overflow-hidden font-sans">
      {/* Top Header */}
      <header id="kiosk-header" className="h-24 bg-[#0c1322]/80 backdrop-blur-md border-b border-[#4f4633]/30 px-8 flex items-center justify-between sticky top-0 z-40">
        <div id="kiosk-brand" className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#fbbf24] rounded-xl flex items-center justify-center text-[#6c4f00]">
            <Utensils className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-headline-lg text-2xl font-extrabold tracking-tight uppercase text-[#ffe1a7] leading-none">D4U GOURMET</h1>
            <p className="text-[10px] text-[#d3c5ac] tracking-[0.2em] font-extrabold mt-1">KITCHEN & GRILL</p>
          </div>
        </div>

        {/* Categories Bar */}
        <nav id="kiosk-top-nav" className="hidden lg:flex items-center gap-8">
          <span className="text-[#ffe1a7] font-extrabold border-b-2 border-[#ffe1a7] pb-1 font-body-md cursor-pointer">MENU</span>
          <span className="text-[#d3c5ac] hover:text-[#dce2f7] font-extrabold transition-colors font-body-md cursor-pointer">DEALS</span>
          <span className="text-[#d3c5ac] hover:text-[#dce2f7] font-extrabold transition-colors font-body-md cursor-pointer">LOCATIONS</span>
          <span className="text-[#d3c5ac] hover:text-[#dce2f7] font-extrabold transition-colors font-body-md cursor-pointer">MY REWARDS</span>
        </nav>

        {/* Language and Table info */}
        <div id="kiosk-status" className="flex items-center gap-6">
          {trackedOrderId && (
            <div className="flex items-center gap-2 bg-[#141b2b] border border-[#4edea3]/40 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
              <span className="text-xs font-black text-[#4edea3]">
                Order #{trackedOrderId} - {trackedOrder?.kdsStatus || 'PENDING'}
              </span>
            </div>
          )}
          <div id="kiosk-table-badge" className="text-right">
            <p className="text-[10px] text-[#d3c5ac] font-bold uppercase tracking-wider">Ordering for</p>
            {isEditingTable ? (
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(Number(e.target.value))}
                  onBlur={() => setIsEditingTable(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingTable(false);
                  }}
                  className="w-12 bg-[#191f2f] border border-[#ffe1a7]/30 text-center rounded text-sm text-[#4edea3] focus:outline-none"
                  autoFocus
                />
              </div>
            ) : (
              <p 
                onClick={() => setIsEditingTable(true)} 
                className="font-bold text-[#4edea3] cursor-pointer hover:underline text-base"
                title="Click to change Table Number"
              >
                Table #{tableNumber}
              </p>
            )}
          </div>
          <button className="w-12 h-12 rounded-full bg-[#191f2f] hover:bg-[#232a3a] flex items-center justify-center text-[#dce2f7] transition-all">
            <Globe className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Primary Workspace */}
      <div id="kiosk-main-content-panel" className="flex-1 flex overflow-hidden">
        
        {/* Left main grid/carousel area */}
        <main id="kiosk-menu-flow" className="flex-1 overflow-y-auto custom-scrollbar bg-[#0c1322] pb-12">
          
          {/* Customer Favorites Carousel */}
          <section id="kiosk-section-favorites" className="mt-8 px-8">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-3xl font-extrabold tracking-tight uppercase">Must Try Favorites</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => scrollFavorites('left')}
                  className="w-10 h-10 rounded-full border border-[#4f4633]/50 flex items-center justify-center hover:bg-[#191f2f]/80 active:scale-90 transition-all text-slate-300"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scrollFavorites('right')}
                  className="w-10 h-10 rounded-full border border-[#4f4633]/50 flex items-center justify-center hover:bg-[#191f2f]/80 active:scale-90 transition-all text-slate-300"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div 
              ref={favoritesScrollRef}
              className="flex gap-6 overflow-x-auto hide-scrollbar pb-2"
            >
              {favorites.map((fav) => (
                <div 
                  key={`fav-${fav.id}`}
                  className="min-w-[430px] h-[280px] rounded-2xl overflow-hidden relative group cursor-pointer flex-shrink-0 shadow-2xl transition-all duration-300"
                  onClick={() => onAddToCart(fav)}
                >
                  <img 
                    alt={fav.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 image-no-referrer"
                    src={fav.image}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent p-6 flex flex-col justify-end">
                    <span className={`font-bold text-[10px] px-3 py-1 rounded-full w-fit mb-3 uppercase tracking-widest ${
                      fav.tag === 'Bestseller' ? 'bg-[#ffe1a7] text-slate-950' : 'bg-[#4edea3] text-slate-950'
                    }`}>
                      {fav.tag}
                    </span>
                    <h3 className="text-2xl font-black mb-1 text-white">{fav.name}</h3>
                    <p className="text-[#dce2f7]/80 text-xs mb-3 font-medium line-clamp-1">{fav.description}</p>
                    <span className="text-xl font-bold text-[#ffe1a7]">Rs. {fav.priceRs.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Category Tabs */}
          <section id="kiosk-section-categories" className="px-8 mt-8 sticky top-0 bg-[#0c1322] py-4 z-30">
            <div className="flex gap-3 overflow-x-auto hide-scrollbar">
              {['Burgers', 'Pizzas', 'Sides', 'Drinks', 'Desserts'].map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={`cat-tab-${cat}`}
                    onClick={() => setActiveCategory(cat as any)}
                    className={`px-8 py-3.5 rounded-2xl font-bold transition-all whitespace-nowrap text-sm uppercase tracking-wider ${
                      isActive 
                        ? 'bg-[#ffe1a7] text-[#402d00] shadow-xl shadow-amber-400/10 scale-[1.02]' 
                        : 'bg-[#2e3545] text-[#dce2f7] hover:bg-[#232a3a]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Large Visual Product Grid */}
          <section id="kiosk-item-grid-section" className="px-8 pb-12 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredFoodItems.map((item) => (
                <div 
                  key={`grid-${item.id}`}
                  className="group bg-[#141b2b] rounded-2xl overflow-hidden border border-[#4f4633]/20 hover:border-[#ffe1a7]/40 transition-all duration-300 flex flex-col shadow-lg hover:shadow-xl"
                >
                  <div className="h-60 overflow-hidden relative">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 image-no-referrer"
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(item);
                      }}
                      className="absolute top-4 right-4 w-11 h-11 bg-black/40 backdrop-blur-md hover:bg-[#ffe1a7] hover:text-slate-950 text-white rounded-full flex items-center justify-center transition-all shadow"
                    >
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    {item.tag && (
                      <span className="absolute top-4 left-4 text-[9px] bg-amber-500 text-slate-950 font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="text-lg font-bold text-white line-clamp-1">{item.name}</h3>
                      <span className="text-base font-bold text-[#ffe1a7] shrink-0">Rs. {item.priceRs.toLocaleString()}</span>
                    </div>
                    <p className="text-[#d3c5ac] text-xs mb-6 line-clamp-2 flex-1">{item.description}</p>
                    <button 
                      onClick={() => onAddToCart(item)}
                      className="w-full py-3 bg-[#2e3545] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#ffe1a7] hover:text-[#402d00] transition-all"
                    >
                      Add to Basket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>

        {/* Right Sidebar: Basket details */}
        <aside id="kiosk-shopping-sidebar" className="w-[420px] bg-[#070e1d] border-l border-[#4f4633]/30 flex flex-col shadow-2xl z-30">
          <div className="p-6 border-b border-[#4f4633]/30">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-2xl font-black uppercase tracking-tight">Your Basket</h2>
              <span className="bg-[#ffe1a7]/10 text-[#ffe1a7] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
              </span>
            </div>
            <p className="text-[#d3c5ac] text-[10px] font-extrabold uppercase tracking-widest">Order #{orderId}</p>
          </div>

          {/* Basket items list */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-65 p-6">
                <Utensils className="w-12 h-12 text-[#d3c5ac]/40 mb-3 stroke-[1.5]" />
                <p className="font-bold text-[#dce2f7] mb-1 text-sm">Basket is empty</p>
                <p className="text-xs text-[#d3c5ac]">Select items from the restaurant menu page to feed your appetite!</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={`cart-${item.foodItem.id}`} className="flex gap-4 items-center bg-[#141b2b]/40 p-3 rounded-xl border border-slate-800/60">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-800">
                    <img 
                      className="w-full h-full object-cover image-no-referrer" 
                      src={item.foodItem.image} 
                      alt={item.foodItem.name} 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h4 className="font-bold text-[#dce2f7] text-sm truncate">{item.foodItem.name}</h4>
                      <button 
                        onClick={() => onRemoveFromCart(item.foodItem.id, true)}
                        className="text-[#d3c5ac] hover:text-[#ffb4ab] transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center gap-3 bg-[#191f2f] px-2.5 py-1 rounded-full border border-slate-700/30">
                        <button 
                          onClick={() => onDecreaseQuantity(item.foodItem.id)}
                          className="w-5 h-5 flex items-center justify-center text-[#d3c5ac] hover:text-[#ffe1a7] active:scale-75 transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs text-white w-3 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => onIncreaseQuantity(item.foodItem.id)}
                          className="w-5 h-5 flex items-center justify-center text-[#d3c5ac] hover:text-[#ffe1a7] active:scale-75 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-bold text-sm text-[#4edea3]">Rs. {(item.foodItem.priceRs * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout section */}
          <div className="p-6 bg-[#141b2b] border-t border-[#4f4633]/30 space-y-5">
            <div className="space-y-2.5">
              <div className="flex justify-between text-[#d3c5ac]">
                <span className="text-xs font-bold uppercase tracking-widest">Sub Total</span>
                <span className="font-bold text-sm">Rs. {subtotal.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between text-[#d3c5ac]">
                <span className="text-xs font-bold uppercase tracking-widest">Service Fee</span>
                <span className="font-bold text-sm">Rs. {serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-[#4f4633]/20">
                <span className="text-lg font-extrabold uppercase tracking-tight text-white">Total</span>
                <span className="text-2xl font-black text-[#ffe1a7]">Rs. {total.toLocaleString()}.00</span>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`w-full h-16 bg-[#4edea3] text-[#003824] font-black uppercase text-base rounded-2xl shadow-xl shadow-emerald-950/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                  cart.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-105 cursor-pointer'
                }`}
              >
                {isPaying ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#003824] border-t-transparent rounded-full animate-spin"></span>
                    Processing Payment...
                  </span>
                ) : (
                  <>
                    PROCEED TO PAYMENT
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              {cart.length > 0 && (
                <button 
                  onClick={onClearCart}
                  className="w-full py-2.5 text-center text-[#d3c5ac] hover:text-[#dce2f7] text-[10px] uppercase font-bold tracking-widest hover:underline"
                >
                  Clear Basket
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Clock and footer terminal */}
      <footer id="kiosk-footer" className="h-10 bg-[#070e1d] border-t border-[#4f4633]/30 flex items-center justify-between px-8 text-[9px] font-bold text-[#d3c5ac] uppercase tracking-widest z-40">
        <div className="flex gap-4 items-center">
          <span>{currentDate}</span>
          <span>{currentTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
          CONNECTED - KIOSK #01
        </div>
      </footer>

      {/* Payment Success Modal Dialog */}
      {paymentSuccess && (
        <div id="payment-success-modal" className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#141b2b] border border-amber-500/30 max-w-sm w-full rounded-3xl p-6 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 border-2 border-[#4edea3] rounded-full flex items-center justify-center mx-auto text-[#4edea3]">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase text-amber-100">Order Placed!</h3>
              <p className="text-xs text-[#d3c5ac]">Your receipt has been compiled at Table #{tableNumber}</p>
            </div>

            {/* Receipt Summary Box */}
            <div className="bg-[#070e1d] rounded-xl p-4 text-left font-mono text-[11px] text-[#ffe1a7] space-y-2 border border-slate-800">
              <div className="flex justify-between font-bold border-b border-slate-800 pb-1.5 text-slate-400">
                <span>ITEM</span>
                <span>QTY / PRICE</span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1.5 py-1">
                {cart.map((cartItem) => (
                  <div key={`receipt-${cartItem.foodItem.id}`} className="flex justify-between">
                    <span className="truncate max-w-[160px] text-white">{cartItem.foodItem.name}</span>
                    <span>{cartItem.quantity}x • Rs {(cartItem.foodItem.priceRs * cartItem.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-800 pt-1.5 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Service Charge:</span>
                  <span>Rs 60.00</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#4edea3]">
                  <span>TOTAL:</span>
                  <span>Rs {total.toLocaleString()}.00</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-emerald-400/80 uppercase font-black tracking-widest flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Est. Cooking Time: 12-15 mins
            </p>

            <button
              id="btn-complete-order"
              onClick={finalizeOrder}
              className="w-full py-4 bg-[#ffe1a7] text-slate-950 font-extrabold uppercase rounded-2xl active:scale-95 transition-all text-xs tracking-wider shadow"
            >
              Order Received / Serve Mode
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
