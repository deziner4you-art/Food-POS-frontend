import React, { useState, useEffect } from 'react';
import type { FoodItem, CartItem } from '../types';
import { foodItems } from '../data/foodItems';
import {
  Search,
  User,
  ShoppingCart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  X,
  Zap,
  Utensils,
  Globe,
  Share2,
  Award,
  CheckCircle2,
  PartyPopper,
  MapPin,
  Clock
} from 'lucide-react';

interface LandingModeProps {
  cart: CartItem[];
  onAddToCart: (item: FoodItem) => void;
  onRemoveFromCart: (itemId: string, removeAll?: boolean) => void;
  onDecreaseQuantity: (itemId: string) => void;
  onIncreaseQuantity: (itemId: string) => void;
  onClearCart: () => void;
}

export default function LandingMode({
  cart,
  onAddToCart,
  onRemoveFromCart,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onClearCart
}: LandingModeProps) {
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [emailValue, setEmailValue] = useState<string>('');
  const [newsLetterJoined, setNewsletterJoined] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string>('');
  const [orderConfirmed, setOrderConfirmed] = useState<boolean>(false);
  const [trackedOrderId, setTrackedOrderId] = useState<number | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<any>(null);

  // Customer auth
  const [customer, setCustomer] = useState<{ name: string; phone: string; address: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem('d4u_customer') || 'null'); } catch { return null; }
  });
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [loginName, setLoginName] = useState<string>('');
  const [loginPhone, setLoginPhone] = useState<string>('');
  const [loginAddress, setLoginAddress] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Feedback states
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  // My Orders panel
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState<boolean>(false);
  const [myOrders, setMyOrders] = useState<any[]>([]);

  // Guest track order
  const [isTrackOpen, setIsTrackOpen] = useState<boolean>(false);
  const [trackId, setTrackId] = useState<string>('');
  const [trackPhone, setTrackPhone] = useState<string>('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState<string>('');
  const [trackLoading, setTrackLoading] = useState<boolean>(false);

  // Poll bridge for My Orders (when panel open + logged in)
  useEffect(() => {
    if (!customer || !isMyOrdersOpen) return;
    const fetchMyOrders = async () => {
      try {
        const res = await fetch(`http://localhost:3001/online-orders?phone=${encodeURIComponent(customer.phone)}`);
        if (res.ok) setMyOrders(await res.json());
      } catch { /* bridge offline */ }
    };
    fetchMyOrders();
    const tid = setInterval(fetchMyOrders, 5000);
    return () => clearInterval(tid);
  }, [customer, isMyOrdersOpen]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const name = loginName.trim();
    const phone = loginPhone.trim();
    const address = loginAddress.trim();
    if (!name || !phone || !address) { setLoginError('Name, Phone aur Address sab zaroori hain'); return; }
    if (phone.length < 7) { setLoginError('Valid phone number enter karein'); return; }
    const c = { name, phone, address };
    localStorage.setItem('d4u_customer', JSON.stringify(c));
    setCustomer(c);
    setIsLoginOpen(false);
    setLoginName('');
    setLoginPhone('');
    setLoginAddress('');
    setLoginError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('d4u_customer');
    setCustomer(null);
    setIsMyOrdersOpen(false);
    setMyOrders([]);
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = trackId.trim();
    const phone = trackPhone.trim();
    if (!id) { setTrackError('Order ID zaroori hai'); return; }
    setTrackLoading(true);
    setTrackError('');
    setTrackResult(null);
    try {
      const res = await fetch(`http://localhost:3001/online-orders/${id}`);
      if (!res.ok) { setTrackError('Order nahi mila — ID check karein'); setTrackLoading(false); return; }
      const data = await res.json();
      // If phone was given, verify it matches (guests with phone) — skip if order has no phone
      if (phone && data.customerPhone && data.customerPhone !== phone) {
        setTrackError('Phone number match nahi kiya');
        setTrackLoading(false);
        return;
      }
      setTrackResult(data);
    } catch {
      setTrackError('Bridge offline — baad mein try karein');
    }
    setTrackLoading(false);
  };

  const handleSubmitFeedback = async () => {
    const targetOrder = trackResult || trackedOrder;
    if (!targetOrder || !feedbackRating) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch(`http://localhost:3001/online-orders/${targetOrder.id}/feedback`, {
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

  // Poll bridge for live order status
  useEffect(() => {
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

  const handleNewsletterJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue) return;
    setNewsletterJoined(true);
    setEmailValue('');
    setTimeout(() => {
      setNewsletterJoined(false);
    }, 4000);
  };

  const handleAddToCartWithNotify = (item: FoodItem) => {
    onAddToCart(item);
    setNotificationMsg(`Added ${item.name} to Basket!`);
    setTimeout(() => {
      setNotificationMsg('');
    }, 2000);
  };

  const megaZinger = foodItems.find(i => i.id === '3') || foodItems[0];
  const midnightPizza = foodItems.find(i => i.id === '8') || foodItems[1];
  const rigatoniItem = foodItems.find(i => i.id === '11') || foodItems[2];
  const goldLeafShake = foodItems.find(i => i.id === '14') || foodItems[3];
  const lavaNoir = foodItems.find(i => i.id === '15') || foodItems[4];
  const sunsetSpritz = foodItems.find(i => i.id === '13') || foodItems[5];

  const subtotalUSD = cart.reduce((sum, item) => sum + item.foodItem.priceUSD * item.quantity, 0);
  const taxUSD = subtotalUSD * 0.08;
  const totalUSD = subtotalUSD + taxUSD;
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div id="landing-layout-root" className="min-h-screen bg-[#0c1322] text-[#dce2f7] select-none font-sans overflow-x-hidden">

      {notificationMsg && (
        <div id="toast-notify" className="fixed bottom-6 left-6 z-[999] bg-[#ffe1a7] text-slate-950 px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-2xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#003824]" />
          <span>{notificationMsg}</span>
        </div>
      )}

      <header id="landing-master-header" className="sticky top-0 left-0 w-full z-50 transition-all duration-300 px-8 h-20 flex justify-between items-center bg-[#0c1322]/90 backdrop-blur-md border-b border-slate-800/40">
        <div className="flex items-center gap-10">
          <h1 className="font-headline-md text-2xl font-black text-[#ffe1a7] tracking-tight cursor-pointer">DineDash</h1>
          <nav className="hidden md:flex items-center gap-6">
            <span className="font-bold text-xs text-[#ffe1a7] border-b-2 border-[#ffe1a7] pb-1 transition-all uppercase tracking-widest cursor-pointer">Menu</span>
            <span className="font-bold text-xs text-[#d3c5ac] hover:text-[#ffe1a7] transition-all uppercase tracking-widest cursor-pointer">Deals</span>
            <span className="font-bold text-xs text-[#d3c5ac] hover:text-[#ffe1a7] transition-all uppercase tracking-widest cursor-pointer">Rewards</span>
            <span className="font-bold text-xs text-[#d3c5ac] hover:text-[#ffe1a7] transition-all uppercase tracking-widest cursor-pointer">Support</span>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-[#d3c5ac] hover:text-[#ffe1a7] transition-colors">
            <Search className="w-5 h-5" />
          </button>
          {customer ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMyOrdersOpen(true)}
                className="flex items-center gap-2 bg-[#191f2f] border border-[#fbbf24]/40 hover:border-[#fbbf24] px-3 py-1.5 rounded-full transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-[#fbbf24] flex items-center justify-center text-slate-900 text-[10px] font-black">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-[#ffe1a7] max-w-[80px] truncate hidden sm:block">{customer.name}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* If guest has an active order — show live order badge */}
              {trackedOrderId ? (
                <button
                  onClick={() => {
                    setTrackId(String(trackedOrderId));
                    setTrackResult(trackedOrder);
                    setTrackError('');
                    setIsTrackOpen(true);
                  }}
                  className="flex items-center gap-2 bg-[#141b2b] border border-[#4edea3]/40 hover:border-[#4edea3] px-3 py-1.5 rounded-full transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse flex-shrink-0" />
                  <span className="text-xs font-black text-[#4edea3]">Order #{trackedOrderId}</span>
                </button>
              ) : (
                <button
                  onClick={() => { setIsTrackOpen(true); setTrackResult(null); setTrackError(''); setTrackId(''); setTrackPhone(''); }}
                  className="flex items-center gap-2 bg-[#141b2b] border border-slate-700 hover:border-[#4edea3] px-3 py-1.5 rounded-full transition-all group"
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#4edea3] transition-colors" />
                  <span className="text-xs font-bold text-slate-400 group-hover:text-[#4edea3] transition-colors">Track Order</span>
                </button>
              )}
              <button onClick={() => setIsLoginOpen(true)} className="p-2 text-[#d3c5ac] hover:text-[#ffe1a7] transition-colors">
                <User className="w-5 h-5" />
              </button>
            </div>
          )}
          <button
            onClick={() => setIsCartOpen(!isCartOpen)}
            className="relative p-2 text-[#ffe1a7] hover:scale-110 transition-transform cursor-pointer"
          >
            <ShoppingCart className="w-6 h-6 stroke-[2]" />
            {totalItemCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#fbbf24] text-slate-950 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-slate-900">
                {totalItemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="relative pb-24">

        <section id="landing-hero" className="relative h-[90vh] w-full flex items-center justify-start overflow-hidden px-8">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c1322] via-[#0c1322]/80 to-transparent z-10"></div>
            <img
              alt="Zinger Burger Hero Banner"
              className="w-full h-full object-cover object-center image-no-referrer"
              src={megaZinger.image}
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="relative z-20 max-w-3xl space-y-6">
            <span className="inline-block bg-[#fbbf24] text-slate-950 px-4 py-1.5 rounded-full font-bold text-[10px] tracking-widest uppercase">
              {megaZinger.tag}
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tighter text-white">
              THE MEGA <br/>
              <span className="text-[#fbbf24]">{megaZinger.name.split(' ').slice(2).join(' ').toUpperCase() || 'ZINGER EVO'}</span>
            </h1>
            <p className="text-sm md:text-base text-[#d3c5ac] max-w-lg leading-relaxed font-semibold">
              {megaZinger.description}
            </p>
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => handleAddToCartWithNotify(megaZinger)}
                className="h-16 px-10 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-extrabold rounded-full hover:scale-105 transition-transform flex items-center gap-2 text-xs tracking-wider cursor-pointer"
              >
                ORDER NOW
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                className="h-16 px-10 border-2 border-[#4f4633]/70 hover:border-amber-400 text-white font-extrabold rounded-full hover:bg-slate-800/40 transition-colors text-xs tracking-wider cursor-pointer"
              >
                VIEW THE MENU
              </button>
            </div>
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-8 z-30">
            {[
              { label: 'BURGERS', icon: '🍔' },
              { label: 'PIZZAS', icon: '🍕' },
              { label: 'DRINKS', icon: '🍹' }
            ].map((v, idx) => (
              <button
                key={`banner-cat-${idx}`}
                className="group flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-[#191f2f]/85 backdrop-blur-md border border-[#4f4633] flex items-center justify-center text-2xl group-hover:bg-[#fbbf24] group-hover:scale-110 transition-all shadow-xl">
                  {v.icon}
                </div>
                <span className="text-[9px] font-bold tracking-widest text-slate-400 group-hover:text-amber-300 transition-colors">{v.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="py-24 px-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Exclusive drops</span>
              <h2 className="text-4xl lg:text-5xl font-black uppercase text-white mt-2 leading-none">Signature Series</h2>
              <p className="text-[#d3c5ac] mt-2 text-sm font-medium">Hand-crafted artisan culinary releases from our master chefs.</p>
            </div>
            <div className="flex gap-2">
              <button className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-300" />
              </button>
              <button className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

            <div className="md:col-span-7 group relative overflow-hidden rounded-[32px] bg-[#191f2f] aspect-[16/10] border border-slate-800/40">
              <img
                alt="Pizza"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 image-no-referrer"
                src={midnightPizza.image}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1322] via-[#0c1322]/10 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                <div>
                  <span className="text-[#fbbf24] font-bold text-[10px] tracking-widest uppercase">{midnightPizza.tag}</span>
                  <h3 className="text-2xl lg:text-3xl font-black text-white mt-1">{midnightPizza.name}</h3>
                  <p className="text-[#d3c5ac] text-xs mt-2 max-w-xs">{midnightPizza.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-black text-[#fbbf24] block">${midnightPizza.priceUSD.toFixed(2)}</span>
                  <button
                    onClick={() => handleAddToCartWithNotify(midnightPizza)}
                    className="mt-4 bg-white hover:bg-amber-300 text-slate-950 w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg cursor-pointer"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 group relative overflow-hidden rounded-[32px] bg-[#191f2f] border border-slate-800/40 p-1 flex flex-col justify-end min-h-[350px]">
              <img
                alt="Pasta"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 image-no-referrer"
                src={rigatoniItem.image}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1322] via-[#0c1322]/20 to-transparent"></div>
              <div className="relative z-10 p-8">
                <h3 className="text-2xl lg:text-3xl font-black text-white">{rigatoniItem.name}</h3>
                <p className="text-[#d3c5ac] text-xs mt-2">{rigatoniItem.description}</p>
                <div className="flex justify-between items-center mt-6">
                  <span className="text-2xl font-black text-[#fbbf24]">${rigatoniItem.priceUSD.toFixed(2)}</span>
                  <button
                    onClick={() => handleAddToCartWithNotify(rigatoniItem)}
                    className="bg-[#fbbf24] hover:bg-amber-400 text-slate-950 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 group relative overflow-hidden rounded-[32px] bg-[#191f2f] aspect-square border border-slate-800/40">
              <img
                alt="Shake"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 image-no-referrer"
                src={goldLeafShake.image}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1322]/90 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div>
                  <h4 className="font-extrabold text-base text-white">{goldLeafShake.name}</h4>
                  <span className="text-sm font-bold text-[#fbbf24] block mt-0.5">${goldLeafShake.priceUSD.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => handleAddToCartWithNotify(goldLeafShake)}
                  className="bg-white hover:bg-amber-400 hover:text-slate-950 text-slate-950 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            <div className="md:col-span-4 group relative overflow-hidden rounded-[32px] bg-[#191f2f] aspect-square border border-slate-800/40">
              <img
                alt="Dessert"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 image-no-referrer"
                src={lavaNoir.image}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1322]/90 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div>
                  <h4 className="font-extrabold text-base text-white">{lavaNoir.name}</h4>
                  <span className="text-sm font-bold text-[#fbbf24] block mt-0.5">${lavaNoir.priceUSD.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => handleAddToCartWithNotify(lavaNoir)}
                  className="bg-white hover:bg-amber-400 hover:text-slate-950 text-slate-950 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            <div className="md:col-span-4 group relative overflow-hidden rounded-[32px] bg-[#191f2f] aspect-square border border-slate-800/40">
              <img
                alt="Cocktail"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 image-no-referrer"
                src={sunsetSpritz.image}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1322]/90 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div>
                  <h4 className="font-extrabold text-base text-white">{sunsetSpritz.name}</h4>
                  <span className="text-sm font-bold text-[#fbbf24] block mt-0.5">${sunsetSpritz.priceUSD.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => handleAddToCartWithNotify(sunsetSpritz)}
                  className="bg-white hover:bg-amber-400 hover:text-slate-950 text-slate-950 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

          </div>
        </section>

        <section id="landing-dash" className="relative py-24 max-w-5xl mx-auto text-center px-8 border-t border-slate-800">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-white mb-6 uppercase">READY TO DASH?</h2>
          <p className="text-[#d3c5ac] max-w-xl mx-auto text-sm md:text-base font-semibold mb-12 leading-relaxed">
            Experience the next generation of fast-casual dining. Fast, premium, and always fresh at your table or straight to your doorstep.
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-3 bg-[#191f2f]/80 border border-slate-800 px-8 py-4 rounded-2xl shadow-xl">
              <Zap className="w-5 h-5 text-[#fbbf24]" />
              <span className="font-bold text-xs uppercase tracking-widest text-[#dce2f7]">Lightning Fast</span>
            </div>
            <div className="flex items-center gap-3 bg-[#191f2f]/80 border border-slate-800 px-8 py-4 rounded-2xl shadow-xl">
              <Utensils className="w-5 h-5 text-[#fbbf24]" />
              <span className="font-bold text-xs uppercase tracking-widest text-[#dce2f7]">Master Chefs</span>
            </div>
            <div className="flex items-center gap-3 bg-[#191f2f]/80 border border-slate-800 px-8 py-4 rounded-2xl shadow-xl">
              <Award className="w-5 h-5 text-[#fbbf24]" />
              <span className="font-bold text-xs uppercase tracking-widest text-[#dce2f7]">Elite Rewards</span>
            </div>
          </div>
        </section>

      </main>

      {isCartOpen && (
        <aside id="landing-side-drawer-cart" className="fixed right-0 top-0 h-full w-[380px] bg-[#191f2f] shadow-2xl border-l border-slate-800 z-[100] flex flex-col p-6 animate-fade-in">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-extrabold text-[#ffe1a7] uppercase tracking-tight">Your Basket</h2>
              <p className="text-xs text-[#d3c5ac]">Table 42 • Ready in 12 mins</p>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 hover:bg-slate-800 rounded-full text-[#d3c5ac]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 space-y-4 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="text-center py-16 opacity-60">
                <p className="font-bold">No items in basket</p>
                <p className="text-xs text-[#d3c5ac] mt-1">Order signature series from the landing grids!</p>
              </div>
            ) : (
              cart.map((c) => (
                <div key={`land-cart-${c.foodItem.id}`} className="flex gap-3 bg-[#141b2b] p-3 rounded-2xl border border-slate-800/40">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                    <img
                      className="w-full h-full object-cover image-no-referrer"
                      src={c.foodItem.image}
                      alt={c.foodItem.name}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-sm text-white truncate">{c.foodItem.name}</h4>
                    <p className="text-[10px] text-[#d3c5ac]">Chef Customization</p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-3.5 bg-[#191f2f] px-2 py-0.5 rounded-full border border-slate-700/30">
                        <button onClick={() => onDecreaseQuantity(c.foodItem.id)} className="text-[#ffe1a7] text-xs font-bold">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-white">{c.quantity}</span>
                        <button onClick={() => onIncreaseQuantity(c.foodItem.id)} className="text-[#ffe1a7] text-xs font-bold">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs font-black text-[#4edea3]">${(c.foodItem.priceUSD * c.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={() => onRemoveFromCart(c.foodItem.id)} className="text-slate-600 hover:text-red-400 self-start pt-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="bg-[#141b2b] p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between text-xs text-[#d3c5ac]">
              <span>Subtotal:</span>
              <span className="font-bold">${subtotalUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#d3c5ac]">
              <span>Estimated Tax (8%):</span>
              <span className="font-bold">${taxUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-black text-white">
              <span>TOTAL:</span>
              <span className="text-lg text-[#fbbf24]">${totalUSD.toFixed(2)}</span>
            </div>
            <button
              onClick={async (e) => {
                const btn = e.currentTarget;
                if (btn.disabled) return;
                btn.disabled = true;
                btn.textContent = 'Encrypting...';
                
                if (!customer?.name?.trim() || !customer?.phone?.trim() || !customer?.address?.trim()) {
                  alert('Please update your profile with Name, Phone, and Address before ordering.');
                  btn.disabled = false;
                  btn.textContent = 'PLACE RESERVATION ORDER';
                  return;
                }
                const itemsSummary = cart.map(c => `${c.quantity}x ${c.foodItem.name}`).join(', ');
                try {
                  const res = await fetch('http://localhost:3001/online-orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      customer: customer?.name || 'Online Guest',
                      customerPhone: customer?.phone || '',
                      customerAddress: customer?.address || '123 Test Address, City',
                      items: itemsSummary,
                      totalAmount: totalUSD.toFixed(2),
                      source: 'Website',
                      notes: '',
                    }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setTrackedOrderId(data.order?.id || null);
                    setTrackedOrder(data.order || null);
                  }
                } catch {
                  // Bridge offline — show confirmation only
                }
                onClearCart();
                setIsCartOpen(false);
                setOrderConfirmed(true);
              }}
              disabled={cart.length === 0}
              className="w-full py-3.5 bg-[#fbbf24] hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow cursor-pointer"
            >
              PLACE RESERVATION ORDER
            </button>
          </div>
        </aside>
      )}

      {/* Guest Track Order Modal */}
      {isTrackOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#191f2f] border border-slate-700 rounded-[28px] p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#4edea3]" />
                  Track Your Order
                </h3>
                <p className="text-xs text-[#d3c5ac] mt-0.5">Order ID enter karein status dekhne ke liye</p>
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
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#d3c5ac] block mb-1.5">Phone Number (optional)</label>
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
                  className="w-full py-3.5 bg-[#4edea3] hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  {trackLoading ? 'Searching...' : 'Find My Order'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Order found — show details */}
                <div className="bg-[#141b2b] rounded-2xl border border-slate-800 p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-white text-base">Order #{trackResult.id}</p>
                      <p className="text-[10px] text-[#d3c5ac]">{trackResult.customer} · {trackResult.timePlaced}</p>
                    </div>
                    <span className="text-xs font-black text-[#fbbf24]">${trackResult.totalAmount}</span>
                  </div>
                  <p className="text-xs text-[#d3c5ac] leading-relaxed">{trackResult.items}</p>
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
                      done: trackResult.kdsStatus === 'PREPARING' || trackResult.kdsStatus === 'READY' || trackResult.status === 'DISPATCHED' || trackResult.status === 'PAID' || trackResult.status === 'SETTLED',
                    },
                    {
                      label: 'Ready for Delivery',
                      sub: trackResult.kdsStatus === 'READY' ? 'Food is packed!' : 'Pending...',
                      done: trackResult.kdsStatus === 'READY' || trackResult.status === 'DISPATCHED' || trackResult.status === 'PAID' || trackResult.status === 'SETTLED',
                    },
                    {
                      label: 'Dispatched',
                      sub: (trackResult.status === 'DISPATCHED' || trackResult.status === 'PAID' || trackResult.status === 'SETTLED') ? 'Rider on the way' : 'Waiting for rider...',
                      done: trackResult.status === 'DISPATCHED' || trackResult.status === 'PAID' || trackResult.status === 'SETTLED',
                    },
                    {
                      label: 'Delivered',
                      sub: (trackResult.status === 'PAID' || trackResult.status === 'SETTLED') ? 'Cash Collected & Delivered ✓' : 'Pending...',
                      done: trackResult.status === 'PAID' || trackResult.status === 'SETTLED',
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 relative">
                      {i < 5 && <div className={`absolute left-2.5 top-5 w-[2px] h-6 ${step.done ? 'bg-[#4edea3]' : 'bg-slate-700'}`}></div>}
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
                  ))}
                </div>

                {trackResult.status === 'DISPATCHED' && trackResult.delivery && (
                  <div className="bg-[#141b2b] border border-[#4edea3]/30 rounded-xl overflow-hidden mt-4">
                    <div className="bg-[#4edea3]/10 px-4 py-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping" />
                      <span className="text-[10px] font-black uppercase text-[#4edea3]">Rider is approaching!</span>
                    </div>
                    <div className="relative h-32 bg-slate-900 w-full overflow-hidden flex items-center justify-center">
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
                        <button onClick={handleSubmitFeedback} disabled={!feedbackRating || isSubmittingFeedback} className="w-full py-2 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">Submit Feedback</button>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setTrackResult(null); setTrackId(''); setTrackPhone(''); }}
                    className="flex-1 py-2.5 border border-slate-700 hover:border-slate-500 text-[#d3c5ac] font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Search Again
                  </button>
                  <button
                    onClick={() => setIsTrackOpen(false)}
                    className="flex-1 py-2.5 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#191f2f] border border-slate-700 rounded-[28px] p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-white">Sign In</h3>
                <p className="text-xs text-[#d3c5ac] mt-0.5">Apna naam aur phone enter karein</p>
              </div>
              <button onClick={() => { setIsLoginOpen(false); setLoginError(''); }} className="text-slate-500 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#d3c5ac] block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={loginName}
                  onChange={e => setLoginName(e.target.value)}
                  placeholder="e.g. Ali Khan"
                  className="w-full bg-[#141b2b] border border-slate-700 focus:border-[#fbbf24] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#d3c5ac] block mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={loginPhone}
                  onChange={e => setLoginPhone(e.target.value)}
                  placeholder="e.g. 03001234567"
                  className="w-full bg-[#141b2b] border border-slate-700 focus:border-[#fbbf24] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>
              {loginError && (
                <p className="text-xs text-red-400 font-bold">{loginError}</p>
              )}
              <button type="submit" className="w-full py-3.5 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all mt-2 cursor-pointer">
                Sign In
              </button>
              <p className="text-[10px] text-center text-slate-600">No password needed — phone number se pehchana jaata hai</p>
            </form>
          </div>
        </div>
      )}

      {/* My Orders Panel */}
      {isMyOrdersOpen && customer && (
        <div className="fixed inset-0 z-[250] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMyOrdersOpen(false)} />
          <aside className="relative w-full max-w-sm bg-[#141b2b] border-l border-slate-800 flex flex-col h-full shadow-2xl animate-slide-in-right">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <div>
                <h2 className="font-black text-white text-base">My Orders</h2>
                <p className="text-[10px] text-[#d3c5ac] mt-0.5">{customer.name} · {customer.phone}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleLogout} className="text-[10px] text-slate-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors">Logout</button>
                <button onClick={() => setIsMyOrdersOpen(false)} className="text-slate-500 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {myOrders.length === 0 ? (
                <div className="text-center py-16 text-[#d3c5ac]">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                  <p className="font-bold text-sm">No orders yet</p>
                  <p className="text-xs mt-1 text-slate-600">Jab order karain ge to yahan dikhega</p>
                </div>
              ) : (
                myOrders.map((ord) => {
                  const statusColor =
                    ord.kdsStatus === 'READY' ? 'text-[#4edea3]' :
                    ord.kdsStatus === 'PREPARING' ? 'text-amber-400' :
                    ord.kdsStatus === 'ACCEPTED' ? 'text-blue-400' : 'text-slate-500';
                  const statusLabel =
                    ord.kdsStatus === 'READY' ? 'Ready for Pickup' :
                    ord.kdsStatus === 'PREPARING' ? `In Kitchen${ord.prepTimeMinutes ? ` (~${ord.prepTimeMinutes} min)` : ''}` :
                    ord.kdsStatus === 'ACCEPTED' ? 'Confirmed by Restaurant' : 'Waiting for Confirmation';
                  return (
                    <div key={ord.id} className="bg-[#191f2f] rounded-2xl border border-slate-800 p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-white text-sm">Order #{ord.id}</p>
                          <p className="text-[10px] text-[#d3c5ac]">{ord.timePlaced}</p>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${statusColor}`}>{statusLabel}</span>
                      </div>
                      <p className="text-xs text-[#d3c5ac] leading-relaxed">{ord.items}</p>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                        <span className="text-xs text-slate-500">Total</span>
                        <span className="text-sm font-black text-[#fbbf24]">${ord.totalAmount}</span>
                      </div>
                      {/* Mini tracking bar */}
                      <div className="flex gap-1.5 pt-1">
                        {['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].map((s, i) => (
                          <div
                            key={s}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              (['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].indexOf(ord.kdsStatus) >= i)
                                ? 'bg-[#fbbf24]' : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                      {ord.kdsStatus === 'READY' && (
                        <div className="bg-[#4edea3]/10 border border-[#4edea3]/20 rounded-xl px-3 py-2 text-center">
                          <span className="text-xs font-black text-[#4edea3]">Your order is ready!</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Live indicator */}
            <div className="px-4 py-3 border-t border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse" />
              <span className="text-[10px] text-slate-600">Live updates — har 5 seconds mein refresh</span>
            </div>
          </aside>
        </div>
      )}

      {/* Custom Order Confirmation + Live Tracking Modal */}
      {orderConfirmed && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#191f2f] border border-[#fbbf24]/30 rounded-[28px] p-8 max-w-sm w-full mx-4 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/30 flex items-center justify-center mx-auto mb-4">
                <PartyPopper className="w-6 h-6 text-[#fbbf24]" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Order Confirmed!</h3>
              {trackedOrderId && (
                <div className="mt-3">
                  <p className="text-[10px] text-[#d3c5ac] uppercase tracking-widest mb-1">Your Order ID</p>
                  <div className="bg-[#141b2b] border border-[#fbbf24]/40 rounded-xl px-4 py-3 inline-block">
                    <span className="text-2xl font-black text-[#fbbf24] tracking-wider">#{trackedOrderId}</span>
                  </div>
                  {!customer && (
                    <p className="text-[10px] text-slate-500 mt-2">
                      Yeh ID save kar lein — Track Order se status check kar saktay hain
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Live Status Timeline */}
            <div className="space-y-3 mb-6">
              {[
                {
                  label: 'Order Placed',
                  sub: trackedOrder?.timePlaced || 'Just now',
                  done: true,
                },
                {
                  label: 'Confirmed by Restaurant',
                  sub: trackedOrder?.kdsStatus === 'PENDING' ? 'Waiting for cashier...' : 'Accepted ✓',
                  done: trackedOrder?.kdsStatus !== 'PENDING' && trackedOrder?.kdsStatus != null,
                },
                {
                  label: 'In Kitchen',
                  sub: trackedOrder?.kdsStatus === 'PREPARING'
                    ? `~${trackedOrder.prepTimeMinutes} mins · Ready by ${trackedOrder.estimatedReadyAt}`
                    : trackedOrder?.kdsStatus === 'READY' ? 'Done ✓' : 'Waiting...',
                  done: trackedOrder?.kdsStatus === 'PREPARING' || trackedOrder?.kdsStatus === 'READY' || trackedOrder?.status === 'DISPATCHED' || trackedOrder?.status === 'PAID' || trackedOrder?.status === 'SETTLED',
                },
                {
                  label: 'Ready for Delivery',
                  sub: trackedOrder?.kdsStatus === 'READY' ? 'Food is packed!' : 'Pending...',
                  done: trackedOrder?.kdsStatus === 'READY' || trackedOrder?.status === 'DISPATCHED' || trackedOrder?.status === 'PAID' || trackedOrder?.status === 'SETTLED',
                },
                {
                  label: 'Dispatched',
                  sub: (trackedOrder?.status === 'DISPATCHED' || trackedOrder?.status === 'PAID' || trackedOrder?.status === 'SETTLED') ? 'Rider on the way' : 'Waiting for rider...',
                  done: trackedOrder?.status === 'DISPATCHED' || trackedOrder?.status === 'PAID' || trackedOrder?.status === 'SETTLED',
                },
                {
                  label: 'Delivered',
                  sub: (trackedOrder?.status === 'PAID' || trackedOrder?.status === 'SETTLED') ? 'Cash Collected & Delivered ✓' : 'Pending...',
                  done: trackedOrder?.status === 'PAID' || trackedOrder?.status === 'SETTLED',
                },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 relative">
                  {i < 5 && <div className={`absolute left-2.5 top-5 w-[2px] h-6 ${step.done ? 'bg-[#4edea3]' : 'bg-slate-700'}`}></div>}
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
              ))}
            </div>

            {trackedOrder?.status === 'DISPATCHED' && trackedOrder?.delivery && (
              <div className="bg-[#141b2b] border border-[#4edea3]/30 rounded-xl overflow-hidden mt-4 mb-4">
                <div className="bg-[#4edea3]/10 px-4 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping" />
                  <span className="text-[10px] font-black uppercase text-[#4edea3]">Rider is approaching!</span>
                </div>
                <div className="relative h-32 bg-slate-900 w-full overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 border-[0.5px] border-slate-800" style={{ backgroundSize: '20px 20px', backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)' }} />
                  <div className="w-32 h-32 border border-[#4edea3]/20 rounded-full animate-ping absolute" />
                  <div className="w-16 h-16 border border-[#4edea3]/40 rounded-full animate-ping absolute" />
                  <div className="w-4 h-4 bg-[#4edea3] rounded-full z-10 shadow-[0_0_15px_#4edea3] relative flex items-center justify-center">
                    <div className="absolute -top-6 bg-white text-slate-900 text-[8px] font-bold px-2 py-0.5 rounded whitespace-nowrap">Rider</div>
                  </div>
                </div>
              </div>
            )}

            {(trackedOrder?.status === 'PAID' || trackedOrder?.status === 'SETTLED') && (
              <div className="bg-[#141b2b] border border-amber-500/30 rounded-xl p-4 mt-4 mb-4 text-center">
                {trackedOrder?.feedback || feedbackSubmitted ? (
                  <div>
                    <h4 className="text-sm font-black text-[#4edea3] mb-1">Thanks for your feedback!</h4>
                    <div className="flex justify-center gap-1 my-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg key={star} className={`w-5 h-5 ${(trackedOrder?.feedback?.rating || feedbackRating) >= star ? 'text-amber-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400">"{trackedOrder?.feedback?.comment || feedbackComment}"</p>
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
                    <button onClick={handleSubmitFeedback} disabled={!feedbackRating || isSubmittingFeedback} className="w-full py-2 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">Submit Feedback</button>
                  </div>
                )}
              </div>
            )}

            {/* Polling indicator */}
            {trackedOrderId && trackedOrder?.status !== 'PAID' && trackedOrder?.status !== 'SETTLED' && (
              <div className="flex items-center gap-2 mb-4 bg-[#141b2b] rounded-xl px-4 py-2 border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse flex-shrink-0"></span>
                <span className="text-[10px] text-[#d3c5ac]">Live tracking active — updates every 4 seconds</span>
              </div>
            )}

            {!customer && trackedOrderId && (
              <div className="flex items-center gap-2 mb-3 bg-[#4edea3]/5 border border-[#4edea3]/20 rounded-xl px-4 py-2.5">
                <MapPin className="w-3.5 h-3.5 text-[#4edea3] flex-shrink-0" />
                <span className="text-[10px] text-[#4edea3]">
                  Header mein <strong>Order #{trackedOrderId}</strong> button se live track karein
                </span>
              </div>
            )}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setOrderConfirmed(false);
                  setTrackId(String(trackedOrderId));
                  setTrackResult(trackedOrder);
                  setTrackError('');
                  setIsTrackOpen(true);
                }}
                className="flex-1 py-3.5 bg-[#4edea3] text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
              >
                Track Your Order
              </button>
              <button
                onClick={() => setOrderConfirmed(false)}
                className="flex-1 py-3 border border-[#ffe1a7] text-[#ffe1a7] rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all hover:bg-[#ffe1a7]/10"
              >
                Go back to feeds
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-[#141b2b] py-16 px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">

          <div className="space-y-6">
            <h2 className="font-headline-md text-2xl font-black text-[#ffe1a7] tracking-tight">DineDash</h2>
            <p className="text-xs text-[#d3c5ac] leading-relaxed">
              The future of fast-casual dining. Premium culinary quality fused with state-of-the-art POS ordering mechanisms.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-[#191f2f]/80 flex items-center justify-center hover:text-[#ffe1a7] text-slate-400 transition-colors">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#191f2f]/80 flex items-center justify-center hover:text-[#ffe1a7] text-slate-400 transition-colors">
                <Share2 className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-white text-xs uppercase tracking-widest">Experience</h4>
            <ul className="space-y-4 text-xs text-[#d3c5ac]">
              <li><a href="#" className="hover:text-white">Our GOURMET Menu</a></li>
              <li><a href="#" className="hover:text-white">Bespoke Locations</a></li>
              <li><a href="#" className="hover:text-white">Fine-Dining Catering</a></li>
              <li><a href="#" className="hover:text-white">Member Gift Cards</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-white text-xs uppercase tracking-widest">Company</h4>
            <ul className="space-y-4 text-xs text-[#d3c5ac]">
              <li><a href="#" className="hover:text-white">Our Culinary Journey</a></li>
              <li><a href="#" className="hover:text-white">Corporate Sustainability</a></li>
              <li><a href="#" className="hover:text-white">Kitchen Careers</a></li>
              <li><a href="#" className="hover:text-white">Intellectual Privacy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-white text-xs uppercase tracking-widest">Join the Dash</h4>
            <p className="text-xs text-[#d3c5ac] mb-4">Subscribe for exclusive chef specials and priority reservations.</p>

            {newsLetterJoined ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-[#4edea3] text-[10px] font-bold p-3 rounded-xl uppercase tracking-wider text-center">
                ✓ Registered successfully!
              </div>
            ) : (
              <form onSubmit={handleNewsletterJoin} className="flex gap-2">
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 bg-slate-800 border-none rounded-xl px-4 text-xs focus:ring-1 focus:ring-[#ffe1a7] text-white"
                  required
                />
                <button type="submit" className="bg-[#fbbf24] hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">Join</button>
              </form>
            )}
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-slate-800 text-center text-xs text-[#d3c5ac]">
          © 2026 DineDash Restaurant Group. Inspired by the bold. Built for the gourmet.
        </div>
      </footer>

    </div>
  );
}
