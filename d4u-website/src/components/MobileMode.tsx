import React, { useState } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';
const socket = io(BACKEND_URL);
import type { FoodItem, CartItem } from '../types';
import { ShoppingBag, Star, Info, LayoutGrid, Sparkles, MapPin, Search, ArrowRight, Home, CreditCard, ChevronDown, Check, ChevronUp, Plus, Minus, UserCircle, LogOut, ShoppingCart, User, PlusCircle, CheckCircle, ReceiptText, X, UtensilsCrossed, CheckCircle2 } from 'lucide-react';

interface MobileModeProps {
  storeId: number;
  storeName?: string;
  foodItems: FoodItem[];
  cart: CartItem[];
  onAddToCart: (item: FoodItem) => void;
  onRemoveFromCart: (itemId: string, removeAll?: boolean) => void;
  onDecreaseQuantity: (itemId: string) => void;
  onIncreaseQuantity: (itemId: string) => void;
  onClearCart: () => void;
  campaigns?: any[];
}

export default function MobileMode({
  storeId,
  storeName = 'D4U',
  foodItems,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onClearCart,
  campaigns = []
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
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string>('');

  // Feedback states
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  // Auth & Profile State
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const [authName, setAuthName] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showRegisterFields, setShowRegisterFields] = useState(false);
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileHistory, setProfileHistory] = useState<any[]>([]);

  React.useEffect(() => {
    // Check local storage for logged in user to persist session
    const savedUser = localStorage.getItem('d4u_web_user');
    if (savedUser) setLoggedInUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true); setAuthError('');
    try {
      if (showRegisterFields) {
        if (!authName || !authPhone) throw new Error('Please enter both name and phone');
        const res = await fetch(`${BACKEND_URL}/online-orders/auth/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: authPhone, name: authName })
        });
        const data = await res.json();
        if (data.success) {
          setLoggedInUser(data.customer);
          localStorage.setItem('d4u_web_user', JSON.stringify(data.customer));
          setIsAuthModalOpen(false);
        } else throw new Error(data.message || 'Registration failed');
      } else {
        if (!authPhone) throw new Error('Please enter your phone number');
        const res = await fetch(`${BACKEND_URL}/online-orders/auth/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: authPhone })
        });
        const data = await res.json();
        if (data.success) {
          setLoggedInUser(data.customer);
          localStorage.setItem('d4u_web_user', JSON.stringify(data.customer));
          setIsAuthModalOpen(false);
        } else {
          setShowRegisterFields(true);
        }
      }
    } catch (err: any) { setAuthError(err.message); } 
    finally { setIsAuthLoading(false); }
  };

  const handleOpenProfile = async () => {
    setIsProfileModalOpen(true);
    if (!loggedInUser) return;
    try {
      const res = await fetch(`${BACKEND_URL}/online-orders/auth/history/${loggedInUser.phone}`);
      const data = await res.json();
      if (data.success) {
        const allOrders = [...(data.orders || []), ...(data.onlineOrders || [])];
        allOrders.sort((a, b) => b.id - a.id);
        setProfileHistory(allOrders);
      }
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('d4u_web_user');
    setIsProfileModalOpen(false);
  };

  // Real-time Socket.io Sync for Guest Tracker & Sidebar
  React.useEffect(() => {
    // Initial fetch for the header badge
    if (trackedOrderId) {
      fetch(`${BACKEND_URL}/online-orders/${trackedOrderId}`)
        .then(res => res.json())
        .then(data => setTrackedOrder(data))
        .catch(() => {});
    }

    // Real-time tracking using Socket.IO
    if (trackResult && isTrackOpen) {
      // Ensure we listen for our tracked order explicitly
      const handleOrderUpdated = (updatedOrder: any) => {
        if (updatedOrder && (updatedOrder.id === trackResult?.id || updatedOrder.id == trackResult?.id)) {
          setTrackResult((prev: any) => ({
            ...prev,
            status: updatedOrder.status,
            ...updatedOrder
          }));
        }
      };
      
      if (socket) {
        socket.on('order_updated', handleOrderUpdated);
      }
      return () => { 
        if (socket) {
          socket.off('order_updated', handleOrderUpdated); 
        }
      };
    }
  }, [trackedOrderId, isTrackOpen, trackResult?.id]);

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
    if (isCheckingOut) return;
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setCheckoutError('Please provide your Name, Phone, and Delivery Address to place the order.');
      return;
    }
    setCheckoutError('');
    setIsCheckingOut(true);

    try {
      const res = await fetch(`${BACKEND_URL}/online-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          customerName: customerName || 'Mobile Guest',
          customerPhone: customerPhone || '',
          customerAddress: customerAddress || '',
          items: cart.map(c => ({
            product_id: c.foodItem.id,
            quantity: c.quantity,
            price: c.foodItem.priceUSD || 0
          })),
          notes: '',
          payment_method: 'COD'
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
    const input = trackId.trim();
    if (!input) { setTrackError('Order ID or Phone is required'); return; }
    setTrackLoading(true);
    setTrackError('');
    setTrackResult(null);
    try {
      const isPhone = input.length > 5 || input.startsWith('03') || input.startsWith('+');
      if (!isPhone) {
        const res = await fetch(`${BACKEND_URL}/online-orders/${input}`);
        if (!res.ok) { setTrackError('Order not found — check ID'); setTrackLoading(false); return; }
        const data = await res.json();
        setTrackResult(data);
      } else {
        const res = await fetch(`${BACKEND_URL}/online-orders?phone=${encodeURIComponent(input)}`);
        if (!res.ok) { setTrackError('Failed to fetch orders'); setTrackLoading(false); return; }
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const sorted = data.sort((a, b) => b.id - a.id);
          setTrackResult(sorted[0]);
        } else {
          setTrackError('No orders found for this phone');
        }
      }
    } catch {
      setTrackError('Failed to connect to server');
    }
    setTrackLoading(false);
  };

  const handleSubmitFeedback = async () => {
    const targetOrder = trackResult || trackedOrder;
    if (!targetOrder || !feedbackRating) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch(`${BACKEND_URL}/online-orders/${targetOrder.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment })
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
        if (trackResult) {
          setTrackResult({ ...trackResult, feedback: { rating: feedbackRating, comment: feedbackComment } });
        }
        if (trackedOrder) {
          setTrackedOrder({ ...trackedOrder, feedback: { rating: feedbackRating, comment: feedbackComment } });
        }
      }
    } catch {}
    setIsSubmittingFeedback(false);
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
            <h1 className="font-headline-md text-2xl font-black text-[#ffe1a7] tracking-tight">D4U - {storeName}</h1>
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
            <button 
              onClick={loggedInUser ? handleOpenProfile : () => setIsAuthModalOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#191f2f] active:scale-95 transition-transform">
              <User className={`w-4 h-4 ${loggedInUser ? 'text-brand-yellow' : 'text-[#dce2f7]'}`} />
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
          {[...new Set(foodItems.map(f => f.category))].slice(0, 8).map((categoryName) => {
            const isActive = activeCategory === categoryName;
            // Draw matching item preview image
            const matchingItem = foodItems.find(f => f.category === categoryName);
            return (
              <div 
                key={`story-${categoryName}`}
                onClick={() => setActiveCategory(categoryName as any)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-full p-[2px] transition-all duration-300 ${
                  isActive ? 'bg-gradient-to-tr from-[#ffe1a7] via-[#fbbf24] to-[#f9bd22] scale-105 shadow-md shadow-amber-400/10' : 'border border-slate-700/50'
                }`}>
                  <div className="w-full h-full rounded-full bg-[#0c1322] p-[3px] overflow-hidden">
                    {matchingItem?.image ? (
                      <img 
                        className="w-full h-full rounded-full object-cover image-no-referrer" 
                        src={matchingItem.image.startsWith('http') ? matchingItem.image : `${BACKEND_URL}${matchingItem.image}`} 
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-500">{categoryName.charAt(0)}</div>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-widest max-w-[70px] truncate text-center ${
                  isActive ? 'text-[#ffe1a7]' : 'text-[#d3c5ac]'
                }`}>
                  {categoryName}
                </span>
              </div>
            );
          })}
        </section>

        {/* Special Offers Zone */}
        {campaigns.length > 0 && (
          <section className="px-6 mt-6 mb-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-[#ec4899] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Offers</span>
              <h2 className="font-headline-lg-mobile text-lg font-extrabold tracking-tight text-[#dce2f7]">Special Deals</h2>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar snap-x">
              {campaigns.map(camp => (
                <div key={camp.id} className="snap-center shrink-0 w-[85%] bg-[#191f2f] border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                  {camp.image_url && (
                    <img src={`${BACKEND_URL}${camp.image_url}`} alt={camp.title} className="w-full h-32 object-cover border-b border-slate-700" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#ec4899] font-black text-sm">{camp.discount_pct}% OFF</span>
                      <h3 className="text-white font-bold text-base truncate">{camp.title}</h3>
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-2 mb-3">{camp.description}</p>
                    {camp.target_products && camp.target_products.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {camp.target_products.slice(0, 3).map((p: any) => (
                           <div key={p.id} className="flex-shrink-0 bg-slate-800 rounded-lg p-1.5 flex items-center gap-2 border border-slate-700 w-32">
                             {p.image_url ? (
                               <img src={p.image_url.startsWith('http') ? p.image_url : `${BACKEND_URL}${p.image_url}`} className="w-8 h-8 rounded object-cover" />
                             ) : (
                               <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs">?</div>
                             )}
                             <div className="flex-1 min-w-0">
                               <div className="text-[10px] text-white font-bold truncate">{p.name}</div>
                               <div className="text-amber-400 font-black text-[10px]">Rs {p.price}</div>
                             </div>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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

            {/* Delivery Details Form */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-[#ffe1a7]">Delivery Details</h4>
              <input type="text" placeholder="Full Name *" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-[#141b2b] border border-slate-700 focus:border-[#4edea3] rounded-xl px-4 py-2 text-sm text-white outline-none" />
              <input type="tel" placeholder="Mobile Number *" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full bg-[#141b2b] border border-slate-700 focus:border-[#4edea3] rounded-xl px-4 py-2 text-sm text-white outline-none" />
              <textarea placeholder="Complete Delivery Address *" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="w-full bg-[#141b2b] border border-slate-700 focus:border-[#4edea3] rounded-xl px-4 py-2 text-sm text-white outline-none resize-none" rows={2} />
              {checkoutError && <p className="text-xs text-red-400 font-bold leading-tight">{checkoutError}</p>}
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
              Your server will carry out your D4U order immediately. Order registered successfully under Session ID #DD-893!
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-[250px]">
            <button
              onClick={() => {
                closeCheckoutFlow();
                setTrackId(String(trackedOrderId));
                setTrackResult(trackedOrder);
                setTrackError('');
                setIsTrackOpen(true);
              }}
              className="w-full py-3.5 bg-[#4edea3] hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              Track Your Order
            </button>
            <button
              onClick={closeCheckoutFlow}
              className="w-full py-3 border border-[#ffe1a7] text-[#ffe1a7] rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all hover:bg-[#ffe1a7]/10"
            >
              Go back to feeds
            </button>
          </div>
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
                <p className="text-[10px] text-[#d3c5ac] mt-0.5">Enter Order ID or Phone</p>
              </div>
              <button onClick={() => setIsTrackOpen(false)} className="text-slate-500 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!trackResult ? (
              <form onSubmit={handleTrackOrder} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={trackId}
                    onChange={e => setTrackId(e.target.value)}
                    placeholder="e.g. 1033 or 0300..."
                    className="w-full bg-[#141b2b] border border-slate-700 focus:border-[#4edea3] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                    autoFocus
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
                  <div className="space-y-3">
                  {(() => {
                    const STATUS_INDEX: Record<string, number> = {
                      ONLINE_ORDER_RECEIVED: 0,
                      CONFIRMED: 1,
                      KITCHEN_PREPARING: 2,
                      READY: 3,
                      RIDER_ARRIVED: 3,
                      PRINT_BILL: 3,
                      DISPATCHED: 3,
                      OUT_FOR_DELIVERY: 4,
                      DELIVERED: 5,
                      WAITING_CASH_SETTLEMENT: 5,
                      SETTLED: 6,
                    };
                    const currentStep = STATUS_INDEX[trackResult.status] ?? 0;
                    return [
                      { label: 'Order Placed', sub: 'Received', done: currentStep >= 0 },
                      { label: 'Confirmed by Restaurant', sub: currentStep >= 1 ? 'Accepted ✓' : 'Waiting for cashier...', done: currentStep >= 1 },
                      { label: 'In Kitchen', sub: currentStep >= 2 ? 'Working on it' : 'Waiting...', done: currentStep >= 2 },
                      { label: 'Ready for Pickup', sub: currentStep >= 3 ? 'Food is packed!' : 'Pending...', done: currentStep >= 3 },
                      { label: 'Out For Delivery', sub: currentStep >= 4 ? 'Rider on the way' : 'Waiting for rider...', done: currentStep >= 4 },
                      { label: 'Delivered', sub: currentStep >= 5 ? 'Arrived ✓' : 'Pending...', done: currentStep >= 5 },
                      { label: 'Completed', sub: currentStep >= 6 ? 'Settled ✓' : 'Pending...', done: currentStep >= 6 },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3 relative">
                        {i < 6 && <div className={`absolute left-2.5 top-5 w-[2px] h-6 ${step.done ? 'bg-[#4edea3]' : 'bg-slate-700'}`}></div>}
                        <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all relative z-10 bg-[#191f2f] ${
                          step.done ? 'border-[#4edea3] text-[#4edea3]' : 'border-slate-700 text-transparent'
                        }`}>
                          {step.done && <CheckCircle2 className="w-3 h-3 fill-[#4edea3] text-[#191f2f]" />}
                        </div>
                        <div>
                          <p className={`text-[10px] font-bold ${step.done ? 'text-white' : 'text-slate-500'}`}>{step.label}</p>
                          <p className="text-[9px] text-[#d3c5ac]">{step.sub}</p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {trackResult.status === 'DISPATCHED' && trackResult.delivery && (
                  <div className="bg-[#141b2b] border border-[#4edea3]/30 rounded-xl overflow-hidden mt-4">
                    <div className="bg-[#4edea3]/10 px-4 py-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping" />
                      <span className="text-[10px] font-black uppercase text-[#4edea3]">Rider is approaching!</span>
                    </div>
                    <div className="relative h-32 bg-slate-900 w-full overflow-hidden flex items-center justify-center">
                      {/* Fake Radar Map Animation */}
                      <div className="absolute inset-0 border-[0.5px] border-slate-800" style={{ backgroundSize: '20px 20px', backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)' }} />
                      <div className="w-32 h-32 border border-[#4edea3]/20 rounded-full animate-ping absolute" />
                      <div className="w-16 h-16 border border-[#4edea3]/40 rounded-full animate-ping absolute" />
                      <div className="w-4 h-4 bg-[#4edea3] rounded-full z-10 shadow-[0_0_15px_#4edea3] relative flex items-center justify-center">
                        <div className="absolute -top-6 bg-white text-slate-900 text-[8px] font-bold px-2 py-0.5 rounded whitespace-nowrap">Rider</div>
                      </div>
                    </div>
                  </div>
                )}

                {(trackResult.status === 'PAID' || trackResult.status === 'SETTLED') && (
                  <div className="bg-[#141b2b] border border-amber-500/30 rounded-xl p-4 mt-4 text-center">
                    {trackResult.feedback || feedbackSubmitted ? (
                      <div>
                        <h4 className="text-sm font-black text-[#4edea3] mb-1">Thanks for your feedback!</h4>
                        <div className="flex justify-center gap-1 my-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <svg key={star} className={`w-5 h-5 ${(trackResult.feedback?.rating || feedbackRating) >= star ? 'text-amber-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400">"{trackResult.feedback?.comment || feedbackComment}"</p>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-sm font-black text-white mb-1">How was your delivery?</h4>
                        <p className="text-[10px] text-slate-400 mb-3">Rate your experience to help us improve</p>
                        <div className="flex justify-center gap-2 mb-3">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setFeedbackRating(star)} className="focus:outline-none">
                              <svg className={`w-8 h-8 ${feedbackRating >= star ? 'text-amber-400' : 'text-slate-700 hover:text-amber-200'} transition-colors`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            </button>
                          ))}
                        </div>
                        <textarea
                          placeholder="Leave a comment (optional)..."
                          value={feedbackComment}
                          onChange={e => setFeedbackComment(e.target.value)}
                          className="w-full bg-[#191f2f] border border-slate-700 rounded-xl px-3 py-2 text-[10px] text-white resize-none outline-none focus:border-amber-400 mb-3"
                          rows={2}
                        />
                        <button
                          onClick={handleSubmitFeedback}
                          disabled={!feedbackRating || isSubmittingFeedback}
                          className="w-full py-2 bg-[#fbbf24] hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                        >
                          {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                </div>

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
      {/* ================= MODAL: AUTH / LOGIN ================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[1005] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#191f2f] border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col relative shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#141b2b]">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <User className="text-brand-yellow w-5 h-5" /> 
                {showRegisterFields ? 'Create Account' : 'Welcome Back'}
              </h3>
              <button onClick={() => { setIsAuthModalOpen(false); setShowRegisterFields(false); }} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {authError && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg text-center">{authError}</div>}
              
              {!showRegisterFields ? (
                <p className="text-sm text-slate-400 text-center mb-6">Enter your phone number to login or create an account.</p>
              ) : (
                <p className="text-sm text-slate-400 text-center mb-6">Looks like you are new! Enter your name to continue.</p>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {showRegisterFields && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Full Name</label>
                    <input type="text" value={authName} onChange={e => setAuthName(e.target.value)} required className="w-full bg-[#0a0f18] text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-brand-yellow outline-none transition" placeholder="John Doe" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Phone Number</label>
                  <input type="tel" value={authPhone} onChange={e => setAuthPhone(e.target.value)} required disabled={showRegisterFields} className="w-full bg-[#0a0f18] text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-brand-yellow outline-none transition disabled:opacity-50" placeholder="0300..." />
                </div>

                <button type="submit" disabled={isAuthLoading} className="w-full mt-4 bg-brand-yellow hover:bg-yellow-400 text-black font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50">
                  {isAuthLoading ? 'Loading...' : (showRegisterFields ? 'Create Account' : 'Continue')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: MY PROFILE ================= */}
      {isProfileModalOpen && loggedInUser && (
        <div className="fixed inset-0 z-[1005] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#191f2f] border border-slate-800 rounded-3xl w-full max-w-md h-[85vh] overflow-hidden flex flex-col relative shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#141b2b]">
              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <User className="text-brand-yellow w-6 h-6" /> 
                  {loggedInUser.name}
                </h3>
                <p className="text-sm text-brand-yellow font-bold mt-1">{loggedInUser.loyalty_points || 0} Loyalty Points</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleLogout} className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition">Logout</button>
                <button onClick={() => setIsProfileModalOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h4 className="text-lg font-bold text-white mb-4">Past Orders</h4>
              {profileHistory.length === 0 ? (
                <div className="text-center p-10 text-slate-500">No orders found.</div>
              ) : (
                profileHistory.map((order: any, idx) => (
                  <div key={idx} className="bg-[#141b2b] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase">
                          {order.type || (order.source === 'Website' ? 'Online' : 'POS')}
                        </span>
                        <span className="text-white font-bold text-sm">Order #{order.id || order.orderId}</span>
                      </div>
                      <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
                      {order.items && typeof order.items === 'string' && (
                        <p className="text-sm text-slate-300 mt-2 line-clamp-1">{order.items}</p>
                      )}
                    </div>
                    <div className="text-right flex flex-col justify-between">
                      <span className="text-brand-yellow font-black">Rs {order.totalAmount || order.total}</span>
                      <span className={`text-xs font-bold ${order.status === 'PAID' || order.status === 'SETTLED' || order.status === 'DELIVERED' ? 'text-green-400' : 'text-slate-400'}`}>
                        {order.status || 'COMPLETED'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
