import React, { useState, useEffect } from 'react';
import { 
  Search, User, MapPin, ShoppingCart, ArrowRight, ChevronLeft, ChevronRight, 
  Plus, Minus, Send, Check, Loader2, X, Percent, Phone, Mail, Globe, 
  Share2, Shield, Sparkles, Clock, CheckCircle2, AlertCircle, ShoppingBag
} from 'lucide-react';
import { io } from 'socket.io-client';

// Product Interface matching Prisma schema guidelines
export interface Product {
  id: number;
  store_id: number;
  name: string;
  price: number;
  is_active: boolean;
  image_url?: string;
  category: string;
  category_id?: number;
  description: string;
}

// Category structure


// Predefined product data matching mockup images and titles

// Cart Item interface
interface CartItem {
  product: Product;
  quantity: number;
  specialInstructions: string;
}

// Special Offer interface
interface Coupon {
  code: string;
  name: string;
  discountPercent: number;
  description: string;
  target_categories?: any[];
  target_products?: any[];
}


export default function StitchLanding({ 
  storeId, storeName, stores, foodItems, cart: globalCart, onAddToCart: globalAddToCart, 
  onRemoveFromCart, onDecreaseQuantity, onIncreaseQuantity, onClearCart, 
  banners, campaigns, onChangeBranch, settings
}: any) {
  const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';
  
  const PRODUCTS = (foodItems || []).map((fi: any) => ({
    id: fi.id,
    store_id: storeId || 1,
    name: fi.name,
    price: fi.priceUSD || fi.priceRs,
    priceRs: fi.priceRs,
    is_active: true,
    image_url: fi.image ? (fi.image.startsWith('http') ? fi.image : `${BACKEND_URL}${fi.image}`) : null,
    category: fi.category,
    categoryGroup: fi.categoryGroup,
    description: fi.description,
    variants: fi.variants,
    categories: fi.categories
  }));

  const CATEGORY_GROUPS: string[] = Array.from(new Set<string>(PRODUCTS.map((p: any) => p.categoryGroup as string).filter(Boolean)));
  const [activeCategoryGroup, setActiveCategoryGroup] = useState<string>('');

  const CATEGORIES: string[] = Array.from(new Set<string>(
    PRODUCTS
      .filter((p: any) => CATEGORY_GROUPS.length === 0 || p.categoryGroup === activeCategoryGroup || !activeCategoryGroup)
      .map((p: any) => p.category as string)
  )).filter(c => !['extra toppings', 'add-ons', 'addons'].includes((c || '').toLowerCase()));

  // Navigation & Location states — pre-set to the chosen store
  const [selectedLocation, setSelectedLocation] = useState<{ city: string; branch: string } | null>(
    storeName ? { city: '', branch: storeName } : null
  );
  const [activeTab, setActiveTab] = useState<'home' | 'rewards' | 'support'>('home');
  
  // Dialog / Selection states inside Location Modal
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  
  // Dynamic menu filtering
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (CATEGORY_GROUPS.length > 0 && !activeCategoryGroup) {
      setActiveCategoryGroup(CATEGORY_GROUPS[0]);
    }
  }, [CATEGORY_GROUPS, activeCategoryGroup]);

  useEffect(() => {
    if (CATEGORIES.length > 0 && !activeCategory) {
      setActiveCategory(CATEGORIES[0]);
    } else if (CATEGORIES.length > 0 && !CATEGORIES.includes(activeCategory)) {
      setActiveCategory(CATEGORIES[0]);
    }
  }, [CATEGORIES, activeCategory]);

  // Banner Slider State
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);
  
  // Checkout States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'NONE' | 'SELECT_VARIANT' | 'ADD_ONS'>('NONE');
  const [pendingVariantProduct, setPendingVariantProduct] = useState<any>(null);
  const [activeVariantTab, setActiveVariantTab] = useState<'SIZES' | 'TOPPINGS'>('SIZES');
  const [orderTracking, setOrderTracking] = useState<any>(null);
  const [trackInput, setTrackInput] = useState('');

  // Socket listener for live tracking updates
  useEffect(() => {
    const socket = io(BACKEND_URL);
    
    socket.on('order_updated', (updatedOrder: any) => {
      setOrderTracking((prev: any) => {
        if (prev && (prev.id == updatedOrder.id || prev.id == updatedOrder.orderId)) {
          return {
            ...prev,
            status: updatedOrder.kdsStatus !== 'PENDING' ? updatedOrder.kdsStatus : updatedOrder.status,
            ...updatedOrder
          };
        }
        return prev;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [BACKEND_URL]);

  // Payment Selection Dialog state
  const [isTrackModalOpen, setIsTrackModalOpen] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'COD' | 'WALLET'>('CASH');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'DINEIN' | 'PICKUP'>('DELIVERY');

  // Interactive Loyalty state (Rewards Page)
  const [loyaltyPhone, setLoyaltyPhone] = useState<string>('');
  const [loyaltyAccount, setLoyaltyAccount] = useState<{ name: string; points: number; tier: string } | null>(null);
  const [isLoyaltySearching, setIsLoyaltySearching] = useState<boolean>(false);
  const [redeemedPointsDiscount, setRedeemedPointsDiscount] = useState<number>(0);

  // Toast / Status System (Standard custom alerts mandated)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Contact Form states
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactSubject, setContactSubject] = useState<string>('');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);

  // Helper to show custom notification alerts safely (No window.alert allowed)
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Branch mapping per city
  const BRANCHES_BY_CITY: Record<string, string[]> = {
    'karachi': ['North Nazimabad', 'Gulshan-e-Iqbal', 'DHA Phase 6'],
    'lahore': ['Gulberg III', 'DHA Phase 5', 'Johar Town'],
    'islamabad': ['F-6 Markaz', 'Centaurus Mall', 'G-11']
  };

  // Predefined interactive coupons
  const COUPONS: Coupon[] = [
    { code: "IMSA30", name: "IMSA 30% OFF", discountPercent: 30, description: "IMSA special flat 30% discount" },
    { code: "DRINKS10", name: "[AUTO] Drinks Discount", discountPercent: 10, description: "Automatically scheduled discount of 10%" },
    { code: "GUEST15", name: "FRESH 15% OFF", discountPercent: 15, description: "Welcome guest discount of 15%" }
  ];

  // Load cart from local storage if available
  useEffect(() => {
    const savedCart = localStorage.getItem('d4u_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart from storage", e);
      }
    }
  }, []);

  // Update localStorage when cart changes
  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('d4u_cart', JSON.stringify(newCart));
  };

  const addToCart = (product: Product, variant?: any) => {
    const itemToUse = variant ? { ...product, name: `${product.name} (${variant.name})`, price: variant.price, priceRs: variant.price, id: `${product.id}-${variant.id}` } : product;
    
    const existingIndex = cart.findIndex(item => item.product.id === itemToUse.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updateCart(updated);
    } else {
      updateCart([...cart, { product: itemToUse as Product, quantity: 1, specialInstructions: '' }]);
    }
    triggerToast(`Added ${itemToUse.name} to cart!`);
  };

  const adjustQuantity = (productId: number, delta: number) => {
    const updated = cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0);
    updateCart(updated);
  };

  const addSpecialInstruction = (productId: number, instruction: string) => {
    const updated = cart.map(item => {
      if (item.product.id === productId) {
        return { ...item, specialInstructions: instruction };
      }
      return item;
    });
    updateCart(updated);
  };

  // MARKETING-003 §8 — Promotion Stack Explainer: same block message used on
  // POS/Waiter, shown here whenever the cart already carries an
  // auto-applying company promotion (Percentage/Flat/BOGO/Bundle/Combo/Free
  // Gift) and the customer tries to layer a second discount on top.
  const cartHasCompanyPromotion = () => cart.some((item) => getProductDiscount(item.product) > 0);
  const COMPANY_PROMOTION_BLOCK_MESSAGE = 'Company Promotion Active. Additional discounts cannot be applied.';

  // Coupons trigger
  const applyCoupon = (coupon: Coupon) => {
    if (cartHasCompanyPromotion()) {
      triggerToast(COMPANY_PROMOTION_BLOCK_MESSAGE, 'error');
      return;
    }
    setAppliedCoupon(coupon);
    triggerToast(`Coupon ${coupon.code} applied successfully!`, 'success');
  };

  // Cart Calculations
  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const getDiscountAmount = () => {
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.target_categories?.length || appliedCoupon.target_products?.length) {
        let applicableSubtotal = 0;
        cart.forEach(item => {
          const productMatches = appliedCoupon.target_products?.some((p:any) => p.id === item.product.id);
          const categoryMatches = appliedCoupon.target_categories?.some((c:any) => c.id === item.product.category_id);
          if (productMatches || categoryMatches) {
            applicableSubtotal += (item.product.price * item.quantity);
          }
        });
        discount += applicableSubtotal * (appliedCoupon.discountPercent / 100);
      } else {
        discount += getSubtotal() * (appliedCoupon.discountPercent / 100);
      }
    }
    discount += redeemedPointsDiscount;
    return Math.min(getSubtotal(), discount);
  };

  const getTax = () => {
    const taxableSubtotal = Math.max(0, getSubtotal() - getDiscountAmount());
    return taxableSubtotal * 0.13; // 13% tax rate
  };

  const getDeliveryFee = () => {
    if (deliveryType !== 'DELIVERY') return 0;
    const subtotal = getSubtotal();
    if (subtotal === 0) return 0;
    return subtotal > 15 ? 0 : 1.50; // Free delivery for orders > $15
  };

  const getGrandTotal = () => {
    return Math.max(0, getSubtotal() - getDiscountAmount() + getTax() + getDeliveryFee());
  };

  // Location selector confirmation
  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCity && selectedBranch) {
      setSelectedLocation({ city: selectedCity, branch: selectedBranch });
      triggerToast(`Location set to ${selectedCity.toUpperCase()} - ${selectedBranch}!`, 'success');
    }
  };

  // Support/Contact form submit
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      triggerToast("Please fill in all required fields.", "error");
      return;
    }
    setIsSendingMessage(true);
    // Simulate sending message
    setTimeout(() => {
      setIsSendingMessage(false);
      triggerToast("Your message has been sent successfully! Our support team will reach out shortly.", "success");
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
    }, 1500);
  };

  // Loyalty Points Lookup simulation
  const handleLoyaltySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loyaltyPhone || loyaltyPhone.length < 8) {
      triggerToast("Please enter a valid phone number.", "error");
      return;
    }
    setIsLoyaltySearching(true);
    setTimeout(() => {
      setIsLoyaltySearching(false);
      // Generate realistic reward account
      setLoyaltyAccount({
        name: loyaltyPhone.endsWith('1') ? "M. Imran Farooq" : "VIP Customer",
        points: Math.floor(Math.random() * 800) + 400,
        tier: loyaltyPhone.endsWith('1') ? "Diamond Member" : "Gold Member"
      });
      triggerToast("Account retrieved successfully!", "success");
    }, 1200);
  };

  // Loyalty discount redeemer
  const handleRedeemPoints = () => {
    if (!loyaltyAccount || loyaltyAccount.points < 200) {
      triggerToast("Minimum 200 points required to redeem.", "error");
      return;
    }
    if (cartHasCompanyPromotion()) {
      triggerToast(COMPANY_PROMOTION_BLOCK_MESSAGE, "error");
      return;
    }
    const pointsToRedeem = 500;
    const actualPointsRedeemed = Math.min(loyaltyAccount.points, pointsToRedeem);
    const value = actualPointsRedeemed * 0.01; // 100 points = $1
    setRedeemedPointsDiscount(value);
    setLoyaltyAccount({
      ...loyaltyAccount,
      points: loyaltyAccount.points - actualPointsRedeemed
    });
    triggerToast(`Redeemed ${actualPointsRedeemed} points for a $${value.toFixed(2)} discount!`, "success");
  };

  // POS Order Placer
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      triggerToast("Your cart is empty.", "error");
      return;
    }
    if (!customerName || !customerPhone || (deliveryType === 'DELIVERY' && !customerAddress)) {
      triggerToast("Please fill in all customer details.", "error");
      return;
    }

    
    setIsSubmittingOrder(true);
    
    const payload = {
        store_id: storeId || 1,
        customer: customerName || 'Online Guest',
        customerPhone: customerPhone || '',
        customerAddress: customerAddress || 'No Address',
        items: JSON.stringify(cart.map((c: any) => ({
          id: c.product.id,
          name: c.product.name,
          qty: c.quantity,
          price: c.product.price
        }))),
        totalAmount: (cart.reduce((sum: number, item: any) => sum + item.product.price * item.quantity, 0) * 1.08).toFixed(2),
        source: 'Website',
        notes: '',
    };

    fetch(`${BACKEND_URL}/online-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(async res => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      return res.json();
    }).then(data => {
      const trackingId = data.order?.id || `D4U-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderTracking({
        id: trackingId.toString(),
        status: "PENDING",
        eta: 25
      });
      setIsSubmittingOrder(false);
      setIsCheckoutOpen(false);
      setCart([]);
      setRedeemedPointsDiscount(0);
      setAppliedCoupon(null);
      triggerToast("Order placed successfully!", "success");
    }).catch(e => {
      console.error(e);
      let errMsg = e.message;
      try {
        const errObj = JSON.parse(e.message);
        errMsg = errObj.message || errObj.error || e.message;
      } catch (parseErr) {}
      triggerToast(`Failed to place order: ${errMsg}`, "error");
      setIsSubmittingOrder(false);
    });
  };


  // Filtered Products list based on category and search
  const getProductDiscount = (product: any) => {
    if (product.id && product.id.toString().includes('-')) return 0; // Variant item in cart
    if (['extra toppings', 'add-ons', 'addons'].includes((product.category || '').toLowerCase())) return 0;
    
    let maxDiscount = 0;
    const activeCampaigns = campaigns || [];
    for (const camp of activeCampaigns) {
      if (!camp.published_web) continue;

      const hasStoreTarget = camp.target_stores?.length > 0;
      const hasCategoryTarget = camp.target_categories?.length > 0;
      const hasProductTarget = camp.target_products?.length > 0;

      const sid = storeId || 1;
      const storeMatches = hasStoreTarget ? camp.target_stores.some((s:any) => s.id === sid) : true;
      if (!storeMatches) continue;

      let categoryMatches = false;
      if (hasCategoryTarget) {
        categoryMatches = camp.target_categories.some((c:any) => c.name === product.category);
      }

      let productMatches = false;
      if (hasProductTarget) {
        productMatches = camp.target_products.some((p:any) => p.id === product.id);
      }

      const noSpecificTargets = !hasCategoryTarget && !hasProductTarget;

      if (noSpecificTargets || categoryMatches || productMatches) {
        if (camp.discount_pct > maxDiscount) maxDiscount = camp.discount_pct;
      }
    }
    return maxDiscount;
  };

  const filteredProducts = PRODUCTS.filter((prod: any) => {
    let matchesCategory = true;
    const isExemptCategory = ['extra toppings', 'add-ons', 'addons'].includes((prod.category || '').toLowerCase());
    
    if (activeCategory === 'Discounted') {
      matchesCategory = getProductDiscount(prod) > 0;
    } else if (activeCategory && activeCategory !== 'All Items') {
      matchesCategory = prod.category === activeCategory;
    } else if (activeCategory === 'All Items') {
      matchesCategory = !isExemptCategory;
    }
    
    const matchesSearch = (prod.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          (prod.description || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-stitch-bg text-stitch-ink flex flex-col font-sans relative selection:bg-stitch-accent selection:text-stitch-accent-ink">
      
      {/* ================= TOAST NOTIFICATION LAYER ================= */}
      {toast && (
        <div className="fixed top-24 right-6 z-[200] max-w-sm w-full bg-stitch-card/95 border border-stitch-border rounded-xl p-4 shadow-2xl backdrop-blur-md transition-all animate-bounce">
          <div className="flex items-start gap-3">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-stitch-success shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-stitch-danger shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Sparkles className="w-5 h-5 text-stitch-accent shrink-0 mt-0.5" />}
            <div className="flex-1">
              <p className="text-sm font-medium text-stitch-ink">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-stitch-muted hover:text-stitch-ink shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STICKY TOP NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-stitch-bg/95 border-b border-stitch-border backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setActiveTab('home')}
                className="text-lg sm:text-2xl font-black tracking-tight text-stitch-ink hover:text-stitch-accent transition"
              >
                {storeName || 'D4U Restaurant'}
              </button>
            </div>

            {/* Navigation links */}
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => { setActiveTab('home'); }}
                className={`px-1 py-2 text-sm font-bold tracking-wider transition ${activeTab === 'home' ? 'text-stitch-accent border-b-2 border-stitch-accent' : 'text-stitch-muted hover:text-stitch-ink'}`}
              >
                MENU
              </button>
              <button
                onClick={() => { setActiveTab('rewards'); }}
                className={`px-1 py-2 text-sm font-bold tracking-wider transition ${activeTab === 'rewards' ? 'text-stitch-accent border-b-2 border-stitch-accent' : 'text-stitch-muted hover:text-stitch-ink'}`}
              >
                REWARDS
              </button>
              <button
                onClick={() => { setActiveTab('support'); }}
                className={`px-1 py-2 text-sm font-bold tracking-wider transition ${activeTab === 'support' ? 'text-stitch-accent border-b-2 border-stitch-accent' : 'text-stitch-muted hover:text-stitch-ink'}`}
              >
                SUPPORT
              </button>
            </nav>

            {/* Right-side Actions */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              {/* Dynamic Location Badge — opens same BranchSelectorModal as on load */}
              <button
                onClick={() => onChangeBranch ? onChangeBranch() : null}
                className="flex items-center text-stitch-accent hover:text-stitch-accent-hover text-xs sm:text-sm font-bold tracking-wider uppercase border border-stitch-accent/30 px-3 py-1.5 rounded-full bg-stitch-accent/5 hover:bg-stitch-accent/10 transition gap-1"
              >
                <MapPin className="w-4 h-4 animate-pulse" />
                {selectedLocation ? selectedLocation.branch : storeName || 'Select Location'}
                <span className="text-[10px] text-stitch-accent/60 font-medium normal-case tracking-normal border-l border-stitch-accent/30 pl-2 ml-1">Change Branch</span>
              </button>

              {/* Track Order Button */}
              <button
                onClick={() => setIsTrackModalOpen(true)}
                className="flex items-center gap-1.5 text-stitch-accent hover:text-stitch-ink px-3 py-1.5 rounded-full hover:bg-stitch-surface transition text-xs sm:text-sm font-bold uppercase tracking-wider"
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Track Order</span>
              </button>

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-full text-stitch-muted hover:text-stitch-ink hover:bg-stitch-surface transition"
                aria-label="View Cart"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-stitch-danger text-white text-[10px] sm:text-xs font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-stitch-bg animate-pulse">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Mobile Nav Bar */}
        <div className="md:hidden flex justify-around border-t border-stitch-border py-2.5 bg-stitch-bg/95">
          <button
            onClick={() => setActiveTab('home')}
            className={`text-xs font-bold px-3 py-1 rounded-full ${activeTab === 'home' ? 'bg-stitch-accent text-stitch-accent-ink' : 'text-stitch-muted'}`}
          >
            MENU
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`text-xs font-bold px-3 py-1 rounded-full ${activeTab === 'rewards' ? 'bg-stitch-accent text-stitch-accent-ink' : 'text-stitch-muted'}`}
          >
            REWARDS
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`text-xs font-bold px-3 py-1 rounded-full ${activeTab === 'support' ? 'bg-stitch-accent text-stitch-accent-ink' : 'text-stitch-muted'}`}
          >
            SUPPORT
          </button>
        </div>
      </header>

      {/* ================= MAIN SCREEN MANAGER ================= */}
      <main className="flex-grow">
        
        {/* VIEW: HOME / MENU */}
        {activeTab === 'home' && (
          <div>
            {/* HERO BANNER SLIDER */}
            <section className="relative w-full min-h-[420px] sm:h-[500px] bg-stitch-panel flex items-center overflow-hidden transition-all duration-700">
              <div className="absolute inset-0 z-0">
                <div key={banners && banners.length > 0 ? banners[currentBannerIndex]?.id : 'default'} className="absolute inset-0 w-full h-full animate-fade-in">
                  <img
                    alt={banners && banners.length > 0 ? banners[currentBannerIndex]?.title : "Delicious Premium Angus Burger"}
                    className="w-full h-full object-cover opacity-60 sm:opacity-80 animate-pan-zoom"
                    src={banners && banners.length > 0 ? `${BACKEND_URL}${banners[currentBannerIndex]?.imageUrl}` : "https://lh3.googleusercontent.com/aida-public/AB6AXuCIiya8Cbx_CdyZFIhVoboYMFkd2vfkN2hNvIBC6MwktpbKWWK4XVpoYLZEK6XF8rcaVTA6WKdoKFxr4wEo9vWFC6IzgvT4w8esgqz1lYyl1UwVY688mJQV9T5YVs_dgZYDIHY4zavtQh609odDannRlv2zZMAjpEue35Zpt7bYUFTRhhj7gzZBZmAQgpnQ0diZpLOw54wg6AEE4oNU4Oqi6EmSwayeNFkVrt2X69ckCqsBJzyk5opi0fXNiweo3dgOgiTVTPrsCYU"}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-stitch-bg/90 via-stitch-bg/40 to-transparent"></div>
              </div>

              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-fade-in" key={`text-${currentBannerIndex}`}>
                <div className="max-w-2xl bg-stitch-bg/40 p-8 sm:p-12 rounded-[2rem] border border-stitch-border shadow-2xl">
                  <span className="inline-block bg-stitch-accent text-stitch-accent-ink text-[10px] sm:text-xs font-black px-3.5 py-1.5 rounded-full mb-4 uppercase tracking-wider">
                    Featured
                  </span>
                  <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight leading-none mb-4 text-stitch-ink">
                    {banners && banners.length > 0 ? (
                      <>
                        {(banners[currentBannerIndex]?.title || '').split(' ').slice(0, -1).join(' ')}<br/>
                        <span className="text-stitch-accent">{(banners[currentBannerIndex]?.title || '').split(' ').slice(-1).join(' ')}</span>
                      </>
                    ) : (
                      <>Delicious<br/><span className="text-stitch-accent">Burgers</span></>
                    )}
                  </h1>
                  <p className="mt-2 max-w-lg text-sm sm:text-lg text-stitch-muted mb-6">
                    {banners && banners.length > 0 ? banners[currentBannerIndex]?.subtitle : "Try our new premium Angus beef burger, loaded with melted cheddar, crisp vegetables, and our signature secret sauce. Freshly flame-cooked for your delight."}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => {
                        if (banners && banners.length > 0 && banners[currentBannerIndex]?.linkUrl) {
                          window.location.href = banners[currentBannerIndex].linkUrl;
                        } else {
                          const section = document.getElementById('menu-grid-section');
                          if (section) section.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="bg-stitch-accent hover:bg-stitch-accent-hover text-stitch-accent-ink font-extrabold py-3 px-8 rounded-full flex items-center gap-2 transition duration-300 transform hover:scale-105 accent-glow"
                    >
                      {banners && banners.length > 0 ? (banners[currentBannerIndex]?.buttonText || 'ORDER NOW') : 'ORDER NOW'} <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Slider Controls */}
              {banners && banners.length > 1 && (
                <div className="absolute bottom-6 right-6 flex space-x-2 z-10">
                  {banners.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${idx === currentBannerIndex ? 'w-10 bg-stitch-accent' : 'w-2 bg-stitch-muted/50 hover:bg-stitch-muted'}`}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* LIMITED TIME SPECIAL OFFERS */}
            {campaigns && campaigns.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-stitch-border relative">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-stitch-accent text-xs font-black uppercase tracking-widest mb-1">Limited Time</p>
                    <h2 className="text-xl sm:text-3xl font-black flex items-center gap-2 text-stitch-ink">
                      <Percent className="w-6 h-6 text-stitch-accent" /> SPECIAL OFFERS
                    </h2>
                  </div>
                  {campaigns.length > 3 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const container = document.getElementById('campaigns-scroll-container');
                          if (container) container.scrollBy({ left: -320, behavior: 'smooth' });
                        }}
                        className="p-2 bg-stitch-surface hover:bg-stitch-accent text-stitch-ink hover:text-stitch-accent-ink rounded-full transition"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          const container = document.getElementById('campaigns-scroll-container');
                          if (container) container.scrollBy({ left: 320, behavior: 'smooth' });
                        }}
                        className="p-2 bg-stitch-surface hover:bg-stitch-accent text-stitch-ink hover:text-stitch-accent-ink rounded-full transition"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div 
                  id="campaigns-scroll-container"
                  className="flex gap-6 overflow-x-auto pb-4 snap-x hide-scrollbar"
                >
                  {campaigns.map((campaign: any) => {
                    const msLeft = campaign.end_date ? new Date(campaign.end_date).getTime() - Date.now() : null;
                    const isLimitedOffer = msLeft !== null && msLeft > 0 && msLeft < 24 * 60 * 60 * 1000;
                    const hoursLeft = msLeft ? Math.max(0, Math.floor(msLeft / (60 * 60 * 1000))) : 0;
                    const minsLeft = msLeft ? Math.max(0, Math.floor((msLeft % (60 * 60 * 1000)) / 60000)) : 0;
                    const badgeText =
                      campaign.campaign_type === 'BOGO'
                        ? `BOGO — BUY ${campaign.buy_qty} GET ${campaign.reward_qty} ${campaign.reward_type === 'PERCENTAGE' ? `${campaign.discount_pct}% OFF` : 'FREE'}`
                        : campaign.campaign_type === 'FLAT'
                          ? `SALE — Rs.${campaign.flat_discount_amount} OFF`
                          : campaign.campaign_type === 'BUNDLE'
                            ? `BUNDLE — FIXED PRICE Rs.${campaign.bundle_price}`
                            : campaign.campaign_type === 'COMBO'
                              ? `COMBO — FIXED PRICE Rs.${campaign.bundle_price}`
                              : campaign.campaign_type === 'FREE_GIFT'
                                ? `FREE ITEM — SPEND Rs.${campaign.min_spend}+`
                                : `SALE — ${campaign.discount_pct}% OFF`;
                    return (
                    <div
                      key={campaign.id}
                      className="bg-stitch-card border border-stitch-border hover:border-stitch-accent rounded-2xl p-6 relative overflow-hidden group transition duration-300 flex flex-col justify-between min-w-[300px] sm:min-w-[340px] snap-center flex-1"
                    >
                      {/* Background Image */}
                      {campaign.image_url && (
                        <div className="absolute inset-0 z-0">
                          <img
                            src={campaign.image_url.startsWith('http') ? campaign.image_url : `${BACKEND_URL}${campaign.image_url}`}
                            className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                            alt={campaign.title}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-stitch-card via-stitch-card/90 to-transparent"></div>
                        </div>
                      )}

                      {/* Corner gradient */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-stitch-accent/5 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110 z-0"></div>

                      {isLimitedOffer && (
                        <span className="absolute top-3 left-3 z-20 bg-stitch-danger text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider shadow-lg animate-pulse">
                          Limited Offer
                        </span>
                      )}

                      <div className="relative z-10">
                        <span className="bg-stitch-accent text-stitch-accent-ink text-[10px] font-black px-2.5 py-1 rounded mb-4 inline-block uppercase tracking-wider shadow-lg">
                          {badgeText}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold mb-1 text-stitch-ink drop-shadow-md">{campaign.title}</h3>
                        <p className="text-stitch-muted text-xs sm:text-sm mb-4 leading-relaxed line-clamp-2 drop-shadow-md">{campaign.description}</p>
                        {campaign.campaign_type === 'FREE_GIFT' && campaign.giftProduct?.name && (
                          <p className="text-stitch-accent text-xs font-bold mb-2">🎁 Free Gift: {campaign.giftProduct.name}</p>
                        )}
                        {['BUNDLE', 'COMBO'].includes(campaign.campaign_type) && campaign.bundle_products?.length > 0 && (
                          <p className="text-stitch-accent text-xs font-bold mb-2">
                            Includes: {campaign.bundle_products.map((p: any) => p.name).join(' + ')}
                          </p>
                        )}
                        {campaign.show_countdown && msLeft !== null && msLeft > 0 && (
                          <p className="text-stitch-danger text-xs font-bold mb-2">Ends in {hoursLeft}h {minsLeft}m</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-stitch-border relative z-10">
                        <span className="text-[10px] font-bold text-stitch-accent tracking-wider font-mono uppercase drop-shadow-md">
                          OFFER
                        </span>
                        <button
                          onClick={() => {
                            // BOGO/Bundle/Combo/Free Gift auto-apply at checkout (same pricing
                            // engine as POS) once eligibility is met in-cart — not a % coupon
                            // like Percentage/Flat campaigns.
                            const autoApplyTypes = ['BOGO', 'BUNDLE', 'COMBO', 'FREE_GIFT'];
                            if (!autoApplyTypes.includes(campaign.campaign_type)) {
                              applyCoupon({
                                code: `CAMP-${campaign.id}`,
                                name: campaign.title,
                                discountPercent: campaign.discount_pct,
                                description: campaign.description,
                                target_categories: campaign.target_categories,
                                target_products: campaign.target_products
                              });
                            }

                            if (campaign.target_categories && campaign.target_categories.length > 0) {
                              setActiveCategory(campaign.target_categories[0].name);
                            }

                            setTimeout(() => {
                              document.getElementById('menu-grid-section')?.scrollIntoView({ behavior: 'smooth' });
                            }, 50);
                          }}
                          className="bg-stitch-accent hover:bg-stitch-accent-hover text-stitch-accent-ink text-xs font-black py-2 px-4 rounded-full transition duration-300 accent-glow accent-glow-hover"
                        >
                          {['BOGO', 'BUNDLE', 'COMBO', 'FREE_GIFT'].includes(campaign.campaign_type)
                            ? 'View Deal'
                            : (appliedCoupon?.code === `CAMP-${campaign.id}` ? 'Applied ✓' : 'Avail Offer')}
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* CATEGORIES + PRODUCTS: sidebar on desktop (lg+), horizontal strip below that */}
            <section id="menu-grid-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* CATEGORIES */}
              <aside className="lg:w-64 lg:flex-shrink-0 lg:sticky lg:top-24 lg:self-start">
                <div className="bg-stitch-card rounded-2xl lg:rounded-2xl p-2 border border-stitch-border flex lg:block items-center justify-between">
                  <div className="flex-1 flex lg:flex-col gap-2 lg:gap-1 items-stretch px-2 lg:px-1 py-1 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[75vh] custom-scrollbar">
                    {CATEGORY_GROUPS.length > 0 && CATEGORY_GROUPS.map(group => (
                      <button
                        key={group}
                        onClick={() => { setActiveCategoryGroup(group); setActiveCategory(''); }}
                        className={`text-left px-4 py-2 lg:py-3 rounded-xl transition font-bold text-sm lg:text-[15px] whitespace-nowrap lg:whitespace-normal
                          ${activeCategoryGroup === group ? 'bg-stitch-accent text-stitch-accent-ink shadow-md' : 'text-stitch-muted hover:text-stitch-ink hover:bg-stitch-surface'}`}
                      >
                        {group}
                      </button>
                    ))}
                    {CATEGORY_GROUPS.length > 0 && <div className="hidden lg:block w-full h-[1px] bg-stitch-border my-2"></div>}

                    {['All Items', 'Discounted', ...(CATEGORIES as string[])].map(category => (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`flex items-center gap-2 min-w-max lg:min-w-0 lg:w-full px-5 py-2.5 rounded-full lg:rounded-xl font-bold text-sm tracking-wide transition cursor-pointer text-left ${
                          activeCategory === category
                            ? 'bg-stitch-accent text-stitch-accent-ink'
                            : 'bg-stitch-surface/60 text-stitch-muted hover:text-stitch-ink hover:bg-stitch-surface'
                        }`}
                      >
                        {category === 'Discounted' ? <span className="text-base leading-none">🔥</span> : <Sparkles className="w-4 h-4 shrink-0" />}
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* PRODUCTS GRID */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <h2 className="text-3xl sm:text-4xl font-black text-stitch-accent tracking-tight">{activeCategory}</h2>

                  {/* Simple Menu Search & View All Menu */}
                  <div className="flex items-center gap-4 max-w-md w-full justify-end">

                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stitch-muted" />
                      <input
                        type="text"
                        placeholder="Search menu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-stitch-surface border border-stitch-border rounded-full pl-9 pr-4 py-2 text-sm text-stitch-ink focus:outline-none focus:border-stitch-accent"
                      />
                    </div>
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16 bg-stitch-card rounded-3xl border border-stitch-border">
                    <ShoppingBag className="w-12 h-12 text-stitch-muted mx-auto mb-3" />
                    <p className="text-stitch-muted font-bold">No products found matching your search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className="bg-stitch-card border border-stitch-border rounded-3xl overflow-hidden relative group hover:border-stitch-accent/30 transition-all duration-300"
                    >
                      {/* Product Image Area */}
                      <div className="aspect-square relative overflow-hidden bg-stitch-surface">
                        {getProductDiscount(product) > 0 && (
                          <div className="absolute top-0 left-0 bg-stitch-accent text-stitch-accent-ink text-xs font-black px-3 py-1.5 rounded-br-2xl shadow-lg z-20 flex items-center gap-1">
                            <span>🔥</span> {getProductDiscount(product)}% OFF
                          </div>
                        )}
                        <img
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src={product.image_url}
                          onError={(e) => {
                            // Fallback default burger placeholder
                            (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/aida-public/AB6AXuCIiya8Cbx_CdyZFIhVoboYMFkd2vfkN2hNvIBC6MwktpbKWWK4XVpoYLZEK6XF8rcaVTA6WKdoKFxr4wEo9vWFC6IzgvT4w8esgqz1lYyl1UwVY688mJQV9T5YVs_dgZYDIHY4zavtQh609odDannRlv2zZMAjpEue35Zpt7bYUFTRhhj7gzZBZmAQgpnQ0diZpLOw54wg6AEE4oNU4Oqi6EmSwayeNFkVrt2X69ckCqsBJzyk5opi0fXNiweo3dgOgiTVTPrsCYU";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stitch-bg/95 via-stitch-bg/40 to-transparent"></div>
                      </div>

                      {/* Overlap content */}
                      <div className="absolute bottom-0 left-0 right-0 p-5 flex justify-between items-end">
                        <div className="flex-1 pr-3">
                          <h3 className="text-stitch-ink font-black text-lg sm:text-xl tracking-tight mb-1">{product.name}</h3>
                          <p className="text-stitch-muted text-xs line-clamp-1 mb-2 leading-snug">{product.description}</p>
                        </div>
                        <div className="flex items-end justify-between mt-4 relative z-10">
                          <div>
                            <p className="text-sm text-stitch-muted font-bold tracking-widest uppercase mb-1">{product.category}</p>
                            <div className="flex items-baseline gap-2">
                              {product.variants && product.variants.length > 0 ? (
                                <p className="text-xl font-black text-stitch-accent">Choose Size</p>
                              ) : (
                                <p className="text-2xl font-black text-stitch-accent">
                                  Rs. {getProductDiscount(product) > 0 ? (product.priceRs * (1 - getProductDiscount(product)/100)).toFixed(0) : product.priceRs}
                                </p>
                              )}
                              {getProductDiscount(product) > 0 && !(product.variants && product.variants.length > 0) && (
                                <p className="text-stitch-muted text-sm line-through">Rs. {product.priceRs}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (product.variants && product.variants.length > 0) {
                                setPendingVariantProduct(product);
                                setModalType('SELECT_VARIANT');
                              } else {
                                addToCart(product);
                              }
                            }}
                            className="w-11 h-11 bg-stitch-panel hover:bg-stitch-accent text-stitch-ink hover:text-stitch-accent-ink rounded-full flex items-center justify-center transition shadow-lg shrink-0"
                            aria-label={`Add ${product.name} to cart`}
                          >
                            <Plus className="w-5 h-5 stroke-[3px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </section>

            {/* ORDER STATUS TRACKING INDICATOR */}
            {orderTracking && (
              <section id="order-tracking-indicator" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mb-8 scroll-mt-24">
                <div className="bg-[#141b2b] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer hover:border-[#4edea3]/30 transition-colors"
                     onClick={() => {
                       setIsTrackModalOpen(true);
                       setTrackInput(orderTracking.id);
                     }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-brand-yellow" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active POS Order</p>
                      <h4 className="text-base font-black text-white">ID: {orderTracking.id}</h4>
                      <p className="text-[10px] text-slate-300">Status: <span className="text-brand-yellow font-black uppercase">{orderTracking.status}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold">Estimated Arrival</p>
                      <p className="text-xl font-black text-brand-yellow">{orderTracking.eta} Mins</p>
                    </div>
                    <button className="bg-brand-yellow text-slate-950 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl hover:scale-105 transition-transform">
                      Track Order
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOrderTracking(null); }}
                      className="text-slate-500 hover:text-white p-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* OUR STAFF SECTION */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center border-t border-gray-800 mt-12">
              <p className="text-brand-yellow text-xs font-black uppercase tracking-widest mb-2">The Faces Behind The Flavor</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">OUR STAFF</h2>
              <p className="text-slate-400 mb-12 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
                Meet the incredible team that makes Masjid e Taqwa special. From our master chefs to our friendly front-of-house staff.
              </p>
              <div className="flex justify-center gap-12 sm:gap-24">
                <div className="flex flex-col items-center group">
                  <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <User className="w-10 h-10 text-slate-400 group-hover:text-brand-yellow" />
                  </div>
                  <h4 className="font-extrabold text-lg text-slate-100">Imran Farooq</h4>
                  <p className="text-brand-yellow text-xs font-black tracking-widest mt-1 uppercase">Cashier</p>
                </div>
                <div className="flex flex-col items-center group">
                  <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <User className="w-10 h-10 text-slate-400 group-hover:text-brand-yellow" />
                  </div>
                  <h4 className="font-extrabold text-lg text-slate-100">Sara Manager</h4>
                  <p className="text-brand-yellow text-xs font-black tracking-widest mt-1 uppercase">Manager</p>
                </div>
              </div>
            </section>
          </div>
        )}



        {/* VIEW: REWARDS LOYALTY PORTAL */}
        {activeTab === 'rewards' && (
          <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-black text-brand-yellow mb-4 tracking-tight">D4U Club Rewards</h1>
              <p className="text-slate-400 max-w-lg mx-auto text-sm sm:text-base">
                Earn 10 points for every $1 spent. Redeem points for free meals, custom discounts, and member-only specials.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Point Checker panel */}
              <div className="md:col-span-7 bg-brand-light border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-100 mb-2">Check Your Balance</h3>
                  <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
                    Enter your registered phone number to load your digital rewards card and redeem your points instantly.
                  </p>

                  <form onSubmit={handleLoyaltySearch} className="space-y-4 mb-6">
                    <div className="space-y-1">
                      <label className="block text-xs font-black tracking-widest text-slate-400 uppercase">Phone Number</label>
                      <input 
                        type="tel" 
                        placeholder="e.g. +1 (555) 123-4567"
                        value={loyaltyPhone}
                        onChange={(e) => setLoyaltyPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isLoyaltySearching}
                      className="w-full bg-brand-yellow hover:bg-brand-yellowHover text-brand-dark font-black py-3 rounded-xl transition flex items-center justify-center gap-2"
                    >
                      {isLoyaltySearching ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Retrieving...
                        </>
                      ) : (
                        "Load Member Card"
                      )}
                    </button>
                  </form>
                </div>

                {/* Helpful Tip */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/30">
                  <p className="text-xs text-slate-400 leading-normal">
                    💡 <span className="text-slate-200 font-bold">Quick Demo:</span> Enter any phone ending in <span className="text-brand-yellow font-bold font-mono">1</span> (e.g. +1 555-0001) to simulate an elite Diamond level account loaded with active balance!
                  </p>
                </div>
              </div>

              {/* Digital Card Preview Panel */}
              <div className="md:col-span-5">
                {loyaltyAccount ? (
                  <div className="space-y-6">
                    {/* VIP Digital Card */}
                    <div className="bg-gradient-to-br from-brand-yellow/90 to-amber-600 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-brand-dark select-none min-h-[190px] flex flex-col justify-between">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/70">D4U Member Club</p>
                          <h4 className="text-base font-black truncate max-w-[180px]">{loyaltyAccount.name}</h4>
                        </div>
                        <span className="bg-brand-dark text-brand-yellow text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {loyaltyAccount.tier}
                        </span>
                      </div>

                      <div className="pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/70">Points Balance</p>
                        <p className="text-4xl font-black tracking-tight">{loyaltyAccount.points} pts</p>
                        <p className="text-xs font-bold text-brand-dark/80 mt-1">Value: ${(loyaltyAccount.points * 0.01).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Redemption Actions */}
                    <div className="bg-brand-light border border-slate-800 rounded-3xl p-6 text-center">
                      <p className="text-xs text-slate-400 mb-3">You have enough points to claim a discount!</p>
                      <button 
                        onClick={handleRedeemPoints}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-brand-yellow text-brand-yellow font-black py-2.5 rounded-xl text-sm transition"
                      >
                        Redeem 500 Points ($5.00 Off)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-800 rounded-3xl p-8 text-center flex flex-col justify-center items-center min-h-[280px]">
                    <Shield className="w-12 h-12 text-slate-700 mb-3" />
                    <h3 className="text-base font-bold text-slate-300">No Member Card Loaded</h3>
                    <p className="text-xs text-slate-500 max-w-[180px] mt-1 leading-normal">
                      Use the checker on the left to securely retrieve your reward statistics.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* VIEW: SUPPORT PAGE (CONTACT FORM & DETAILED MAP) */}
        {activeTab === 'support' && (
          <div>
            {/* Contact Hero */}
            <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 text-center border-b border-gray-800/80 bg-brand-light relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[220px] bg-brand-yellow/5 rounded-full blur-[100px] pointer-events-none"></div>
              <div className="max-w-3xl mx-auto relative z-10">
                <h1 className="text-4xl sm:text-6xl font-black mb-3 text-white tracking-tight">Contact Us</h1>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
                  Got a craving or a question? Drop us a line. We're here to ensure your premium dining experience is nothing short of extraordinary.
                </p>
              </div>
            </section>

            {/* Split Layout Section */}
            <section className="mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16">
              {/* Form Card (7 cols) */}
              <div className="lg:col-span-7">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
                  <h2 className="text-2xl font-black mb-6 text-slate-100">Send a Message</h2>
                  
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-black tracking-widest text-slate-400 uppercase" htmlFor="name">Full Name</label>
                        <input 
                          id="name"
                          type="text" 
                          placeholder="e.g. John Doe"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-black tracking-widest text-slate-400 uppercase" htmlFor="email">Email Address</label>
                        <input 
                          id="email"
                          type="email" 
                          placeholder="e.g. john@example.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black tracking-widest text-slate-400 uppercase" htmlFor="subject">Subject</label>
                      <input 
                        id="subject"
                        type="text" 
                        placeholder="How can we help?"
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black tracking-widest text-slate-400 uppercase" htmlFor="message">Your Message</label>
                      <textarea 
                        id="message"
                        rows={5}
                        placeholder="Write your message here..."
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow resize-none"
                        required
                      ></textarea>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSendingMessage}
                      className="bg-brand-yellow hover:bg-brand-yellowHover text-brand-dark font-black px-8 py-3.5 rounded-full transition duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
                    >
                      {isSendingMessage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          Send Message <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Details & Map Card (5 cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-8">
                {/* Contact Points list */}
                <div className="space-y-6 bg-brand-light border border-slate-800/80 p-6 rounded-3xl">
                  {/* Row 1 */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full border border-slate-700 flex-shrink-0 flex items-center justify-center text-brand-yellow">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-base">Our Location</h3>
                      <p className="text-slate-400 text-sm mt-1 leading-relaxed whitespace-pre-wrap">
                        {settings?.address || "452 Gourmet Avenue\nCulinary District, NY 10012"}
                      </p>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full border border-slate-700 flex-shrink-0 flex items-center justify-center text-brand-yellow">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-base">Phone Support</h3>
                      <p className="text-slate-400 text-sm mt-1 leading-relaxed whitespace-pre-wrap">
                        {settings?.contactPhone || "+1 (555) 123-4567\nMon-Sun, 10am - 12am"}
                      </p>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full border border-slate-700 flex-shrink-0 flex items-center justify-center text-brand-yellow">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-base">Email Address</h3>
                      <p className="text-slate-400 text-sm mt-1 leading-relaxed whitespace-pre-wrap">
                        {settings?.contactEmail || "hello@masjidetaqwa.com\nsupport@masjidetaqwa.com"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Map Graphics */}
                <div className="relative rounded-3xl border border-slate-800 overflow-hidden shadow-2xl h-64 sm:h-72">
                  <img 
                    alt="City Map Navigation" 
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy_ttPIgvKT--O52bqItJTMyy05G-MDoJNnjCytOEI2NfjnyVEXqfpJ00q2YW9Z9KUEFWnVWowdEx6svJ5QulraDzMepXckV0V646gBxC43rnFNRwiZAqAhaqxQvyIbVeJSXTTVD98S32uZLWEI7DND4B22u-8IARPKDlyiqvXRB_Y4QRHp5bbe11LiE28ZFsFxjrPa2VPASz91IKgBhZp8A72TPG7JUtaw8_KjyYB9642xlE1ZDa_bPWxdXxzM_EijVX_GwVAKvM" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 to-transparent pointer-events-none"></div>
                  
                  {/* Open Status Badge */}
                  <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-black text-slate-100">Open Now</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ================= STICKY FOOTER ================= */}
      <footer className="bg-stitch-panel pt-12 pb-6 border-t border-stitch-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

            {/* Brand Info */}
            <div>
              <h3 className="text-stitch-accent font-black text-xl mb-4">{`${settings?.siteTitle || 'D4U Restaurant'}`}</h3>
              <p className="text-stitch-muted text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                {`${settings?.aboutText || 'The future of fast-casual dining. Premium culinary quality fused with state-of-the-art POS ordering mechanisms.'}`}
              </p>
              <div className="flex space-x-4">
                {settings?.facebookUrl && <a className="text-stitch-muted hover:text-stitch-ink transition" href={settings.facebookUrl} target="_blank" aria-label="Facebook"><Globe className="w-5 h-5" /></a>}
                {settings?.instagramUrl && <a className="text-stitch-muted hover:text-stitch-ink transition" href={settings.instagramUrl} target="_blank" aria-label="Instagram"><Share2 className="w-5 h-5" /></a>}
                {settings?.twitterUrl && <a className="text-stitch-muted hover:text-stitch-ink transition" href={settings.twitterUrl} target="_blank" aria-label="Twitter"><Share2 className="w-5 h-5" /></a>}
                {settings?.youtubeUrl && <a className="text-stitch-muted hover:text-stitch-ink transition" href={settings.youtubeUrl} target="_blank" aria-label="YouTube"><Share2 className="w-5 h-5" /></a>}
                {(!settings?.facebookUrl && !settings?.instagramUrl) && (
                  <>
                    <a className="text-stitch-muted hover:text-stitch-ink transition" href="#" aria-label="Website Link"><Globe className="w-5 h-5" /></a>
                    <a className="text-stitch-muted hover:text-stitch-ink transition" href="#" aria-label="Share Link"><Share2 className="w-5 h-5" /></a>
                  </>
                )}
              </div>
            </div>

            {/* Links columns */}
            <div>
              <h4 className="text-stitch-ink font-black mb-4 uppercase text-xs tracking-widest">Contact Us</h4>
              <ul className="space-y-2 text-sm">
                {settings?.address && <li className="text-stitch-muted">{settings.address}</li>}
                {settings?.contactPhone && <li className="text-stitch-muted">{settings.contactPhone}</li>}
                {settings?.contactEmail && <li className="text-stitch-muted">{settings.contactEmail}</li>}
                {(!settings?.address && !settings?.contactPhone && !settings?.contactEmail) && (
                  <>
                    <li><a className="text-stitch-muted hover:text-stitch-ink transition" href="#">Our GOURMET Menu</a></li>
                    <li><a className="text-stitch-muted hover:text-stitch-ink transition" href="#">Bespoke Locations</a></li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-stitch-ink font-black mb-4 uppercase text-xs tracking-widest">Company</h4>
              {settings?.companyText ? (
                <p className="text-stitch-muted text-sm whitespace-pre-wrap">{`${settings.companyText}`}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  <li><a className="text-stitch-muted hover:text-stitch-ink transition" href="#">Our Culinary Journey</a></li>
                  <li><a className="text-stitch-muted hover:text-stitch-ink transition" href="#">Corporate Sustainability</a></li>
                  <li><a className="text-stitch-muted hover:text-stitch-ink transition" href="#">Kitchen Careers</a></li>
                  <li><a className="text-stitch-muted hover:text-stitch-ink transition" href="#">Intellectual Privacy</a></li>
                </ul>
              )}
            </div>

            {/* Newsletter form */}
            <div>
              <h4 className="text-stitch-ink font-black mb-4 uppercase text-xs tracking-widest">Join The D4U</h4>
              <p className="text-stitch-muted text-sm mb-4 leading-normal">Subscribe for exclusive chef specials and priority reservations.</p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.target as typeof e.target & { email: { value: string } };
                  try {
                    await fetch(`${BACKEND_URL}/cms/subscribe`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ store_id: storeId, email: target.email.value })
                    });
                    triggerToast("Subscribed successfully! Thank you for joining.", "success");
                    target.email.value = '';
                  } catch (err) {
                    triggerToast("Failed to subscribe. Please try again.", "error");
                  }
                }}
                className="flex"
              >
                <input
                  name="email"
                  className="bg-stitch-surface border border-stitch-border text-stitch-ink text-sm rounded-l-xl px-4 py-2.5 w-full focus:outline-none focus:border-stitch-accent"
                  placeholder="Enter email address"
                  type="email"
                  required
                />
                <button className="bg-stitch-accent hover:bg-stitch-accent-hover text-stitch-accent-ink font-black text-sm px-5 py-2.5 rounded-r-xl transition" type="submit">
                  JOIN
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Accent Bar */}
        <div className="bg-stitch-accent py-3.5 relative mt-8">
          <div className="max-w-7xl mx-auto px-4 flex justify-center items-center">
            <div className="text-stitch-accent-ink text-xs font-black tracking-wide">
              © 2026 D4U Restaurant Group. Inspired by the bold. Built for the gourmet.
            </div>
          </div>
        </div>
      </footer>

      {/* Removed Internal Location Modal */}

      {/* ================= DRAWER: SHOPPING CART SLIDEOVER ================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-stitch-bg/70 backdrop-blur-sm">
          {/* Backdrop Click Dismiss */}
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)}></div>

          <div className="relative w-full max-w-md bg-stitch-panel h-full shadow-2xl flex flex-col justify-between z-10 border-l border-stitch-border">

            {/* Header */}
            <div className="p-5 border-b border-stitch-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-stitch-accent" />
                <h3 className="font-black text-lg text-stitch-ink">Your Basket</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-stitch-muted hover:text-stitch-ink p-2 rounded-full hover:bg-stitch-surface transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag className="w-12 h-12 text-stitch-muted mx-auto mb-3 animate-pulse" />
                  <p className="text-stitch-muted font-bold">Your cart is empty.</p>
                  <p className="text-xs text-stitch-muted mt-1">Start adding delicious food from our menu!</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="bg-stitch-surface/60 p-4 rounded-2xl border border-stitch-border flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-extrabold text-sm text-stitch-ink">{item.product.name}</h4>
                        <p className="text-stitch-accent text-xs font-bold font-mono mt-1">${item.product.price.toFixed(2)} each</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center bg-stitch-surface border border-stitch-border rounded-full px-2.5 py-1">
                        <button onClick={() => adjustQuantity(item.product.id, -1)} className="text-stitch-muted hover:text-stitch-ink p-1">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-stitch-ink text-xs font-bold px-2">{item.quantity}</span>
                        <button onClick={() => adjustQuantity(item.product.id, 1)} className="text-stitch-muted hover:text-stitch-ink p-1">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Special instruction input */}
                    <input
                      type="text"
                      placeholder="Special instructions (e.g. no onions)..."
                      value={item.specialInstructions}
                      onChange={(e) => addSpecialInstruction(item.product.id, e.target.value)}
                      className="bg-stitch-surface border border-stitch-border rounded-lg px-3 py-1.5 text-xs text-stitch-ink focus:outline-none focus:border-stitch-accent"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Checkout */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-stitch-border bg-stitch-surface/40 space-y-4">
                {/* Add Ons Button */}
                <div className="p-4 sm:p-6 bg-stitch-card border-t border-stitch-border">
                    <button
                      onClick={() => setModalType('ADD_ONS')}
                      className="w-full py-2.5 mb-4 border-2 border-dashed border-stitch-accent text-stitch-accent rounded-xl font-black hover:bg-stitch-accent hover:text-stitch-accent-ink transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" /> Add ons
                    </button>
                </div>
                {/* Promo Code Info */}
                {appliedCoupon && (
                  <div className="flex justify-between items-center bg-stitch-accent/5 border border-stitch-accent/20 px-3 py-2 rounded-xl text-xs">
                    <span className="text-stitch-accent font-black">Coupon Applied: {appliedCoupon.code}</span>
                    <button onClick={() => setAppliedCoupon(null)} className="text-stitch-muted hover:text-stitch-danger font-bold">Remove</button>
                  </div>
                )}

                {/* Bill Breakdown */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-stitch-muted">
                    <span>Subtotal</span>
                    <span>${getSubtotal().toFixed(2)}</span>
                  </div>
                  {getDiscountAmount() > 0 && (
                    <div className="flex justify-between text-stitch-accent font-bold">
                      <span>Discount</span>
                      <span>-${getDiscountAmount().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stitch-muted">
                    <span>GST / Sales Tax (13%)</span>
                    <span>${getTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stitch-muted">
                    <span>Delivery Fee</span>
                    <span>{getDeliveryFee() === 0 ? "FREE" : `$${getDeliveryFee().toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-stitch-ink pt-2 border-t border-stitch-border">
                    <span>Grand Total</span>
                    <span>${getGrandTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full bg-stitch-accent hover:bg-stitch-accent-hover text-stitch-accent-ink font-black py-4 rounded-xl text-sm transition tracking-wider uppercase transform active:scale-95 text-center flex justify-center items-center gap-2 accent-glow"
                >
                  Checkout Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: TRACK ORDER ================= */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-[250] flex justify-end">
          <div className="absolute inset-0 bg-stitch-bg/60 backdrop-blur-sm" onClick={() => setIsTrackModalOpen(false)} />
          <aside className="relative w-full max-w-sm bg-stitch-panel border-l border-stitch-border flex flex-col h-full shadow-2xl animate-slide-in-right overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-stitch-border shrink-0">
              <div>
                <h3 className="text-xl font-black text-stitch-ink flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-stitch-success" />
                  Track Order
                </h3>
                <p className="text-xs text-stitch-muted mt-1">Enter Order ID</p>
              </div>
              <button onClick={() => setIsTrackModalOpen(false)} className="text-stitch-muted hover:text-stitch-ink p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-6">
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!trackInput) return;
                try {
                  const res = await fetch(`${BACKEND_URL}/online-orders/track/${trackInput}`);
                  if (!res.ok) throw new Error("Not found");
                  const data = await res.json();
                  setOrderTracking({
                    id: data.id.toString(),
                    status: data.kdsStatus !== 'PENDING' ? data.kdsStatus : data.status,
                    eta: data.prepTimeMinutes || 25,
                    ...data
                  });
                } catch (err) {
                  triggerToast("Order not found. Please check your ID or phone number.", "error");
                }
              }}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackInput}
                    onChange={(e) => setTrackInput(e.target.value)}
                    className="flex-1 bg-stitch-surface border border-stitch-border text-stitch-ink text-sm rounded-xl px-4 py-3 outline-none focus:border-stitch-success transition-colors"
                    placeholder="e.g. 1033 or 0300..."
                  />
                  <button type="submit" className="bg-stitch-success hover:opacity-90 text-stitch-bg px-5 rounded-xl font-bold transition-colors">
                    Find
                  </button>
                </div>
              </form>

              {orderTracking && orderTracking.status !== 'Unknown' && (
                <div className="space-y-4">
                  {/* Order found details */}
                  <div className="bg-stitch-surface rounded-2xl border border-stitch-border p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-stitch-ink text-base">Order #{orderTracking.id}</p>
                        <p className="text-[10px] text-stitch-muted">{(orderTracking as any).customer} · {(orderTracking as any).timePlaced}</p>
                      </div>
                      <span className="text-xs font-black text-stitch-accent">${(orderTracking as any).totalAmount}</span>
                    </div>
                  </div>

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
                      const currentStep = STATUS_INDEX[orderTracking.status] ?? 0;
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
                          {i < 6 && <div className={`absolute left-2.5 top-5 w-[2px] h-6 ${step.done ? 'bg-stitch-success' : 'bg-stitch-border'}`}></div>}
                          <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all relative z-10 bg-stitch-panel ${
                            step.done ? 'border-stitch-success text-stitch-success' : 'border-stitch-border text-transparent'
                          }`}>
                            {step.done && <CheckCircle2 className="w-3 h-3 fill-stitch-success text-stitch-panel" />}
                          </div>
                          <div>
                            <p className={`text-[10px] font-bold ${step.done ? 'text-stitch-ink' : 'text-stitch-muted'}`}>{step.label}</p>
                            <p className="text-[9px] text-stitch-muted">{step.sub}</p>
                        </div>
                      </div>
                    ));
                  })()}
                  </div>

                  {orderTracking.status === 'DISPATCHED' && (
                    <div className="bg-stitch-surface border border-stitch-success/30 rounded-xl overflow-hidden mt-4">
                      <div className="bg-stitch-success/10 px-4 py-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-stitch-success animate-ping" />
                        <span className="text-[10px] font-black uppercase text-stitch-success">Rider is approaching!</span>
                      </div>
                    </div>
                  )}

                  {(orderTracking.status === 'PAID' || orderTracking.status === 'SETTLED') && (
                    <div className="bg-stitch-surface border border-stitch-success/30 rounded-xl p-4 mt-4 text-center">
                      <h4 className="text-sm font-black text-stitch-success mb-1">Thanks for ordering!</h4>
                      <p className="text-[10px] text-stitch-muted">Your food was delivered.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ================= MODAL: SELECT VARIANT ================= */}
      {modalType === 'SELECT_VARIANT' && pendingVariantProduct && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black text-brand-yellow">Select Options for {pendingVariantProduct.name}</h2>
              </div>
              <button onClick={() => { setModalType('NONE'); setPendingVariantProduct(null); }} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex border-b border-slate-800 bg-slate-900">
              <button 
                onClick={() => setActiveVariantTab('SIZES')}
                className={`flex-1 py-4 text-sm font-bold tracking-wider transition ${activeVariantTab === 'SIZES' ? 'bg-brand-yellow text-slate-900' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                Pizza Sizes
              </button>
              <button 
                onClick={() => setActiveVariantTab('TOPPINGS')}
                className={`flex-1 py-4 text-sm font-bold tracking-wider transition ${activeVariantTab === 'TOPPINGS' ? 'bg-brand-yellow text-slate-900' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                Extra Toppings
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3">
              {activeVariantTab === 'SIZES' && pendingVariantProduct.variants?.map((v: any) => (
                <button 
                  key={v.id} 
                  onClick={() => {
                    addToCart(pendingVariantProduct, v);
                  }}
                  className="w-full text-left p-3 bg-slate-800 border border-slate-700 hover:border-brand-yellow/50 rounded-xl flex items-center gap-4 group transition"
                >
                  {pendingVariantProduct.image_url && (
                    <img src={pendingVariantProduct.image_url} alt={pendingVariantProduct.name} className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
                  )}
                  <span className="text-white font-bold group-hover:text-brand-yellow transition flex-1">{v.name}</span>
                  <span className="text-brand-green font-bold">Rs. {v.price}</span>
                </button>
              ))}

              {activeVariantTab === 'TOPPINGS' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRODUCTS.filter((p: any) => p.categories?.some((c:any) => c.name.toLowerCase().includes('topping'))).length === 0 && (
                    <p className="text-slate-500 col-span-2 text-center py-8">No Extra Toppings available.</p>
                  )}
                  {PRODUCTS.filter((p: any) => p.categories?.some((c:any) => c.name.toLowerCase().includes('topping'))).map((topping: any) => (
                    <button key={topping.id} onClick={() => addToCart(topping)} className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 hover:border-brand-yellow/50 rounded-xl group transition">
                      <div className="flex-1 text-left">
                        <p className="text-white font-bold text-sm group-hover:text-brand-yellow transition line-clamp-1">{topping.name}</p>
                        <p className="text-brand-green text-xs font-bold mt-1">Rs. {topping.priceRs}</p>
                      </div>
                      <Plus className="w-4 h-4 text-slate-500 group-hover:text-brand-yellow" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-900">
              <button onClick={() => { setModalType('NONE'); setPendingVariantProduct(null); }} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD ONS ================= */}
      {modalType === 'ADD_ONS' && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
              <h2 className="text-xl font-black text-white flex items-center gap-2"><Plus className="text-brand-yellow w-6 h-6" /> Select Add-ons</h2>
              <button onClick={() => setModalType('NONE')} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PRODUCTS.filter((p: any) => p.categories?.some((c:any) => c.name.toLowerCase() === 'add-ons' || c.name.toLowerCase() === 'addons')).length === 0 && (
                  <p className="text-slate-500 col-span-2 text-center py-8">No Add-ons available.</p>
                )}
                {PRODUCTS.filter((p: any) => p.categories?.some((c:any) => c.name.toLowerCase() === 'add-ons' || c.name.toLowerCase() === 'addons')).map((addon: any) => (
                  <button key={addon.id} onClick={() => { addToCart(addon); setModalType('NONE'); }} className="flex items-center gap-3 p-4 bg-slate-800 border border-slate-700 hover:border-brand-yellow/50 rounded-xl group transition">
                    {addon.image_url && <img src={addon.image_url} alt={addon.name} className="w-12 h-12 rounded-lg object-cover" />}
                    <div className="flex-1 text-left">
                      <p className="text-white font-bold text-sm group-hover:text-brand-yellow transition line-clamp-1">{addon.name}</p>
                      <p className="text-brand-green text-xs font-bold mt-1">Rs. {addon.priceRs}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-700 group-hover:bg-brand-yellow flex items-center justify-center transition">
                      <Plus className="w-4 h-4 text-slate-300 group-hover:text-slate-900 font-bold" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: POS CHECKOUT FLOW ================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-stitch-bg/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-stitch-panel border border-stitch-border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 text-stitch-muted hover:text-stitch-ink p-2 rounded-full hover:bg-stitch-surface"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-stitch-ink mb-6">Complete Your Order</h3>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              {/* Service Type Selection */}
              <div className="grid grid-cols-2 gap-2">
                {['DELIVERY', 'PICKUP'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDeliveryType(type as any)}
                    className={`py-2 text-xs font-black rounded-lg border transition ${
                      deliveryType === type
                        ? 'bg-stitch-accent text-stitch-accent-ink border-stitch-accent'
                        : 'bg-stitch-surface border-stitch-border text-stitch-muted hover:text-stitch-ink'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Customer Info */}
              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-widest text-stitch-muted uppercase">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-xl px-4 py-3 text-sm text-stitch-ink focus:outline-none focus:border-stitch-accent"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-widest text-stitch-muted uppercase">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 123-4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-xl px-4 py-3 text-sm text-stitch-ink focus:outline-none focus:border-stitch-accent"
                  required
                />
              </div>

              {deliveryType === 'DELIVERY' ? (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-[10px] font-black tracking-widest text-stitch-muted uppercase">Delivery Address</label>
                  <textarea
                    rows={2}
                    placeholder="Enter absolute drop-off street details..."
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full bg-stitch-surface border border-stitch-border rounded-xl px-4 py-3 text-sm text-stitch-ink focus:outline-none focus:border-stitch-accent resize-none"
                    required
                  ></textarea>
                </div>
              ) : (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-[10px] font-black tracking-widest text-stitch-muted uppercase">Table Number / Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Table #5 or Counter pickup"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full bg-stitch-surface border border-stitch-border rounded-xl px-4 py-3 text-sm text-stitch-ink focus:outline-none focus:border-stitch-accent"
                  />
                </div>
              )}

              {/* Payment Methods */}
              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-widest text-stitch-muted uppercase">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'CASH', label: 'Cash Payment' },
                    { key: 'CARD', label: 'Credit Card' },
                    { key: 'COD', label: 'Cash on Delivery' },
                    { key: 'WALLET', label: 'Digital Wallet' }
                  ].map(method => (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => setPaymentMethod(method.key as any)}
                      className={`py-3 text-xs font-bold rounded-xl border text-center transition ${
                        paymentMethod === method.key
                          ? 'bg-stitch-accent text-stitch-accent-ink border-stitch-accent font-black'
                          : 'bg-stitch-surface border-stitch-border text-stitch-muted'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm Bill summary */}
              <div className="bg-stitch-surface/50 rounded-2xl p-4 border border-stitch-border text-xs space-y-1">
                <div className="flex justify-between text-stitch-muted">
                  <span>Tax & Delivery Fee included</span>
                  <span className="font-bold text-stitch-ink">${getGrandTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="w-full bg-stitch-accent text-stitch-accent-ink hover:bg-stitch-accent-hover font-black py-4 rounded-xl transition flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 transform hover:scale-[1.02] uppercase tracking-wider text-sm mt-4 accent-glow"
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Transmitting POS Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
