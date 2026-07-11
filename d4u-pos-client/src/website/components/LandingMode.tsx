import React, { useState } from 'react';
import { FoodItem, CartItem } from '../types';
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
  ShieldCheck, 
  Globe, 
  Share2, 
  Award,
  CheckCircle2
} from 'lucide-react';

interface LandingModeProps {
  cart: CartItem[];
  onAddToCart: (item: FoodItem) => void;
  onRemoveFromCart: (itemId: string, removeAll?: boolean) => void;
  onDecreaseQuantity: (itemId: string) => void;
  onIncreaseQuantity: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export default function LandingMode({
  cart,
  onAddToCart,
  onRemoveFromCart,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onClearCart,
  onCheckout
}: LandingModeProps) {
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [emailValue, setEmailValue] = useState<string>('');
  const [newsLetterJoined, setNewsletterJoined] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string>('');

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

  // Find specific food items for bento grid layouts
  const megaZinger = foodItems.find(i => i.id === '3') || foodItems[0];
  const midnightPizza = foodItems.find(i => i.id === '8') || foodItems[1];
  const rigatoniItem = foodItems.find(i => i.id === '11') || foodItems[2];
  const goldLeafShake = foodItems.find(i => i.id === '14') || foodItems[3];
  const lavaNoir = foodItems.find(i => i.id === '15') || foodItems[4];
  const sunsetSpritz = foodItems.find(i => i.id === '13') || foodItems[5];

  // USD Calculations
  const subtotalUSD = cart.reduce((sum, item) => sum + item.foodItem.priceUSD * item.quantity, 0);
  const taxUSD = subtotalUSD * 0.08;
  const totalUSD = subtotalUSD + taxUSD;
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div id="landing-layout-root" className="min-h-screen bg-[#0c1322] text-[#dce2f7] select-none font-sans overflow-x-hidden">
      
      {/* Toast Notification for premium feedback */}
      {notificationMsg && (
        <div id="toast-notify" className="fixed bottom-6 left-6 z-[999] bg-[#ffe1a7] text-slate-950 px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-2xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#003824]" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header Overlay */}
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
          <button className="p-2 text-[#d3c5ac] hover:text-[#ffe1a7] transition-colors">
            <User className="w-5 h-5" />
          </button>
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

      {/* Main Canvas */}
      <main className="relative pb-24">
        
        {/* Massive Hero Section */}
        <section id="landing-hero" className="relative h-[90vh] w-full flex items-center justify-start overflow-hidden px-8">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c1322] via-[#0c1322]/80 to-transparent z-10"></div>
            <img 
              alt="Zinger Burger Hero Banner" 
              className="w-full h-full object-cover object-center scale-102 image-no-referrer" 
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

          {/* Floated custom category tabs overlay */}
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

        {/* Bento Grid Editorial Signature section */}
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

          {/* Real Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Bento block 1: Midnight Truffle Pizza (Large 7 columns) */}
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

            {/* Bento block 2: Rustic Rigatoni (Vertical 5 columns) */}
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

            {/* Bento block 3: Gold Leaf Shake (4 columns) */}
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

            {/* Bento block 4: Lava Noir (4 columns) */}
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

            {/* Bento block 5: Sunset Spritz (4 columns) */}
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

        {/* Ready to Dash interactive section */}
        <section id="landing-dash" className="relative py-24 max-w-5xl mx-auto text-center px-8 border-t border-slate-800">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-white mb-6 uppercase">READY TO DASH?</h2>
          <p className="text-[#d3c5ac] max-w-xl mx-auto text-sm md:text-base font-semibold mb-12 leading-relaxed">
            Experience the next generation of fast-casual dining. Fast, premium, and always fresh at your table or straight to your doorstep.
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-3 bg-[#191f2f]/80 border border-slate-800 px-8 py-4.5 rounded-2xl shadow-xl">
              <Zap className="w-5 h-5 text-[#fbbf24]" />
              <span className="font-bold text-xs uppercase tracking-widest text-[#dce2f7]">Lightning Fast</span>
            </div>
            <div className="flex items-center gap-3 bg-[#191f2f]/80 border border-slate-800 px-8 py-4.5 rounded-2xl shadow-xl">
              <Utensils className="w-5 h-5 text-[#fbbf24]" />
              <span className="font-bold text-xs uppercase tracking-widest text-[#dce2f7]">Master Chefs</span>
            </div>
            <div className="flex items-center gap-3 bg-[#191f2f]/80 border border-slate-800 px-8 py-4.5 rounded-2xl shadow-xl">
              <Award className="w-5 h-5 text-[#fbbf24]" />
              <span className="font-bold text-xs uppercase tracking-widest text-[#dce2f7]">Elite Rewards</span>
            </div>
          </div>
        </section>

      </main>

      {/* Side Cart Drawer */}
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

          {/* Cart items scroll detail */}
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
                        <button onClick={() => onDecreaseQuantity(c.foodItem.id)} className="text-[#ffe1a7] text-xs font-bold">-</button>
                        <span className="text-xs font-black text-white">{c.quantity}</span>
                        <button onClick={() => onIncreaseQuantity(c.foodItem.id)} className="text-[#ffe1a7] text-xs font-bold">+</button>
                      </div>
                      <span className="text-xs font-black text-[#4edea3]">${(c.foodItem.priceUSD * c.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sub Totals */}
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
              onClick={() => {
                onCheckout();
                setIsCartOpen(false);
              }}
              disabled={cart.length === 0}
              className="w-full py-3.5 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow"
            >
              PLACE RESERVATION ORDER
            </button>
          </div>
        </aside>
      )}

      {/* Styled corporate elements footer layout */}
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
