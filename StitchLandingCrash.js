import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/@fs/G:\\RESTAURANT_POS_WITH_BACKEND\\d4u-website\\src\\components\\StitchLanding.tsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=013c4788"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$();
import __vite__cjsImport1_react from "/node_modules/.vite/deps/react.js?v=013c4788"; const useState = __vite__cjsImport1_react["useState"]; const useEffect = __vite__cjsImport1_react["useEffect"];
import {
  Search,
  User,
  MapPin,
  ShoppingCart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Send,
  Loader2,
  X,
  Percent,
  Phone,
  Mail,
  Globe,
  Share2,
  Shield,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag
} from "/node_modules/.vite/deps/lucide-react.js?v=013c4788";
export default function StitchLanding({
  storeId,
  storeName,
  stores,
  foodItems,
  cart: globalCart,
  onAddToCart: globalAddToCart,
  onRemoveFromCart,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onClearCart,
  banners,
  campaigns,
  onChangeBranch
}) {
  _s();
  const BACKEND_URL = "http://" + (typeof window !== "undefined" ? window.location.hostname : "localhost") + ":3001";
  const PRODUCTS = (foodItems || []).map((fi) => ({
    id: fi.id,
    store_id: storeId || 1,
    name: fi.name,
    price: fi.priceUSD || fi.priceRs,
    priceRs: fi.priceRs,
    is_active: true,
    image_url: fi.image && fi.image.startsWith("http") ? fi.image : `${BACKEND_URL}${fi.image}`,
    category: fi.category,
    description: fi.description
  }));
  const CATEGORIES = Array.from(new Set(PRODUCTS.map((p) => p.category)));
  const [selectedLocation, setSelectedLocation] = useState(
    storeName ? { city: "", branch: storeName } : null
  );
  const [activeTab, setActiveTab] = useState("home");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    if (CATEGORIES.length > 0 && !activeCategory) {
      setActiveCategory(CATEGORIES[0]);
    }
  }, [CATEGORIES, activeCategory]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5e3);
    return () => clearInterval(interval);
  }, [banners]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderTracking, setOrderTracking] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [tableNumber, setTableNumber] = useState("");
  const [deliveryType, setDeliveryType] = useState("DELIVERY");
  const [loyaltyPhone, setLoyaltyPhone] = useState("");
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);
  const [isLoyaltySearching, setIsLoyaltySearching] = useState(false);
  const [redeemedPointsDiscount, setRedeemedPointsDiscount] = useState(0);
  const [toast, setToast] = useState(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const triggerToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4e3);
  };
  const BRANCHES_BY_CITY = {
    "karachi": ["North Nazimabad", "Gulshan-e-Iqbal", "DHA Phase 6"],
    "lahore": ["Gulberg III", "DHA Phase 5", "Johar Town"],
    "islamabad": ["F-6 Markaz", "Centaurus Mall", "G-11"]
  };
  const COUPONS = [
    { code: "IMSA30", name: "IMSA 30% OFF", discountPercent: 30, description: "IMSA special flat 30% discount" },
    { code: "DRINKS10", name: "[AUTO] Drinks Discount", discountPercent: 10, description: "Automatically scheduled discount of 10%" },
    { code: "GUEST15", name: "FRESH 15% OFF", discountPercent: 15, description: "Welcome guest discount of 15%" }
  ];
  useEffect(() => {
    const savedCart = localStorage.getItem("d4u_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart from storage", e);
      }
    }
  }, []);
  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("d4u_cart", JSON.stringify(newCart));
  };
  const addToCart = (product) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updateCart(updated);
    } else {
      updateCart([...cart, { product, quantity: 1, specialInstructions: "" }]);
    }
    triggerToast(`Added ${product.name} to cart!`);
  };
  const adjustQuantity = (productId, delta) => {
    const updated = cart.map((item) => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter((item) => item.quantity > 0);
    updateCart(updated);
  };
  const addSpecialInstruction = (productId, instruction) => {
    const updated = cart.map((item) => {
      if (item.product.id === productId) {
        return { ...item, specialInstructions: instruction };
      }
      return item;
    });
    updateCart(updated);
  };
  const applyCoupon = (coupon) => {
    setAppliedCoupon(coupon);
    triggerToast(`Coupon ${coupon.code} applied successfully!`, "success");
  };
  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };
  const getDiscountAmount = () => {
    const subtotal = getSubtotal();
    let discount = 0;
    if (appliedCoupon) {
      discount += subtotal * (appliedCoupon.discountPercent / 100);
    }
    discount += redeemedPointsDiscount;
    return Math.min(subtotal, discount);
  };
  const getTax = () => {
    const taxableSubtotal = Math.max(0, getSubtotal() - getDiscountAmount());
    return taxableSubtotal * 0.13;
  };
  const getDeliveryFee = () => {
    if (deliveryType !== "DELIVERY") return 0;
    const subtotal = getSubtotal();
    if (subtotal === 0) return 0;
    return subtotal > 15 ? 0 : 1.5;
  };
  const getGrandTotal = () => {
    return Math.max(0, getSubtotal() - getDiscountAmount() + getTax() + getDeliveryFee());
  };
  const handleLocationSubmit = (e) => {
    e.preventDefault();
    if (selectedCity && selectedBranch) {
      setSelectedLocation({ city: selectedCity, branch: selectedBranch });
      triggerToast(`Location set to ${selectedCity.toUpperCase()} - ${selectedBranch}!`, "success");
    }
  };
  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      triggerToast("Please fill in all required fields.", "error");
      return;
    }
    setIsSendingMessage(true);
    setTimeout(() => {
      setIsSendingMessage(false);
      triggerToast("Your message has been sent successfully! Our support team will reach out shortly.", "success");
      setContactName("");
      setContactEmail("");
      setContactSubject("");
      setContactMessage("");
    }, 1500);
  };
  const handleLoyaltySearch = (e) => {
    e.preventDefault();
    if (!loyaltyPhone || loyaltyPhone.length < 8) {
      triggerToast("Please enter a valid phone number.", "error");
      return;
    }
    setIsLoyaltySearching(true);
    setTimeout(() => {
      setIsLoyaltySearching(false);
      setLoyaltyAccount({
        name: loyaltyPhone.endsWith("1") ? "M. Imran Farooq" : "VIP Customer",
        points: Math.floor(Math.random() * 800) + 400,
        tier: loyaltyPhone.endsWith("1") ? "Diamond Member" : "Gold Member"
      });
      triggerToast("Account retrieved successfully!", "success");
    }, 1200);
  };
  const handleRedeemPoints = () => {
    if (!loyaltyAccount || loyaltyAccount.points < 200) {
      triggerToast("Minimum 200 points required to redeem.", "error");
      return;
    }
    const pointsToRedeem = 500;
    const actualPointsRedeemed = Math.min(loyaltyAccount.points, pointsToRedeem);
    const value = actualPointsRedeemed * 0.01;
    setRedeemedPointsDiscount(value);
    setLoyaltyAccount({
      ...loyaltyAccount,
      points: loyaltyAccount.points - actualPointsRedeemed
    });
    triggerToast(`Redeemed ${actualPointsRedeemed} points for a $${value.toFixed(2)} discount!`, "success");
  };
  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      triggerToast("Your cart is empty.", "error");
      return;
    }
    if (!customerName || !customerPhone || deliveryType === "DELIVERY" && !customerAddress) {
      triggerToast("Please fill in all customer details.", "error");
      return;
    }
    setIsSubmittingOrder(true);
    const payload = {
      store_id: storeId || 1,
      customer: customerName || "Online Guest",
      customerPhone: customerPhone || "",
      customerAddress: customerAddress || "No Address",
      items: JSON.stringify(cart.map((c) => ({
        id: c.product.id,
        name: c.product.name,
        qty: c.quantity,
        price: c.product.price
      }))),
      totalAmount: (cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 1.08).toFixed(2),
      source: "Website",
      notes: ""
    };
    fetch(`${BACKEND_URL}/online-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then((res) => res.json()).then((data) => {
      const trackingId = data.order?.id || `D4U-${Math.floor(1e5 + Math.random() * 9e5)}`;
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
    }).catch((e2) => {
      console.error(e2);
      triggerToast("Failed to place order.", "error");
      setIsSubmittingOrder(false);
    });
  };
  const filteredProducts = PRODUCTS.filter((prod) => {
    const matchesCategory = prod.category === activeCategory;
    const matchesSearch = (prod.name || "").toLowerCase().includes((searchQuery || "").toLowerCase()) || (prod.description || "").toLowerCase().includes((searchQuery || "").toLowerCase());
    return matchesCategory && matchesSearch;
  });
  return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen bg-brand-dark text-white flex flex-col font-sans relative selection:bg-brand-yellow selection:text-brand-dark", children: [
    toast && /* @__PURE__ */ jsxDEV("div", { className: "fixed top-24 right-6 z-[200] max-w-sm w-full bg-slate-900/95 border border-slate-700 rounded-xl p-4 shadow-2xl backdrop-blur-md transition-all animate-bounce", children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-start gap-3", children: [
      toast.type === "success" && /* @__PURE__ */ jsxDEV(CheckCircle2, { className: "w-5 h-5 text-emerald-400 shrink-0 mt-0.5" }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 369,
        columnNumber: 42
      }, this),
      toast.type === "error" && /* @__PURE__ */ jsxDEV(AlertCircle, { className: "w-5 h-5 text-rose-500 shrink-0 mt-0.5" }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 370,
        columnNumber: 40
      }, this),
      toast.type === "info" && /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-5 h-5 text-brand-yellow shrink-0 mt-0.5" }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 371,
        columnNumber: 39
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1", children: /* @__PURE__ */ jsxDEV("p", { className: "text-sm font-medium text-slate-100", children: toast.message }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 373,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 372,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("button", { onClick: () => setToast(null), className: "text-slate-400 hover:text-white shrink-0", children: /* @__PURE__ */ jsxDEV(X, { className: "w-4 h-4" }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 376,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 375,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
      lineNumber: 368,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
      lineNumber: 367,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("header", { className: "sticky top-0 z-50 bg-brand-dark/95 border-b border-gray-800/80 backdrop-blur-md", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between h-16 sm:h-20", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("home"),
            className: "text-lg sm:text-2xl font-black tracking-tight text-white hover:text-brand-yellow transition",
            children: storeName || "D4U Restaurant"
          },
          void 0,
          false,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 388,
            columnNumber: 15
          },
          this
        ) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 387,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("nav", { className: "hidden md:flex space-x-8", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => {
                setActiveTab("home");
              },
              className: `px-1 py-2 text-sm font-bold tracking-wider transition ${activeTab === "home" ? "text-brand-yellow border-b-2 border-brand-yellow" : "text-gray-300 hover:text-white"}`,
              children: "MENU"
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 398,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => {
                setActiveTab("rewards");
              },
              className: `px-1 py-2 text-sm font-bold tracking-wider transition ${activeTab === "rewards" ? "text-brand-yellow border-b-2 border-brand-yellow" : "text-gray-300 hover:text-white"}`,
              children: "REWARDS"
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 404,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => {
                setActiveTab("support");
              },
              className: `px-1 py-2 text-sm font-bold tracking-wider transition ${activeTab === "support" ? "text-brand-yellow border-b-2 border-brand-yellow" : "text-gray-300 hover:text-white"}`,
              children: "SUPPORT"
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 410,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 397,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center space-x-3 sm:space-x-5", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => onChangeBranch ? onChangeBranch() : null,
              className: "flex items-center text-brand-yellow hover:text-brand-yellowHover text-xs sm:text-sm font-bold tracking-wider uppercase border border-brand-yellow/30 px-3 py-1.5 rounded-full bg-brand-yellow/5 hover:bg-brand-yellow/10 transition gap-1",
              children: [
                /* @__PURE__ */ jsxDEV(MapPin, { className: "w-4 h-4 animate-pulse" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 425,
                  columnNumber: 17
                }, this),
                selectedLocation ? selectedLocation.branch : storeName || "Select Location",
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-brand-yellow/60 font-medium normal-case tracking-normal border-l border-brand-yellow/30 pl-2 ml-1", children: "Change Branch" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 427,
                  columnNumber: 17
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 421,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setIsCartOpen(true),
              className: "relative p-2.5 rounded-full text-gray-300 hover:text-white hover:bg-slate-800 transition",
              "aria-label": "View Cart",
              children: [
                /* @__PURE__ */ jsxDEV(ShoppingCart, { className: "w-5 h-5 sm:w-6 h-6" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 436,
                  columnNumber: 17
                }, this),
                cart.length > 0 && /* @__PURE__ */ jsxDEV("span", { className: "absolute -top-1 -right-1 bg-brand-pink text-white text-[10px] sm:text-xs font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-brand-dark animate-pulse", children: cart.reduce((sum, item) => sum + item.quantity, 0) }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 438,
                  columnNumber: 17
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 431,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 419,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 385,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 384,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "md:hidden flex justify-around border-t border-gray-800/80 py-2.5 bg-brand-dark/95", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("home"),
            className: `text-xs font-bold px-3 py-1 rounded-full ${activeTab === "home" ? "bg-brand-yellow text-brand-dark" : "text-gray-400"}`,
            children: "MENU"
          },
          void 0,
          false,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 449,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("rewards"),
            className: `text-xs font-bold px-3 py-1 rounded-full ${activeTab === "rewards" ? "bg-brand-yellow text-brand-dark" : "text-gray-400"}`,
            children: "REWARDS"
          },
          void 0,
          false,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 455,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("support"),
            className: `text-xs font-bold px-3 py-1 rounded-full ${activeTab === "support" ? "bg-brand-yellow text-brand-dark" : "text-gray-400"}`,
            children: "SUPPORT"
          },
          void 0,
          false,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 461,
            columnNumber: 11
          },
          this
        )
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 448,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
      lineNumber: 383,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("main", { className: "flex-grow", children: [
      activeTab === "home" && /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("section", { className: "relative w-full min-h-[420px] sm:h-[500px] bg-brand-light flex items-center overflow-hidden transition-all duration-700", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 z-0", children: [
            /* @__PURE__ */ jsxDEV(
              "img",
              {
                alt: banners && banners.length > 0 ? banners[currentBannerIndex]?.title : "Delicious Premium Angus Burger",
                className: "w-full h-full object-cover opacity-30 sm:opacity-40 animate-fade-in",
                src: banners && banners.length > 0 ? `${BACKEND_URL}${banners[currentBannerIndex]?.imageUrl}` : "https://lh3.googleusercontent.com/aida-public/AB6AXuCIiya8Cbx_CdyZFIhVoboYMFkd2vfkN2hNvIBC6MwktpbKWWK4XVpoYLZEK6XF8rcaVTA6WKdoKFxr4wEo9vWFC6IzgvT4w8esgqz1lYyl1UwVY688mJQV9T5YVs_dgZYDIHY4zavtQh609odDannRlv2zZMAjpEue35Zpt7bYUFTRhhj7gzZBZmAQgpnQ0diZpLOw54wg6AEE4oNU4Oqi6EmSwayeNFkVrt2X69ckCqsBJzyk5opi0fXNiweo3dgOgiTVTPrsCYU"
              },
              banners && banners.length > 0 ? banners[currentBannerIndex]?.id : "default",
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 479,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/90 to-transparent" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 485,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 478,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-fade-in", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "inline-block bg-brand-yellow text-brand-dark text-[10px] sm:text-xs font-black px-3.5 py-1.5 rounded-full mb-4 uppercase tracking-wider", children: "Featured" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 489,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("h1", { className: "text-4xl sm:text-6xl md:text-8xl font-black tracking-tight leading-none mb-4", children: banners && banners.length > 0 ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
              (banners[currentBannerIndex]?.title || "").split(" ").slice(0, -1).join(" "),
              /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 495,
                columnNumber: 101
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-brand-yellow", children: (banners[currentBannerIndex]?.title || "").split(" ").slice(-1).join(" ") }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 496,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 494,
              columnNumber: 17
            }, this) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
              "Delicious",
              /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 499,
                columnNumber: 28
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-brand-yellow", children: "Burgers" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 499,
                columnNumber: 34
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 499,
              columnNumber: 17
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 492,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "mt-2 max-w-lg text-sm sm:text-lg text-slate-300 mb-6", children: banners && banners.length > 0 ? banners[currentBannerIndex]?.subtitle : "Try our new premium Angus beef burger, loaded with melted cheddar, crisp vegetables, and our signature secret sauce. Freshly flame-cooked for your delight." }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 502,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap gap-4", children: /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => {
                  if (banners && banners.length > 0 && banners[currentBannerIndex]?.linkUrl) {
                    window.location.href = banners[currentBannerIndex].linkUrl;
                  } else {
                    const section = document.getElementById("menu-grid-section");
                    if (section) section.scrollIntoView({ behavior: "smooth" });
                  }
                },
                className: "bg-brand-yellow hover:bg-brand-yellowHover text-brand-dark font-extrabold py-3 px-8 rounded-full flex items-center gap-2 transition duration-300 transform hover:scale-105",
                children: [
                  banners && banners.length > 0 ? banners[currentBannerIndex]?.buttonText || "ORDER NOW" : "ORDER NOW",
                  " ",
                  /* @__PURE__ */ jsxDEV(ArrowRight, { className: "w-5 h-5" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 517,
                    columnNumber: 124
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 506,
                columnNumber: 19
              },
              this
            ) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 505,
              columnNumber: 17
            }, this)
          ] }, `text-${currentBannerIndex}`, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 488,
            columnNumber: 15
          }, this),
          banners && banners.length > 1 && /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-6 right-6 flex space-x-2 z-10", children: banners.map(
            (_, idx) => /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => setCurrentBannerIndex(idx),
                className: `h-2 rounded-full transition-all duration-300 ${idx === currentBannerIndex ? "w-10 bg-brand-yellow" : "w-2 bg-slate-500 hover:bg-slate-400"}`
              },
              idx,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 526,
                columnNumber: 15
              },
              this
            )
          ) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 524,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 477,
          columnNumber: 13
        }, this),
        campaigns && campaigns.length > 0 && /* @__PURE__ */ jsxDEV("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-gray-800 relative", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between mb-8", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("p", { className: "text-brand-pink text-xs font-black uppercase tracking-widest mb-1", children: "Limited Time" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 541,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("h2", { className: "text-xl sm:text-3xl font-black flex items-center gap-2", children: [
                /* @__PURE__ */ jsxDEV(Percent, { className: "w-6 h-6 text-brand-pink" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 543,
                  columnNumber: 23
                }, this),
                " SPECIAL OFFERS"
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 542,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 540,
              columnNumber: 19
            }, this),
            campaigns.length > 3 && /* @__PURE__ */ jsxDEV("div", { className: "flex space-x-2", children: [
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => {
                    const container = document.getElementById("campaigns-scroll-container");
                    if (container) container.scrollBy({ left: -320, behavior: "smooth" });
                  },
                  className: "p-2 bg-slate-800 hover:bg-brand-yellow text-white hover:text-brand-dark rounded-full transition",
                  children: /* @__PURE__ */ jsxDEV(ChevronLeft, { className: "w-5 h-5" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 555,
                    columnNumber: 25
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 548,
                  columnNumber: 23
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => {
                    const container = document.getElementById("campaigns-scroll-container");
                    if (container) container.scrollBy({ left: 320, behavior: "smooth" });
                  },
                  className: "p-2 bg-slate-800 hover:bg-brand-yellow text-white hover:text-brand-dark rounded-full transition",
                  children: /* @__PURE__ */ jsxDEV(ChevronRight, { className: "w-5 h-5" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 564,
                    columnNumber: 25
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 557,
                  columnNumber: 23
                },
                this
              )
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 547,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 539,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "div",
            {
              id: "campaigns-scroll-container",
              className: "flex gap-6 overflow-x-auto pb-4 snap-x hide-scrollbar",
              children: campaigns.map(
                (campaign) => /* @__PURE__ */ jsxDEV(
                  "div",
                  {
                    className: "bg-brand-light border border-slate-800/80 hover:border-brand-yellow rounded-2xl p-6 relative overflow-hidden group transition duration-300 flex flex-col justify-between min-w-[300px] sm:min-w-[340px] snap-center flex-1",
                    children: [
                      /* @__PURE__ */ jsxDEV("div", { className: "absolute top-0 right-0 w-24 h-24 bg-brand-yellow/5 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110" }, void 0, false, {
                        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                        lineNumber: 580,
                        columnNumber: 23
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { children: [
                        /* @__PURE__ */ jsxDEV("span", { className: "bg-brand-pink text-white text-[10px] font-black px-2.5 py-1 rounded mb-4 inline-block uppercase tracking-wider", children: [
                          campaign.discount_pct,
                          "% OFF"
                        ] }, void 0, true, {
                          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                          lineNumber: 583,
                          columnNumber: 25
                        }, this),
                        /* @__PURE__ */ jsxDEV("h3", { className: "text-lg sm:text-xl font-bold mb-1 text-slate-100", children: campaign.title }, void 0, false, {
                          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                          lineNumber: 586,
                          columnNumber: 25
                        }, this),
                        /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed line-clamp-2", children: campaign.description }, void 0, false, {
                          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                          lineNumber: 587,
                          columnNumber: 25
                        }, this)
                      ] }, void 0, true, {
                        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                        lineNumber: 582,
                        columnNumber: 23
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between mt-4 pt-4 border-t border-slate-800/40", children: [
                        /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-slate-500 tracking-wider font-mono uppercase", children: "OFFER" }, void 0, false, {
                          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                          lineNumber: 591,
                          columnNumber: 25
                        }, this),
                        /* @__PURE__ */ jsxDEV(
                          "button",
                          {
                            onClick: () => {
                              applyCoupon({
                                code: `CAMP-${campaign.id}`,
                                name: campaign.title,
                                discountPercent: campaign.discount_pct,
                                description: campaign.description
                              });
                            },
                            className: "bg-slate-800 hover:bg-brand-yellow hover:text-brand-dark text-brand-yellow text-xs font-black py-2 px-4 rounded-full transition duration-300",
                            children: appliedCoupon?.code === `CAMP-${campaign.id}` ? "Applied ✓" : "Apply Deal"
                          },
                          void 0,
                          false,
                          {
                            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                            lineNumber: 594,
                            columnNumber: 25
                          },
                          this
                        )
                      ] }, void 0, true, {
                        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                        lineNumber: 590,
                        columnNumber: 23
                      }, this)
                    ]
                  },
                  campaign.id,
                  true,
                  {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 575,
                    columnNumber: 15
                  },
                  this
                )
              )
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 570,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 538,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-brand-light rounded-2xl sm:rounded-full p-2 border border-slate-800/80 flex items-center justify-between", children: /* @__PURE__ */ jsxDEV("div", { className: "flex-1 flex gap-4 sm:justify-around items-center px-4 overflow-x-auto py-1", children: CATEGORIES.map(
          (category) => /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setActiveCategory(category),
              className: `flex items-center gap-2 min-w-max px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition cursor-pointer ${activeCategory === category ? "bg-brand-yellow text-brand-dark" : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"}`,
              children: [
                /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-4 h-4 shrink-0" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 628,
                  columnNumber: 23
                }, this),
                category
              ]
            },
            category,
            true,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 619,
              columnNumber: 17
            },
            this
          )
        ) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 617,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 616,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 615,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("section", { id: "menu-grid-section", className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4", children: [
            /* @__PURE__ */ jsxDEV("h2", { className: "text-3xl sm:text-4xl font-black text-brand-yellow tracking-tight", children: activeCategory }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 639,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "relative max-w-xs w-full", children: [
              /* @__PURE__ */ jsxDEV(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 643,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  placeholder: "Search menu...",
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  className: "w-full bg-slate-900 border border-slate-800 rounded-full pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-yellow"
                },
                void 0,
                false,
                {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 644,
                  columnNumber: 19
                },
                this
              )
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 642,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 638,
            columnNumber: 15
          }, this),
          filteredProducts.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "text-center py-16 bg-brand-light rounded-3xl border border-slate-800/50", children: [
            /* @__PURE__ */ jsxDEV(ShoppingBag, { className: "w-12 h-12 text-slate-600 mx-auto mb-3" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 656,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 font-bold", children: "No products found matching your search." }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 657,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 655,
            columnNumber: 13
          }, this) : /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8", children: filteredProducts.map(
            (product) => /* @__PURE__ */ jsxDEV(
              "div",
              {
                className: "bg-brand-light border border-slate-800/60 rounded-3xl overflow-hidden relative group hover:border-brand-yellow/30 transition-all duration-300",
                children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "aspect-square relative overflow-hidden bg-slate-900", children: [
                    /* @__PURE__ */ jsxDEV(
                      "img",
                      {
                        alt: product.name,
                        className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500",
                        src: product.image_url,
                        onError: (e) => {
                          e.target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuCIiya8Cbx_CdyZFIhVoboYMFkd2vfkN2hNvIBC6MwktpbKWWK4XVpoYLZEK6XF8rcaVTA6WKdoKFxr4wEo9vWFC6IzgvT4w8esgqz1lYyl1UwVY688mJQV9T5YVs_dgZYDIHY4zavtQh609odDannRlv2zZMAjpEue35Zpt7bYUFTRhhj7gzZBZmAQgpnQ0diZpLOw54wg6AEE4oNU4Oqi6EmSwayeNFkVrt2X69ckCqsBJzyk5opi0fXNiweo3dgOgiTVTPrsCYU";
                        }
                      },
                      void 0,
                      false,
                      {
                        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                        lineNumber: 668,
                        columnNumber: 25
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/40 to-transparent" }, void 0, false, {
                      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                      lineNumber: 677,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 667,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-0 left-0 right-0 p-5 flex justify-between items-end", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "flex-1 pr-3", children: [
                      /* @__PURE__ */ jsxDEV("h3", { className: "text-white font-black text-lg sm:text-xl tracking-tight mb-1", children: product.name }, void 0, false, {
                        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                        lineNumber: 683,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 text-xs line-clamp-1 mb-2 leading-snug", children: product.description }, void 0, false, {
                        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                        lineNumber: 684,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV("p", { className: "text-brand-yellow font-black text-lg", children: [
                        "$",
                        product.price.toFixed(2)
                      ] }, void 0, true, {
                        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                        lineNumber: 685,
                        columnNumber: 27
                      }, this)
                    ] }, void 0, true, {
                      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                      lineNumber: 682,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV(
                      "button",
                      {
                        onClick: () => addToCart(product),
                        className: "w-11 h-11 bg-white hover:bg-brand-yellow text-brand-dark rounded-full flex items-center justify-center transition shadow-lg shrink-0",
                        "aria-label": `Add ${product.name} to cart`,
                        children: /* @__PURE__ */ jsxDEV(Plus, { className: "w-5 h-5 stroke-[3px]" }, void 0, false, {
                          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                          lineNumber: 692,
                          columnNumber: 27
                        }, this)
                      },
                      void 0,
                      false,
                      {
                        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                        lineNumber: 687,
                        columnNumber: 25
                      },
                      this
                    )
                  ] }, void 0, true, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 681,
                    columnNumber: 23
                  }, this)
                ]
              },
              product.id,
              true,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 662,
                columnNumber: 15
              },
              this
            )
          ) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 660,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 637,
          columnNumber: 13
        }, this),
        orderTracking && /* @__PURE__ */ jsxDEV("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mb-8", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-900 border-2 border-brand-yellow/40 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "w-12 h-12 bg-brand-yellow/10 rounded-full flex items-center justify-center text-brand-yellow animate-pulse shrink-0", children: /* @__PURE__ */ jsxDEV(Clock, { className: "w-6 h-6" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 707,
              columnNumber: 23
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 706,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-400 font-bold uppercase tracking-wider", children: "Active POS Order" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 710,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("h4", { className: "text-lg font-black text-white", children: [
                "ID: ",
                orderTracking.id
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 711,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-slate-300", children: [
                "Status: ",
                /* @__PURE__ */ jsxDEV("span", { className: "text-brand-yellow font-black uppercase", children: orderTracking.status }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 712,
                  columnNumber: 69
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 712,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 709,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 705,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "w-full md:w-auto flex items-center gap-4", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-center md:text-right", children: [
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-400 font-bold", children: "Estimated Arrival" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 717,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-2xl font-black text-brand-yellow", children: [
                orderTracking.eta,
                " Mins"
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 718,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 716,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => {
                  triggerToast("Checking live dispatch status...", "info");
                  setOrderTracking({
                    ...orderTracking,
                    status: "DISPATCHED",
                    eta: 12
                  });
                },
                className: "bg-brand-yellow hover:bg-brand-yellowHover text-brand-dark font-black text-xs px-5 py-3 rounded-full transition",
                children: "Track Order"
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 720,
                columnNumber: 21
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => setOrderTracking(null),
                className: "text-slate-400 hover:text-white",
                "aria-label": "Dismiss tracking panel",
                children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 739,
                  columnNumber: 23
                }, this)
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 734,
                columnNumber: 21
              },
              this
            )
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 715,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 704,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 703,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("section", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center border-t border-gray-800 mt-12", children: [
          /* @__PURE__ */ jsxDEV("p", { className: "text-brand-yellow text-xs font-black uppercase tracking-widest mb-2", children: "The Faces Behind The Flavor" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 748,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("h2", { className: "text-3xl sm:text-4xl font-black mb-4", children: "OUR STAFF" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 749,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 mb-12 max-w-xl mx-auto text-sm sm:text-base leading-relaxed", children: "Meet the incredible team that makes Masjid e Taqwa special. From our master chefs to our friendly front-of-house staff." }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 750,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center gap-12 sm:gap-24", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-4 transition-transform group-hover:scale-105", children: /* @__PURE__ */ jsxDEV(User, { className: "w-10 h-10 text-slate-400 group-hover:text-brand-yellow" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 756,
                columnNumber: 21
              }, this) }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 755,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("h4", { className: "font-extrabold text-lg text-slate-100", children: "Imran Farooq" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 758,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-brand-yellow text-xs font-black tracking-widest mt-1 uppercase", children: "Cashier" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 759,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 754,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center group", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-4 transition-transform group-hover:scale-105", children: /* @__PURE__ */ jsxDEV(User, { className: "w-10 h-10 text-slate-400 group-hover:text-brand-yellow" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 763,
                columnNumber: 21
              }, this) }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 762,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("h4", { className: "font-extrabold text-lg text-slate-100", children: "Sara Manager" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 765,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-brand-yellow text-xs font-black tracking-widest mt-1 uppercase", children: "Manager" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 766,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 761,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 753,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 747,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 475,
        columnNumber: 9
      }, this),
      activeTab === "rewards" && /* @__PURE__ */ jsxDEV("section", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "text-center mb-12", children: [
          /* @__PURE__ */ jsxDEV("h1", { className: "text-4xl sm:text-5xl font-black text-brand-yellow mb-4 tracking-tight", children: "D4U Club Rewards" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 779,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 max-w-lg mx-auto text-sm sm:text-base", children: "Earn 10 points for every $1 spent. Redeem points for free meals, custom discounts, and member-only specials." }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 780,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 778,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-8", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "md:col-span-7 bg-brand-light border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("h3", { className: "text-xl font-bold text-slate-100 mb-2", children: "Check Your Balance" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 789,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed", children: "Enter your registered phone number to load your digital rewards card and redeem your points instantly." }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 790,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("form", { onSubmit: handleLoyaltySearch, className: "space-y-4 mb-6", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-black tracking-widest text-slate-400 uppercase", children: "Phone Number" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 796,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "tel",
                      placeholder: "e.g. +1 (555) 123-4567",
                      value: loyaltyPhone,
                      onChange: (e) => setLoyaltyPhone(e.target.value),
                      className: "w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow"
                    },
                    void 0,
                    false,
                    {
                      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                      lineNumber: 797,
                      columnNumber: 23
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 795,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    type: "submit",
                    disabled: isLoyaltySearching,
                    className: "w-full bg-brand-yellow hover:bg-brand-yellowHover text-brand-dark font-black py-3 rounded-xl transition flex items-center justify-center gap-2",
                    children: isLoyaltySearching ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
                      /* @__PURE__ */ jsxDEV(Loader2, { className: "w-4 h-4 animate-spin" }, void 0, false, {
                        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                        lineNumber: 812,
                        columnNumber: 27
                      }, this),
                      " Retrieving..."
                    ] }, void 0, true, {
                      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                      lineNumber: 811,
                      columnNumber: 21
                    }, this) : "Load Member Card"
                  },
                  void 0,
                  false,
                  {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 805,
                    columnNumber: 21
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 794,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 788,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-900/50 rounded-xl p-4 border border-slate-800/30", children: /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-400 leading-normal", children: [
              "💡 ",
              /* @__PURE__ */ jsxDEV("span", { className: "text-slate-200 font-bold", children: "Quick Demo:" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 824,
                columnNumber: 24
              }, this),
              " Enter any phone ending in ",
              /* @__PURE__ */ jsxDEV("span", { className: "text-brand-yellow font-bold font-mono", children: "1" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 824,
                columnNumber: 112
              }, this),
              " (e.g. +1 555-0001) to simulate an elite Diamond level account loaded with active balance!"
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 823,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 822,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 787,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "md:col-span-5", children: loyaltyAccount ? /* @__PURE__ */ jsxDEV("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "bg-gradient-to-br from-brand-yellow/90 to-amber-600 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-brand-dark select-none min-h-[190px] flex flex-col justify-between", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 835,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-start", children: [
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] font-black uppercase tracking-widest text-brand-dark/70", children: "D4U Member Club" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 839,
                    columnNumber: 27
                  }, this),
                  /* @__PURE__ */ jsxDEV("h4", { className: "text-base font-black truncate max-w-[180px]", children: loyaltyAccount.name }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 840,
                    columnNumber: 27
                  }, this)
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 838,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "bg-brand-dark text-brand-yellow text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider", children: loyaltyAccount.tier }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 842,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 837,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "pt-4", children: [
                /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] font-black uppercase tracking-widest text-brand-dark/70", children: "Points Balance" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 848,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-4xl font-black tracking-tight", children: [
                  loyaltyAccount.points,
                  " pts"
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 849,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-xs font-bold text-brand-dark/80 mt-1", children: [
                  "Value: $",
                  (loyaltyAccount.points * 0.01).toFixed(2)
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 850,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 847,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 834,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "bg-brand-light border border-slate-800 rounded-3xl p-6 text-center", children: [
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-400 mb-3", children: "You have enough points to claim a discount!" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 856,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: handleRedeemPoints,
                  className: "w-full bg-slate-900 border border-slate-700 hover:border-brand-yellow text-brand-yellow font-black py-2.5 rounded-xl text-sm transition",
                  children: "Redeem 500 Points ($5.00 Off)"
                },
                void 0,
                false,
                {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 857,
                  columnNumber: 23
                },
                this
              )
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 855,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 832,
            columnNumber: 15
          }, this) : /* @__PURE__ */ jsxDEV("div", { className: "border border-dashed border-slate-800 rounded-3xl p-8 text-center flex flex-col justify-center items-center min-h-[280px]", children: [
            /* @__PURE__ */ jsxDEV(Shield, { className: "w-12 h-12 text-slate-700 mb-3" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 867,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("h3", { className: "text-base font-bold text-slate-300", children: "No Member Card Loaded" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 868,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-500 max-w-[180px] mt-1 leading-normal", children: "Use the checker on the left to securely retrieve your reward statistics." }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 869,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 866,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 830,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 785,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 777,
        columnNumber: 9
      }, this),
      activeTab === "support" && /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("section", { className: "py-12 sm:py-16 px-4 sm:px-6 lg:px-8 text-center border-b border-gray-800/80 bg-brand-light relative", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[220px] bg-brand-yellow/5 rounded-full blur-[100px] pointer-events-none" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 884,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "max-w-3xl mx-auto relative z-10", children: [
            /* @__PURE__ */ jsxDEV("h1", { className: "text-4xl sm:text-6xl font-black mb-3 text-white tracking-tight", children: "Contact Us" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 886,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto", children: "Got a craving or a question? Drop us a line. We're here to ensure your premium dining experience is nothing short of extraordinary." }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 887,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 885,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 883,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("section", { className: "mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "lg:col-span-7", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm", children: [
            /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-black mb-6 text-slate-100", children: "Send a Message" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 898,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("form", { onSubmit: handleContactSubmit, className: "space-y-4", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-black tracking-widest text-slate-400 uppercase", htmlFor: "name", children: "Full Name" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 903,
                    columnNumber: 25
                  }, this),
                  /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      id: "name",
                      type: "text",
                      placeholder: "e.g. John Doe",
                      value: contactName,
                      onChange: (e) => setContactName(e.target.value),
                      className: "w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow",
                      required: true
                    },
                    void 0,
                    false,
                    {
                      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                      lineNumber: 904,
                      columnNumber: 25
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 902,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-black tracking-widest text-slate-400 uppercase", htmlFor: "email", children: "Email Address" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 915,
                    columnNumber: 25
                  }, this),
                  /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      id: "email",
                      type: "email",
                      placeholder: "e.g. john@example.com",
                      value: contactEmail,
                      onChange: (e) => setContactEmail(e.target.value),
                      className: "w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow",
                      required: true
                    },
                    void 0,
                    false,
                    {
                      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                      lineNumber: 916,
                      columnNumber: 25
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 914,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 901,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-black tracking-widest text-slate-400 uppercase", htmlFor: "subject", children: "Subject" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 929,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    id: "subject",
                    type: "text",
                    placeholder: "How can we help?",
                    value: contactSubject,
                    onChange: (e) => setContactSubject(e.target.value),
                    className: "w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow"
                  },
                  void 0,
                  false,
                  {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 930,
                    columnNumber: 23
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 928,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxDEV("label", { className: "block text-xs font-black tracking-widest text-slate-400 uppercase", htmlFor: "message", children: "Your Message" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 941,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "textarea",
                  {
                    id: "message",
                    rows: 5,
                    placeholder: "Write your message here...",
                    value: contactMessage,
                    onChange: (e) => setContactMessage(e.target.value),
                    className: "w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow resize-none",
                    required: true
                  },
                  void 0,
                  false,
                  {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 942,
                    columnNumber: 23
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 940,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "submit",
                  disabled: isSendingMessage,
                  className: "bg-brand-yellow hover:bg-brand-yellowHover text-brand-dark font-black px-8 py-3.5 rounded-full transition duration-300 flex items-center justify-center gap-2 transform hover:scale-105",
                  children: isSendingMessage ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
                    /* @__PURE__ */ jsxDEV(Loader2, { className: "w-4 h-4 animate-spin" }, void 0, false, {
                      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                      lineNumber: 960,
                      columnNumber: 27
                    }, this),
                    " Sending..."
                  ] }, void 0, true, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 959,
                    columnNumber: 21
                  }, this) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
                    "Send Message ",
                    /* @__PURE__ */ jsxDEV(Send, { className: "w-4 h-4" }, void 0, false, {
                      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                      lineNumber: 964,
                      columnNumber: 40
                    }, this)
                  ] }, void 0, true, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 963,
                    columnNumber: 21
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 953,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 900,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 897,
            columnNumber: 17
          }, this) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 896,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "lg:col-span-5 flex flex-col space-y-8", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-6 bg-brand-light border border-slate-800/80 p-6 rounded-3xl", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-start gap-4", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "w-12 h-12 rounded-full border border-slate-700 flex-shrink-0 flex items-center justify-center text-brand-yellow", children: /* @__PURE__ */ jsxDEV(MapPin, { className: "w-5 h-5" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 979,
                  columnNumber: 23
                }, this) }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 978,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("h3", { className: "font-bold text-slate-100 text-base", children: "Our Location" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 982,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 text-sm mt-1 leading-relaxed whitespace-pre-wrap", children: settings?.address || "452 Gourmet Avenue\nCulinary District, NY 10012" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 983,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 981,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 977,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-start gap-4", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "w-12 h-12 rounded-full border border-slate-700 flex-shrink-0 flex items-center justify-center text-brand-yellow", children: /* @__PURE__ */ jsxDEV(Phone, { className: "w-5 h-5" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 992,
                  columnNumber: 23
                }, this) }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 991,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("h3", { className: "font-bold text-slate-100 text-base", children: "Phone Support" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 995,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 text-sm mt-1 leading-relaxed whitespace-pre-wrap", children: settings?.contactPhone || "+1 (555) 123-4567\nMon-Sun, 10am - 12am" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 996,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 994,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 990,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-start gap-4", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "w-12 h-12 rounded-full border border-slate-700 flex-shrink-0 flex items-center justify-center text-brand-yellow", children: /* @__PURE__ */ jsxDEV(Mail, { className: "w-5 h-5" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1005,
                  columnNumber: 23
                }, this) }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1004,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("h3", { className: "font-bold text-slate-100 text-base", children: "Email Address" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 1008,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 text-sm mt-1 leading-relaxed whitespace-pre-wrap", children: settings?.contactEmail || "hello@masjidetaqwa.com\nsupport@masjidetaqwa.com" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 1009,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1007,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1003,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 975,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "relative rounded-3xl border border-slate-800 overflow-hidden shadow-2xl h-64 sm:h-72", children: [
              /* @__PURE__ */ jsxDEV(
                "img",
                {
                  alt: "City Map Navigation",
                  className: "absolute inset-0 w-full h-full object-cover opacity-80",
                  src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCy_ttPIgvKT--O52bqItJTMyy05G-MDoJNnjCytOEI2NfjnyVEXqfpJ00q2YW9Z9KUEFWnVWowdEx6svJ5QulraDzMepXckV0V646gBxC43rnFNRwiZAqAhaqxQvyIbVeJSXTTVD98S32uZLWEI7DND4B22u-8IARPKDlyiqvXRB_Y4QRHp5bbe11LiE28ZFsFxjrPa2VPASz91IKgBhZp8A72TPG7JUtaw8_KjyYB9642xlE1ZDa_bPWxdXxzM_EijVX_GwVAKvM"
                },
                void 0,
                false,
                {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1018,
                  columnNumber: 19
                },
                this
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-t from-brand-dark/90 to-transparent pointer-events-none" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1023,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1027,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-black text-slate-100", children: "Open Now" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1028,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1026,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1017,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 973,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 894,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 881,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
      lineNumber: 471,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("footer", { className: "bg-brand-light pt-12 pb-6 border-t border-gray-800", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-10 mb-10", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-brand-yellow font-black text-xl mb-4", children: settings?.siteTitle || "D4U Restaurant" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1044,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 text-sm leading-relaxed mb-6 whitespace-pre-wrap", children: settings?.aboutText || "The future of fast-casual dining. Premium culinary quality fused with state-of-the-art POS ordering mechanisms." }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1045,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex space-x-4", children: [
            settings?.facebookUrl && /* @__PURE__ */ jsxDEV("a", { className: "text-slate-400 hover:text-white transition", href: settings.facebookUrl, target: "_blank", "aria-label": "Facebook", children: /* @__PURE__ */ jsxDEV(Globe, { className: "w-5 h-5" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1049,
              columnNumber: 167
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1049,
              columnNumber: 43
            }, this),
            settings?.instagramUrl && /* @__PURE__ */ jsxDEV("a", { className: "text-slate-400 hover:text-white transition", href: settings.instagramUrl, target: "_blank", "aria-label": "Instagram", children: /* @__PURE__ */ jsxDEV(Share2, { className: "w-5 h-5" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1050,
              columnNumber: 170
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1050,
              columnNumber: 44
            }, this),
            settings?.twitterUrl && /* @__PURE__ */ jsxDEV("a", { className: "text-slate-400 hover:text-white transition", href: settings.twitterUrl, target: "_blank", "aria-label": "Twitter", children: /* @__PURE__ */ jsxDEV(Share2, { className: "w-5 h-5" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1051,
              columnNumber: 164
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1051,
              columnNumber: 42
            }, this),
            settings?.youtubeUrl && /* @__PURE__ */ jsxDEV("a", { className: "text-slate-400 hover:text-white transition", href: settings.youtubeUrl, target: "_blank", "aria-label": "YouTube", children: /* @__PURE__ */ jsxDEV(Share2, { className: "w-5 h-5" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1052,
              columnNumber: 164
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1052,
              columnNumber: 42
            }, this),
            !settings?.facebookUrl && !settings?.instagramUrl && /* @__PURE__ */ jsxDEV(Fragment, { children: [
              /* @__PURE__ */ jsxDEV("a", { className: "text-slate-400 hover:text-white transition", href: "#", "aria-label": "Website Link", children: /* @__PURE__ */ jsxDEV(Globe, { className: "w-5 h-5" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1055,
                columnNumber: 114
              }, this) }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1055,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("a", { className: "text-slate-400 hover:text-white transition", href: "#", "aria-label": "Share Link", children: /* @__PURE__ */ jsxDEV(Share2, { className: "w-5 h-5" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1056,
                columnNumber: 112
              }, this) }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1056,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1054,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1048,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1043,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h4", { className: "text-white font-black mb-4 uppercase text-xs tracking-widest", children: "Contact Us" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1064,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("ul", { className: "space-y-2 text-sm", children: [
            settings?.address && /* @__PURE__ */ jsxDEV("li", { className: "text-slate-400", children: settings.address }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1066,
              columnNumber: 39
            }, this),
            settings?.contactPhone && /* @__PURE__ */ jsxDEV("li", { className: "text-slate-400", children: settings.contactPhone }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1067,
              columnNumber: 44
            }, this),
            settings?.contactEmail && /* @__PURE__ */ jsxDEV("li", { className: "text-slate-400", children: settings.contactEmail }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1068,
              columnNumber: 44
            }, this),
            !settings?.address && !settings?.contactPhone && !settings?.contactEmail && /* @__PURE__ */ jsxDEV(Fragment, { children: [
              /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { className: "text-slate-400 hover:text-white transition", href: "#", children: "Our GOURMET Menu" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1071,
                columnNumber: 25
              }, this) }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1071,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { className: "text-slate-400 hover:text-white transition", href: "#", children: "Bespoke Locations" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1072,
                columnNumber: 25
              }, this) }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1072,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1070,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1065,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1063,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h4", { className: "text-white font-black mb-4 uppercase text-xs tracking-widest", children: "Company" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1079,
            columnNumber: 15
          }, this),
          settings?.companyText ? /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 text-sm whitespace-pre-wrap", children: settings.companyText }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1081,
            columnNumber: 15
          }, this) : /* @__PURE__ */ jsxDEV("ul", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { className: "text-slate-400 hover:text-white transition", href: "#", children: "Our Culinary Journey" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1084,
              columnNumber: 23
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1084,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { className: "text-slate-400 hover:text-white transition", href: "#", children: "Corporate Sustainability" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1085,
              columnNumber: 23
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1085,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { className: "text-slate-400 hover:text-white transition", href: "#", children: "Kitchen Careers" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1086,
              columnNumber: 23
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1086,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { className: "text-slate-400 hover:text-white transition", href: "#", children: "Intellectual Privacy" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1087,
              columnNumber: 23
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1087,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1083,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1078,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h4", { className: "text-white font-black mb-4 uppercase text-xs tracking-widest", children: "Join The D4U" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1094,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 text-sm mb-4 leading-normal", children: "Subscribe for exclusive chef specials and priority reservations." }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1095,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV(
            "form",
            {
              onSubmit: async (e) => {
                e.preventDefault();
                const target = e.target;
                try {
                  await fetch(`${BACKEND_URL}/cms/subscribe`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ store_id: storeId, email: target.email.value })
                  });
                  triggerToast("Subscribed successfully! Thank you for joining.", "success");
                  target.email.value = "";
                } catch (err) {
                  triggerToast("Failed to subscribe. Please try again.", "error");
                }
              },
              className: "flex",
              children: [
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    name: "email",
                    className: "bg-slate-900 border border-slate-800 text-white text-sm rounded-l-xl px-4 py-2.5 w-full focus:outline-none focus:border-brand-yellow",
                    placeholder: "Enter email address",
                    type: "email",
                    required: true
                  },
                  void 0,
                  false,
                  {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 1114,
                    columnNumber: 17
                  },
                  this
                ),
                /* @__PURE__ */ jsxDEV("button", { className: "bg-brand-yellow hover:bg-brand-yellowHover text-brand-dark font-black text-sm px-5 py-2.5 rounded-r-xl transition", type: "submit", children: "JOIN" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1121,
                  columnNumber: 17
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1096,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1093,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 1040,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 1039,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "bg-brand-yellow py-3.5 relative mt-8", children: /* @__PURE__ */ jsxDEV("div", { className: "max-w-7xl mx-auto px-4 flex justify-center items-center", children: /* @__PURE__ */ jsxDEV("div", { className: "text-[#0c1322] text-xs font-black tracking-wide", children: "© 2026 D4U Restaurant Group. Inspired by the bold. Built for the gourmet." }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 1132,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 1131,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 1130,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
      lineNumber: 1038,
      columnNumber: 7
    }, this),
    !selectedLocation && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-[150] flex items-center justify-center px-4 bg-brand-dark/90 backdrop-blur-xl", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden p-6 sm:p-8", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-yellow to-transparent opacity-60" }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 1143,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "text-center space-y-4", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-700 shadow-inner", children: /* @__PURE__ */ jsxDEV(MapPin, { className: "w-8 h-8 text-brand-yellow animate-bounce" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1147,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1146,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl sm:text-3xl font-black text-white tracking-tight", children: "Select Your Location" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1149,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 text-xs sm:text-sm max-w-[280px] mx-auto leading-normal", children: "Choose your city and branch to see the customized menu for your local area." }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1150,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 1145,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("form", { onSubmit: handleLocationSubmit, className: "space-y-6 mt-6", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-black tracking-wider text-slate-400 uppercase px-1", children: "Choose City" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1158,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "select",
            {
              value: selectedCity,
              onChange: (e) => {
                setSelectedCity(e.target.value);
                setSelectedBranch("");
              },
              className: "w-full bg-slate-950 border border-slate-800 text-white font-bold rounded-xl py-3.5 px-4 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition",
              required: true,
              children: [
                /* @__PURE__ */ jsxDEV("option", { value: "", disabled: true, children: "Select a city..." }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1168,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("option", { value: "karachi", children: "Karachi" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1169,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("option", { value: "lahore", children: "Lahore" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1170,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("option", { value: "islamabad", children: "Islamabad" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1171,
                  columnNumber: 19
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1159,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1157,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-black tracking-wider text-slate-400 uppercase px-1", children: "Choose Branch" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1177,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "select",
            {
              value: selectedBranch,
              onChange: (e) => setSelectedBranch(e.target.value),
              disabled: !selectedCity,
              className: "w-full bg-slate-950 border border-slate-800 text-white font-bold rounded-xl py-3.5 px-4 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition disabled:opacity-50 disabled:cursor-not-allowed",
              required: true,
              children: [
                /* @__PURE__ */ jsxDEV("option", { value: "", disabled: true, children: "Select a branch..." }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1185,
                  columnNumber: 19
                }, this),
                selectedCity && BRANCHES_BY_CITY[selectedCity].map(
                  (b) => /* @__PURE__ */ jsxDEV("option", { value: b, children: b }, b, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                    lineNumber: 1187,
                    columnNumber: 17
                  }, this)
                )
              ]
            },
            void 0,
            true,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1178,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1176,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "submit",
            disabled: !selectedCity || !selectedBranch,
            className: "w-full bg-brand-yellow text-brand-dark hover:bg-brand-yellowHover font-black py-4 rounded-full transition duration-300 flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]",
            children: [
              "Enter Website ",
              /* @__PURE__ */ jsxDEV(ArrowRight, { className: "w-5 h-5" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1198,
                columnNumber: 31
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1193,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 1155,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
      lineNumber: 1142,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
      lineNumber: 1141,
      columnNumber: 7
    }, this),
    isCartOpen && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-[100] flex justify-end bg-brand-dark/70 backdrop-blur-sm", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0", onClick: () => setIsCartOpen(false) }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 1209,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "relative w-full max-w-md bg-slate-900 h-full shadow-2xl flex flex-col justify-between z-10 border-l border-slate-800", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "p-5 border-b border-slate-800 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV(ShoppingCart, { className: "w-5 h-5 text-brand-yellow" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1216,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("h3", { className: "font-black text-lg text-white", children: "Your Basket" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1217,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1215,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setIsCartOpen(false),
              className: "text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition",
              children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1223,
                columnNumber: 17
              }, this)
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1219,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1214,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto p-5 space-y-4", children: cart.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "text-center py-20", children: [
          /* @__PURE__ */ jsxDEV(ShoppingBag, { className: "w-12 h-12 text-slate-700 mx-auto mb-3 animate-pulse" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1231,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 font-bold", children: "Your cart is empty." }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1232,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-slate-500 mt-1", children: "Start adding delicious food from our menu!" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1233,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1230,
          columnNumber: 13
        }, this) : cart.map(
          (item) => /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-start gap-4", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("h4", { className: "font-extrabold text-sm text-slate-100", children: item.product.name }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1240,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-brand-yellow text-xs font-bold font-mono mt-1", children: [
                  "$",
                  item.product.price.toFixed(2),
                  " each"
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1241,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1239,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-center bg-slate-900 border border-slate-800 rounded-full px-2.5 py-1", children: [
                /* @__PURE__ */ jsxDEV("button", { onClick: () => adjustQuantity(item.product.id, -1), className: "text-slate-400 hover:text-white p-1", children: /* @__PURE__ */ jsxDEV(Minus, { className: "w-3.5 h-3.5" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1247,
                  columnNumber: 27
                }, this) }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1246,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-slate-100 text-xs font-bold px-2", children: item.quantity }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1249,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("button", { onClick: () => adjustQuantity(item.product.id, 1), className: "text-slate-400 hover:text-white p-1", children: /* @__PURE__ */ jsxDEV(Plus, { className: "w-3.5 h-3.5" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1251,
                  columnNumber: 27
                }, this) }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1250,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1245,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1238,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                placeholder: "Special instructions (e.g. no onions)...",
                value: item.specialInstructions,
                onChange: (e) => addSpecialInstruction(item.product.id, e.target.value),
                className: "bg-slate-900 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-yellow"
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1257,
                columnNumber: 21
              },
              this
            )
          ] }, item.product.id, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1237,
            columnNumber: 13
          }, this)
        ) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1228,
          columnNumber: 13
        }, this),
        cart.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "p-5 border-t border-slate-800 bg-slate-950/40 space-y-4", children: [
          appliedCoupon && /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center bg-brand-yellow/5 border border-brand-yellow/20 px-3 py-2 rounded-xl text-xs", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-brand-yellow font-black", children: [
              "Coupon Applied: ",
              appliedCoupon.code
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1275,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("button", { onClick: () => setAppliedCoupon(null), className: "text-slate-400 hover:text-rose-400 font-bold", children: "Remove" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1276,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1274,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-2 text-xs", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-slate-400", children: [
              /* @__PURE__ */ jsxDEV("span", { children: "Subtotal" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1283,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: [
                "$",
                getSubtotal().toFixed(2)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1284,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1282,
              columnNumber: 19
            }, this),
            getDiscountAmount() > 0 && /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-brand-pink font-bold", children: [
              /* @__PURE__ */ jsxDEV("span", { children: "Discount" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1288,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: [
                "-$",
                getDiscountAmount().toFixed(2)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1289,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1287,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-slate-400", children: [
              /* @__PURE__ */ jsxDEV("span", { children: "GST / Sales Tax (13%)" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1293,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: [
                "$",
                getTax().toFixed(2)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1294,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1292,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-slate-400", children: [
              /* @__PURE__ */ jsxDEV("span", { children: "Delivery Fee" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1297,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: getDeliveryFee() === 0 ? "FREE" : `$${getDeliveryFee().toFixed(2)}` }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1298,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1296,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-base font-black text-white pt-2 border-t border-slate-800", children: [
              /* @__PURE__ */ jsxDEV("span", { children: "Grand Total" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1301,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: [
                "$",
                getGrandTotal().toFixed(2)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1302,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1300,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1281,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => {
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              },
              className: "w-full bg-brand-yellow hover:bg-brand-yellowHover text-brand-dark font-black py-4 rounded-xl text-sm transition tracking-wider uppercase transform active:scale-95 text-center flex justify-center items-center gap-2",
              children: [
                "Checkout Now ",
                /* @__PURE__ */ jsxDEV(ArrowRight, { className: "w-4 h-4" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                  lineNumber: 1313,
                  columnNumber: 32
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1306,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1271,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 1211,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
      lineNumber: 1207,
      columnNumber: 7
    }, this),
    isCheckoutOpen && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-[110] flex items-center justify-center px-4 bg-brand-dark/80 backdrop-blur-sm overflow-y-auto", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative p-6 sm:p-8", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setIsCheckoutOpen(false),
          className: "absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800",
          children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1329,
            columnNumber: 15
          }, this)
        },
        void 0,
        false,
        {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1325,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("h3", { className: "text-2xl font-black text-white mb-6", children: "Complete Your Order" }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 1332,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("form", { onSubmit: handlePlaceOrder, className: "space-y-4", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-3 gap-2", children: ["DELIVERY", "DINEIN", "PICKUP"].map(
          (type) => /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              onClick: () => setDeliveryType(type),
              className: `py-2 text-xs font-black rounded-lg border transition ${deliveryType === type ? "bg-brand-yellow text-brand-dark border-brand-yellow" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"}`,
              children: type
            },
            type,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1338,
              columnNumber: 15
            },
            this
          )
        ) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1336,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-[10px] font-black tracking-widest text-slate-400 uppercase", children: "Customer Name" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1355,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              placeholder: "e.g. John Doe",
              value: customerName,
              onChange: (e) => setCustomerName(e.target.value),
              className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow",
              required: true
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1356,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1354,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-[10px] font-black tracking-widest text-slate-400 uppercase", children: "Contact Phone" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1367,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "tel",
              placeholder: "e.g. +1 (555) 123-4567",
              value: customerPhone,
              onChange: (e) => setCustomerPhone(e.target.value),
              className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow",
              required: true
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1368,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1366,
          columnNumber: 15
        }, this),
        deliveryType === "DELIVERY" ? /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 animate-fade-in", children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-[10px] font-black tracking-widest text-slate-400 uppercase", children: "Delivery Address" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1380,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV(
            "textarea",
            {
              rows: 2,
              placeholder: "Enter absolute drop-off street details...",
              value: customerAddress,
              onChange: (e) => setCustomerAddress(e.target.value),
              className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow resize-none",
              required: true
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1381,
              columnNumber: 19
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1379,
          columnNumber: 13
        }, this) : /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 animate-fade-in", children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-[10px] font-black tracking-widest text-slate-400 uppercase", children: "Table Number / Note" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1392,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              placeholder: "e.g. Table #5 or Counter pickup",
              value: tableNumber,
              onChange: (e) => setTableNumber(e.target.value),
              className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow"
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1393,
              columnNumber: 19
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1391,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-[10px] font-black tracking-widest text-slate-400 uppercase", children: "Payment Method" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1405,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-2", children: [
            { key: "CASH", label: "Cash Payment" },
            { key: "CARD", label: "Credit Card" },
            { key: "COD", label: "Cash on Delivery" },
            { key: "WALLET", label: "Digital Wallet" }
          ].map(
            (method) => /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                onClick: () => setPaymentMethod(method.key),
                className: `py-3 text-xs font-bold rounded-xl border text-center transition ${paymentMethod === method.key ? "bg-brand-yellow text-brand-dark border-brand-yellow font-black" : "bg-slate-950 border-slate-800 text-slate-400"}`,
                children: method.label
              },
              method.key,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1413,
                columnNumber: 17
              },
              this
            )
          ) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1406,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1404,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-950/50 rounded-2xl p-4 border border-slate-800 text-xs space-y-1", children: /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-slate-400", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "Tax & Delivery Fee included" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1432,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-white", children: [
            "$",
            getGrandTotal().toFixed(2)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1433,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1431,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
          lineNumber: 1430,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "submit",
            disabled: isSubmittingOrder,
            className: "w-full bg-brand-yellow text-brand-dark hover:bg-brand-yellowHover font-black py-4 rounded-xl transition flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 transform hover:scale-[1.02] uppercase tracking-wider text-sm mt-4",
            children: isSubmittingOrder ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
              /* @__PURE__ */ jsxDEV(Loader2, { className: "w-5 h-5 animate-spin" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
                lineNumber: 1444,
                columnNumber: 21
              }, this),
              " Transmitting POS Order..."
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
              lineNumber: 1443,
              columnNumber: 15
            }, this) : "Place Order"
          },
          void 0,
          false,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
            lineNumber: 1437,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
        lineNumber: 1334,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
      lineNumber: 1324,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
      lineNumber: 1323,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx",
    lineNumber: 363,
    columnNumber: 5
  }, this);
}
_s(StitchLanding, "vAm/zMUkjEjid68ipS1bnPsG39Q=");
_c = StitchLanding;
var _c;
$RefreshReg$(_c, "StitchLanding");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/StitchLanding.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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QUFBLFFBRUE7QUFBQSxVQUFDO0FBQUE7QUFBQSxZQUNDLE1BQUs7QUFBQSxZQUNMLFVBQVVwRztBQUFBQSxZQUNWLFdBQVU7QUFBQSxZQUVUQSw4QkFDQyxtQ0FDRTtBQUFBLHFDQUFDLFdBQVEsV0FBVSwwQkFBbkI7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQkFBeUM7QUFBQSxjQUFHO0FBQUEsaUJBRDlDO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBRUEsSUFFQTtBQUFBO0FBQUEsVUFWSjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFZQTtBQUFBLFdBbkhGO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFvSEE7QUFBQSxTQTlIRjtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBK0hBLEtBaElGO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FpSUE7QUFBQSxPQWprQ0o7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQW9rQ0E7QUFFSjtBQUFDckQsR0F4NEN1QmhCLGVBQWE7QUFBQSxLQUFiQTtBQUFhLElBQUE2TztBQUFBLGFBQUFBLElBQUEiLCJuYW1lcyI6WyJ1c2VTdGF0ZSIsInVzZUVmZmVjdCIsIlNlYXJjaCIsIlVzZXIiLCJNYXBQaW4iLCJTaG9wcGluZ0NhcnQiLCJBcnJvd1JpZ2h0IiwiQ2hldnJvbkxlZnQiLCJDaGV2cm9uUmlnaHQiLCJQbHVzIiwiTWludXMiLCJTZW5kIiwiTG9hZGVyMiIsIlgiLCJQZXJjZW50IiwiUGhvbmUiLCJNYWlsIiwiR2xvYmUiLCJTaGFyZTIiLCJTaGllbGQiLCJTcGFya2xlcyIsIkNsb2NrIiwiQ2hlY2tDaXJjbGUyIiwiQWxlcnRDaXJjbGUiLCJTaG9wcGluZ0JhZyIsIlN0aXRjaExhbmRpbmciLCJzdG9yZUlkIiwic3RvcmVOYW1lIiwic3RvcmVzIiwiZm9vZEl0ZW1zIiwiY2FydCIsImdsb2JhbENhcnQiLCJvbkFkZFRvQ2FydCIsImdsb2JhbEFkZFRvQ2FydCIsIm9uUmVtb3ZlRnJvbUNhcnQiLCJvbkRlY3JlYXNlUXVhbnRpdHkiLCJvbkluY3JlYXNlUXVhbnRpdHkiLCJvbkNsZWFyQ2FydCIsImJhbm5lcnMiLCJjYW1wYWlnbnMiLCJvbkNoYW5nZUJyYW5jaCIsIl9zIiwiQkFDS0VORF9VUkwiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhvc3RuYW1lIiwiUFJPRFVDVFMiLCJtYXAiLCJmaSIsImlkIiwic3RvcmVfaWQiLCJuYW1lIiwicHJpY2UiLCJwcmljZVVTRCIsInByaWNlUnMiLCJpc19hY3RpdmUiLCJpbWFnZV91cmwiLCJpbWFnZSIsInN0YXJ0c1dpdGgiLCJjYXRlZ29yeSIsImRlc2NyaXB0aW9uIiwiQ0FURUdPUklFUyIsIkFycmF5IiwiZnJvbSIsIlNldCIsInAiLCJzZWxlY3RlZExvY2F0aW9uIiwic2V0U2VsZWN0ZWRMb2NhdGlvbiIsImNpdHkiLCJicmFuY2giLCJhY3RpdmVUYWIiLCJzZXRBY3RpdmVUYWIiLCJzZWxlY3RlZENpdHkiLCJzZXRTZWxlY3RlZENpdHkiLCJzZWxlY3RlZEJyYW5jaCIsInNldFNlbGVjdGVkQnJhbmNoIiwic2V0Q2FydCIsImlzQ2FydE9wZW4iLCJzZXRJc0NhcnRPcGVuIiwiYXBwbGllZENvdXBvbiIsInNldEFwcGxpZWRDb3Vwb24iLCJhY3RpdmVDYXRlZ29yeSIsInNldEFjdGl2ZUNhdGVnb3J5Iiwic2VhcmNoUXVlcnkiLCJzZXRTZWFyY2hRdWVyeSIsImxlbmd0aCIsImN1cnJlbnRCYW5uZXJJbmRleCIsInNldEN1cnJlbnRCYW5uZXJJbmRleCIsImludGVydmFsIiwic2V0SW50ZXJ2YWwiLCJwcmV2IiwiY2xlYXJJbnRlcnZhbCIsImlzQ2hlY2tvdXRPcGVuIiwic2V0SXNDaGVja291dE9wZW4iLCJpc1N1Ym1pdHRpbmdPcmRlciIsInNldElzU3VibWl0dGluZ09yZGVyIiwib3JkZXJUcmFja2luZyIsInNldE9yZGVyVHJhY2tpbmciLCJjdXN0b21lck5hbWUiLCJzZXRDdXN0b21lck5hbWUiLCJjdXN0b21lclBob25lIiwic2V0Q3VzdG9tZXJQaG9uZSIsImN1c3RvbWVyQWRkcmVzcyIsInNldEN1c3RvbWVyQWRkcmVzcyIsInBheW1lbnRNZXRob2QiLCJzZXRQYXltZW50TWV0aG9kIiwidGFibGVOdW1iZXIiLCJzZXRUYWJsZU51bWJlciIsImRlbGl2ZXJ5VHlwZSIsInNldERlbGl2ZXJ5VHlwZSIsImxveWFsdHlQaG9uZSIsInNldExveWFsdHlQaG9uZSIsImxveWFsdHlBY2NvdW50Iiwic2V0TG95YWx0eUFjY291bnQiLCJpc0xveWFsdHlTZWFyY2hpbmciLCJzZXRJc0xveWFsdHlTZWFyY2hpbmciLCJyZWRlZW1lZFBvaW50c0Rpc2NvdW50Iiwic2V0UmVkZWVtZWRQb2ludHNEaXNjb3VudCIsInRvYXN0Iiwic2V0VG9hc3QiLCJjb250YWN0TmFtZSIsInNldENvbnRhY3ROYW1lIiwiY29udGFjdEVtYWlsIiwic2V0Q29udGFjdEVtYWlsIiwiY29udGFjdFN1YmplY3QiLCJzZXRDb250YWN0U3ViamVjdCIsImNvbnRhY3RNZXNzYWdlIiwic2V0Q29udGFjdE1lc3NhZ2UiLCJpc1NlbmRpbmdNZXNzYWdlIiwic2V0SXNTZW5kaW5nTWVzc2FnZSIsInRyaWdnZXJUb2FzdCIsIm1lc3NhZ2UiLCJ0eXBlIiwic2V0VGltZW91dCIsIkJSQU5DSEVTX0JZX0NJVFkiLCJDT1VQT05TIiwiY29kZSIsImRpc2NvdW50UGVyY2VudCIsInNhdmVkQ2FydCIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJKU09OIiwicGFyc2UiLCJlIiwiY29uc29sZSIsImVycm9yIiwidXBkYXRlQ2FydCIsIm5ld0NhcnQiLCJzZXRJdGVtIiwic3RyaW5naWZ5IiwiYWRkVG9DYXJ0IiwicHJvZHVjdCIsImV4aXN0aW5nSW5kZXgiLCJmaW5kSW5kZXgiLCJpdGVtIiwidXBkYXRlZCIsInF1YW50aXR5Iiwic3BlY2lhbEluc3RydWN0aW9ucyIsImFkanVzdFF1YW50aXR5IiwicHJvZHVjdElkIiwiZGVsdGEiLCJuZXdRdHkiLCJmaWx0ZXIiLCJhZGRTcGVjaWFsSW5zdHJ1Y3Rpb24iLCJpbnN0cnVjdGlvbiIsImFwcGx5Q291cG9uIiwiY291cG9uIiwiZ2V0U3VidG90YWwiLCJyZWR1Y2UiLCJzdW0iLCJnZXREaXNjb3VudEFtb3VudCIsInN1YnRvdGFsIiwiZGlzY291bnQiLCJNYXRoIiwibWluIiwiZ2V0VGF4IiwidGF4YWJsZVN1YnRvdGFsIiwibWF4IiwiZ2V0RGVsaXZlcnlGZWUiLCJnZXRHcmFuZFRvdGFsIiwiaGFuZGxlTG9jYXRpb25TdWJtaXQiLCJwcmV2ZW50RGVmYXVsdCIsInRvVXBwZXJDYXNlIiwiaGFuZGxlQ29udGFjdFN1Ym1pdCIsImhhbmRsZUxveWFsdHlTZWFyY2giLCJlbmRzV2l0aCIsInBvaW50cyIsImZsb29yIiwicmFuZG9tIiwidGllciIsImhhbmRsZVJlZGVlbVBvaW50cyIsInBvaW50c1RvUmVkZWVtIiwiYWN0dWFsUG9pbnRzUmVkZWVtZWQiLCJ2YWx1ZSIsInRvRml4ZWQiLCJoYW5kbGVQbGFjZU9yZGVyIiwicGF5bG9hZCIsImN1c3RvbWVyIiwiaXRlbXMiLCJjIiwicXR5IiwidG90YWxBbW91bnQiLCJzb3VyY2UiLCJub3RlcyIsImZldGNoIiwibWV0aG9kIiwiaGVhZGVycyIsImJvZHkiLCJ0aGVuIiwicmVzIiwianNvbiIsImRhdGEiLCJ0cmFja2luZ0lkIiwib3JkZXIiLCJ0b1N0cmluZyIsInN0YXR1cyIsImV0YSIsImNhdGNoIiwiZmlsdGVyZWRQcm9kdWN0cyIsInByb2QiLCJtYXRjaGVzQ2F0ZWdvcnkiLCJtYXRjaGVzU2VhcmNoIiwidG9Mb3dlckNhc2UiLCJpbmNsdWRlcyIsInRpdGxlIiwiaW1hZ2VVcmwiLCJzcGxpdCIsInNsaWNlIiwiam9pbiIsInN1YnRpdGxlIiwibGlua1VybCIsImhyZWYiLCJzZWN0aW9uIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsInNjcm9sbEludG9WaWV3IiwiYmVoYXZpb3IiLCJidXR0b25UZXh0IiwiXyIsImlkeCIsImNvbnRhaW5lciIsInNjcm9sbEJ5IiwibGVmdCIsImNhbXBhaWduIiwiZGlzY291bnRfcGN0IiwidGFyZ2V0Iiwic3JjIiwic2V0dGluZ3MiLCJhZGRyZXNzIiwiY29udGFjdFBob25lIiwic2l0ZVRpdGxlIiwiYWJvdXRUZXh0IiwiZmFjZWJvb2tVcmwiLCJpbnN0YWdyYW1VcmwiLCJ0d2l0dGVyVXJsIiwieW91dHViZVVybCIsImNvbXBhbnlUZXh0IiwiZW1haWwiLCJlcnIiLCJiIiwia2V5IiwibGFiZWwiLCJfYyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJTdGl0Y2hMYW5kaW5nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgXHJcbiAgU2VhcmNoLCBVc2VyLCBNYXBQaW4sIFNob3BwaW5nQ2FydCwgQXJyb3dSaWdodCwgQ2hldnJvbkxlZnQsIENoZXZyb25SaWdodCwgXHJcbiAgUGx1cywgTWludXMsIFNlbmQsIENoZWNrLCBMb2FkZXIyLCBYLCBQZXJjZW50LCBQaG9uZSwgTWFpbCwgR2xvYmUsIFxyXG4gIFNoYXJlMiwgU2hpZWxkLCBTcGFya2xlcywgQ2xvY2ssIENoZWNrQ2lyY2xlMiwgQWxlcnRDaXJjbGUsIFNob3BwaW5nQmFnXHJcbn0gZnJvbSAnbHVjaWRlLXJlYWN0JztcclxuXHJcbi8vIFByb2R1Y3QgSW50ZXJmYWNlIG1hdGNoaW5nIFByaXNtYSBzY2hlbWEgZ3VpZGVsaW5lc1xyXG5leHBvcnQgaW50ZXJmYWNlIFByb2R1Y3Qge1xyXG4gIGlkOiBudW1iZXI7XHJcbiAgc3RvcmVfaWQ6IG51bWJlcjtcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgcHJpY2U6IG51bWJlcjtcclxuICBpc19hY3RpdmU6IGJvb2xlYW47XHJcbiAgaW1hZ2VfdXJsPzogc3RyaW5nO1xyXG4gIGNhdGVnb3J5OiBzdHJpbmc7XHJcbiAgZGVzY3JpcHRpb246IHN0cmluZztcclxufVxyXG5cclxuLy8gQ2F0ZWdvcnkgc3RydWN0dXJlXHJcblxyXG5cclxuLy8gUHJlZGVmaW5lZCBwcm9kdWN0IGRhdGEgbWF0Y2hpbmcgbW9ja3VwIGltYWdlcyBhbmQgdGl0bGVzXHJcblxyXG4vLyBDYXJ0IEl0ZW0gaW50ZXJmYWNlXHJcbmludGVyZmFjZSBDYXJ0SXRlbSB7XHJcbiAgcHJvZHVjdDogUHJvZHVjdDtcclxuICBxdWFudGl0eTogbnVtYmVyO1xyXG4gIHNwZWNpYWxJbnN0cnVjdGlvbnM6IHN0cmluZztcclxufVxyXG5cclxuLy8gU3BlY2lhbCBPZmZlciBpbnRlcmZhY2VcclxuaW50ZXJmYWNlIENvdXBvbiB7XHJcbiAgY29kZTogc3RyaW5nO1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBkaXNjb3VudFBlcmNlbnQ6IG51bWJlcjtcclxuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gU3RpdGNoTGFuZGluZyh7IFxyXG4gIHN0b3JlSWQsIHN0b3JlTmFtZSwgc3RvcmVzLCBmb29kSXRlbXMsIGNhcnQ6IGdsb2JhbENhcnQsIG9uQWRkVG9DYXJ0OiBnbG9iYWxBZGRUb0NhcnQsIFxyXG4gIG9uUmVtb3ZlRnJvbUNhcnQsIG9uRGVjcmVhc2VRdWFudGl0eSwgb25JbmNyZWFzZVF1YW50aXR5LCBvbkNsZWFyQ2FydCwgXHJcbiAgYmFubmVycywgY2FtcGFpZ25zLCBvbkNoYW5nZUJyYW5jaFxyXG59OiBhbnkpIHtcclxuICBjb25zdCBCQUNLRU5EX1VSTCA9ICdodHRwOi8vJyArICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSA6ICdsb2NhbGhvc3QnKSArICc6MzAwMSc7XHJcbiAgXHJcbiAgY29uc3QgUFJPRFVDVFMgPSAoZm9vZEl0ZW1zIHx8IFtdKS5tYXAoKGZpOiBhbnkpID0+ICh7XHJcbiAgICBpZDogZmkuaWQsXHJcbiAgICBzdG9yZV9pZDogc3RvcmVJZCB8fCAxLFxyXG4gICAgbmFtZTogZmkubmFtZSxcclxuICAgIHByaWNlOiBmaS5wcmljZVVTRCB8fCBmaS5wcmljZVJzLFxyXG4gICAgcHJpY2VSczogZmkucHJpY2VScyxcclxuICAgIGlzX2FjdGl2ZTogdHJ1ZSxcclxuICAgIGltYWdlX3VybDogZmkuaW1hZ2UgJiYgZmkuaW1hZ2Uuc3RhcnRzV2l0aCgnaHR0cCcpID8gZmkuaW1hZ2UgOiBgJHtCQUNLRU5EX1VSTH0ke2ZpLmltYWdlfWAsXHJcbiAgICBjYXRlZ29yeTogZmkuY2F0ZWdvcnksXHJcbiAgICBkZXNjcmlwdGlvbjogZmkuZGVzY3JpcHRpb25cclxuICB9KSk7XHJcblxyXG4gIGNvbnN0IENBVEVHT1JJRVM6IHN0cmluZ1tdID0gQXJyYXkuZnJvbShuZXcgU2V0KFBST0RVQ1RTLm1hcCgocDogYW55KSA9PiBwLmNhdGVnb3J5IGFzIHN0cmluZykpKTtcclxuXHJcbiAgLy8gTmF2aWdhdGlvbiAmIExvY2F0aW9uIHN0YXRlcyDigJQgcHJlLXNldCB0byB0aGUgY2hvc2VuIHN0b3JlXHJcbiAgY29uc3QgW3NlbGVjdGVkTG9jYXRpb24sIHNldFNlbGVjdGVkTG9jYXRpb25dID0gdXNlU3RhdGU8eyBjaXR5OiBzdHJpbmc7IGJyYW5jaDogc3RyaW5nIH0gfCBudWxsPihcclxuICAgIHN0b3JlTmFtZSA/IHsgY2l0eTogJycsIGJyYW5jaDogc3RvcmVOYW1lIH0gOiBudWxsXHJcbiAgKTtcclxuICBjb25zdCBbYWN0aXZlVGFiLCBzZXRBY3RpdmVUYWJdID0gdXNlU3RhdGU8J2hvbWUnIHwgJ3Jld2FyZHMnIHwgJ3N1cHBvcnQnPignaG9tZScpO1xyXG4gIFxyXG4gIC8vIERpYWxvZyAvIFNlbGVjdGlvbiBzdGF0ZXMgaW5zaWRlIExvY2F0aW9uIE1vZGFsXHJcbiAgY29uc3QgW3NlbGVjdGVkQ2l0eSwgc2V0U2VsZWN0ZWRDaXR5XSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xyXG4gIGNvbnN0IFtzZWxlY3RlZEJyYW5jaCwgc2V0U2VsZWN0ZWRCcmFuY2hdID0gdXNlU3RhdGU8c3RyaW5nPignJyk7XHJcblxyXG4gIC8vIENhcnQgU3RhdGVzXHJcbiAgY29uc3QgW2NhcnQsIHNldENhcnRdID0gdXNlU3RhdGU8Q2FydEl0ZW1bXT4oW10pO1xyXG4gIGNvbnN0IFtpc0NhcnRPcGVuLCBzZXRJc0NhcnRPcGVuXSA9IHVzZVN0YXRlPGJvb2xlYW4+KGZhbHNlKTtcclxuICBjb25zdCBbYXBwbGllZENvdXBvbiwgc2V0QXBwbGllZENvdXBvbl0gPSB1c2VTdGF0ZTxDb3Vwb24gfCBudWxsPihudWxsKTtcclxuICBcclxuICAvLyBEeW5hbWljIG1lbnUgZmlsdGVyaW5nXHJcbiAgY29uc3QgW2FjdGl2ZUNhdGVnb3J5LCBzZXRBY3RpdmVDYXRlZ29yeV0gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKTtcclxuICBjb25zdCBbc2VhcmNoUXVlcnksIHNldFNlYXJjaFF1ZXJ5XSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xyXG5cclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgaWYgKENBVEVHT1JJRVMubGVuZ3RoID4gMCAmJiAhYWN0aXZlQ2F0ZWdvcnkpIHtcclxuICAgICAgc2V0QWN0aXZlQ2F0ZWdvcnkoQ0FURUdPUklFU1swXSk7XHJcbiAgICB9XHJcbiAgfSwgW0NBVEVHT1JJRVMsIGFjdGl2ZUNhdGVnb3J5XSk7XHJcblxyXG4gIC8vIEJhbm5lciBTbGlkZXIgU3RhdGVcclxuICBjb25zdCBbY3VycmVudEJhbm5lckluZGV4LCBzZXRDdXJyZW50QmFubmVySW5kZXhdID0gdXNlU3RhdGUoMCk7XHJcblxyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICBpZiAoIWJhbm5lcnMgfHwgYmFubmVycy5sZW5ndGggPD0gMSkgcmV0dXJuO1xyXG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgIHNldEN1cnJlbnRCYW5uZXJJbmRleChwcmV2ID0+IChwcmV2ICsgMSkgJSBiYW5uZXJzLmxlbmd0aCk7XHJcbiAgICB9LCA1MDAwKTtcclxuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKGludGVydmFsKTtcclxuICB9LCBbYmFubmVyc10pO1xyXG4gIFxyXG4gIC8vIENoZWNrb3V0IFN0YXRlc1xyXG4gIGNvbnN0IFtpc0NoZWNrb3V0T3Blbiwgc2V0SXNDaGVja291dE9wZW5dID0gdXNlU3RhdGU8Ym9vbGVhbj4oZmFsc2UpO1xyXG4gIGNvbnN0IFtpc1N1Ym1pdHRpbmdPcmRlciwgc2V0SXNTdWJtaXR0aW5nT3JkZXJdID0gdXNlU3RhdGU8Ym9vbGVhbj4oZmFsc2UpO1xyXG4gIGNvbnN0IFtvcmRlclRyYWNraW5nLCBzZXRPcmRlclRyYWNraW5nXSA9IHVzZVN0YXRlPHsgaWQ6IHN0cmluZzsgc3RhdHVzOiBzdHJpbmc7IGV0YTogbnVtYmVyIH0gfCBudWxsPihudWxsKTtcclxuICBjb25zdCBbY3VzdG9tZXJOYW1lLCBzZXRDdXN0b21lck5hbWVdID0gdXNlU3RhdGU8c3RyaW5nPignJyk7XHJcbiAgY29uc3QgW2N1c3RvbWVyUGhvbmUsIHNldEN1c3RvbWVyUGhvbmVdID0gdXNlU3RhdGU8c3RyaW5nPignJyk7XHJcbiAgY29uc3QgW2N1c3RvbWVyQWRkcmVzcywgc2V0Q3VzdG9tZXJBZGRyZXNzXSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xyXG4gIGNvbnN0IFtwYXltZW50TWV0aG9kLCBzZXRQYXltZW50TWV0aG9kXSA9IHVzZVN0YXRlPCdDQVNIJyB8ICdDQVJEJyB8ICdDT0QnIHwgJ1dBTExFVCc+KCdDQVNIJyk7XHJcbiAgY29uc3QgW3RhYmxlTnVtYmVyLCBzZXRUYWJsZU51bWJlcl0gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKTtcclxuICBjb25zdCBbZGVsaXZlcnlUeXBlLCBzZXREZWxpdmVyeVR5cGVdID0gdXNlU3RhdGU8J0RFTElWRVJZJyB8ICdESU5FSU4nIHwgJ1BJQ0tVUCc+KCdERUxJVkVSWScpO1xyXG5cclxuICAvLyBJbnRlcmFjdGl2ZSBMb3lhbHR5IHN0YXRlIChSZXdhcmRzIFBhZ2UpXHJcbiAgY29uc3QgW2xveWFsdHlQaG9uZSwgc2V0TG95YWx0eVBob25lXSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xyXG4gIGNvbnN0IFtsb3lhbHR5QWNjb3VudCwgc2V0TG95YWx0eUFjY291bnRdID0gdXNlU3RhdGU8eyBuYW1lOiBzdHJpbmc7IHBvaW50czogbnVtYmVyOyB0aWVyOiBzdHJpbmcgfSB8IG51bGw+KG51bGwpO1xyXG4gIGNvbnN0IFtpc0xveWFsdHlTZWFyY2hpbmcsIHNldElzTG95YWx0eVNlYXJjaGluZ10gPSB1c2VTdGF0ZTxib29sZWFuPihmYWxzZSk7XHJcbiAgY29uc3QgW3JlZGVlbWVkUG9pbnRzRGlzY291bnQsIHNldFJlZGVlbWVkUG9pbnRzRGlzY291bnRdID0gdXNlU3RhdGU8bnVtYmVyPigwKTtcclxuXHJcbiAgLy8gVG9hc3QgLyBTdGF0dXMgU3lzdGVtIChTdGFuZGFyZCBjdXN0b20gYWxlcnRzIG1hbmRhdGVkKVxyXG4gIGNvbnN0IFt0b2FzdCwgc2V0VG9hc3RdID0gdXNlU3RhdGU8eyBtZXNzYWdlOiBzdHJpbmc7IHR5cGU6ICdzdWNjZXNzJyB8ICdlcnJvcicgfCAnaW5mbycgfSB8IG51bGw+KG51bGwpO1xyXG5cclxuICAvLyBDb250YWN0IEZvcm0gc3RhdGVzXHJcbiAgY29uc3QgW2NvbnRhY3ROYW1lLCBzZXRDb250YWN0TmFtZV0gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKTtcclxuICBjb25zdCBbY29udGFjdEVtYWlsLCBzZXRDb250YWN0RW1haWxdID0gdXNlU3RhdGU8c3RyaW5nPignJyk7XHJcbiAgY29uc3QgW2NvbnRhY3RTdWJqZWN0LCBzZXRDb250YWN0U3ViamVjdF0gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKTtcclxuICBjb25zdCBbY29udGFjdE1lc3NhZ2UsIHNldENvbnRhY3RNZXNzYWdlXSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xyXG4gIGNvbnN0IFtpc1NlbmRpbmdNZXNzYWdlLCBzZXRJc1NlbmRpbmdNZXNzYWdlXSA9IHVzZVN0YXRlPGJvb2xlYW4+KGZhbHNlKTtcclxuXHJcbiAgLy8gSGVscGVyIHRvIHNob3cgY3VzdG9tIG5vdGlmaWNhdGlvbiBhbGVydHMgc2FmZWx5IChObyB3aW5kb3cuYWxlcnQgYWxsb3dlZClcclxuICBjb25zdCB0cmlnZ2VyVG9hc3QgPSAobWVzc2FnZTogc3RyaW5nLCB0eXBlOiAnc3VjY2VzcycgfCAnZXJyb3InIHwgJ2luZm8nID0gJ3N1Y2Nlc3MnKSA9PiB7XHJcbiAgICBzZXRUb2FzdCh7IG1lc3NhZ2UsIHR5cGUgfSk7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHNldFRvYXN0KG51bGwpLCA0MDAwKTtcclxuICB9O1xyXG5cclxuICAvLyBCcmFuY2ggbWFwcGluZyBwZXIgY2l0eVxyXG4gIGNvbnN0IEJSQU5DSEVTX0JZX0NJVFk6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHtcclxuICAgICdrYXJhY2hpJzogWydOb3J0aCBOYXppbWFiYWQnLCAnR3Vsc2hhbi1lLUlxYmFsJywgJ0RIQSBQaGFzZSA2J10sXHJcbiAgICAnbGFob3JlJzogWydHdWxiZXJnIElJSScsICdESEEgUGhhc2UgNScsICdKb2hhciBUb3duJ10sXHJcbiAgICAnaXNsYW1hYmFkJzogWydGLTYgTWFya2F6JywgJ0NlbnRhdXJ1cyBNYWxsJywgJ0ctMTEnXVxyXG4gIH07XHJcblxyXG4gIC8vIFByZWRlZmluZWQgaW50ZXJhY3RpdmUgY291cG9uc1xyXG4gIGNvbnN0IENPVVBPTlM6IENvdXBvbltdID0gW1xyXG4gICAgeyBjb2RlOiBcIklNU0EzMFwiLCBuYW1lOiBcIklNU0EgMzAlIE9GRlwiLCBkaXNjb3VudFBlcmNlbnQ6IDMwLCBkZXNjcmlwdGlvbjogXCJJTVNBIHNwZWNpYWwgZmxhdCAzMCUgZGlzY291bnRcIiB9LFxyXG4gICAgeyBjb2RlOiBcIkRSSU5LUzEwXCIsIG5hbWU6IFwiW0FVVE9dIERyaW5rcyBEaXNjb3VudFwiLCBkaXNjb3VudFBlcmNlbnQ6IDEwLCBkZXNjcmlwdGlvbjogXCJBdXRvbWF0aWNhbGx5IHNjaGVkdWxlZCBkaXNjb3VudCBvZiAxMCVcIiB9LFxyXG4gICAgeyBjb2RlOiBcIkdVRVNUMTVcIiwgbmFtZTogXCJGUkVTSCAxNSUgT0ZGXCIsIGRpc2NvdW50UGVyY2VudDogMTUsIGRlc2NyaXB0aW9uOiBcIldlbGNvbWUgZ3Vlc3QgZGlzY291bnQgb2YgMTUlXCIgfVxyXG4gIF07XHJcblxyXG4gIC8vIExvYWQgY2FydCBmcm9tIGxvY2FsIHN0b3JhZ2UgaWYgYXZhaWxhYmxlXHJcbiAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGNvbnN0IHNhdmVkQ2FydCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdkNHVfY2FydCcpO1xyXG4gICAgaWYgKHNhdmVkQ2FydCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHNldENhcnQoSlNPTi5wYXJzZShzYXZlZENhcnQpKTtcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gcGFyc2UgY2FydCBmcm9tIHN0b3JhZ2VcIiwgZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LCBbXSk7XHJcblxyXG4gIC8vIFVwZGF0ZSBsb2NhbFN0b3JhZ2Ugd2hlbiBjYXJ0IGNoYW5nZXNcclxuICBjb25zdCB1cGRhdGVDYXJ0ID0gKG5ld0NhcnQ6IENhcnRJdGVtW10pID0+IHtcclxuICAgIHNldENhcnQobmV3Q2FydCk7XHJcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnZDR1X2NhcnQnLCBKU09OLnN0cmluZ2lmeShuZXdDYXJ0KSk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgYWRkVG9DYXJ0ID0gKHByb2R1Y3Q6IFByb2R1Y3QpID0+IHtcclxuICAgIGNvbnN0IGV4aXN0aW5nSW5kZXggPSBjYXJ0LmZpbmRJbmRleChpdGVtID0+IGl0ZW0ucHJvZHVjdC5pZCA9PT0gcHJvZHVjdC5pZCk7XHJcbiAgICBpZiAoZXhpc3RpbmdJbmRleCA+IC0xKSB7XHJcbiAgICAgIGNvbnN0IHVwZGF0ZWQgPSBbLi4uY2FydF07XHJcbiAgICAgIHVwZGF0ZWRbZXhpc3RpbmdJbmRleF0ucXVhbnRpdHkgKz0gMTtcclxuICAgICAgdXBkYXRlQ2FydCh1cGRhdGVkKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHVwZGF0ZUNhcnQoWy4uLmNhcnQsIHsgcHJvZHVjdCwgcXVhbnRpdHk6IDEsIHNwZWNpYWxJbnN0cnVjdGlvbnM6ICcnIH1dKTtcclxuICAgIH1cclxuICAgIHRyaWdnZXJUb2FzdChgQWRkZWQgJHtwcm9kdWN0Lm5hbWV9IHRvIGNhcnQhYCk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgYWRqdXN0UXVhbnRpdHkgPSAocHJvZHVjdElkOiBudW1iZXIsIGRlbHRhOiBudW1iZXIpID0+IHtcclxuICAgIGNvbnN0IHVwZGF0ZWQgPSBjYXJ0Lm1hcChpdGVtID0+IHtcclxuICAgICAgaWYgKGl0ZW0ucHJvZHVjdC5pZCA9PT0gcHJvZHVjdElkKSB7XHJcbiAgICAgICAgY29uc3QgbmV3UXR5ID0gaXRlbS5xdWFudGl0eSArIGRlbHRhO1xyXG4gICAgICAgIHJldHVybiB7IC4uLml0ZW0sIHF1YW50aXR5OiBuZXdRdHkgfTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gaXRlbTtcclxuICAgIH0pLmZpbHRlcihpdGVtID0+IGl0ZW0ucXVhbnRpdHkgPiAwKTtcclxuICAgIHVwZGF0ZUNhcnQodXBkYXRlZCk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgYWRkU3BlY2lhbEluc3RydWN0aW9uID0gKHByb2R1Y3RJZDogbnVtYmVyLCBpbnN0cnVjdGlvbjogc3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCB1cGRhdGVkID0gY2FydC5tYXAoaXRlbSA9PiB7XHJcbiAgICAgIGlmIChpdGVtLnByb2R1Y3QuaWQgPT09IHByb2R1Y3RJZCkge1xyXG4gICAgICAgIHJldHVybiB7IC4uLml0ZW0sIHNwZWNpYWxJbnN0cnVjdGlvbnM6IGluc3RydWN0aW9uIH07XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICB9KTtcclxuICAgIHVwZGF0ZUNhcnQodXBkYXRlZCk7XHJcbiAgfTtcclxuXHJcbiAgLy8gQ291cG9ucyB0cmlnZ2VyXHJcbiAgY29uc3QgYXBwbHlDb3Vwb24gPSAoY291cG9uOiBDb3Vwb24pID0+IHtcclxuICAgIHNldEFwcGxpZWRDb3Vwb24oY291cG9uKTtcclxuICAgIHRyaWdnZXJUb2FzdChgQ291cG9uICR7Y291cG9uLmNvZGV9IGFwcGxpZWQgc3VjY2Vzc2Z1bGx5IWAsICdzdWNjZXNzJyk7XHJcbiAgfTtcclxuXHJcbiAgLy8gQ2FydCBDYWxjdWxhdGlvbnNcclxuICBjb25zdCBnZXRTdWJ0b3RhbCA9ICgpID0+IHtcclxuICAgIHJldHVybiBjYXJ0LnJlZHVjZSgoc3VtLCBpdGVtKSA9PiBzdW0gKyAoaXRlbS5wcm9kdWN0LnByaWNlICogaXRlbS5xdWFudGl0eSksIDApO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGdldERpc2NvdW50QW1vdW50ID0gKCkgPT4ge1xyXG4gICAgY29uc3Qgc3VidG90YWwgPSBnZXRTdWJ0b3RhbCgpO1xyXG4gICAgbGV0IGRpc2NvdW50ID0gMDtcclxuICAgIGlmIChhcHBsaWVkQ291cG9uKSB7XHJcbiAgICAgIGRpc2NvdW50ICs9IHN1YnRvdGFsICogKGFwcGxpZWRDb3Vwb24uZGlzY291bnRQZXJjZW50IC8gMTAwKTtcclxuICAgIH1cclxuICAgIGRpc2NvdW50ICs9IHJlZGVlbWVkUG9pbnRzRGlzY291bnQ7XHJcbiAgICByZXR1cm4gTWF0aC5taW4oc3VidG90YWwsIGRpc2NvdW50KTtcclxuICB9O1xyXG5cclxuICBjb25zdCBnZXRUYXggPSAoKSA9PiB7XHJcbiAgICBjb25zdCB0YXhhYmxlU3VidG90YWwgPSBNYXRoLm1heCgwLCBnZXRTdWJ0b3RhbCgpIC0gZ2V0RGlzY291bnRBbW91bnQoKSk7XHJcbiAgICByZXR1cm4gdGF4YWJsZVN1YnRvdGFsICogMC4xMzsgLy8gMTMlIHRheCByYXRlXHJcbiAgfTtcclxuXHJcbiAgY29uc3QgZ2V0RGVsaXZlcnlGZWUgPSAoKSA9PiB7XHJcbiAgICBpZiAoZGVsaXZlcnlUeXBlICE9PSAnREVMSVZFUlknKSByZXR1cm4gMDtcclxuICAgIGNvbnN0IHN1YnRvdGFsID0gZ2V0U3VidG90YWwoKTtcclxuICAgIGlmIChzdWJ0b3RhbCA9PT0gMCkgcmV0dXJuIDA7XHJcbiAgICByZXR1cm4gc3VidG90YWwgPiAxNSA/IDAgOiAxLjUwOyAvLyBGcmVlIGRlbGl2ZXJ5IGZvciBvcmRlcnMgPiAkMTVcclxuICB9O1xyXG5cclxuICBjb25zdCBnZXRHcmFuZFRvdGFsID0gKCkgPT4ge1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KDAsIGdldFN1YnRvdGFsKCkgLSBnZXREaXNjb3VudEFtb3VudCgpICsgZ2V0VGF4KCkgKyBnZXREZWxpdmVyeUZlZSgpKTtcclxuICB9O1xyXG5cclxuICAvLyBMb2NhdGlvbiBzZWxlY3RvciBjb25maXJtYXRpb25cclxuICBjb25zdCBoYW5kbGVMb2NhdGlvblN1Ym1pdCA9IChlOiBSZWFjdC5Gb3JtRXZlbnQpID0+IHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGlmIChzZWxlY3RlZENpdHkgJiYgc2VsZWN0ZWRCcmFuY2gpIHtcclxuICAgICAgc2V0U2VsZWN0ZWRMb2NhdGlvbih7IGNpdHk6IHNlbGVjdGVkQ2l0eSwgYnJhbmNoOiBzZWxlY3RlZEJyYW5jaCB9KTtcclxuICAgICAgdHJpZ2dlclRvYXN0KGBMb2NhdGlvbiBzZXQgdG8gJHtzZWxlY3RlZENpdHkudG9VcHBlckNhc2UoKX0gLSAke3NlbGVjdGVkQnJhbmNofSFgLCAnc3VjY2VzcycpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8vIFN1cHBvcnQvQ29udGFjdCBmb3JtIHN1Ym1pdFxyXG4gIGNvbnN0IGhhbmRsZUNvbnRhY3RTdWJtaXQgPSAoZTogUmVhY3QuRm9ybUV2ZW50KSA9PiB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBpZiAoIWNvbnRhY3ROYW1lIHx8ICFjb250YWN0RW1haWwgfHwgIWNvbnRhY3RNZXNzYWdlKSB7XHJcbiAgICAgIHRyaWdnZXJUb2FzdChcIlBsZWFzZSBmaWxsIGluIGFsbCByZXF1aXJlZCBmaWVsZHMuXCIsIFwiZXJyb3JcIik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHNldElzU2VuZGluZ01lc3NhZ2UodHJ1ZSk7XHJcbiAgICAvLyBTaW11bGF0ZSBzZW5kaW5nIG1lc3NhZ2VcclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICBzZXRJc1NlbmRpbmdNZXNzYWdlKGZhbHNlKTtcclxuICAgICAgdHJpZ2dlclRvYXN0KFwiWW91ciBtZXNzYWdlIGhhcyBiZWVuIHNlbnQgc3VjY2Vzc2Z1bGx5ISBPdXIgc3VwcG9ydCB0ZWFtIHdpbGwgcmVhY2ggb3V0IHNob3J0bHkuXCIsIFwic3VjY2Vzc1wiKTtcclxuICAgICAgc2V0Q29udGFjdE5hbWUoJycpO1xyXG4gICAgICBzZXRDb250YWN0RW1haWwoJycpO1xyXG4gICAgICBzZXRDb250YWN0U3ViamVjdCgnJyk7XHJcbiAgICAgIHNldENvbnRhY3RNZXNzYWdlKCcnKTtcclxuICAgIH0sIDE1MDApO1xyXG4gIH07XHJcblxyXG4gIC8vIExveWFsdHkgUG9pbnRzIExvb2t1cCBzaW11bGF0aW9uXHJcbiAgY29uc3QgaGFuZGxlTG95YWx0eVNlYXJjaCA9IChlOiBSZWFjdC5Gb3JtRXZlbnQpID0+IHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGlmICghbG95YWx0eVBob25lIHx8IGxveWFsdHlQaG9uZS5sZW5ndGggPCA4KSB7XHJcbiAgICAgIHRyaWdnZXJUb2FzdChcIlBsZWFzZSBlbnRlciBhIHZhbGlkIHBob25lIG51bWJlci5cIiwgXCJlcnJvclwiKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgc2V0SXNMb3lhbHR5U2VhcmNoaW5nKHRydWUpO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIHNldElzTG95YWx0eVNlYXJjaGluZyhmYWxzZSk7XHJcbiAgICAgIC8vIEdlbmVyYXRlIHJlYWxpc3RpYyByZXdhcmQgYWNjb3VudFxyXG4gICAgICBzZXRMb3lhbHR5QWNjb3VudCh7XHJcbiAgICAgICAgbmFtZTogbG95YWx0eVBob25lLmVuZHNXaXRoKCcxJykgPyBcIk0uIEltcmFuIEZhcm9vcVwiIDogXCJWSVAgQ3VzdG9tZXJcIixcclxuICAgICAgICBwb2ludHM6IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDgwMCkgKyA0MDAsXHJcbiAgICAgICAgdGllcjogbG95YWx0eVBob25lLmVuZHNXaXRoKCcxJykgPyBcIkRpYW1vbmQgTWVtYmVyXCIgOiBcIkdvbGQgTWVtYmVyXCJcclxuICAgICAgfSk7XHJcbiAgICAgIHRyaWdnZXJUb2FzdChcIkFjY291bnQgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseSFcIiwgXCJzdWNjZXNzXCIpO1xyXG4gICAgfSwgMTIwMCk7XHJcbiAgfTtcclxuXHJcbiAgLy8gTG95YWx0eSBkaXNjb3VudCByZWRlZW1lclxyXG4gIGNvbnN0IGhhbmRsZVJlZGVlbVBvaW50cyA9ICgpID0+IHtcclxuICAgIGlmICghbG95YWx0eUFjY291bnQgfHwgbG95YWx0eUFjY291bnQucG9pbnRzIDwgMjAwKSB7XHJcbiAgICAgIHRyaWdnZXJUb2FzdChcIk1pbmltdW0gMjAwIHBvaW50cyByZXF1aXJlZCB0byByZWRlZW0uXCIsIFwiZXJyb3JcIik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IHBvaW50c1RvUmVkZWVtID0gNTAwO1xyXG4gICAgY29uc3QgYWN0dWFsUG9pbnRzUmVkZWVtZWQgPSBNYXRoLm1pbihsb3lhbHR5QWNjb3VudC5wb2ludHMsIHBvaW50c1RvUmVkZWVtKTtcclxuICAgIGNvbnN0IHZhbHVlID0gYWN0dWFsUG9pbnRzUmVkZWVtZWQgKiAwLjAxOyAvLyAxMDAgcG9pbnRzID0gJDFcclxuICAgIHNldFJlZGVlbWVkUG9pbnRzRGlzY291bnQodmFsdWUpO1xyXG4gICAgc2V0TG95YWx0eUFjY291bnQoe1xyXG4gICAgICAuLi5sb3lhbHR5QWNjb3VudCxcclxuICAgICAgcG9pbnRzOiBsb3lhbHR5QWNjb3VudC5wb2ludHMgLSBhY3R1YWxQb2ludHNSZWRlZW1lZFxyXG4gICAgfSk7XHJcbiAgICB0cmlnZ2VyVG9hc3QoYFJlZGVlbWVkICR7YWN0dWFsUG9pbnRzUmVkZWVtZWR9IHBvaW50cyBmb3IgYSAkJHt2YWx1ZS50b0ZpeGVkKDIpfSBkaXNjb3VudCFgLCBcInN1Y2Nlc3NcIik7XHJcbiAgfTtcclxuXHJcbiAgLy8gUE9TIE9yZGVyIFBsYWNlclxyXG4gIGNvbnN0IGhhbmRsZVBsYWNlT3JkZXIgPSAoZTogUmVhY3QuRm9ybUV2ZW50KSA9PiB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBpZiAoY2FydC5sZW5ndGggPT09IDApIHtcclxuICAgICAgdHJpZ2dlclRvYXN0KFwiWW91ciBjYXJ0IGlzIGVtcHR5LlwiLCBcImVycm9yXCIpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZiAoIWN1c3RvbWVyTmFtZSB8fCAhY3VzdG9tZXJQaG9uZSB8fCAoZGVsaXZlcnlUeXBlID09PSAnREVMSVZFUlknICYmICFjdXN0b21lckFkZHJlc3MpKSB7XHJcbiAgICAgIHRyaWdnZXJUb2FzdChcIlBsZWFzZSBmaWxsIGluIGFsbCBjdXN0b21lciBkZXRhaWxzLlwiLCBcImVycm9yXCIpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgXHJcbiAgICBzZXRJc1N1Ym1pdHRpbmdPcmRlcih0cnVlKTtcclxuICAgIFxyXG4gICAgY29uc3QgcGF5bG9hZCA9IHtcclxuICAgICAgICBzdG9yZV9pZDogc3RvcmVJZCB8fCAxLFxyXG4gICAgICAgIGN1c3RvbWVyOiBjdXN0b21lck5hbWUgfHwgJ09ubGluZSBHdWVzdCcsXHJcbiAgICAgICAgY3VzdG9tZXJQaG9uZTogY3VzdG9tZXJQaG9uZSB8fCAnJyxcclxuICAgICAgICBjdXN0b21lckFkZHJlc3M6IGN1c3RvbWVyQWRkcmVzcyB8fCAnTm8gQWRkcmVzcycsXHJcbiAgICAgICAgaXRlbXM6IEpTT04uc3RyaW5naWZ5KGNhcnQubWFwKChjOiBhbnkpID0+ICh7XHJcbiAgICAgICAgICBpZDogYy5wcm9kdWN0LmlkLFxyXG4gICAgICAgICAgbmFtZTogYy5wcm9kdWN0Lm5hbWUsXHJcbiAgICAgICAgICBxdHk6IGMucXVhbnRpdHksXHJcbiAgICAgICAgICBwcmljZTogYy5wcm9kdWN0LnByaWNlXHJcbiAgICAgICAgfSkpKSxcclxuICAgICAgICB0b3RhbEFtb3VudDogKGNhcnQucmVkdWNlKChzdW06IG51bWJlciwgaXRlbTogYW55KSA9PiBzdW0gKyBpdGVtLnByb2R1Y3QucHJpY2UgKiBpdGVtLnF1YW50aXR5LCAwKSAqIDEuMDgpLnRvRml4ZWQoMiksXHJcbiAgICAgICAgc291cmNlOiAnV2Vic2l0ZScsXHJcbiAgICAgICAgbm90ZXM6ICcnLFxyXG4gICAgfTtcclxuXHJcbiAgICBmZXRjaChgJHtCQUNLRU5EX1VSTH0vb25saW5lLW9yZGVyc2AsIHtcclxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxyXG4gICAgfSkudGhlbihyZXMgPT4gcmVzLmpzb24oKSkudGhlbihkYXRhID0+IHtcclxuICAgICAgY29uc3QgdHJhY2tpbmdJZCA9IGRhdGEub3JkZXI/LmlkIHx8IGBENFUtJHtNYXRoLmZsb29yKDEwMDAwMCArIE1hdGgucmFuZG9tKCkgKiA5MDAwMDApfWA7XHJcbiAgICAgIHNldE9yZGVyVHJhY2tpbmcoe1xyXG4gICAgICAgIGlkOiB0cmFja2luZ0lkLnRvU3RyaW5nKCksXHJcbiAgICAgICAgc3RhdHVzOiBcIlBFTkRJTkdcIixcclxuICAgICAgICBldGE6IDI1XHJcbiAgICAgIH0pO1xyXG4gICAgICBzZXRJc1N1Ym1pdHRpbmdPcmRlcihmYWxzZSk7XHJcbiAgICAgIHNldElzQ2hlY2tvdXRPcGVuKGZhbHNlKTtcclxuICAgICAgc2V0Q2FydChbXSk7XHJcbiAgICAgIHNldFJlZGVlbWVkUG9pbnRzRGlzY291bnQoMCk7XHJcbiAgICAgIHNldEFwcGxpZWRDb3Vwb24obnVsbCk7XHJcbiAgICAgIHRyaWdnZXJUb2FzdChcIk9yZGVyIHBsYWNlZCBzdWNjZXNzZnVsbHkhXCIsIFwic3VjY2Vzc1wiKTtcclxuICAgIH0pLmNhdGNoKGUgPT4ge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICB0cmlnZ2VyVG9hc3QoXCJGYWlsZWQgdG8gcGxhY2Ugb3JkZXIuXCIsIFwiZXJyb3JcIik7XHJcbiAgICAgIHNldElzU3VibWl0dGluZ09yZGVyKGZhbHNlKTtcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG5cclxuICAvLyBGaWx0ZXJlZCBQcm9kdWN0cyBsaXN0IGJhc2VkIG9uIGNhdGVnb3J5IGFuZCBzZWFyY2hcclxuICBjb25zdCBmaWx0ZXJlZFByb2R1Y3RzID0gUFJPRFVDVFMuZmlsdGVyKChwcm9kOiBhbnkpID0+IHtcclxuICAgIGNvbnN0IG1hdGNoZXNDYXRlZ29yeSA9IHByb2QuY2F0ZWdvcnkgPT09IGFjdGl2ZUNhdGVnb3J5O1xyXG4gICAgY29uc3QgbWF0Y2hlc1NlYXJjaCA9IChwcm9kLm5hbWUgfHwgJycpLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoKHNlYXJjaFF1ZXJ5IHx8ICcnKS50b0xvd2VyQ2FzZSgpKSB8fCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAocHJvZC5kZXNjcmlwdGlvbiB8fCAnJykudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygoc2VhcmNoUXVlcnkgfHwgJycpLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgcmV0dXJuIG1hdGNoZXNDYXRlZ29yeSAmJiBtYXRjaGVzU2VhcmNoO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPGRpdiBjbGFzc05hbWU9XCJtaW4taC1zY3JlZW4gYmctYnJhbmQtZGFyayB0ZXh0LXdoaXRlIGZsZXggZmxleC1jb2wgZm9udC1zYW5zIHJlbGF0aXZlIHNlbGVjdGlvbjpiZy1icmFuZC15ZWxsb3cgc2VsZWN0aW9uOnRleHQtYnJhbmQtZGFya1wiPlxyXG4gICAgICBcclxuICAgICAgey8qID09PT09PT09PT09PT09PT09IFRPQVNUIE5PVElGSUNBVElPTiBMQVlFUiA9PT09PT09PT09PT09PT09PSAqL31cclxuICAgICAge3RvYXN0ICYmIChcclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIHRvcC0yNCByaWdodC02IHotWzIwMF0gbWF4LXctc20gdy1mdWxsIGJnLXNsYXRlLTkwMC85NSBib3JkZXIgYm9yZGVyLXNsYXRlLTcwMCByb3VuZGVkLXhsIHAtNCBzaGFkb3ctMnhsIGJhY2tkcm9wLWJsdXItbWQgdHJhbnNpdGlvbi1hbGwgYW5pbWF0ZS1ib3VuY2VcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1zdGFydCBnYXAtM1wiPlxyXG4gICAgICAgICAgICB7dG9hc3QudHlwZSA9PT0gJ3N1Y2Nlc3MnICYmIDxDaGVja0NpcmNsZTIgY2xhc3NOYW1lPVwidy01IGgtNSB0ZXh0LWVtZXJhbGQtNDAwIHNocmluay0wIG10LTAuNVwiIC8+fVxyXG4gICAgICAgICAgICB7dG9hc3QudHlwZSA9PT0gJ2Vycm9yJyAmJiA8QWxlcnRDaXJjbGUgY2xhc3NOYW1lPVwidy01IGgtNSB0ZXh0LXJvc2UtNTAwIHNocmluay0wIG10LTAuNVwiIC8+fVxyXG4gICAgICAgICAgICB7dG9hc3QudHlwZSA9PT0gJ2luZm8nICYmIDxTcGFya2xlcyBjbGFzc05hbWU9XCJ3LTUgaC01IHRleHQtYnJhbmQteWVsbG93IHNocmluay0wIG10LTAuNVwiIC8+fVxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMVwiPlxyXG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1zbGF0ZS0xMDBcIj57dG9hc3QubWVzc2FnZX08L3A+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldFRvYXN0KG51bGwpfSBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHNocmluay0wXCI+XHJcbiAgICAgICAgICAgICAgPFggY2xhc3NOYW1lPVwidy00IGgtNFwiIC8+XHJcbiAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICl9XHJcblxyXG4gICAgICB7LyogPT09PT09PT09PT09PT09PT0gU1RJQ0tZIFRPUCBOQVZCQVIgPT09PT09PT09PT09PT09PT0gKi99XHJcbiAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwic3RpY2t5IHRvcC0wIHotNTAgYmctYnJhbmQtZGFyay85NSBib3JkZXItYiBib3JkZXItZ3JheS04MDAvODAgYmFja2Ryb3AtYmx1ci1tZFwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWF4LXctN3hsIG14LWF1dG8gcHgtNCBzbTpweC02IGxnOnB4LThcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGgtMTYgc206aC0yMFwiPlxyXG4gICAgICAgICAgICB7LyogTG9nbyAqL31cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LXNocmluay0wXCI+XHJcbiAgICAgICAgICAgICAgPGJ1dHRvbiBcclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEFjdGl2ZVRhYignaG9tZScpfSBcclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtbGcgc206dGV4dC0yeGwgZm9udC1ibGFjayB0cmFja2luZy10aWdodCB0ZXh0LXdoaXRlIGhvdmVyOnRleHQtYnJhbmQteWVsbG93IHRyYW5zaXRpb25cIlxyXG4gICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgIHtzdG9yZU5hbWUgfHwgJ0Q0VSBSZXN0YXVyYW50J31cclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICB7LyogTmF2aWdhdGlvbiBsaW5rcyAqL31cclxuICAgICAgICAgICAgPG5hdiBjbGFzc05hbWU9XCJoaWRkZW4gbWQ6ZmxleCBzcGFjZS14LThcIj5cclxuICAgICAgICAgICAgICA8YnV0dG9uIFxyXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRBY3RpdmVUYWIoJ2hvbWUnKTsgfX1cclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTEgcHktMiB0ZXh0LXNtIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciB0cmFuc2l0aW9uICR7YWN0aXZlVGFiID09PSAnaG9tZScgPyAndGV4dC1icmFuZC15ZWxsb3cgYm9yZGVyLWItMiBib3JkZXItYnJhbmQteWVsbG93JyA6ICd0ZXh0LWdyYXktMzAwIGhvdmVyOnRleHQtd2hpdGUnfWB9XHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgTUVOVVxyXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgIDxidXR0b24gXHJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldEFjdGl2ZVRhYigncmV3YXJkcycpOyB9fVxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtMSBweS0yIHRleHQtc20gZm9udC1ib2xkIHRyYWNraW5nLXdpZGVyIHRyYW5zaXRpb24gJHthY3RpdmVUYWIgPT09ICdyZXdhcmRzJyA/ICd0ZXh0LWJyYW5kLXllbGxvdyBib3JkZXItYi0yIGJvcmRlci1icmFuZC15ZWxsb3cnIDogJ3RleHQtZ3JheS0zMDAgaG92ZXI6dGV4dC13aGl0ZSd9YH1cclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICBSRVdBUkRTXHJcbiAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgPGJ1dHRvbiBcclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHsgc2V0QWN0aXZlVGFiKCdzdXBwb3J0Jyk7IH19XHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0xIHB5LTIgdGV4dC1zbSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdHJhbnNpdGlvbiAke2FjdGl2ZVRhYiA9PT0gJ3N1cHBvcnQnID8gJ3RleHQtYnJhbmQteWVsbG93IGJvcmRlci1iLTIgYm9yZGVyLWJyYW5kLXllbGxvdycgOiAndGV4dC1ncmF5LTMwMCBob3Zlcjp0ZXh0LXdoaXRlJ31gfVxyXG4gICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgIFNVUFBPUlRcclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9uYXY+XHJcblxyXG4gICAgICAgICAgICB7LyogUmlnaHQtc2lkZSBBY3Rpb25zICovfVxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtMyBzbTpzcGFjZS14LTVcIj5cclxuICAgICAgICAgICAgICB7LyogRHluYW1pYyBMb2NhdGlvbiBCYWRnZSDigJQgb3BlbnMgc2FtZSBCcmFuY2hTZWxlY3Rvck1vZGFsIGFzIG9uIGxvYWQgKi99XHJcbiAgICAgICAgICAgICAgPGJ1dHRvbiBcclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG9uQ2hhbmdlQnJhbmNoID8gb25DaGFuZ2VCcmFuY2goKSA6IG51bGx9XHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciB0ZXh0LWJyYW5kLXllbGxvdyBob3Zlcjp0ZXh0LWJyYW5kLXllbGxvd0hvdmVyIHRleHQteHMgc206dGV4dC1zbSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgdXBwZXJjYXNlIGJvcmRlciBib3JkZXItYnJhbmQteWVsbG93LzMwIHB4LTMgcHktMS41IHJvdW5kZWQtZnVsbCBiZy1icmFuZC15ZWxsb3cvNSBob3ZlcjpiZy1icmFuZC15ZWxsb3cvMTAgdHJhbnNpdGlvbiBnYXAtMVwiXHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgPE1hcFBpbiBjbGFzc05hbWU9XCJ3LTQgaC00IGFuaW1hdGUtcHVsc2VcIiAvPlxyXG4gICAgICAgICAgICAgICAge3NlbGVjdGVkTG9jYXRpb24gPyBzZWxlY3RlZExvY2F0aW9uLmJyYW5jaCA6IHN0b3JlTmFtZSB8fCAnU2VsZWN0IExvY2F0aW9uJ31cclxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtYnJhbmQteWVsbG93LzYwIGZvbnQtbWVkaXVtIG5vcm1hbC1jYXNlIHRyYWNraW5nLW5vcm1hbCBib3JkZXItbCBib3JkZXItYnJhbmQteWVsbG93LzMwIHBsLTIgbWwtMVwiPkNoYW5nZSBCcmFuY2g8L3NwYW4+XHJcbiAgICAgICAgICAgICAgPC9idXR0b24+XHJcblxyXG4gICAgICAgICAgICAgIHsvKiBDYXJ0IEJ1dHRvbiAqL31cclxuICAgICAgICAgICAgICA8YnV0dG9uIFxyXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNDYXJ0T3Blbih0cnVlKX1cclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInJlbGF0aXZlIHAtMi41IHJvdW5kZWQtZnVsbCB0ZXh0LWdyYXktMzAwIGhvdmVyOnRleHQtd2hpdGUgaG92ZXI6Ymctc2xhdGUtODAwIHRyYW5zaXRpb25cIlxyXG4gICAgICAgICAgICAgICAgYXJpYS1sYWJlbD1cIlZpZXcgQ2FydFwiXHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgPFNob3BwaW5nQ2FydCBjbGFzc05hbWU9XCJ3LTUgaC01IHNtOnctNiBoLTZcIiAvPlxyXG4gICAgICAgICAgICAgICAge2NhcnQubGVuZ3RoID4gMCAmJiAoXHJcbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFic29sdXRlIC10b3AtMSAtcmlnaHQtMSBiZy1icmFuZC1waW5rIHRleHQtd2hpdGUgdGV4dC1bMTBweF0gc206dGV4dC14cyBmb250LWJsYWNrIHctNCBoLTQgc206dy01IHNtOmgtNSByb3VuZGVkLWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYm9yZGVyLTIgYm9yZGVyLWJyYW5kLWRhcmsgYW5pbWF0ZS1wdWxzZVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIHtjYXJ0LnJlZHVjZSgoc3VtLCBpdGVtKSA9PiBzdW0gKyBpdGVtLnF1YW50aXR5LCAwKX1cclxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgey8qIFJlc3BvbnNpdmUgTW9iaWxlIE5hdiBCYXIgKi99XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtZDpoaWRkZW4gZmxleCBqdXN0aWZ5LWFyb3VuZCBib3JkZXItdCBib3JkZXItZ3JheS04MDAvODAgcHktMi41IGJnLWJyYW5kLWRhcmsvOTVcIj5cclxuICAgICAgICAgIDxidXR0b24gXHJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEFjdGl2ZVRhYignaG9tZScpfVxyXG4gICAgICAgICAgICBjbGFzc05hbWU9e2B0ZXh0LXhzIGZvbnQtYm9sZCBweC0zIHB5LTEgcm91bmRlZC1mdWxsICR7YWN0aXZlVGFiID09PSAnaG9tZScgPyAnYmctYnJhbmQteWVsbG93IHRleHQtYnJhbmQtZGFyaycgOiAndGV4dC1ncmF5LTQwMCd9YH1cclxuICAgICAgICAgID5cclxuICAgICAgICAgICAgTUVOVVxyXG4gICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICA8YnV0dG9uIFxyXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVUYWIoJ3Jld2FyZHMnKX1cclxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgdGV4dC14cyBmb250LWJvbGQgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCAke2FjdGl2ZVRhYiA9PT0gJ3Jld2FyZHMnID8gJ2JnLWJyYW5kLXllbGxvdyB0ZXh0LWJyYW5kLWRhcmsnIDogJ3RleHQtZ3JheS00MDAnfWB9XHJcbiAgICAgICAgICA+XHJcbiAgICAgICAgICAgIFJFV0FSRFNcclxuICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgPGJ1dHRvbiBcclxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlVGFiKCdzdXBwb3J0Jyl9XHJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHRleHQteHMgZm9udC1ib2xkIHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgJHthY3RpdmVUYWIgPT09ICdzdXBwb3J0JyA/ICdiZy1icmFuZC15ZWxsb3cgdGV4dC1icmFuZC1kYXJrJyA6ICd0ZXh0LWdyYXktNDAwJ31gfVxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICBTVVBQT1JUXHJcbiAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9oZWFkZXI+XHJcblxyXG4gICAgICB7LyogPT09PT09PT09PT09PT09PT0gTUFJTiBTQ1JFRU4gTUFOQUdFUiA9PT09PT09PT09PT09PT09PSAqL31cclxuICAgICAgPG1haW4gY2xhc3NOYW1lPVwiZmxleC1ncm93XCI+XHJcbiAgICAgICAgXHJcbiAgICAgICAgey8qIFZJRVc6IEhPTUUgLyBNRU5VICovfVxyXG4gICAgICAgIHthY3RpdmVUYWIgPT09ICdob21lJyAmJiAoXHJcbiAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICB7LyogSEVSTyBCQU5ORVIgU0xJREVSICovfVxyXG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJyZWxhdGl2ZSB3LWZ1bGwgbWluLWgtWzQyMHB4XSBzbTpoLVs1MDBweF0gYmctYnJhbmQtbGlnaHQgZmxleCBpdGVtcy1jZW50ZXIgb3ZlcmZsb3ctaGlkZGVuIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTcwMFwiPlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgaW5zZXQtMCB6LTBcIj5cclxuICAgICAgICAgICAgICAgIDxpbWcgXHJcbiAgICAgICAgICAgICAgICAgIGtleT17YmFubmVycyAmJiBiYW5uZXJzLmxlbmd0aCA+IDAgPyBiYW5uZXJzW2N1cnJlbnRCYW5uZXJJbmRleF0/LmlkIDogJ2RlZmF1bHQnfVxyXG4gICAgICAgICAgICAgICAgICBhbHQ9e2Jhbm5lcnMgJiYgYmFubmVycy5sZW5ndGggPiAwID8gYmFubmVyc1tjdXJyZW50QmFubmVySW5kZXhdPy50aXRsZSA6IFwiRGVsaWNpb3VzIFByZW1pdW0gQW5ndXMgQnVyZ2VyXCJ9IFxyXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBvcGFjaXR5LTMwIHNtOm9wYWNpdHktNDAgYW5pbWF0ZS1mYWRlLWluXCIgXHJcbiAgICAgICAgICAgICAgICAgIHNyYz17YmFubmVycyAmJiBiYW5uZXJzLmxlbmd0aCA+IDAgPyBgJHtCQUNLRU5EX1VSTH0ke2Jhbm5lcnNbY3VycmVudEJhbm5lckluZGV4XT8uaW1hZ2VVcmx9YCA6IFwiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2FpZGEtcHVibGljL0FCNkFYdUNJaXlhOENieF9DZHlaRkloVm9ib1lNRmtkMnZma04yaE52SUJDNk13a3RwYktXV0s0WFZwb1lMWkVLNlhGOHJjYVZUQTZXS2RvS0Z4cjR3RW85dldGQzZJemd2VDR3OGVzZ3F6MWxZeWwxVXdWWTY4OG1KUVY5VDVZVnNfZGdaWURJSFk0emF2dFFoNjA5b2REYW5uUmx2MnpaTUFqcEV1ZTM1WnB0N2JZVUZUUmhoajdnelpCWm1BUWdwblEwZGlacExPdzU0d2c2QUVFNG9OVTRPcWk2RW1Td2F5ZU5Ga1ZydDJYNjlja0Nxc0JKenlrNW9waTBmWE5pd2VvM2RnT2dpVFZUUHJzQ1lVXCJ9XHJcbiAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1icmFuZC1kYXJrIHZpYS1icmFuZC1kYXJrLzkwIHRvLXRyYW5zcGFyZW50XCI+PC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSB6LTEwIG1heC13LTd4bCBteC1hdXRvIHB4LTQgc206cHgtNiBsZzpweC04IHB5LTEwIHctZnVsbCBhbmltYXRlLWZhZGUtaW5cIiBrZXk9e2B0ZXh0LSR7Y3VycmVudEJhbm5lckluZGV4fWB9PlxyXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaW5saW5lLWJsb2NrIGJnLWJyYW5kLXllbGxvdyB0ZXh0LWJyYW5kLWRhcmsgdGV4dC1bMTBweF0gc206dGV4dC14cyBmb250LWJsYWNrIHB4LTMuNSBweS0xLjUgcm91bmRlZC1mdWxsIG1iLTQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgIEZlYXR1cmVkXHJcbiAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC00eGwgc206dGV4dC02eGwgbWQ6dGV4dC04eGwgZm9udC1ibGFjayB0cmFja2luZy10aWdodCBsZWFkaW5nLW5vbmUgbWItNFwiPlxyXG4gICAgICAgICAgICAgICAgICB7YmFubmVycyAmJiBiYW5uZXJzLmxlbmd0aCA+IDAgPyAoXHJcbiAgICAgICAgICAgICAgICAgICAgPD5cclxuICAgICAgICAgICAgICAgICAgICAgIHsoYmFubmVyc1tjdXJyZW50QmFubmVySW5kZXhdPy50aXRsZSB8fCAnJykuc3BsaXQoJyAnKS5zbGljZSgwLCAtMSkuam9pbignICcpfTxici8+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJyYW5kLXllbGxvd1wiPnsoYmFubmVyc1tjdXJyZW50QmFubmVySW5kZXhdPy50aXRsZSB8fCAnJykuc3BsaXQoJyAnKS5zbGljZSgtMSkuam9pbignICcpfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8Lz5cclxuICAgICAgICAgICAgICAgICAgKSA6IChcclxuICAgICAgICAgICAgICAgICAgICA8PkRlbGljaW91czxici8+PHNwYW4gY2xhc3NOYW1lPVwidGV4dC1icmFuZC15ZWxsb3dcIj5CdXJnZXJzPC9zcGFuPjwvPlxyXG4gICAgICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICAgICAgPC9oMT5cclxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTIgbWF4LXctbGcgdGV4dC1zbSBzbTp0ZXh0LWxnIHRleHQtc2xhdGUtMzAwIG1iLTZcIj5cclxuICAgICAgICAgICAgICAgICAge2Jhbm5lcnMgJiYgYmFubmVycy5sZW5ndGggPiAwID8gYmFubmVyc1tjdXJyZW50QmFubmVySW5kZXhdPy5zdWJ0aXRsZSA6IFwiVHJ5IG91ciBuZXcgcHJlbWl1bSBBbmd1cyBiZWVmIGJ1cmdlciwgbG9hZGVkIHdpdGggbWVsdGVkIGNoZWRkYXIsIGNyaXNwIHZlZ2V0YWJsZXMsIGFuZCBvdXIgc2lnbmF0dXJlIHNlY3JldCBzYXVjZS4gRnJlc2hseSBmbGFtZS1jb29rZWQgZm9yIHlvdXIgZGVsaWdodC5cIn1cclxuICAgICAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgZ2FwLTRcIj5cclxuICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcclxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoYmFubmVycyAmJiBiYW5uZXJzLmxlbmd0aCA+IDAgJiYgYmFubmVyc1tjdXJyZW50QmFubmVySW5kZXhdPy5saW5rVXJsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gYmFubmVyc1tjdXJyZW50QmFubmVySW5kZXhdLmxpbmtVcmw7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWN0aW9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnUtZ3JpZC1zZWN0aW9uJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWN0aW9uKSBzZWN0aW9uLnNjcm9sbEludG9WaWV3KHsgYmVoYXZpb3I6ICdzbW9vdGgnIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctYnJhbmQteWVsbG93IGhvdmVyOmJnLWJyYW5kLXllbGxvd0hvdmVyIHRleHQtYnJhbmQtZGFyayBmb250LWV4dHJhYm9sZCBweS0zIHB4LTggcm91bmRlZC1mdWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRyYW5zaXRpb24gZHVyYXRpb24tMzAwIHRyYW5zZm9ybSBob3ZlcjpzY2FsZS0xMDVcIlxyXG4gICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAge2Jhbm5lcnMgJiYgYmFubmVycy5sZW5ndGggPiAwID8gKGJhbm5lcnNbY3VycmVudEJhbm5lckluZGV4XT8uYnV0dG9uVGV4dCB8fCAnT1JERVIgTk9XJykgOiAnT1JERVIgTk9XJ30gPEFycm93UmlnaHQgY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgIHsvKiBTbGlkZXIgQ29udHJvbHMgKi99XHJcbiAgICAgICAgICAgICAge2Jhbm5lcnMgJiYgYmFubmVycy5sZW5ndGggPiAxICYmIChcclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgYm90dG9tLTYgcmlnaHQtNiBmbGV4IHNwYWNlLXgtMiB6LTEwXCI+XHJcbiAgICAgICAgICAgICAgICAgIHtiYW5uZXJzLm1hcCgoXzogYW55LCBpZHg6IG51bWJlcikgPT4gKFxyXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gXHJcbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e2lkeH1cclxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEN1cnJlbnRCYW5uZXJJbmRleChpZHgpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgaC0yIHJvdW5kZWQtZnVsbCB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0zMDAgJHtpZHggPT09IGN1cnJlbnRCYW5uZXJJbmRleCA/ICd3LTEwIGJnLWJyYW5kLXllbGxvdycgOiAndy0yIGJnLXNsYXRlLTUwMCBob3ZlcjpiZy1zbGF0ZS00MDAnfWB9XHJcbiAgICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgICAgKSl9XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICAgICAgICB7LyogTElNSVRFRCBUSU1FIFNQRUNJQUwgT0ZGRVJTICovfVxyXG4gICAgICAgICAgICB7Y2FtcGFpZ25zICYmIGNhbXBhaWducy5sZW5ndGggPiAwICYmIChcclxuICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJtYXgtdy03eGwgbXgtYXV0byBweC00IHNtOnB4LTYgbGc6cHgtOCBweS0xMiBzbTpweS0xNiBib3JkZXItdCBib3JkZXItZ3JheS04MDAgcmVsYXRpdmVcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIG1iLThcIj5cclxuICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWJyYW5kLXBpbmsgdGV4dC14cyBmb250LWJsYWNrIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgbWItMVwiPkxpbWl0ZWQgVGltZTwvcD5cclxuICAgICAgICAgICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC14bCBzbTp0ZXh0LTN4bCBmb250LWJsYWNrIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8UGVyY2VudCBjbGFzc05hbWU9XCJ3LTYgaC02IHRleHQtYnJhbmQtcGlua1wiIC8+IFNQRUNJQUwgT0ZGRVJTXHJcbiAgICAgICAgICAgICAgICAgICAgPC9oMj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIHtjYW1wYWlnbnMubGVuZ3RoID4gMyAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IHNwYWNlLXgtMlwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW1wYWlnbnMtc2Nyb2xsLWNvbnRhaW5lcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250YWluZXIpIGNvbnRhaW5lci5zY3JvbGxCeSh7IGxlZnQ6IC0zMjAsIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0yIGJnLXNsYXRlLTgwMCBob3ZlcjpiZy1icmFuZC15ZWxsb3cgdGV4dC13aGl0ZSBob3Zlcjp0ZXh0LWJyYW5kLWRhcmsgcm91bmRlZC1mdWxsIHRyYW5zaXRpb25cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Q2hldnJvbkxlZnQgY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FtcGFpZ25zLXNjcm9sbC1jb250YWluZXInKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyKSBjb250YWluZXIuc2Nyb2xsQnkoeyBsZWZ0OiAzMjAsIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0yIGJnLXNsYXRlLTgwMCBob3ZlcjpiZy1icmFuZC15ZWxsb3cgdGV4dC13aGl0ZSBob3Zlcjp0ZXh0LWJyYW5kLWRhcmsgcm91bmRlZC1mdWxsIHRyYW5zaXRpb25cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Q2hldnJvblJpZ2h0IGNsYXNzTmFtZT1cInctNSBoLTVcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICA8ZGl2IFxyXG4gICAgICAgICAgICAgICAgICBpZD1cImNhbXBhaWducy1zY3JvbGwtY29udGFpbmVyXCJcclxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBnYXAtNiBvdmVyZmxvdy14LWF1dG8gcGItNCBzbmFwLXggaGlkZS1zY3JvbGxiYXJcIlxyXG4gICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICB7Y2FtcGFpZ25zLm1hcCgoY2FtcGFpZ246IGFueSkgPT4gKFxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgXHJcbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e2NhbXBhaWduLmlkfSBcclxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLWJyYW5kLWxpZ2h0IGJvcmRlciBib3JkZXItc2xhdGUtODAwLzgwIGhvdmVyOmJvcmRlci1icmFuZC15ZWxsb3cgcm91bmRlZC0yeGwgcC02IHJlbGF0aXZlIG92ZXJmbG93LWhpZGRlbiBncm91cCB0cmFuc2l0aW9uIGR1cmF0aW9uLTMwMCBmbGV4IGZsZXgtY29sIGp1c3RpZnktYmV0d2VlbiBtaW4tdy1bMzAwcHhdIHNtOm1pbi13LVszNDBweF0gc25hcC1jZW50ZXIgZmxleC0xXCJcclxuICAgICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7LyogQ29ybmVyIGdyYWRpZW50ICovfVxyXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSB0b3AtMCByaWdodC0wIHctMjQgaC0yNCBiZy1icmFuZC15ZWxsb3cvNSByb3VuZGVkLWJsLWZ1bGwgLW1yLTYgLW10LTYgdHJhbnNpdGlvbi10cmFuc2Zvcm0gZ3JvdXAtaG92ZXI6c2NhbGUtMTEwXCI+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImJnLWJyYW5kLXBpbmsgdGV4dC13aGl0ZSB0ZXh0LVsxMHB4XSBmb250LWJsYWNrIHB4LTIuNSBweS0xIHJvdW5kZWQgbWItNCBpbmxpbmUtYmxvY2sgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAge2NhbXBhaWduLmRpc2NvdW50X3BjdH0lIE9GRlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LWxnIHNtOnRleHQteGwgZm9udC1ib2xkIG1iLTEgdGV4dC1zbGF0ZS0xMDBcIj57Y2FtcGFpZ24udGl0bGV9PC9oMz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgdGV4dC14cyBzbTp0ZXh0LXNtIG1iLTQgbGVhZGluZy1yZWxheGVkIGxpbmUtY2xhbXAtMlwiPntjYW1wYWlnbi5kZXNjcmlwdGlvbn08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBtdC00IHB0LTQgYm9yZGVyLXQgYm9yZGVyLXNsYXRlLTgwMC80MFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1zbGF0ZS01MDAgdHJhY2tpbmctd2lkZXIgZm9udC1tb25vIHVwcGVyY2FzZVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIE9GRkVSXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBseUNvdXBvbih7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGBDQU1QLSR7Y2FtcGFpZ24uaWR9YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogY2FtcGFpZ24udGl0bGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2NvdW50UGVyY2VudDogY2FtcGFpZ24uZGlzY291bnRfcGN0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogY2FtcGFpZ24uZGVzY3JpcHRpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctc2xhdGUtODAwIGhvdmVyOmJnLWJyYW5kLXllbGxvdyBob3Zlcjp0ZXh0LWJyYW5kLWRhcmsgdGV4dC1icmFuZC15ZWxsb3cgdGV4dC14cyBmb250LWJsYWNrIHB5LTIgcHgtNCByb3VuZGVkLWZ1bGwgdHJhbnNpdGlvbiBkdXJhdGlvbi0zMDBcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAge2FwcGxpZWRDb3Vwb24/LmNvZGUgPT09IGBDQU1QLSR7Y2FtcGFpZ24uaWR9YCA/ICdBcHBsaWVkIOKckycgOiAnQXBwbHkgRGVhbCd9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICAgICApfVxyXG5cclxuICAgICAgICAgICAgey8qIENBVEVHT1JJRVMgTUVOVSBST1cgKi99XHJcbiAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cIm1heC13LTd4bCBteC1hdXRvIHB4LTQgc206cHgtNiBsZzpweC04IHB5LTZcIj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLWJyYW5kLWxpZ2h0IHJvdW5kZWQtMnhsIHNtOnJvdW5kZWQtZnVsbCBwLTIgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAvODAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGdhcC00IHNtOmp1c3RpZnktYXJvdW5kIGl0ZW1zLWNlbnRlciBweC00IG92ZXJmbG93LXgtYXV0byBweS0xXCI+XHJcbiAgICAgICAgICAgICAgICAgIHsoQ0FURUdPUklFUyBhcyBzdHJpbmdbXSkubWFwKGNhdGVnb3J5ID0+IChcclxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e2NhdGVnb3J5fVxyXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlQ2F0ZWdvcnkoY2F0ZWdvcnkpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbWluLXctbWF4IHB4LTUgcHktMi41IHJvdW5kZWQtZnVsbCBmb250LWJvbGQgdGV4dC1zbSB0cmFja2luZy13aWRlIHRyYW5zaXRpb24gY3Vyc29yLXBvaW50ZXIgJHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlQ2F0ZWdvcnkgPT09IGNhdGVnb3J5IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWJyYW5kLXllbGxvdyB0ZXh0LWJyYW5kLWRhcmsnIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXNsYXRlLTkwMC82MCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIGhvdmVyOmJnLXNsYXRlLTgwMCdcclxuICAgICAgICAgICAgICAgICAgICAgIH1gfVxyXG4gICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgIDxTcGFya2xlcyBjbGFzc05hbWU9XCJ3LTQgaC00IHNocmluay0wXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgIHtjYXRlZ29yeX1cclxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgKSl9XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG5cclxuICAgICAgICAgICAgey8qIFBST0RVQ1RTIEdSSUQgKi99XHJcbiAgICAgICAgICAgIDxzZWN0aW9uIGlkPVwibWVudS1ncmlkLXNlY3Rpb25cIiBjbGFzc05hbWU9XCJtYXgtdy03eGwgbXgtYXV0byBweC00IHNtOnB4LTYgbGc6cHgtOCBweS0xMFwiPlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBzbTppdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIG1iLTggZ2FwLTRcIj5cclxuICAgICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LTN4bCBzbTp0ZXh0LTR4bCBmb250LWJsYWNrIHRleHQtYnJhbmQteWVsbG93IHRyYWNraW5nLXRpZ2h0XCI+e2FjdGl2ZUNhdGVnb3J5fTwvaDI+XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHsvKiBTaW1wbGUgTWVudSBTZWFyY2ggKi99XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIG1heC13LXhzIHctZnVsbFwiPlxyXG4gICAgICAgICAgICAgICAgICA8U2VhcmNoIGNsYXNzTmFtZT1cImFic29sdXRlIGxlZnQtMyB0b3AtMS8yIC10cmFuc2xhdGUteS0xLzIgdy00IGgtNCB0ZXh0LXNsYXRlLTQwMFwiIC8+XHJcbiAgICAgICAgICAgICAgICAgIDxpbnB1dCBcclxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiIFxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiU2VhcmNoIG1lbnUuLi5cIlxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtzZWFyY2hRdWVyeX1cclxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFNlYXJjaFF1ZXJ5KGUudGFyZ2V0LnZhbHVlKX1cclxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctc2xhdGUtOTAwIGJvcmRlciBib3JkZXItc2xhdGUtODAwIHJvdW5kZWQtZnVsbCBwbC05IHByLTQgcHktMiB0ZXh0LXNtIHRleHQtc2xhdGUtMjAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItYnJhbmQteWVsbG93XCJcclxuICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICB7ZmlsdGVyZWRQcm9kdWN0cy5sZW5ndGggPT09IDAgPyAoXHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHB5LTE2IGJnLWJyYW5kLWxpZ2h0IHJvdW5kZWQtM3hsIGJvcmRlciBib3JkZXItc2xhdGUtODAwLzUwXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxTaG9wcGluZ0JhZyBjbGFzc05hbWU9XCJ3LTEyIGgtMTIgdGV4dC1zbGF0ZS02MDAgbXgtYXV0byBtYi0zXCIgLz5cclxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgZm9udC1ib2xkXCI+Tm8gcHJvZHVjdHMgZm91bmQgbWF0Y2hpbmcgeW91ciBzZWFyY2guPC9wPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgKSA6IChcclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMSBzbTpncmlkLWNvbHMtMiBsZzpncmlkLWNvbHMtMyBnYXAtOFwiPlxyXG4gICAgICAgICAgICAgICAgICB7ZmlsdGVyZWRQcm9kdWN0cy5tYXAoKHByb2R1Y3Q6IGFueSkgPT4gKFxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgXHJcbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e3Byb2R1Y3QuaWR9IFxyXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctYnJhbmQtbGlnaHQgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAvNjAgcm91bmRlZC0zeGwgb3ZlcmZsb3ctaGlkZGVuIHJlbGF0aXZlIGdyb3VwIGhvdmVyOmJvcmRlci1icmFuZC15ZWxsb3cvMzAgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwXCJcclxuICAgICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7LyogUHJvZHVjdCBJbWFnZSBBcmVhICovfVxyXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhc3BlY3Qtc3F1YXJlIHJlbGF0aXZlIG92ZXJmbG93LWhpZGRlbiBiZy1zbGF0ZS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBhbHQ9e3Byb2R1Y3QubmFtZX0gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY292ZXIgZ3JvdXAtaG92ZXI6c2NhbGUtMTA1IHRyYW5zaXRpb24tdHJhbnNmb3JtIGR1cmF0aW9uLTUwMFwiIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNyYz17cHJvZHVjdC5pbWFnZV91cmx9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25FcnJvcj17KGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrIGRlZmF1bHQgYnVyZ2VyIHBsYWNlaG9sZGVyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZS50YXJnZXQgYXMgSFRNTEltYWdlRWxlbWVudCkuc3JjID0gXCJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYWlkYS1wdWJsaWMvQUI2QVh1Q0lpeWE4Q2J4X0NkeVpGSWhWb2JvWU1Ga2QydmZrTjJoTnZJQkM2TXdrdHBiS1dXSzRYVnBvWUxaRUs2WEY4cmNhVlRBNldLZG9LRnhyNHdFbzl2V0ZDNkl6Z3ZUNHc4ZXNncXoxbFl5bDFVd1ZZNjg4bUpRVjlUNVlWc19kZ1pZRElIWTR6YXZ0UWg2MDlvZERhbm5SbHYyelpNQWpwRXVlMzVacHQ3YllVRlRSaGhqN2d6WkJabUFRZ3BuUTBkaVpwTE93NTR3ZzZBRUU0b05VNE9xaTZFbVN3YXllTkZrVnJ0Mlg2OWNrQ3FzQkp6eWs1b3BpMGZYTml3ZW8zZGdPZ2lUVlRQcnNDWVVcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgYmctZ3JhZGllbnQtdG8tdCBmcm9tLWJyYW5kLWRhcmsvOTUgdmlhLWJyYW5kLWRhcmsvNDAgdG8tdHJhbnNwYXJlbnRcIj48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgIHsvKiBPdmVybGFwIGNvbnRlbnQgKi99XHJcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGJvdHRvbS0wIGxlZnQtMCByaWdodC0wIHAtNSBmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1lbmRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgcHItM1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LXdoaXRlIGZvbnQtYmxhY2sgdGV4dC1sZyBzbTp0ZXh0LXhsIHRyYWNraW5nLXRpZ2h0IG1iLTFcIj57cHJvZHVjdC5uYW1lfTwvaDM+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgdGV4dC14cyBsaW5lLWNsYW1wLTEgbWItMiBsZWFkaW5nLXNudWdcIj57cHJvZHVjdC5kZXNjcmlwdGlvbn08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1icmFuZC15ZWxsb3cgZm9udC1ibGFjayB0ZXh0LWxnXCI+JHtwcm9kdWN0LnByaWNlLnRvRml4ZWQoMil9PC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBhZGRUb0NhcnQocHJvZHVjdCl9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0xMSBoLTExIGJnLXdoaXRlIGhvdmVyOmJnLWJyYW5kLXllbGxvdyB0ZXh0LWJyYW5kLWRhcmsgcm91bmRlZC1mdWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRyYW5zaXRpb24gc2hhZG93LWxnIHNocmluay0wXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPXtgQWRkICR7cHJvZHVjdC5uYW1lfSB0byBjYXJ0YH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxQbHVzIGNsYXNzTmFtZT1cInctNSBoLTUgc3Ryb2tlLVszcHhdXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgKSl9XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICAgICAgICB7LyogT1JERVIgU1RBVFVTIFRSQUNLSU5HIElORElDQVRPUiAoTWF0Y2hlcyBtb2Rlcm4gUE9TIGd1aWRlbGluZXMpICovfVxyXG4gICAgICAgICAgICB7b3JkZXJUcmFja2luZyAmJiAoXHJcbiAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwibWF4LXctN3hsIG14LWF1dG8gcHgtNCBzbTpweC02IGxnOnB4LTggcHktNCBtYi04XCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXNsYXRlLTkwMCBib3JkZXItMiBib3JkZXItYnJhbmQteWVsbG93LzQwIHJvdW5kZWQtM3hsIHAtNiBmbGV4IGZsZXgtY29sIG1kOmZsZXgtcm93IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTZcIj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xMiBoLTEyIGJnLWJyYW5kLXllbGxvdy8xMCByb3VuZGVkLWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1icmFuZC15ZWxsb3cgYW5pbWF0ZS1wdWxzZSBzaHJpbmstMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPENsb2NrIGNsYXNzTmFtZT1cInctNiBoLTZcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIGZvbnQtYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcIj5BY3RpdmUgUE9TIE9yZGVyPC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1ibGFjayB0ZXh0LXdoaXRlXCI+SUQ6IHtvcmRlclRyYWNraW5nLmlkfTwvaDQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtc2xhdGUtMzAwXCI+U3RhdHVzOiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJyYW5kLXllbGxvdyBmb250LWJsYWNrIHVwcGVyY2FzZVwiPntvcmRlclRyYWNraW5nLnN0YXR1c308L3NwYW4+PC9wPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgbWQ6dy1hdXRvIGZsZXggaXRlbXMtY2VudGVyIGdhcC00XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBtZDp0ZXh0LXJpZ2h0XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNDAwIGZvbnQtYm9sZFwiPkVzdGltYXRlZCBBcnJpdmFsPC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1ibGFjayB0ZXh0LWJyYW5kLXllbGxvd1wiPntvcmRlclRyYWNraW5nLmV0YX0gTWluczwvcD5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIFxyXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyVG9hc3QoXCJDaGVja2luZyBsaXZlIGRpc3BhdGNoIHN0YXR1cy4uLlwiLCBcImluZm9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpbXVsYXRlZCB1cGRhdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0T3JkZXJUcmFja2luZyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ub3JkZXJUcmFja2luZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IFwiRElTUEFUQ0hFRFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV0YTogMTJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctYnJhbmQteWVsbG93IGhvdmVyOmJnLWJyYW5kLXllbGxvd0hvdmVyIHRleHQtYnJhbmQtZGFyayBmb250LWJsYWNrIHRleHQteHMgcHgtNSBweS0zIHJvdW5kZWQtZnVsbCB0cmFuc2l0aW9uXCJcclxuICAgICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgICBUcmFjayBPcmRlclxyXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gXHJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRPcmRlclRyYWNraW5nKG51bGwpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiRGlzbWlzcyB0cmFja2luZyBwYW5lbFwiXHJcbiAgICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPFggY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICAgICApfVxyXG5cclxuICAgICAgICAgICAgey8qIE9VUiBTVEFGRiBTRUNUSU9OICovfVxyXG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJtYXgtdy00eGwgbXgtYXV0byBweC00IHNtOnB4LTYgbGc6cHgtOCBweS0xNiB0ZXh0LWNlbnRlciBib3JkZXItdCBib3JkZXItZ3JheS04MDAgbXQtMTJcIj5cclxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWJyYW5kLXllbGxvdyB0ZXh0LXhzIGZvbnQtYmxhY2sgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBtYi0yXCI+VGhlIEZhY2VzIEJlaGluZCBUaGUgRmxhdm9yPC9wPlxyXG4gICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LTN4bCBzbTp0ZXh0LTR4bCBmb250LWJsYWNrIG1iLTRcIj5PVVIgU1RBRkY8L2gyPlxyXG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIG1iLTEyIG1heC13LXhsIG14LWF1dG8gdGV4dC1zbSBzbTp0ZXh0LWJhc2UgbGVhZGluZy1yZWxheGVkXCI+XHJcbiAgICAgICAgICAgICAgICBNZWV0IHRoZSBpbmNyZWRpYmxlIHRlYW0gdGhhdCBtYWtlcyBNYXNqaWQgZSBUYXF3YSBzcGVjaWFsLiBGcm9tIG91ciBtYXN0ZXIgY2hlZnMgdG8gb3VyIGZyaWVuZGx5IGZyb250LW9mLWhvdXNlIHN0YWZmLlxyXG4gICAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1jZW50ZXIgZ2FwLTEyIHNtOmdhcC0yNFwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBncm91cFwiPlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMjQgaC0yNCByb3VuZGVkLWZ1bGwgYmctc2xhdGUtODAwIGJvcmRlci0yIGJvcmRlci1zbGF0ZS03MDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgbWItNCB0cmFuc2l0aW9uLXRyYW5zZm9ybSBncm91cC1ob3ZlcjpzY2FsZS0xMDVcIj5cclxuICAgICAgICAgICAgICAgICAgICA8VXNlciBjbGFzc05hbWU9XCJ3LTEwIGgtMTAgdGV4dC1zbGF0ZS00MDAgZ3JvdXAtaG92ZXI6dGV4dC1icmFuZC15ZWxsb3dcIiAvPlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cImZvbnQtZXh0cmFib2xkIHRleHQtbGcgdGV4dC1zbGF0ZS0xMDBcIj5JbXJhbiBGYXJvb3E8L2g0PlxyXG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWJyYW5kLXllbGxvdyB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhY2tpbmctd2lkZXN0IG10LTEgdXBwZXJjYXNlXCI+Q2FzaGllcjwvcD5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBncm91cFwiPlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMjQgaC0yNCByb3VuZGVkLWZ1bGwgYmctc2xhdGUtODAwIGJvcmRlci0yIGJvcmRlci1zbGF0ZS03MDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgbWItNCB0cmFuc2l0aW9uLXRyYW5zZm9ybSBncm91cC1ob3ZlcjpzY2FsZS0xMDVcIj5cclxuICAgICAgICAgICAgICAgICAgICA8VXNlciBjbGFzc05hbWU9XCJ3LTEwIGgtMTAgdGV4dC1zbGF0ZS00MDAgZ3JvdXAtaG92ZXI6dGV4dC1icmFuZC15ZWxsb3dcIiAvPlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cImZvbnQtZXh0cmFib2xkIHRleHQtbGcgdGV4dC1zbGF0ZS0xMDBcIj5TYXJhIE1hbmFnZXI8L2g0PlxyXG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWJyYW5kLXllbGxvdyB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhY2tpbmctd2lkZXN0IG10LTEgdXBwZXJjYXNlXCI+TWFuYWdlcjwvcD5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApfVxyXG5cclxuXHJcblxyXG4gICAgICAgIHsvKiBWSUVXOiBSRVdBUkRTIExPWUFMVFkgUE9SVEFMICovfVxyXG4gICAgICAgIHthY3RpdmVUYWIgPT09ICdyZXdhcmRzJyAmJiAoXHJcbiAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJtYXgtdy00eGwgbXgtYXV0byBweC00IHNtOnB4LTYgbGc6cHgtOCBweS0xMlwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtY2VudGVyIG1iLTEyXCI+XHJcbiAgICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtNHhsIHNtOnRleHQtNXhsIGZvbnQtYmxhY2sgdGV4dC1icmFuZC15ZWxsb3cgbWItNCB0cmFja2luZy10aWdodFwiPkQ0VSBDbHViIFJld2FyZHM8L2gxPlxyXG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIG1heC13LWxnIG14LWF1dG8gdGV4dC1zbSBzbTp0ZXh0LWJhc2VcIj5cclxuICAgICAgICAgICAgICAgIEVhcm4gMTAgcG9pbnRzIGZvciBldmVyeSAkMSBzcGVudC4gUmVkZWVtIHBvaW50cyBmb3IgZnJlZSBtZWFscywgY3VzdG9tIGRpc2NvdW50cywgYW5kIG1lbWJlci1vbmx5IHNwZWNpYWxzLlxyXG4gICAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTEgbWQ6Z3JpZC1jb2xzLTEyIGdhcC04XCI+XHJcbiAgICAgICAgICAgICAgey8qIFBvaW50IENoZWNrZXIgcGFuZWwgKi99XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtZDpjb2wtc3Bhbi03IGJnLWJyYW5kLWxpZ2h0IGJvcmRlciBib3JkZXItc2xhdGUtODAwIHJvdW5kZWQtM3hsIHAtNiBzbTpwLTggZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWJldHdlZW5cIj5cclxuICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTEwMCBtYi0yXCI+Q2hlY2sgWW91ciBCYWxhbmNlPC9oMz5cclxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgdGV4dC14cyBzbTp0ZXh0LXNtIG1iLTYgbGVhZGluZy1yZWxheGVkXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgRW50ZXIgeW91ciByZWdpc3RlcmVkIHBob25lIG51bWJlciB0byBsb2FkIHlvdXIgZGlnaXRhbCByZXdhcmRzIGNhcmQgYW5kIHJlZGVlbSB5b3VyIHBvaW50cyBpbnN0YW50bHkuXHJcbiAgICAgICAgICAgICAgICAgIDwvcD5cclxuXHJcbiAgICAgICAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVMb3lhbHR5U2VhcmNofSBjbGFzc05hbWU9XCJzcGFjZS15LTQgbWItNlwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC14cyBmb250LWJsYWNrIHRyYWNraW5nLXdpZGVzdCB0ZXh0LXNsYXRlLTQwMCB1cHBlcmNhc2VcIj5QaG9uZSBOdW1iZXI8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGVsXCIgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiZS5nLiArMSAoNTU1KSAxMjMtNDU2N1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtsb3lhbHR5UGhvbmV9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0TG95YWx0eVBob25lKGUudGFyZ2V0LnZhbHVlKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLXNsYXRlLTkwMCBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMCByb3VuZGVkLXhsIHB4LTQgcHktMyB0ZXh0LXNtIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItYnJhbmQteWVsbG93XCJcclxuICAgICAgICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcclxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2lzTG95YWx0eVNlYXJjaGluZ31cclxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1icmFuZC15ZWxsb3cgaG92ZXI6YmctYnJhbmQteWVsbG93SG92ZXIgdGV4dC1icmFuZC1kYXJrIGZvbnQtYmxhY2sgcHktMyByb3VuZGVkLXhsIHRyYW5zaXRpb24gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTJcIlxyXG4gICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgIHtpc0xveWFsdHlTZWFyY2hpbmcgPyAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPExvYWRlcjIgY2xhc3NOYW1lPVwidy00IGgtNCBhbmltYXRlLXNwaW5cIiAvPiBSZXRyaWV2aW5nLi4uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgKSA6IChcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJMb2FkIE1lbWJlciBDYXJkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgIDwvZm9ybT5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICAgIHsvKiBIZWxwZnVsIFRpcCAqL31cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctc2xhdGUtOTAwLzUwIHJvdW5kZWQteGwgcC00IGJvcmRlciBib3JkZXItc2xhdGUtODAwLzMwXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1zbGF0ZS00MDAgbGVhZGluZy1ub3JtYWxcIj5cclxuICAgICAgICAgICAgICAgICAgICDwn5KhIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtMjAwIGZvbnQtYm9sZFwiPlF1aWNrIERlbW86PC9zcGFuPiBFbnRlciBhbnkgcGhvbmUgZW5kaW5nIGluIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtYnJhbmQteWVsbG93IGZvbnQtYm9sZCBmb250LW1vbm9cIj4xPC9zcGFuPiAoZS5nLiArMSA1NTUtMDAwMSkgdG8gc2ltdWxhdGUgYW4gZWxpdGUgRGlhbW9uZCBsZXZlbCBhY2NvdW50IGxvYWRlZCB3aXRoIGFjdGl2ZSBiYWxhbmNlIVxyXG4gICAgICAgICAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgey8qIERpZ2l0YWwgQ2FyZCBQcmV2aWV3IFBhbmVsICovfVxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWQ6Y29sLXNwYW4tNVwiPlxyXG4gICAgICAgICAgICAgICAge2xveWFsdHlBY2NvdW50ID8gKFxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNlwiPlxyXG4gICAgICAgICAgICAgICAgICAgIHsvKiBWSVAgRGlnaXRhbCBDYXJkICovfVxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctZ3JhZGllbnQtdG8tYnIgZnJvbS1icmFuZC15ZWxsb3cvOTAgdG8tYW1iZXItNjAwIHJvdW5kZWQtM3hsIHAtNiBzaGFkb3ctMnhsIHJlbGF0aXZlIG92ZXJmbG93LWhpZGRlbiB0ZXh0LWJyYW5kLWRhcmsgc2VsZWN0LW5vbmUgbWluLWgtWzE5MHB4XSBmbGV4IGZsZXgtY29sIGp1c3RpZnktYmV0d2VlblwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSB0b3AtMCByaWdodC0wIHctMzIgaC0zMiBiZy13aGl0ZS8xMCByb3VuZGVkLWZ1bGwgLW1yLTEwIC1tdC0xMCBibHVyLXhsXCI+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtc3RhcnRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJsYWNrIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgdGV4dC1icmFuZC1kYXJrLzcwXCI+RDRVIE1lbWJlciBDbHViPC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgZm9udC1ibGFjayB0cnVuY2F0ZSBtYXgtdy1bMTgwcHhdXCI+e2xveWFsdHlBY2NvdW50Lm5hbWV9PC9oND5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImJnLWJyYW5kLWRhcmsgdGV4dC1icmFuZC15ZWxsb3cgdGV4dC1bOXB4XSBmb250LWJsYWNrIHB4LTIuNSBweS0xIHJvdW5kZWQtZnVsbCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICB7bG95YWx0eUFjY291bnQudGllcn1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwdC00XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYmxhY2sgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCB0ZXh0LWJyYW5kLWRhcmsvNzBcIj5Qb2ludHMgQmFsYW5jZTwvcD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC00eGwgZm9udC1ibGFjayB0cmFja2luZy10aWdodFwiPntsb3lhbHR5QWNjb3VudC5wb2ludHN9IHB0czwvcD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1icmFuZC1kYXJrLzgwIG10LTFcIj5WYWx1ZTogJHsobG95YWx0eUFjY291bnQucG9pbnRzICogMC4wMSkudG9GaXhlZCgyKX08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgey8qIFJlZGVtcHRpb24gQWN0aW9ucyAqL31cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLWJyYW5kLWxpZ2h0IGJvcmRlciBib3JkZXItc2xhdGUtODAwIHJvdW5kZWQtM3hsIHAtNiB0ZXh0LWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXNsYXRlLTQwMCBtYi0zXCI+WW91IGhhdmUgZW5vdWdoIHBvaW50cyB0byBjbGFpbSBhIGRpc2NvdW50ITwvcD5cclxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVJlZGVlbVBvaW50c31cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLXNsYXRlLTkwMCBib3JkZXIgYm9yZGVyLXNsYXRlLTcwMCBob3Zlcjpib3JkZXItYnJhbmQteWVsbG93IHRleHQtYnJhbmQteWVsbG93IGZvbnQtYmxhY2sgcHktMi41IHJvdW5kZWQteGwgdGV4dC1zbSB0cmFuc2l0aW9uXCJcclxuICAgICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgUmVkZWVtIDUwMCBQb2ludHMgKCQ1LjAwIE9mZilcclxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICkgOiAoXHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYm9yZGVyIGJvcmRlci1kYXNoZWQgYm9yZGVyLXNsYXRlLTgwMCByb3VuZGVkLTN4bCBwLTggdGV4dC1jZW50ZXIgZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgbWluLWgtWzI4MHB4XVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxTaGllbGQgY2xhc3NOYW1lPVwidy0xMiBoLTEyIHRleHQtc2xhdGUtNzAwIG1iLTNcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwXCI+Tm8gTWVtYmVyIENhcmQgTG9hZGVkPC9oMz5cclxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIG1heC13LVsxODBweF0gbXQtMSBsZWFkaW5nLW5vcm1hbFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgVXNlIHRoZSBjaGVja2VyIG9uIHRoZSBsZWZ0IHRvIHNlY3VyZWx5IHJldHJpZXZlIHlvdXIgcmV3YXJkIHN0YXRpc3RpY3MuXHJcbiAgICAgICAgICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICl9XHJcblxyXG4gICAgICAgIHsvKiBWSUVXOiBTVVBQT1JUIFBBR0UgKENPTlRBQ1QgRk9STSAmIERFVEFJTEVEIE1BUCkgKi99XHJcbiAgICAgICAge2FjdGl2ZVRhYiA9PT0gJ3N1cHBvcnQnICYmIChcclxuICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIHsvKiBDb250YWN0IEhlcm8gKi99XHJcbiAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInB5LTEyIHNtOnB5LTE2IHB4LTQgc206cHgtNiBsZzpweC04IHRleHQtY2VudGVyIGJvcmRlci1iIGJvcmRlci1ncmF5LTgwMC84MCBiZy1icmFuZC1saWdodCByZWxhdGl2ZVwiPlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgdG9wLTAgbGVmdC0xLzIgLXRyYW5zbGF0ZS14LTEvMiB3LVs1MDBweF0gaC1bMjIwcHhdIGJnLWJyYW5kLXllbGxvdy81IHJvdW5kZWQtZnVsbCBibHVyLVsxMDBweF0gcG9pbnRlci1ldmVudHMtbm9uZVwiPjwvZGl2PlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWF4LXctM3hsIG14LWF1dG8gcmVsYXRpdmUgei0xMFwiPlxyXG4gICAgICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtNHhsIHNtOnRleHQtNnhsIGZvbnQtYmxhY2sgbWItMyB0ZXh0LXdoaXRlIHRyYWNraW5nLXRpZ2h0XCI+Q29udGFjdCBVczwvaDE+XHJcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCB0ZXh0LXNtIHNtOnRleHQtYmFzZSBsZWFkaW5nLXJlbGF4ZWQgbWF4LXcteGwgbXgtYXV0b1wiPlxyXG4gICAgICAgICAgICAgICAgICBHb3QgYSBjcmF2aW5nIG9yIGEgcXVlc3Rpb24/IERyb3AgdXMgYSBsaW5lLiBXZSdyZSBoZXJlIHRvIGVuc3VyZSB5b3VyIHByZW1pdW0gZGluaW5nIGV4cGVyaWVuY2UgaXMgbm90aGluZyBzaG9ydCBvZiBleHRyYW9yZGluYXJ5LlxyXG4gICAgICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICAgICAgICB7LyogU3BsaXQgTGF5b3V0IFNlY3Rpb24gKi99XHJcbiAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cIm10LTEyIG1heC13LTd4bCBteC1hdXRvIHB4LTQgc206cHgtNiBsZzpweC04IGdyaWQgZ3JpZC1jb2xzLTEgbGc6Z3JpZC1jb2xzLTEyIGdhcC0xMiBwYi0xNlwiPlxyXG4gICAgICAgICAgICAgIHsvKiBGb3JtIENhcmQgKDcgY29scykgKi99XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJsZzpjb2wtc3Bhbi03XCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXNsYXRlLTkwMC82MCBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMC84MCByb3VuZGVkLTN4bCBwLTYgc206cC04IHNoYWRvdy0yeGwgYmFja2Ryb3AtYmx1ci1zbVwiPlxyXG4gICAgICAgICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1ibGFjayBtYi02IHRleHQtc2xhdGUtMTAwXCI+U2VuZCBhIE1lc3NhZ2U8L2gyPlxyXG4gICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZUNvbnRhY3RTdWJtaXR9IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMSBzbTpncmlkLWNvbHMtMiBnYXAtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTFcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgZm9udC1ibGFjayB0cmFja2luZy13aWRlc3QgdGV4dC1zbGF0ZS00MDAgdXBwZXJjYXNlXCIgaHRtbEZvcj1cIm5hbWVcIj5GdWxsIE5hbWU8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJuYW1lXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiZS5nLiBKb2huIERvZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2NvbnRhY3ROYW1lfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0Q29udGFjdE5hbWUoZS50YXJnZXQudmFsdWUpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1zbGF0ZS04MDAgYm9yZGVyIGJvcmRlci1zbGF0ZS03MDAvNjAgcm91bmRlZC14bCBweC00IHB5LTMgdGV4dC1zbSBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLWJyYW5kLXllbGxvd1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTFcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgZm9udC1ibGFjayB0cmFja2luZy13aWRlc3QgdGV4dC1zbGF0ZS00MDAgdXBwZXJjYXNlXCIgaHRtbEZvcj1cImVtYWlsXCI+RW1haWwgQWRkcmVzczwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImVtYWlsXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiZW1haWxcIiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cImUuZy4gam9obkBleGFtcGxlLmNvbVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2NvbnRhY3RFbWFpbH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldENvbnRhY3RFbWFpbChlLnRhcmdldC52YWx1ZSl9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLXNsYXRlLTgwMCBib3JkZXIgYm9yZGVyLXNsYXRlLTcwMC82MCByb3VuZGVkLXhsIHB4LTQgcHktMyB0ZXh0LXNtIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItYnJhbmQteWVsbG93XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC14cyBmb250LWJsYWNrIHRyYWNraW5nLXdpZGVzdCB0ZXh0LXNsYXRlLTQwMCB1cHBlcmNhc2VcIiBodG1sRm9yPVwic3ViamVjdFwiPlN1YmplY3Q8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZD1cInN1YmplY3RcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkhvdyBjYW4gd2UgaGVscD9cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Y29udGFjdFN1YmplY3R9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0Q29udGFjdFN1YmplY3QoZS50YXJnZXQudmFsdWUpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctc2xhdGUtODAwIGJvcmRlciBib3JkZXItc2xhdGUtNzAwLzYwIHJvdW5kZWQteGwgcHgtNCBweS0zIHRleHQtc20gZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1icmFuZC15ZWxsb3dcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTFcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhY2tpbmctd2lkZXN0IHRleHQtc2xhdGUtNDAwIHVwcGVyY2FzZVwiIGh0bWxGb3I9XCJtZXNzYWdlXCI+WW91ciBNZXNzYWdlPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICAgIDx0ZXh0YXJlYSBcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJtZXNzYWdlXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgcm93cz17NX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJXcml0ZSB5b3VyIG1lc3NhZ2UgaGVyZS4uLlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtjb250YWN0TWVzc2FnZX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRDb250YWN0TWVzc2FnZShlLnRhcmdldC52YWx1ZSl9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1zbGF0ZS04MDAgYm9yZGVyIGJvcmRlci1zbGF0ZS03MDAvNjAgcm91bmRlZC14bCBweC00IHB5LTMgdGV4dC1zbSBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLWJyYW5kLXllbGxvdyByZXNpemUtbm9uZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkXHJcbiAgICAgICAgICAgICAgICAgICAgICA+PC90ZXh0YXJlYT5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcclxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2lzU2VuZGluZ01lc3NhZ2V9XHJcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1icmFuZC15ZWxsb3cgaG92ZXI6YmctYnJhbmQteWVsbG93SG92ZXIgdGV4dC1icmFuZC1kYXJrIGZvbnQtYmxhY2sgcHgtOCBweS0zLjUgcm91bmRlZC1mdWxsIHRyYW5zaXRpb24gZHVyYXRpb24tMzAwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0yIHRyYW5zZm9ybSBob3ZlcjpzY2FsZS0xMDVcIlxyXG4gICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgIHtpc1NlbmRpbmdNZXNzYWdlID8gKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxMb2FkZXIyIGNsYXNzTmFtZT1cInctNCBoLTQgYW5pbWF0ZS1zcGluXCIgLz4gU2VuZGluZy4uLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Lz5cclxuICAgICAgICAgICAgICAgICAgICAgICkgOiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgU2VuZCBNZXNzYWdlIDxTZW5kIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Lz5cclxuICAgICAgICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgIDwvZm9ybT5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICB7LyogRGV0YWlscyAmIE1hcCBDYXJkICg1IGNvbHMpICovfVxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGc6Y29sLXNwYW4tNSBmbGV4IGZsZXgtY29sIHNwYWNlLXktOFwiPlxyXG4gICAgICAgICAgICAgICAgey8qIENvbnRhY3QgUG9pbnRzIGxpc3QgKi99XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNiBiZy1icmFuZC1saWdodCBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMC84MCBwLTYgcm91bmRlZC0zeGxcIj5cclxuICAgICAgICAgICAgICAgICAgey8qIFJvdyAxICovfVxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtc3RhcnQgZ2FwLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTIgaC0xMiByb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci1zbGF0ZS03MDAgZmxleC1zaHJpbmstMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LWJyYW5kLXllbGxvd1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPE1hcFBpbiBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTEwMCB0ZXh0LWJhc2VcIj5PdXIgTG9jYXRpb248L2gzPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgdGV4dC1zbSBtdC0xIGxlYWRpbmctcmVsYXhlZCB3aGl0ZXNwYWNlLXByZS13cmFwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtzZXR0aW5ncz8uYWRkcmVzcyB8fCBcIjQ1MiBHb3VybWV0IEF2ZW51ZVxcbkN1bGluYXJ5IERpc3RyaWN0LCBOWSAxMDAxMlwifVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgIHsvKiBSb3cgMiAqL31cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLXN0YXJ0IGdhcC00XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTEyIGgtMTIgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItc2xhdGUtNzAwIGZsZXgtc2hyaW5rLTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1icmFuZC15ZWxsb3dcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxQaG9uZSBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTEwMCB0ZXh0LWJhc2VcIj5QaG9uZSBTdXBwb3J0PC9oMz5cclxuICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIHRleHQtc20gbXQtMSBsZWFkaW5nLXJlbGF4ZWQgd2hpdGVzcGFjZS1wcmUtd3JhcFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7c2V0dGluZ3M/LmNvbnRhY3RQaG9uZSB8fCBcIisxICg1NTUpIDEyMy00NTY3XFxuTW9uLVN1biwgMTBhbSAtIDEyYW1cIn1cclxuICAgICAgICAgICAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgICB7LyogUm93IDMgKi99XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1zdGFydCBnYXAtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xMiBoLTEyIHJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLXNsYXRlLTcwMCBmbGV4LXNocmluay0wIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtYnJhbmQteWVsbG93XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8TWFpbCBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTEwMCB0ZXh0LWJhc2VcIj5FbWFpbCBBZGRyZXNzPC9oMz5cclxuICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIHRleHQtc20gbXQtMSBsZWFkaW5nLXJlbGF4ZWQgd2hpdGVzcGFjZS1wcmUtd3JhcFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7c2V0dGluZ3M/LmNvbnRhY3RFbWFpbCB8fCBcImhlbGxvQG1hc2ppZGV0YXF3YS5jb21cXG5zdXBwb3J0QG1hc2ppZGV0YXF3YS5jb21cIn1cclxuICAgICAgICAgICAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICB7LyogTWFwIEdyYXBoaWNzICovfVxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSByb3VuZGVkLTN4bCBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMCBvdmVyZmxvdy1oaWRkZW4gc2hhZG93LTJ4bCBoLTY0IHNtOmgtNzJcIj5cclxuICAgICAgICAgICAgICAgICAgPGltZyBcclxuICAgICAgICAgICAgICAgICAgICBhbHQ9XCJDaXR5IE1hcCBOYXZpZ2F0aW9uXCIgXHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgaW5zZXQtMCB3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBvcGFjaXR5LTgwXCJcclxuICAgICAgICAgICAgICAgICAgICBzcmM9XCJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYWlkYS1wdWJsaWMvQUI2QVh1Q3lfdHRQSWd2S1QtLU81MmJxSXRKVE15eTA1Ry1NRG9KTm5qQ3l0T0VJMk5mam55VkVYcWZwSjAwcTJZVzlaOUtVRUZXblZXb3dkRXg2c3ZKNVF1bHJhRHpNZXBYY2tWMFY2NDZnQnhDNDNybkZOUndpWkFxQWhhcXhRdnlJYlZlSlNYVFRWRDk4UzMydVpMV0VJN0RORDRCMjJ1LThJQVJQS0RseWlxdlhSQl9ZNFFSSHA1YmJlMTFMaUUyOFpGc0Z4anJQYTJWUEFTejkxSUtnQmhacDhBNzJUUEc3SlV0YXc4X0tqeVlCOTY0MnhsRTFaRGFfYlBXeGRYeHpNX0VpalZYX0d3VkFLdk1cIiBcclxuICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIGJnLWdyYWRpZW50LXRvLXQgZnJvbS1icmFuZC1kYXJrLzkwIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVcIj48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgIHsvKiBPcGVuIFN0YXR1cyBCYWRnZSAqL31cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBib3R0b20tNCBsZWZ0LTQgYmctc2xhdGUtOTAwLzkwIGJhY2tkcm9wLWJsdXItbWQgYm9yZGVyIGJvcmRlci1zbGF0ZS03MDAgcHgtNCBweS0yIHJvdW5kZWQteGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgc2hhZG93LWxnXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidy0yLjUgaC0yLjUgcm91bmRlZC1mdWxsIGJnLWVtZXJhbGQtNDAwIGFuaW1hdGUtcHVsc2VcIj48L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJsYWNrIHRleHQtc2xhdGUtMTAwXCI+T3BlbiBOb3c8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICl9XHJcbiAgICAgIDwvbWFpbj5cclxuXHJcbiAgICAgIHsvKiA9PT09PT09PT09PT09PT09PSBTVElDS1kgRk9PVEVSID09PT09PT09PT09PT09PT09ICovfVxyXG4gICAgICA8Zm9vdGVyIGNsYXNzTmFtZT1cImJnLWJyYW5kLWxpZ2h0IHB0LTEyIHBiLTYgYm9yZGVyLXQgYm9yZGVyLWdyYXktODAwXCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYXgtdy03eGwgbXgtYXV0byBweC00IHNtOnB4LTYgbGc6cHgtOFwiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0xIG1kOmdyaWQtY29scy00IGdhcC0xMCBtYi0xMFwiPlxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgey8qIEJyYW5kIEluZm8gKi99XHJcbiAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtYnJhbmQteWVsbG93IGZvbnQtYmxhY2sgdGV4dC14bCBtYi00XCI+e3NldHRpbmdzPy5zaXRlVGl0bGUgfHwgJ0Q0VSBSZXN0YXVyYW50J308L2gzPlxyXG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIHRleHQtc20gbGVhZGluZy1yZWxheGVkIG1iLTYgd2hpdGVzcGFjZS1wcmUtd3JhcFwiPlxyXG4gICAgICAgICAgICAgICAge3NldHRpbmdzPy5hYm91dFRleHQgfHwgJ1RoZSBmdXR1cmUgb2YgZmFzdC1jYXN1YWwgZGluaW5nLiBQcmVtaXVtIGN1bGluYXJ5IHF1YWxpdHkgZnVzZWQgd2l0aCBzdGF0ZS1vZi10aGUtYXJ0IFBPUyBvcmRlcmluZyBtZWNoYW5pc21zLid9XHJcbiAgICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBzcGFjZS14LTRcIj5cclxuICAgICAgICAgICAgICAgIHtzZXR0aW5ncz8uZmFjZWJvb2tVcmwgJiYgPGEgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0cmFuc2l0aW9uXCIgaHJlZj17c2V0dGluZ3MuZmFjZWJvb2tVcmx9IHRhcmdldD1cIl9ibGFua1wiIGFyaWEtbGFiZWw9XCJGYWNlYm9va1wiPjxHbG9iZSBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz48L2E+fVxyXG4gICAgICAgICAgICAgICAge3NldHRpbmdzPy5pbnN0YWdyYW1VcmwgJiYgPGEgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0cmFuc2l0aW9uXCIgaHJlZj17c2V0dGluZ3MuaW5zdGFncmFtVXJsfSB0YXJnZXQ9XCJfYmxhbmtcIiBhcmlhLWxhYmVsPVwiSW5zdGFncmFtXCI+PFNoYXJlMiBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz48L2E+fVxyXG4gICAgICAgICAgICAgICAge3NldHRpbmdzPy50d2l0dGVyVXJsICYmIDxhIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgdHJhbnNpdGlvblwiIGhyZWY9e3NldHRpbmdzLnR3aXR0ZXJVcmx9IHRhcmdldD1cIl9ibGFua1wiIGFyaWEtbGFiZWw9XCJUd2l0dGVyXCI+PFNoYXJlMiBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz48L2E+fVxyXG4gICAgICAgICAgICAgICAge3NldHRpbmdzPy55b3V0dWJlVXJsICYmIDxhIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgdHJhbnNpdGlvblwiIGhyZWY9e3NldHRpbmdzLnlvdXR1YmVVcmx9IHRhcmdldD1cIl9ibGFua1wiIGFyaWEtbGFiZWw9XCJZb3VUdWJlXCI+PFNoYXJlMiBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz48L2E+fVxyXG4gICAgICAgICAgICAgICAgeyghc2V0dGluZ3M/LmZhY2Vib29rVXJsICYmICFzZXR0aW5ncz8uaW5zdGFncmFtVXJsKSAmJiAoXHJcbiAgICAgICAgICAgICAgICAgIDw+XHJcbiAgICAgICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0cmFuc2l0aW9uXCIgaHJlZj1cIiNcIiBhcmlhLWxhYmVsPVwiV2Vic2l0ZSBMaW5rXCI+PEdsb2JlIGNsYXNzTmFtZT1cInctNSBoLTVcIiAvPjwvYT5cclxuICAgICAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHRyYW5zaXRpb25cIiBocmVmPVwiI1wiIGFyaWEtbGFiZWw9XCJTaGFyZSBMaW5rXCI+PFNoYXJlMiBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz48L2E+XHJcbiAgICAgICAgICAgICAgICAgIDwvPlxyXG4gICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICB7LyogTGlua3MgY29sdW1ucyAqL31cclxuICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC13aGl0ZSBmb250LWJsYWNrIG1iLTQgdXBwZXJjYXNlIHRleHQteHMgdHJhY2tpbmctd2lkZXN0XCI+Q29udGFjdCBVczwvaDQ+XHJcbiAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cInNwYWNlLXktMiB0ZXh0LXNtXCI+XHJcbiAgICAgICAgICAgICAgICB7c2V0dGluZ3M/LmFkZHJlc3MgJiYgPGxpIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwXCI+e3NldHRpbmdzLmFkZHJlc3N9PC9saT59XHJcbiAgICAgICAgICAgICAgICB7c2V0dGluZ3M/LmNvbnRhY3RQaG9uZSAmJiA8bGkgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDBcIj57c2V0dGluZ3MuY29udGFjdFBob25lfTwvbGk+fVxyXG4gICAgICAgICAgICAgICAge3NldHRpbmdzPy5jb250YWN0RW1haWwgJiYgPGxpIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwXCI+e3NldHRpbmdzLmNvbnRhY3RFbWFpbH08L2xpPn1cclxuICAgICAgICAgICAgICAgIHsoIXNldHRpbmdzPy5hZGRyZXNzICYmICFzZXR0aW5ncz8uY29udGFjdFBob25lICYmICFzZXR0aW5ncz8uY29udGFjdEVtYWlsKSAmJiAoXHJcbiAgICAgICAgICAgICAgICAgIDw+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgdHJhbnNpdGlvblwiIGhyZWY9XCIjXCI+T3VyIEdPVVJNRVQgTWVudTwvYT48L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgIDxsaT48YSBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHRyYW5zaXRpb25cIiBocmVmPVwiI1wiPkJlc3Bva2UgTG9jYXRpb25zPC9hPjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgIDwvPlxyXG4gICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICA8L3VsPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQtd2hpdGUgZm9udC1ibGFjayBtYi00IHVwcGVyY2FzZSB0ZXh0LXhzIHRyYWNraW5nLXdpZGVzdFwiPkNvbXBhbnk8L2g0PlxyXG4gICAgICAgICAgICAgIHtzZXR0aW5ncz8uY29tcGFueVRleHQgPyAoXHJcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCB0ZXh0LXNtIHdoaXRlc3BhY2UtcHJlLXdyYXBcIj57c2V0dGluZ3MuY29tcGFueVRleHR9PC9wPlxyXG4gICAgICAgICAgICAgICkgOiAoXHJcbiAgICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwic3BhY2UteS0yIHRleHQtc21cIj5cclxuICAgICAgICAgICAgICAgICAgPGxpPjxhIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgdHJhbnNpdGlvblwiIGhyZWY9XCIjXCI+T3VyIEN1bGluYXJ5IEpvdXJuZXk8L2E+PC9saT5cclxuICAgICAgICAgICAgICAgICAgPGxpPjxhIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgdHJhbnNpdGlvblwiIGhyZWY9XCIjXCI+Q29ycG9yYXRlIFN1c3RhaW5hYmlsaXR5PC9hPjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgIDxsaT48YSBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHRyYW5zaXRpb25cIiBocmVmPVwiI1wiPktpdGNoZW4gQ2FyZWVyczwvYT48L2xpPlxyXG4gICAgICAgICAgICAgICAgICA8bGk+PGEgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0cmFuc2l0aW9uXCIgaHJlZj1cIiNcIj5JbnRlbGxlY3R1YWwgUHJpdmFjeTwvYT48L2xpPlxyXG4gICAgICAgICAgICAgICAgPC91bD5cclxuICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgIHsvKiBOZXdzbGV0dGVyIGZvcm0gKi99XHJcbiAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQtd2hpdGUgZm9udC1ibGFjayBtYi00IHVwcGVyY2FzZSB0ZXh0LXhzIHRyYWNraW5nLXdpZGVzdFwiPkpvaW4gVGhlIEQ0VTwvaDQ+XHJcbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgdGV4dC1zbSBtYi00IGxlYWRpbmctbm9ybWFsXCI+U3Vic2NyaWJlIGZvciBleGNsdXNpdmUgY2hlZiBzcGVjaWFscyBhbmQgcHJpb3JpdHkgcmVzZXJ2YXRpb25zLjwvcD5cclxuICAgICAgICAgICAgICA8Zm9ybSBcclxuICAgICAgICAgICAgICAgIG9uU3VibWl0PXthc3luYyAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0IGFzIHR5cGVvZiBlLnRhcmdldCAmIHsgZW1haWw6IHsgdmFsdWU6IHN0cmluZyB9IH07XHJcbiAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZmV0Y2goYCR7QkFDS0VORF9VUkx9L2Ntcy9zdWJzY3JpYmVgLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBzdG9yZV9pZDogc3RvcmVJZCwgZW1haWw6IHRhcmdldC5lbWFpbC52YWx1ZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXJUb2FzdChcIlN1YnNjcmliZWQgc3VjY2Vzc2Z1bGx5ISBUaGFuayB5b3UgZm9yIGpvaW5pbmcuXCIsIFwic3VjY2Vzc1wiKTtcclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuZW1haWwudmFsdWUgPSAnJztcclxuICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlclRvYXN0KFwiRmFpbGVkIHRvIHN1YnNjcmliZS4gUGxlYXNlIHRyeSBhZ2Fpbi5cIiwgXCJlcnJvclwiKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfX0gXHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4XCJcclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICA8aW5wdXQgXHJcbiAgICAgICAgICAgICAgICAgIG5hbWU9XCJlbWFpbFwiXHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLXNsYXRlLTkwMCBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMCB0ZXh0LXdoaXRlIHRleHQtc20gcm91bmRlZC1sLXhsIHB4LTQgcHktMi41IHctZnVsbCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLWJyYW5kLXllbGxvd1wiIFxyXG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkVudGVyIGVtYWlsIGFkZHJlc3NcIiBcclxuICAgICAgICAgICAgICAgICAgdHlwZT1cImVtYWlsXCJcclxuICAgICAgICAgICAgICAgICAgcmVxdWlyZWRcclxuICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJnLWJyYW5kLXllbGxvdyBob3ZlcjpiZy1icmFuZC15ZWxsb3dIb3ZlciB0ZXh0LWJyYW5kLWRhcmsgZm9udC1ibGFjayB0ZXh0LXNtIHB4LTUgcHktMi41IHJvdW5kZWQtci14bCB0cmFuc2l0aW9uXCIgdHlwZT1cInN1Ym1pdFwiPlxyXG4gICAgICAgICAgICAgICAgICBKT0lOXHJcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICA8L2Zvcm0+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIHsvKiBCb3R0b20gWWVsbG93IEJhciAqL31cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLWJyYW5kLXllbGxvdyBweS0zLjUgcmVsYXRpdmUgbXQtOFwiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYXgtdy03eGwgbXgtYXV0byBweC00IGZsZXgganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bIzBjMTMyMl0gdGV4dC14cyBmb250LWJsYWNrIHRyYWNraW5nLXdpZGVcIj5cclxuICAgICAgICAgICAgICDCqSAyMDI2IEQ0VSBSZXN0YXVyYW50IEdyb3VwLiBJbnNwaXJlZCBieSB0aGUgYm9sZC4gQnVpbHQgZm9yIHRoZSBnb3VybWV0LlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Zvb3Rlcj5cclxuXHJcbiAgICAgIHsvKiA9PT09PT09PT09PT09PT09PSBNT0RBTDogTE9DQVRJT04gU0VMRUNUT1IgKEJMT0NLSU5HIC8gVFJJR0dFUikgPT09PT09PT09PT09PT09PT0gKi99XHJcbiAgICAgIHshc2VsZWN0ZWRMb2NhdGlvbiAmJiAoXHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIHotWzE1MF0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcHgtNCBiZy1icmFuZC1kYXJrLzkwIGJhY2tkcm9wLWJsdXIteGxcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctc2xhdGUtOTAwIGJvcmRlciBib3JkZXItc2xhdGUtODAwIHJvdW5kZWQtM3hsIG1heC13LW1kIHctZnVsbCBzaGFkb3ctWzBfMjBweF81MHB4X3JnYmEoMCwwLDAsMC44KV0gcmVsYXRpdmUgb3ZlcmZsb3ctaGlkZGVuIHAtNiBzbTpwLThcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSB0b3AtMCBsZWZ0LTAgcmlnaHQtMCBoLTEgYmctZ3JhZGllbnQtdG8tciBmcm9tLXRyYW5zcGFyZW50IHZpYS1icmFuZC15ZWxsb3cgdG8tdHJhbnNwYXJlbnQgb3BhY2l0eS02MFwiPjwvZGl2PlxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBzcGFjZS15LTRcIj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTYgaC0xNiBiZy1zbGF0ZS04MDAgcm91bmRlZC1mdWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIG14LWF1dG8gYm9yZGVyIGJvcmRlci1zbGF0ZS03MDAgc2hhZG93LWlubmVyXCI+XHJcbiAgICAgICAgICAgICAgICA8TWFwUGluIGNsYXNzTmFtZT1cInctOCBoLTggdGV4dC1icmFuZC15ZWxsb3cgYW5pbWF0ZS1ib3VuY2VcIiAvPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBzbTp0ZXh0LTN4bCBmb250LWJsYWNrIHRleHQtd2hpdGUgdHJhY2tpbmctdGlnaHRcIj5TZWxlY3QgWW91ciBMb2NhdGlvbjwvaDI+XHJcbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgdGV4dC14cyBzbTp0ZXh0LXNtIG1heC13LVsyODBweF0gbXgtYXV0byBsZWFkaW5nLW5vcm1hbFwiPlxyXG4gICAgICAgICAgICAgICAgQ2hvb3NlIHlvdXIgY2l0eSBhbmQgYnJhbmNoIHRvIHNlZSB0aGUgY3VzdG9taXplZCBtZW51IGZvciB5b3VyIGxvY2FsIGFyZWEuXHJcbiAgICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVMb2NhdGlvblN1Ym1pdH0gY2xhc3NOYW1lPVwic3BhY2UteS02IG10LTZcIj5cclxuICAgICAgICAgICAgICB7LyogQ2l0eSBTZWxlY3Rpb24gKi99XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNVwiPlxyXG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ibGFjayB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCB1cHBlcmNhc2UgcHgtMVwiPkNob29zZSBDaXR5PC9sYWJlbD5cclxuICAgICAgICAgICAgICAgIDxzZWxlY3QgXHJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtzZWxlY3RlZENpdHl9XHJcbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkQ2l0eShlLnRhcmdldC52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0ZWRCcmFuY2goJycpO1xyXG4gICAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctc2xhdGUtOTUwIGJvcmRlciBib3JkZXItc2xhdGUtODAwIHRleHQtd2hpdGUgZm9udC1ib2xkIHJvdW5kZWQteGwgcHktMy41IHB4LTQgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1icmFuZC15ZWxsb3cgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctYnJhbmQteWVsbG93IHRyYW5zaXRpb25cIlxyXG4gICAgICAgICAgICAgICAgICByZXF1aXJlZFxyXG4gICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiXCIgZGlzYWJsZWQ+U2VsZWN0IGEgY2l0eS4uLjwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwia2FyYWNoaVwiPkthcmFjaGk8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImxhaG9yZVwiPkxhaG9yZTwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiaXNsYW1hYmFkXCI+SXNsYW1hYmFkPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgey8qIEJyYW5jaCBTZWxlY3Rpb24gKi99XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNVwiPlxyXG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ibGFjayB0cmFja2luZy13aWRlciB0ZXh0LXNsYXRlLTQwMCB1cHBlcmNhc2UgcHgtMVwiPkNob29zZSBCcmFuY2g8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgPHNlbGVjdCBcclxuICAgICAgICAgICAgICAgICAgdmFsdWU9e3NlbGVjdGVkQnJhbmNofVxyXG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFNlbGVjdGVkQnJhbmNoKGUudGFyZ2V0LnZhbHVlKX1cclxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFzZWxlY3RlZENpdHl9XHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1zbGF0ZS05NTAgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAgdGV4dC13aGl0ZSBmb250LWJvbGQgcm91bmRlZC14bCBweS0zLjUgcHgtNCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLWJyYW5kLXllbGxvdyBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1icmFuZC15ZWxsb3cgdHJhbnNpdGlvbiBkaXNhYmxlZDpvcGFjaXR5LTUwIGRpc2FibGVkOmN1cnNvci1ub3QtYWxsb3dlZFwiXHJcbiAgICAgICAgICAgICAgICAgIHJlcXVpcmVkXHJcbiAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIiBkaXNhYmxlZD5TZWxlY3QgYSBicmFuY2guLi48L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAge3NlbGVjdGVkQ2l0eSAmJiBCUkFOQ0hFU19CWV9DSVRZW3NlbGVjdGVkQ2l0eV0ubWFwKGIgPT4gKFxyXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24ga2V5PXtifSB2YWx1ZT17Yn0+e2J9PC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgIHsvKiBBY3Rpb24gKi99XHJcbiAgICAgICAgICAgICAgPGJ1dHRvbiBcclxuICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFzZWxlY3RlZENpdHkgfHwgIXNlbGVjdGVkQnJhbmNofVxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLWJyYW5kLXllbGxvdyB0ZXh0LWJyYW5kLWRhcmsgaG92ZXI6YmctYnJhbmQteWVsbG93SG92ZXIgZm9udC1ibGFjayBweS00IHJvdW5kZWQtZnVsbCB0cmFuc2l0aW9uIGR1cmF0aW9uLTMwMCBmbGV4IGp1c3RpZnktY2VudGVyIGl0ZW1zLWNlbnRlciBnYXAtMiBzaGFkb3ctbGcgZGlzYWJsZWQ6b3BhY2l0eS01MCBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgdHJhbnNmb3JtIGhvdmVyOnNjYWxlLVsxLjAyXVwiXHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgRW50ZXIgV2Vic2l0ZSA8QXJyb3dSaWdodCBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9mb3JtPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICl9XHJcblxyXG4gICAgICB7LyogPT09PT09PT09PT09PT09PT0gRFJBV0VSOiBTSE9QUElORyBDQVJUIFNMSURFT1ZFUiA9PT09PT09PT09PT09PT09PSAqL31cclxuICAgICAge2lzQ2FydE9wZW4gJiYgKFxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZml4ZWQgaW5zZXQtMCB6LVsxMDBdIGZsZXgganVzdGlmeS1lbmQgYmctYnJhbmQtZGFyay83MCBiYWNrZHJvcC1ibHVyLXNtXCI+XHJcbiAgICAgICAgICB7LyogQmFja2Ryb3AgQ2xpY2sgRGlzbWlzcyAqL31cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgaW5zZXQtMFwiIG9uQ2xpY2s9eygpID0+IHNldElzQ2FydE9wZW4oZmFsc2UpfT48L2Rpdj5cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSB3LWZ1bGwgbWF4LXctbWQgYmctc2xhdGUtOTAwIGgtZnVsbCBzaGFkb3ctMnhsIGZsZXggZmxleC1jb2wganVzdGlmeS1iZXR3ZWVuIHotMTAgYm9yZGVyLWwgYm9yZGVyLXNsYXRlLTgwMFwiPlxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgey8qIEhlYWRlciAqL31cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTUgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTgwMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW5cIj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XHJcbiAgICAgICAgICAgICAgICA8U2hvcHBpbmdDYXJ0IGNsYXNzTmFtZT1cInctNSBoLTUgdGV4dC1icmFuZC15ZWxsb3dcIiAvPlxyXG4gICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cImZvbnQtYmxhY2sgdGV4dC1sZyB0ZXh0LXdoaXRlXCI+WW91ciBCYXNrZXQ8L2gzPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxidXR0b24gXHJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc0NhcnRPcGVuKGZhbHNlKX1cclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgcC0yIHJvdW5kZWQtZnVsbCBob3ZlcjpiZy1zbGF0ZS04MDAgdHJhbnNpdGlvblwiXHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgPFggY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+XHJcbiAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgey8qIENhcnQgSXRlbXMgbGlzdCAqL31cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHAtNSBzcGFjZS15LTRcIj5cclxuICAgICAgICAgICAgICB7Y2FydC5sZW5ndGggPT09IDAgPyAoXHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHB5LTIwXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxTaG9wcGluZ0JhZyBjbGFzc05hbWU9XCJ3LTEyIGgtMTIgdGV4dC1zbGF0ZS03MDAgbXgtYXV0byBtYi0zIGFuaW1hdGUtcHVsc2VcIiAvPlxyXG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBmb250LWJvbGRcIj5Zb3VyIGNhcnQgaXMgZW1wdHkuPC9wPlxyXG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIG10LTFcIj5TdGFydCBhZGRpbmcgZGVsaWNpb3VzIGZvb2QgZnJvbSBvdXIgbWVudSE8L3A+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICApIDogKFxyXG4gICAgICAgICAgICAgICAgY2FydC5tYXAoaXRlbSA9PiAoXHJcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtpdGVtLnByb2R1Y3QuaWR9IGNsYXNzTmFtZT1cImJnLXNsYXRlLTk1MC82MCBwLTQgcm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAgZmxleCBmbGV4LWNvbCBnYXAtM1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtc3RhcnQgZ2FwLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJmb250LWV4dHJhYm9sZCB0ZXh0LXNtIHRleHQtc2xhdGUtMTAwXCI+e2l0ZW0ucHJvZHVjdC5uYW1lfTwvaDQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtYnJhbmQteWVsbG93IHRleHQteHMgZm9udC1ib2xkIGZvbnQtbW9ubyBtdC0xXCI+JHtpdGVtLnByb2R1Y3QucHJpY2UudG9GaXhlZCgyKX0gZWFjaDwvcD5cclxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICB7LyogUXVhbnRpdHkgQ29udHJvbHMgKi99XHJcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGJnLXNsYXRlLTkwMCBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMCByb3VuZGVkLWZ1bGwgcHgtMi41IHB5LTFcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBhZGp1c3RRdWFudGl0eShpdGVtLnByb2R1Y3QuaWQsIC0xKX0gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSBwLTFcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICA8TWludXMgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjVcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS0xMDAgdGV4dC14cyBmb250LWJvbGQgcHgtMlwiPntpdGVtLnF1YW50aXR5fTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBhZGp1c3RRdWFudGl0eShpdGVtLnByb2R1Y3QuaWQsIDEpfSBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHAtMVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxQbHVzIGNsYXNzTmFtZT1cInctMy41IGgtMy41XCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgey8qIFNwZWNpYWwgaW5zdHJ1Y3Rpb24gaW5wdXQgKi99XHJcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxyXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcclxuICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiU3BlY2lhbCBpbnN0cnVjdGlvbnMgKGUuZy4gbm8gb25pb25zKS4uLlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17aXRlbS5zcGVjaWFsSW5zdHJ1Y3Rpb25zfVxyXG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhZGRTcGVjaWFsSW5zdHJ1Y3Rpb24oaXRlbS5wcm9kdWN0LmlkLCBlLnRhcmdldC52YWx1ZSl9XHJcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1zbGF0ZS05MDAgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAvODAgcm91bmRlZC1sZyBweC0zIHB5LTEuNSB0ZXh0LXhzIHRleHQtc2xhdGUtMzAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItYnJhbmQteWVsbG93XCJcclxuICAgICAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICkpXHJcbiAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICB7LyogQ2FsY3VsYXRpb25zICYgQ2hlY2tvdXQgKi99XHJcbiAgICAgICAgICAgIHtjYXJ0Lmxlbmd0aCA+IDAgJiYgKFxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC01IGJvcmRlci10IGJvcmRlci1zbGF0ZS04MDAgYmctc2xhdGUtOTUwLzQwIHNwYWNlLXktNFwiPlxyXG4gICAgICAgICAgICAgICAgey8qIFByb21vIENvZGUgSW5mbyAqL31cclxuICAgICAgICAgICAgICAgIHthcHBsaWVkQ291cG9uICYmIChcclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgYmctYnJhbmQteWVsbG93LzUgYm9yZGVyIGJvcmRlci1icmFuZC15ZWxsb3cvMjAgcHgtMyBweS0yIHJvdW5kZWQteGwgdGV4dC14c1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtYnJhbmQteWVsbG93IGZvbnQtYmxhY2tcIj5Db3Vwb24gQXBwbGllZDoge2FwcGxpZWRDb3Vwb24uY29kZX08L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBzZXRBcHBsaWVkQ291cG9uKG51bGwpfSBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXJvc2UtNDAwIGZvbnQtYm9sZFwiPlJlbW92ZTwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICl9XHJcblxyXG4gICAgICAgICAgICAgICAgey8qIEJpbGwgQnJlYWtkb3duICovfVxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTIgdGV4dC14c1wiPlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIHRleHQtc2xhdGUtNDAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+U3VidG90YWw8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+JHtnZXRTdWJ0b3RhbCgpLnRvRml4ZWQoMil9PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAge2dldERpc2NvdW50QW1vdW50KCkgPiAwICYmIChcclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIHRleHQtYnJhbmQtcGluayBmb250LWJvbGRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPkRpc2NvdW50PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+LSR7Z2V0RGlzY291bnRBbW91bnQoKS50b0ZpeGVkKDIpfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiB0ZXh0LXNsYXRlLTQwMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPkdTVCAvIFNhbGVzIFRheCAoMTMlKTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj4ke2dldFRheCgpLnRvRml4ZWQoMil9PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiB0ZXh0LXNsYXRlLTQwMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPkRlbGl2ZXJ5IEZlZTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj57Z2V0RGVsaXZlcnlGZWUoKSA9PT0gMCA/IFwiRlJFRVwiIDogYCQke2dldERlbGl2ZXJ5RmVlKCkudG9GaXhlZCgyKX1gfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gdGV4dC1iYXNlIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBwdC0yIGJvcmRlci10IGJvcmRlci1zbGF0ZS04MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5HcmFuZCBUb3RhbDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj4ke2dldEdyYW5kVG90YWwoKS50b0ZpeGVkKDIpfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICA8YnV0dG9uIFxyXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0SXNDYXJ0T3BlbihmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0SXNDaGVja291dE9wZW4odHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1icmFuZC15ZWxsb3cgaG92ZXI6YmctYnJhbmQteWVsbG93SG92ZXIgdGV4dC1icmFuZC1kYXJrIGZvbnQtYmxhY2sgcHktNCByb3VuZGVkLXhsIHRleHQtc20gdHJhbnNpdGlvbiB0cmFja2luZy13aWRlciB1cHBlcmNhc2UgdHJhbnNmb3JtIGFjdGl2ZTpzY2FsZS05NSB0ZXh0LWNlbnRlciBmbGV4IGp1c3RpZnktY2VudGVyIGl0ZW1zLWNlbnRlciBnYXAtMlwiXHJcbiAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgIENoZWNrb3V0IE5vdyA8QXJyb3dSaWdodCBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cclxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICApfVxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICl9XHJcblxyXG4gICAgICB7LyogPT09PT09PT09PT09PT09PT0gTU9EQUw6IFBPUyBDSEVDS09VVCBGTE9XID09PT09PT09PT09PT09PT09ICovfVxyXG4gICAgICB7aXNDaGVja291dE9wZW4gJiYgKFxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZml4ZWQgaW5zZXQtMCB6LVsxMTBdIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHB4LTQgYmctYnJhbmQtZGFyay84MCBiYWNrZHJvcC1ibHVyLXNtIG92ZXJmbG93LXktYXV0b1wiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1zbGF0ZS05MDAgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAgcm91bmRlZC0zeGwgbWF4LXctbGcgdy1mdWxsIG1heC1oLVs5MHZoXSBvdmVyZmxvdy15LWF1dG8gc2hhZG93LVswXzIwcHhfNTBweF9yZ2JhKDAsMCwwLDAuOCldIHJlbGF0aXZlIHAtNiBzbTpwLThcIj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBcclxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc0NoZWNrb3V0T3BlbihmYWxzZSl9XHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgdG9wLTQgcmlnaHQtNCB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHAtMiByb3VuZGVkLWZ1bGwgaG92ZXI6Ymctc2xhdGUtODAwXCJcclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgIDxYIGNsYXNzTmFtZT1cInctNSBoLTVcIiAvPlxyXG4gICAgICAgICAgICA8L2J1dHRvbj5cclxuXHJcbiAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJsYWNrIHRleHQtd2hpdGUgbWItNlwiPkNvbXBsZXRlIFlvdXIgT3JkZXI8L2gzPlxyXG5cclxuICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVBsYWNlT3JkZXJ9IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxyXG4gICAgICAgICAgICAgIHsvKiBTZXJ2aWNlIFR5cGUgU2VsZWN0aW9uICovfVxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMyBnYXAtMlwiPlxyXG4gICAgICAgICAgICAgICAge1snREVMSVZFUlknLCAnRElORUlOJywgJ1BJQ0tVUCddLm1hcCh0eXBlID0+IChcclxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgIGtleT17dHlwZX1cclxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcclxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREZWxpdmVyeVR5cGUodHlwZSBhcyBhbnkpfVxyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB5LTIgdGV4dC14cyBmb250LWJsYWNrIHJvdW5kZWQtbGcgYm9yZGVyIHRyYW5zaXRpb24gJHtcclxuICAgICAgICAgICAgICAgICAgICAgIGRlbGl2ZXJ5VHlwZSA9PT0gdHlwZSBcclxuICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctYnJhbmQteWVsbG93IHRleHQtYnJhbmQtZGFyayBib3JkZXItYnJhbmQteWVsbG93JyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctc2xhdGUtOTUwIGJvcmRlci1zbGF0ZS04MDAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSdcclxuICAgICAgICAgICAgICAgICAgICB9YH1cclxuICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgIHt0eXBlfVxyXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICB7LyogQ3VzdG9tZXIgSW5mbyAqL31cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxyXG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYmxhY2sgdHJhY2tpbmctd2lkZXN0IHRleHQtc2xhdGUtNDAwIHVwcGVyY2FzZVwiPkN1c3RvbWVyIE5hbWU8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgPGlucHV0IFxyXG4gICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiIFxyXG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cImUuZy4gSm9obiBEb2VcIlxyXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17Y3VzdG9tZXJOYW1lfVxyXG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEN1c3RvbWVyTmFtZShlLnRhcmdldC52YWx1ZSl9XHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1zbGF0ZS05NTAgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAgcm91bmRlZC14bCBweC00IHB5LTMgdGV4dC1zbSBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLWJyYW5kLXllbGxvd1wiXHJcbiAgICAgICAgICAgICAgICAgIHJlcXVpcmVkXHJcbiAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxyXG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYmxhY2sgdHJhY2tpbmctd2lkZXN0IHRleHQtc2xhdGUtNDAwIHVwcGVyY2FzZVwiPkNvbnRhY3QgUGhvbmU8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgPGlucHV0IFxyXG4gICAgICAgICAgICAgICAgICB0eXBlPVwidGVsXCIgXHJcbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiZS5nLiArMSAoNTU1KSAxMjMtNDU2N1wiXHJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtjdXN0b21lclBob25lfVxyXG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEN1c3RvbWVyUGhvbmUoZS50YXJnZXQudmFsdWUpfVxyXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctc2xhdGUtOTUwIGJvcmRlciBib3JkZXItc2xhdGUtODAwIHJvdW5kZWQteGwgcHgtNCBweS0zIHRleHQtc20gZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1icmFuZC15ZWxsb3dcIlxyXG4gICAgICAgICAgICAgICAgICByZXF1aXJlZFxyXG4gICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAge2RlbGl2ZXJ5VHlwZSA9PT0gJ0RFTElWRVJZJyA/IChcclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xIGFuaW1hdGUtZmFkZS1pblwiPlxyXG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ibGFjayB0cmFja2luZy13aWRlc3QgdGV4dC1zbGF0ZS00MDAgdXBwZXJjYXNlXCI+RGVsaXZlcnkgQWRkcmVzczwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgIDx0ZXh0YXJlYSBcclxuICAgICAgICAgICAgICAgICAgICByb3dzPXsyfVxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiRW50ZXIgYWJzb2x1dGUgZHJvcC1vZmYgc3RyZWV0IGRldGFpbHMuLi5cIlxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtjdXN0b21lckFkZHJlc3N9XHJcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRDdXN0b21lckFkZHJlc3MoZS50YXJnZXQudmFsdWUpfVxyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1zbGF0ZS05NTAgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAgcm91bmRlZC14bCBweC00IHB5LTMgdGV4dC1zbSBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLWJyYW5kLXllbGxvdyByZXNpemUtbm9uZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWRcclxuICAgICAgICAgICAgICAgICAgPjwvdGV4dGFyZWE+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICApIDogKFxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEgYW5pbWF0ZS1mYWRlLWluXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJsYWNrIHRyYWNraW5nLXdpZGVzdCB0ZXh0LXNsYXRlLTQwMCB1cHBlcmNhc2VcIj5UYWJsZSBOdW1iZXIgLyBOb3RlPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgPGlucHV0IFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgXHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJlLmcuIFRhYmxlICM1IG9yIENvdW50ZXIgcGlja3VwXCJcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17dGFibGVOdW1iZXJ9XHJcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRUYWJsZU51bWJlcihlLnRhcmdldC52YWx1ZSl9XHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLXNsYXRlLTk1MCBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMCByb3VuZGVkLXhsIHB4LTQgcHktMyB0ZXh0LXNtIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItYnJhbmQteWVsbG93XCJcclxuICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICl9XHJcblxyXG4gICAgICAgICAgICAgIHsvKiBQYXltZW50IE1ldGhvZHMgKi99XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTFcIj5cclxuICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJsYWNrIHRyYWNraW5nLXdpZGVzdCB0ZXh0LXNsYXRlLTQwMCB1cHBlcmNhc2VcIj5QYXltZW50IE1ldGhvZDwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTJcIj5cclxuICAgICAgICAgICAgICAgICAge1tcclxuICAgICAgICAgICAgICAgICAgICB7IGtleTogJ0NBU0gnLCBsYWJlbDogJ0Nhc2ggUGF5bWVudCcgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGtleTogJ0NBUkQnLCBsYWJlbDogJ0NyZWRpdCBDYXJkJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsga2V5OiAnQ09EJywgbGFiZWw6ICdDYXNoIG9uIERlbGl2ZXJ5JyB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsga2V5OiAnV0FMTEVUJywgbGFiZWw6ICdEaWdpdGFsIFdhbGxldCcgfVxyXG4gICAgICAgICAgICAgICAgICBdLm1hcChtZXRob2QgPT4gKFxyXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICAgICAgICAgIGtleT17bWV0aG9kLmtleX1cclxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0UGF5bWVudE1ldGhvZChtZXRob2Qua2V5IGFzIGFueSl9XHJcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweS0zIHRleHQteHMgZm9udC1ib2xkIHJvdW5kZWQteGwgYm9yZGVyIHRleHQtY2VudGVyIHRyYW5zaXRpb24gJHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF5bWVudE1ldGhvZCA9PT0gbWV0aG9kLmtleSBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1icmFuZC15ZWxsb3cgdGV4dC1icmFuZC1kYXJrIGJvcmRlci1icmFuZC15ZWxsb3cgZm9udC1ibGFjaycgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctc2xhdGUtOTUwIGJvcmRlci1zbGF0ZS04MDAgdGV4dC1zbGF0ZS00MDAnXHJcbiAgICAgICAgICAgICAgICAgICAgICB9YH1cclxuICAgICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7bWV0aG9kLmxhYmVsfVxyXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICApKX1cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICB7LyogQ29uZmlybSBCaWxsIHN1bW1hcnkgKi99XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1zbGF0ZS05NTAvNTAgcm91bmRlZC0yeGwgcC00IGJvcmRlciBib3JkZXItc2xhdGUtODAwIHRleHQteHMgc3BhY2UteS0xXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIHRleHQtc2xhdGUtNDAwXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxzcGFuPlRheCAmIERlbGl2ZXJ5IEZlZSBpbmNsdWRlZDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtd2hpdGVcIj4ke2dldEdyYW5kVG90YWwoKS50b0ZpeGVkKDIpfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICA8YnV0dG9uIFxyXG4gICAgICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17aXNTdWJtaXR0aW5nT3JkZXJ9XHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctYnJhbmQteWVsbG93IHRleHQtYnJhbmQtZGFyayBob3ZlcjpiZy1icmFuZC15ZWxsb3dIb3ZlciBmb250LWJsYWNrIHB5LTQgcm91bmRlZC14bCB0cmFuc2l0aW9uIGZsZXgganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIGdhcC0yIHNoYWRvdy1sZyBkaXNhYmxlZDpvcGFjaXR5LTUwIHRyYW5zZm9ybSBob3ZlcjpzY2FsZS1bMS4wMl0gdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIHRleHQtc20gbXQtNFwiXHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAge2lzU3VibWl0dGluZ09yZGVyID8gKFxyXG4gICAgICAgICAgICAgICAgICA8PlxyXG4gICAgICAgICAgICAgICAgICAgIDxMb2FkZXIyIGNsYXNzTmFtZT1cInctNSBoLTUgYW5pbWF0ZS1zcGluXCIgLz4gVHJhbnNtaXR0aW5nIFBPUyBPcmRlci4uLlxyXG4gICAgICAgICAgICAgICAgICA8Lz5cclxuICAgICAgICAgICAgICAgICkgOiAoXHJcbiAgICAgICAgICAgICAgICAgIFwiUGxhY2UgT3JkZXJcIlxyXG4gICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9mb3JtPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICl9XHJcblxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufVxyXG4iXSwiZmlsZSI6Ikc6L1JFU1RBVVJBTlRfUE9TX1dJVEhfQkFDS0VORC9kNHUtd2Vic2l0ZS9zcmMvY29tcG9uZW50cy9TdGl0Y2hMYW5kaW5nLnRzeCJ9