import React, { useState } from 'react';
import type { FoodItem, CartItem } from '../types';
import { foodItems } from '../data/foodItems';
import { 
  Search, 
  ShoppingCart, 
  User, 
  PlusCircle, 
  CheckCircle, 
  ArrowRight, 
  Home, 
  ReceiptText, 
  X, 
  Plus, 
  Minus,
  UtensilsCrossed,
  MapPin,
  CheckCircle2
} from 'lucide-react';

interface MobileModeProps {
  cart: CartItem[];
  onAddToCart: (item: FoodItem) => void;
  onRemoveFromCart: (itemId: string, removeAll?: boolean) => void;
  onDecreaseQuantity: (itemId: string) => void;
  onIncreaseQuantity: (itemId: string) => void;
  onClearCart: () => void;
}

export default function MobileMode({
  cart,
  onAddToCart,
  onRemoveFromCart,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onClearCart
}: MobileModeProps) {
  const [activeCategory, setActiveCategory] = useState<'Burgers' | 'Pizzas' | 'Sides' | 'Drinks' | 'Desserts'>('Burgers');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedFlags, setAddedFlags] = useState<{ [key: string]: boolean }>({});
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<'home' | 'search' | 'orders' | 'profile'>('home');
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [checkoutComplete, setCheckoutComplete] = useState<boolean>(false);
  const [trackedOrderId, setTrackedOrderId] = useState<number | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [isTrackOpen, setIsTrackOpen] = useState<boolean>(false);
  const [trackId, setTrackId] = useState<string>('');
  const [trackPhone, setTrackPhone] = useState<string>('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState<string>('');
  const [trackLoading, setTrackLoading] = useState<boolean>(false);

  // Poll bridge for live order status
  React.useEffect(() => {
    if (!trackedOrderId) return;
    let timerId: ReturnType<typeof setInterval> | null = null;
    const poll = async () => {
      try {
        const res = await fetch(`http://localhost:3001/online-orders/${trackedOrderId}`);
        if (res.ok) {
          const data = await res.json();
          setTrackedOrder(data);
          if (data.kdsStatus === 'READY' && timerId) {
            clearInterval(timerId);
            timerId = null;
          }
        }
      } catch { /* bridge offline */ }
    };
    poll();
    timerId = setInterval(poll, 4000);
    return () => { if (timerId) clearInterval(timerId); };
  }, [trackedOrderId]);

  // Filter items
  const filteredFoodItems = foodItems.filter(item => {
    const matchesCategory = item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate USD totals
  const subtotalUSD = cart.reduce((sum, item) => sum + item.foodItem.priceUSD * item.quantity, 0);
  const taxUSD = subtotalUSD * 0.08;
  const totalUSD = subtotalUSD + taxUSD;
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddWithFeedback = (item: FoodItem) => {
    onAddToCart(item);
    setAddedFlags(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedFlags(prev => ({ ...prev, [item.id]: false }));
    }, 1500);
  };

  const executeCheckout = async () => {
    setIsCheckingOut(true);

    const itemsSummary = cart.map(c => `${c.quantity}x ${c.foodItem.name}`).join(', ');

    try {
      const res = await fetch('http://localhost:3001/online-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: 'Mobile Guest',
          customerPhone: '',
          customerAddress: '123 Mobile Delivery Lane, Suite 4',
          items: itemsSummary,
          totalAmount: totalUSD.toFixed(2),
          source: 'Mobile App',
          notes: '',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTrackedOrderId(data.order?.id || null);
        setTrackedOrder(data.order || null);
      }
    } catch {
      // Offline fallback
    }

    setTimeout(() => {
      setIsCheckingOut(false);
      setCheckoutComplete(true);
    }, 1500);
  };

  const closeCheckoutFlow = () => {
    setCheckoutComplete(false);
    setIsCartOpen(false);
    onClearCart();
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = trackId.trim();
    const phone = trackPhone.trim();
    if (!id) { setTrackError('Order ID is required'); return; }
    setTrackLoading(true);
    setTrackError('');
    setTrackResult(null);
    try {
      const res = await fetch(`http://localhost:3001/online-orders/${id}`);
      if (!res.ok) { setTrackError('Order not found — check ID'); setTrackLoading(false); return; }
      const data = await res.json();
      if (phone && data.customerPhone && data.customerPhone !== phone) {
        setTrackError('Phone number does not match');
        setTrackLoading(false);
        return;
      }
      setTrackResult(data);
    } catch {
      setTrackError('Bridge offline — try again later');
    }
    setTrackLoading(false);
  };

  return (
    <div id="mobile-canvas-frame" className="relative w-full h-screen max-h-screen bg-[#0c1322] text-[#dce2f7] flex flex-col overflow-hidden font-sans">
      
      {/* Dynamic Status Bar/Top Decorator Spacing */}
      <div className="pt-2"></div>

      {/* Top Header */}
      <header id="mobile-app-header" className="pt-4 pb-4 px-6 bg-[#0c1322]/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-800/50">
        <div className="flex justify-end mb-2">
           <button onClick={() => { setIsTrackOpen(true); setTrackResult(null); setTrackError(''); setTrackId(''); setTrackPhone(''); }} className="flex items-center gap-2 border border-[#4edea3] text-[#4edea3] rounded-full px-4 py-1 hover:bg-[#4edea3]/10 transition-colors">
             <MapPin className="w-4 h-4" />
             <span className="font-bold text-sm">Track Order</span>
           </button>
        </div>
        <div className="flex justify-between items-center mb-4 mt-1">
          <div className="flex items-center gap-2">
            <h1 className="font-headline-md text-2xl font-black text-[#ffe1a7] tracking-tight">DineDash</h1>
            {trackedOrderId && (
              <div className="flex items-center gap-1.5 bg-[#141b2b] border border-[#4edea3]/40 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                <span className="text-[10px] font-black text-[#4edea3]">#{trackedOrderId} {trackedOrder?.kdsStatus || 'PENDING'}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-[#191f2f] active:scale-95 transition-transform"
            >
              <ShoppingCart className="w-4 h-4 text-[#dce2f7]" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#fbbf24] text-slate-950 font-black text-[9px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0c1322]">
                  {totalItemCount}
                </span>
              )}
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#191f2f] active:scale-95 transition-transform">
              <User className="w-4 h-4 text-[#dce2f7]" />
            </button>
          </div>
        </div>

        {/* Dynamic Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d3c5ac] w-4 h-4" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-[#191f2f] border border-[#4f4633]/30 rounded-xl pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffe1a7]"
            placeholder="Search our delicious feeds... Hungry?"
          />
        </div>
      </header>

      {/* Sub-Scroll Container */}
      <main className="flex-1 overflow-y-auto custom-scrollbar pb-28">
        
        {/* Story Categories Ring List */}
        <span className="px-6 block text-[10px] uppercase font-bold tracking-widest text-[#d3c5ac] mt-4 mb-2">Explore Categories</span>
        <section id="story-categories-slider" className="flex items-center gap-5 overflow-x-auto hide-scrollbar px-6 mb-2 py-3">
          {[
            { catName: 'Burgers', display: 'Burgers', icon: '🍔' },
            { catName: 'Pizzas', display: 'Pizza', icon: '🍕' },
            { catName: 'Sides', display: 'Bowls & Pasta', icon: '🥗' },
            { catName: 'Drinks', display: 'Beverages', icon: '🍹' },
            { catName: 'Desserts', display: 'Desserts', icon: '🍰' }
          ].map((item) => {
            const isActive = activeCategory === item.catName;
            // Draw matching item preview image
            const matchingItem = foodItems.find(f => f.category === item.catName);
            return (
              <div 
                key={`story-${item.catName}`}
                onClick={() => setActiveCategory(item.catName as any)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-full p-[2px] transition-all duration-300 ${
                  isActive ? 'bg-gradient-to-tr from-[#ffe1a7] via-[#fbbf24] to-[#f9bd22] scale-105 shadow-md shadow-amber-400/10' : 'border border-slate-700/50'
                }`}>
                  <div className="w-full h-full rounded-full bg-[#0c1322] p-[3px] overflow-hidden">
                    <img 
                      className="w-full h-full rounded-full object-cover image-no-referrer" 
                      src={matchingItem?.image} 
                      alt=""
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[#ffe1a7]' : 'text-[#d3c5ac]'}`}>
                  {item.display}
                </span>
              </div>
            );
          })}
        </section>

        {/* Product Grid - Styled accurately like dynamic mobile design */}
        <section className="px-6 space-y-6 mt-4">
          <h2 className="font-headline-lg-mobile text-xl font-extrabold tracking-tight text-[#dce2f7]">
            {searchQuery ? 'Search Results' : 'Top Picks for You'}
          </h2>

          {filteredFoodItems.length === 0 ? (
            <div className="text-center py-12 opacity-60">
              <UtensilsCrossed className="w-10 h-10 mx-auto stroke-1 mb-2 text-[#d3c5ac]" />
              <p className="font-bold text-sm">No items found</p>
              <p className="text-xs text-[#d3c5ac]/80">Try checking spelling or keyword searches</p>
            </div>
          ) : (
            filteredFoodItems.map((item) => {
              const isAdded = addedFlags[item.id];
              return (
                <div 
                  key={`item-${item.id}`}
                  className="group relative bg-[#191f2f] rounded-2xl overflow-hidden shadow-lg border border-slate-800/40 hover:border-slate-700/50 transition-all duration-300"
                >
                  <div className="aspect-[4/3] relative">
                    <img 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102 image-no-referrer" 
                      src={item.image} 
                      alt={item.name}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
                      <span className="text-[9px] font-bold tracking-widest text-[#ffe1a7] uppercase">
                        {item.tag || 'POPULAR'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div>
                        <h3 className="font-bold text-base text-white">{item.name}</h3>
                        <p className="text-xs text-[#d3c5ac] line-clamp-1 mt-0.5">{item.description}</p>
                      </div>
                      <span className="text-lg font-black text-[#ffe1a7] shrink-0">${item.priceUSD.toFixed(2)}</span>
                    </div>

                    <button 
                      onClick={() => handleAddWithFeedback(item)}
                      className={`w-full h-11 rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 ${
                        isAdded 
                          ? 'bg-[#4edea3] text-slate-950' 
                          : 'bg-[#ffe1a7] text-slate-950 hover:brightness-105'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                          ADDED TO BAG
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          ADD TO BAG
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>

      </main>

      {/* Checkout Sidebar Draw Overload */}
      {isCartOpen && (
        <div id="mobile-cart-drawer-backdrop" className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div id="mobile-cart-sliding-container" className="bg-[#191f2f] max-h-[80%] rounded-t-[32px] border-t border-[#4f4633]/30 flex flex-col shadow-2xl p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-extrabold text-[#ffe1a7]">Your Basket</h3>
                <p className="text-[10px] text-[#d3c5ac]">Table 12 • Custom Mobile Session</p>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-[#d3c5ac]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of cart items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="text-center py-10 opacity-60">
                  <p className="text-sm">Bag is empty</p>
                  <p className="text-xs text-[#d3c5ac]">Add top picks to place your order!</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={`mob-cart-${item.foodItem.id}`} className="flex gap-3 bg-[#141b2b] p-3 rounded-xl border border-slate-800">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-950 shrink-0">
                      <img 
                        className="w-full h-full object-cover image-no-referrer" 
                        src={item.foodItem.image} 
                        alt={item.foodItem.name} 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{item.foodItem.name}</h4>
                      <p className="text-[10px] text-[#d3c5ac]">Express Customization</p>
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-3 bg-slate-800 rounded-full px-2 py-0.5">
                          <button 
                            onClick={() => onDecreaseQuantity(item.foodItem.id)}
                            className="text-[#ffe1a7] text-xs font-bold"
                          >-</button>
                          <span className="text-xs font-black text-white">{item.quantity}</span>
                          <button 
                            onClick={() => onIncreaseQuantity(item.foodItem.id)}
                            className="text-[#ffe1a7] text-xs font-bold"
                          >+</button>
                        </div>
                        <span className="text-xs font-black text-[#4edea3]">${(item.foodItem.priceUSD * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment footer */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[#d3c5ac]">
                  <span>Subtotal</span>
                  <span>${subtotalUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#d3c5ac]">
                  <span>Tax (8%)</span>
                  <span>${taxUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-black text-white">
                  <span>Grand Total</span>
                  <span className="text-lg text-[#fbbf24]">${totalUSD.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={executeCheckout}
                disabled={cart.length === 0}
                className="w-full h-12 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isCheckingOut ? (
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    Encrypting...
                  </span>
                ) : (
                  <>
                    CONFIRM & PLACE ORDER
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Checkout Bag Indicator Bar */}
      {totalItemCount > 0 && !isCartOpen && (
        <div 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-20 left-4 right-4 z-40 animate-bounce cursor-pointer flex justify-center max-w-sm mx-auto"
        >
          <div className="bg-[#fbbf24] text-slate-950 px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-950/15 rounded-lg flex items-center justify-center font-black text-sm">
                {totalItemCount}
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest leading-none">Your Order Bag</p>
                <p className="text-sm font-black mt-0.5">${subtotalUSD.toFixed(2)}</p>
              </div>
            </div>
            <button className="bg-slate-950 text-[#fbbf24] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1">
              Check Out
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Dynamic bottom iOS tab navigation mock */}
      <nav className="absolute bottom-0 left-0 w-full bg-[#070e1d] border-t border-slate-800/60 h-16 flex justify-around items-center px-4 pb-safe z-40">
        <button 
          onClick={() => setActiveNav('home')}
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl active:scale-90 transition-all ${
            activeNav === 'home' ? 'bg-[#ffe1a7] text-slate-950 font-bold' : 'text-[#d3c5ac]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">Home</span>
        </button>

        <button 
          onClick={() => setActiveNav('search')}
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl active:scale-90 transition-all ${
            activeNav === 'search' ? 'bg-[#ffe1a7] text-slate-950 font-bold' : 'text-[#d3c5ac]'
          }`}
        >
          <Search className="w-4 h-4" />
          <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">Search</span>
        </button>

        <button 
          onClick={() => setIsCartOpen(true)}
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl active:scale-90 transition-all ${
            activeNav === 'orders' ? 'bg-[#ffe1a7] text-slate-950 font-bold' : 'text-[#d3c5ac]'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">Bag</span>
        </button>
      </nav>

      {/* Checkout Finished Confirmed modal overlay */}
      {checkoutComplete && (
        <div className="absolute inset-0 z-[1001] bg-slate-950/90 flex flex-col items-center justify-center text-center p-6 space-y-6 animate-fade-in">
          <div className="w-20 h-20 bg-emerald-500/10 border-2 border-[#4edea3] rounded-full flex items-center justify-center text-[#4edea3]">
            <CheckCircle className="w-10 h-10 stroke-[2.5] animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-[#ffe1a7] uppercase tracking-tight">Enjoy Cooking!</h3>
            <p className="text-xs text-[#d3c5ac] px-4 leading-relaxed">
              Your server will carry out your DineDash order immediately. Order registered successfully under Session ID #DD-893!
            </p>
          </div>

          <button
            onClick={closeCheckoutFlow}
            className="px-8 py-3 bg-[#ffe1a7] text-slate-950 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
          >
            Go back to feeds
          </button>
        </div>
      )}

      {/* Guest Track Order Modal */}
      {isTrackOpen && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#191f2f] border border-slate-700 rounded-[28px] p-6 max-w-sm w-full mx-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#4edea3]" />
                  Track Your Order
                </h3>
                <p className="text-[10px] text-[#d3c5ac] mt-0.5">Enter Order ID to view status</p>
              </div>
              <button onClick={() => setIsTrackOpen(false)} className="text-slate-500 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!trackResult ? (
              <form onSubmit={handleTrackOrder} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#d3c5ac] block mb-1.5">Order ID *</label>
                  <input
                    type="number"
                    value={trackId}
                    onChange={e => setTrackId(e.target.value)}
                    placeholder="e.g. 1001"
                    className="w-full bg-[#141b2b] border border-slate-700 focus:border-[#4edea3] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#d3c5ac] block mb-1.5">Phone (optional)</label>
                  <input
                    type="tel"
                    value={trackPhone}
                    onChange={e => setTrackPhone(e.target.value)}
                    placeholder="e.g. 03001234567"
                    className="w-full bg-[#141b2b] border border-slate-700 focus:border-[#4edea3] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>
                {trackError && <p className="text-xs text-red-400 font-bold">{trackError}</p>}
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="w-full py-3.5 bg-[#4edea3] hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                >
                  {trackLoading ? 'Searching...' : 'Find My Order'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#141b2b] rounded-2xl border border-slate-800 p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-white text-base">Order #{trackResult.id}</p>
                      <p className="text-[10px] text-[#d3c5ac]">{trackResult.customer} · {trackResult.timePlaced}</p>
                    </div>
                    <span className="text-xs font-black text-[#fbbf24]">${trackResult.totalAmount}</span>
                  </div>
                  <p className="text-[10px] text-[#d3c5ac] leading-relaxed line-clamp-3">{trackResult.items}</p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Order Placed', sub: trackResult.timePlaced || 'Received', done: true },
                    {
                      label: 'Confirmed by Restaurant',
                      sub: trackResult.kdsStatus === 'PENDING' ? 'Waiting for cashier...' : 'Accepted ✓',
                      done: trackResult.kdsStatus !== 'PENDING',
                    },
                    {
                      label: 'In Kitchen',
                      sub: trackResult.kdsStatus === 'PREPARING'
                        ? `~${trackResult.prepTimeMinutes} mins · Ready by ${trackResult.estimatedReadyAt}`
                        : trackResult.kdsStatus === 'READY' ? 'Done ✓' : 'Waiting...',
                      done: trackResult.kdsStatus === 'PREPARING' || trackResult.kdsStatus === 'READY',
                    },
                    {
                      label: 'Ready for Pickup',
                      sub: trackResult.kdsStatus === 'READY' ? 'Your order is ready!' : 'Pending...',
                      done: trackResult.kdsStatus === 'READY',
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all ${
                        step.done ? 'bg-[#4edea3] border-[#4edea3]' : 'bg-transparent border-slate-700'
                      }`}>
                        {step.done && <CheckCircle2 className="w-3 h-3 text-slate-900" />}
                      </div>
                      <div>
                        <p className={`text-[10px] font-bold ${step.done ? 'text-white' : 'text-slate-500'}`}>{step.label}</p>
                        <p className="text-[9px] text-[#d3c5ac]">{step.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {trackResult.kdsStatus === 'READY' && (
                  <div className="bg-[#4edea3]/10 border border-[#4edea3]/30 rounded-xl px-4 py-2 text-center">
                    <span className="text-xs font-black text-[#4edea3]">Order Ready! Please collect.</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setTrackResult(null); setTrackId(''); setTrackPhone(''); }}
                    className="flex-1 py-2.5 border border-slate-700 hover:border-slate-500 text-[#d3c5ac] font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all"
                  >
                    Search Again
                  </button>
                  <button
                    onClick={() => setIsTrackOpen(false)}
                    className="flex-1 py-2.5 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
