import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/LandingMode.tsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=013c4788"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$();
import __vite__cjsImport1_react from "/node_modules/.vite/deps/react.js?v=013c4788"; const useState = __vite__cjsImport1_react["useState"]; const useEffect = __vite__cjsImport1_react["useEffect"];
import { io } from "/node_modules/.vite/deps/socket__io-client.js?v=013c4788";
const BACKEND_URL = "http://" + (typeof window !== "undefined" ? window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname : "127.0.0.1") + ":3001";
const socket = io(BACKEND_URL);
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
  Utensils,
  Globe,
  Share2,
  Award,
  CheckCircle2,
  PartyPopper,
  MapPin,
  Tag,
  Megaphone
} from "/node_modules/.vite/deps/lucide-react.js?v=013c4788";
export default function LandingMode({
  storeId,
  storeName = "D4U",
  stores = [],
  onStoreChange,
  foodItems,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onClearCart,
  banners: propBanners = [],
  campaigns = []
}) {
  _s();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [notificationMsg, setNotificationMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [newsLetterJoined, setNewsletterJoined] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState(null);
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [customer, setCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("d4u_customer") || "null");
    } catch {
      return null;
    }
  });
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginAddress, setLoginAddress] = useState("");
  const [loginError, setLoginError] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [trackId, setTrackId] = useState("");
  const [trackPhone, setTrackPhone] = useState("");
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [activeCampaignModal, setActiveCampaignModal] = useState(null);
  const [isCheckoutProfileOpen, setIsCheckoutProfileOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [staffMembers, setStaffMembers] = useState([]);
  useEffect(() => {
    if (storeId) {
      fetch(`${BACKEND_URL}/users?store_id=${storeId}`).then((res) => res.json()).then((data) => {
        if (Array.isArray(data)) {
          setStaffMembers(data.filter((u) => {
            const roleName = u.role?.name?.toLowerCase() || "";
            return roleName !== "rider" && roleName !== "superadmin";
          }));
        }
      }).catch(console.error);
    }
  }, [storeId]);
  useEffect(() => {
    if (customer?.id && siteSettings?.module_loyalty_enabled) {
      fetch(`${BACKEND_URL}/customers/${customer.id}/wallet`).then((res) => res.json()).then((data) => {
        if (data.loyalty_points !== void 0 && data.loyalty_points !== customer.loyalty_points) {
          const updatedCustomer = { ...customer, loyalty_points: data.loyalty_points };
          setCustomer(updatedCustomer);
          localStorage.setItem("d4u_customer", JSON.stringify(updatedCustomer));
        }
      }).catch(console.error);
    }
  }, [customer?.id, siteSettings?.module_loyalty_enabled]);
  const [checkoutError, setCheckoutError] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [banners, setBanners] = useState(propBanners || []);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [siteSettings, setSiteSettings] = useState(null);
  useEffect(() => {
    if (propBanners && propBanners.length > 0) {
      setBanners(propBanners.filter((ban) => ban.isActive).sort((x, y) => x.displayOrder - y.displayOrder));
    }
  }, [propBanners]);
  useEffect(() => {
    const fetchCmsData = async () => {
      try {
        const settingsRes = await fetch(`${BACKEND_URL}/cms/settings`);
        if (settingsRes.ok) setSiteSettings(await settingsRes.json());
      } catch (e) {
        console.error("CMS fetch error", e);
      }
    };
    fetchCmsData();
  }, []);
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5e3);
    return () => clearInterval(interval);
  }, [banners]);
  useEffect(() => {
    if (!customer || !isMyOrdersOpen) return;
    const fetchMyOrders = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/online-orders?phone=${encodeURIComponent(customer.phone)}`);
        if (res.ok) setMyOrders(await res.json());
      } catch {
      }
    };
    fetchMyOrders();
  }, [customer, isMyOrdersOpen]);
  useEffect(() => {
    const handleOrderUpdate = (updatedOrder) => {
      setMyOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === updatedOrder.id);
        if (idx > -1) {
          const newOrders = [...prev];
          newOrders[idx] = updatedOrder;
          return newOrders;
        }
        return prev;
      });
      setTrackedOrder((prev) => {
        if (prev && prev.id === updatedOrder.id) return updatedOrder;
        return prev;
      });
      setTrackResult((prev) => {
        if (prev && prev.id === updatedOrder.id) return updatedOrder;
        return prev;
      });
    };
    const handleGpsUpdate = (data) => {
      setTrackedOrder((prev) => {
        if (prev && prev.id === data.orderId) {
          return { ...prev, delivery: { ...prev.delivery, lat: data.lat, lng: data.lng } };
        }
        return prev;
      });
      setTrackResult((prev) => {
        if (prev && prev.id === data.orderId) {
          return { ...prev, delivery: { ...prev.delivery, lat: data.lat, lng: data.lng } };
        }
        return prev;
      });
    };
    socket.on("order_updated", handleOrderUpdate);
    socket.on("gps_update", handleGpsUpdate);
    return () => {
      socket.off("order_updated", handleOrderUpdate);
      socket.off("gps_update", handleGpsUpdate);
    };
  }, []);
  const handleLogin = async (e) => {
    e.preventDefault();
    const name = loginName.trim();
    const phone = loginPhone.trim();
    const address = loginAddress.trim();
    if (!name || !phone || !address) {
      setLoginError("Name, Phone aur Address sab zaroori hain");
      return;
    }
    if (phone.length < 7) {
      setLoginError("Valid phone number enter karein");
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: 1, name, phone, address })
      });
      if (res.ok) {
        const data = await res.json();
        const c = { id: data.id, name: data.name, phone: data.phone, address: data.address || address, loyalty_points: data.loyalty_points || 0 };
        localStorage.setItem("d4u_customer", JSON.stringify(c));
        setCustomer(c);
        setIsLoginOpen(false);
        setLoginName("");
        setLoginPhone("");
        setLoginAddress("");
        setLoginError("");
      } else {
        setLoginError("Server error while saving customer");
      }
    } catch (err) {
      setLoginError("Network error connecting to backend");
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("d4u_customer");
    setCustomer(null);
    setIsMyOrdersOpen(false);
    setMyOrders([]);
  };
  const handleTrackOrder = async (e) => {
    e.preventDefault();
    const id = trackId.trim();
    const phone = trackPhone.trim();
    if (!id && !phone) {
      setTrackError("Order ID ya Phone zaroori hai");
      return;
    }
    setTrackLoading(true);
    setTrackError("");
    setTrackResult(null);
    try {
      if (id) {
        const res = await fetch(`${BACKEND_URL}/online-orders/${id}`);
        if (!res.ok) {
          setTrackError("Order nahi mila — ID check karein");
          setTrackLoading(false);
          return;
        }
        const data = await res.json();
        if (phone && data.customerPhone && data.customerPhone !== phone) {
          setTrackError("Phone number match nahi kiya");
          setTrackLoading(false);
          return;
        }
        setTrackResult(data);
      } else if (phone) {
        const res = await fetch(`${BACKEND_URL}/online-orders?phone=${encodeURIComponent(phone)}`);
        if (!res.ok) {
          setTrackError("Failed to fetch orders");
          setTrackLoading(false);
          return;
        }
        const data = await res.json();
        if (!data || data.length === 0) {
          setTrackError("Is phone number par koi order nahi mila");
          setTrackLoading(false);
          return;
        }
        setTrackResult(data[data.length - 1]);
      }
    } catch {
      setTrackError("Bridge offline — baad mein try karein");
    }
    setTrackLoading(false);
  };
  const handleSubmitFeedback = async () => {
    const targetOrder = trackResult || trackedOrder;
    if (!targetOrder || !feedbackRating) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch(`${BACKEND_URL}/online-orders/${targetOrder.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    } catch {
    }
    setIsSubmittingFeedback(false);
  };
  useEffect(() => {
    if (!trackedOrderId) return;
    const fetchInitial = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/online-orders/${trackedOrderId}`);
        if (res.ok) {
          setTrackedOrder(await res.json());
        }
      } catch {
      }
    };
    fetchInitial();
  }, [trackedOrderId]);
  const handleNewsletterJoin = (e) => {
    e.preventDefault();
    if (!emailValue) return;
    setNewsletterJoined(true);
    setEmailValue("");
    setTimeout(() => {
      setNewsletterJoined(false);
    }, 4e3);
  };
  const handleAddToCartWithNotify = (item) => {
    onAddToCart(item);
    setNotificationMsg(`Added ${item.name} to Basket!`);
    setTimeout(() => {
      setNotificationMsg("");
    }, 2e3);
  };
  const fallbackItem = {
    id: "0",
    name: "Loading...",
    priceRs: 0,
    priceUSD: 0,
    description: "Please wait...",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80",
    category: "",
    tag: ""
  };
  const megaZinger = foodItems.find((i) => i.id === "3") || foodItems[0] || fallbackItem;
  const midnightPizza = foodItems.find((i) => i.id === "8") || foodItems[1] || fallbackItem;
  const rigatoniItem = foodItems.find((i) => i.id === "11") || foodItems[2] || fallbackItem;
  const goldLeafShake = foodItems.find((i) => i.id === "14") || foodItems[3] || fallbackItem;
  const lavaNoir = foodItems.find((i) => i.id === "15") || foodItems[4] || fallbackItem;
  const sunsetSpritz = foodItems.find((i) => i.id === "13") || foodItems[5] || fallbackItem;
  const subtotalUSD = cart.reduce((sum, item) => sum + item.foodItem.priceUSD * item.quantity, 0);
  const taxUSD = subtotalUSD * 0.08;
  const loyaltyDiscount = useLoyaltyPoints && customer?.loyalty_points ? Math.min(customer.loyalty_points * 0.1, subtotalUSD) : 0;
  const totalUSD = subtotalUSD + taxUSD - loyaltyDiscount;
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const submitOrder = async (custInfo) => {
    setIsSubmittingOrder(true);
    try {
      const payload = {
        store_id: storeId,
        customer: custInfo.name || "Online Guest",
        customerPhone: custInfo.phone || "",
        customerAddress: custInfo.address || "123 Test Address, City",
        items: JSON.stringify(cart.map((c) => ({
          id: c.foodItem.id,
          name: c.foodItem.name,
          qty: c.quantity,
          price: c.foodItem.priceUSD
        }))),
        totalAmount: totalUSD.toFixed(2),
        source: "Website",
        notes: ""
      };
      const res = await fetch(`${BACKEND_URL}/online-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setTrackedOrderId(data.order?.id || null);
        setTrackedOrder(data.order || null);
        if (useLoyaltyPoints && custInfo.id && loyaltyDiscount > 0) {
          const pointsUsed = Math.ceil(loyaltyDiscount / 0.1);
          try {
            await fetch(`${BACKEND_URL}/customers/${custInfo.id}/redeem`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ points: pointsUsed })
            });
            const updatedC = { ...custInfo, loyalty_points: Math.max(0, (custInfo.loyalty_points || 0) - pointsUsed) };
            setCustomer(updatedC);
            localStorage.setItem("d4u_customer", JSON.stringify(updatedC));
          } catch (err) {
            console.error("Failed to redeem points", err);
          }
        }
        onClearCart();
        setIsCartOpen(false);
        setOrderConfirmed(true);
      } else {
        const err = await res.text();
        setErrorMsg("Failed to place order (HTTP " + res.status + " at " + res.url + "): " + err);
        setTimeout(() => setErrorMsg(""), 8e3);
      }
    } catch (error) {
      setErrorMsg("Network error connecting to backend: " + error.message);
      setTimeout(() => setErrorMsg(""), 8e3);
    }
    setIsSubmittingOrder(false);
  };
  const handleCheckoutProfileSubmit = async (e) => {
    e.preventDefault();
    const name = checkoutName.trim();
    const phone = checkoutPhone.trim();
    const address = checkoutAddress.trim();
    if (!name || !phone || !address) {
      setCheckoutError("Name, Phone, and Delivery Address are all required.");
      return;
    }
    if (phone.length < 7) {
      setCheckoutError("Please enter a valid phone number.");
      return;
    }
    const c = { name, phone, address };
    localStorage.setItem("d4u_customer", JSON.stringify(c));
    setCustomer(c);
    setIsCheckoutProfileOpen(false);
    await submitOrder(c);
  };
  return /* @__PURE__ */ jsxDEV("div", { id: "landing-layout-root", className: "min-h-screen bg-[#0c1322] text-[#dce2f7] select-none font-sans overflow-x-hidden", children: [
    notificationMsg && /* @__PURE__ */ jsxDEV("div", { id: "toast-notify", className: "fixed bottom-6 left-6 z-[999] bg-[#ffe1a7] text-slate-950 px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-2xl animate-bounce", children: [
      /* @__PURE__ */ jsxDEV(CheckCircle2, { className: "w-4 h-4 text-[#003824]" }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 485,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("span", { children: notificationMsg }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 486,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 484,
      columnNumber: 7
    }, this),
    errorMsg && /* @__PURE__ */ jsxDEV("div", { id: "toast-error", className: "fixed bottom-6 left-6 z-[999] bg-red-500 text-white px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-2xl animate-bounce", children: /* @__PURE__ */ jsxDEV("span", { children: errorMsg }, void 0, false, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 492,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 491,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("header", { id: "landing-master-header", className: "sticky top-0 left-0 w-full z-50 transition-all duration-300 px-8 h-20 flex justify-between items-center bg-[#0c1322]/90 backdrop-blur-md border-b border-slate-800/40", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-10", children: [
        /* @__PURE__ */ jsxDEV("h1", { className: "font-headline-md text-2xl font-black text-[#ffe1a7] tracking-tight cursor-pointer", children: [
          "D4U - ",
          storeName
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 498,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("nav", { className: "hidden md:flex items-center gap-6", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-xs text-[#ffe1a7] border-b-2 border-[#ffe1a7] pb-1 transition-all uppercase tracking-widest cursor-pointer", children: "Menu" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 500,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-xs text-[#d3c5ac] hover:text-[#ffe1a7] transition-all uppercase tracking-widest cursor-pointer", children: "Deals" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 501,
            columnNumber: 13
          }, this),
          siteSettings?.module_loyalty_enabled && /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-xs text-[#d3c5ac] hover:text-[#ffe1a7] transition-all uppercase tracking-widest cursor-pointer", children: "Rewards" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 503,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-xs text-[#d3c5ac] hover:text-[#ffe1a7] transition-all uppercase tracking-widest cursor-pointer", children: "Support" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 505,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 499,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 497,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "p-2 text-[#d3c5ac] hover:text-[#ffe1a7] transition-colors", children: /* @__PURE__ */ jsxDEV(Search, { className: "w-5 h-5" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 511,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 510,
          columnNumber: 11
        }, this),
        customer ? /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setIsMyOrdersOpen(true),
              className: "flex items-center gap-2 bg-[#191f2f] border border-[#fbbf24]/40 hover:border-[#fbbf24] px-3 py-1.5 rounded-full transition-all",
              children: [
                /* @__PURE__ */ jsxDEV("div", { className: "w-6 h-6 rounded-full bg-[#fbbf24] flex items-center justify-center text-slate-900 text-[10px] font-black", children: (customer.name || "U").charAt(0).toUpperCase() }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 522,
                  columnNumber: 17
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-[#ffe1a7] max-w-[80px] truncate hidden sm:block", children: customer.name }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 525,
                  columnNumber: 17
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 518,
              columnNumber: 15
            },
            this
          ),
          siteSettings?.module_loyalty_enabled && /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 px-3 py-1.5 rounded-full", title: "Your Loyalty Points", children: [
            /* @__PURE__ */ jsxDEV(Award, { className: "w-3.5 h-3.5 text-amber-400" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 529,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-black text-amber-400", children: [
              customer.loyalty_points || 0,
              " pts"
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 530,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 528,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 517,
          columnNumber: 11
        }, this) : /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
          trackedOrderId && /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => {
                setTrackId(String(trackedOrderId));
                setTrackResult(trackedOrder);
                setTrackError("");
                setIsTrackOpen(true);
              },
              className: "flex items-center gap-2 bg-[#141b2b] border border-[#4edea3]/40 hover:border-[#4edea3] px-3 py-1.5 rounded-full transition-all",
              children: [
                /* @__PURE__ */ jsxDEV("span", { className: "w-2 h-2 rounded-full bg-[#4edea3] animate-pulse flex-shrink-0" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 547,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-black text-[#4edea3]", children: [
                  "Order #",
                  trackedOrderId
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 548,
                  columnNumber: 19
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 538,
              columnNumber: 13
            },
            this
          ),
          siteSettings?.module_loyalty_enabled && /* @__PURE__ */ jsxDEV("button", { onClick: () => setIsLoginOpen(true), className: "p-2 text-[#d3c5ac] hover:text-[#ffe1a7] transition-colors", children: /* @__PURE__ */ jsxDEV(User, { className: "w-5 h-5" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 553,
            columnNumber: 19
          }, this) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 552,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 535,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => {
              setIsTrackOpen(true);
              setTrackResult(null);
              setTrackError("");
              setTrackId("");
              setTrackPhone("");
            },
            className: "p-2 text-[#4edea3] hover:scale-110 transition-transform cursor-pointer flex items-center gap-1.5",
            title: "Track Order",
            children: [
              /* @__PURE__ */ jsxDEV(MapPin, { className: "w-5 h-5 stroke-[2]" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 564,
                columnNumber: 13
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold uppercase tracking-widest hidden sm:block", children: "Track" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 565,
                columnNumber: 13
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 559,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setIsCartOpen(!isCartOpen),
            className: "relative p-2 text-[#ffe1a7] hover:scale-110 transition-transform cursor-pointer ml-1",
            children: [
              /* @__PURE__ */ jsxDEV(ShoppingCart, { className: "w-6 h-6 stroke-[2]" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 572,
                columnNumber: 13
              }, this),
              totalItemCount > 0 && /* @__PURE__ */ jsxDEV("span", { className: "absolute top-0 right-0 bg-[#fbbf24] text-slate-950 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-slate-900", children: totalItemCount }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 574,
                columnNumber: 13
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 568,
            columnNumber: 11
          },
          this
        )
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 509,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 496,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("main", { className: "relative pb-24", children: [
      /* @__PURE__ */ jsxDEV("section", { id: "landing-hero", className: "relative h-[90vh] w-full flex items-center justify-start overflow-hidden px-8", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 z-0 transition-opacity duration-1000", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-r from-[#0c1322] via-[#0c1322]/80 to-transparent z-10" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 586,
            columnNumber: 13
          }, this),
          banners.length > 0 ? /* @__PURE__ */ jsxDEV(
            "img",
            {
              alt: banners[currentBannerIndex].title,
              className: "w-full h-full object-cover object-center image-no-referrer animate-fade-in",
              src: `${BACKEND_URL}${banners[currentBannerIndex].imageUrl}`,
              referrerPolicy: "no-referrer"
            },
            banners[currentBannerIndex].id,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 588,
              columnNumber: 13
            },
            this
          ) : /* @__PURE__ */ jsxDEV(
            "img",
            {
              alt: "Default Hero Banner",
              className: "w-full h-full object-cover object-center image-no-referrer",
              src: megaZinger.image,
              referrerPolicy: "no-referrer"
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 596,
              columnNumber: 13
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 585,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "relative z-20 max-w-3xl space-y-6", children: banners.length > 0 ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
          banners[currentBannerIndex].subtitle && /* @__PURE__ */ jsxDEV("span", { className: "inline-block bg-[#fbbf24] text-slate-950 px-4 py-1.5 rounded-full font-bold text-[10px] tracking-widest uppercase animate-slide-up", children: banners[currentBannerIndex].subtitle }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 609,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("h1", { className: "text-5xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tighter text-white animate-slide-up", children: banners[currentBannerIndex].title ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
            banners[currentBannerIndex].title.split(" ").slice(0, -1).join(" "),
            " ",
            /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 616,
              columnNumber: 93
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[#fbbf24]", children: banners[currentBannerIndex].title.split(" ").slice(-1).join(" ") }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 617,
              columnNumber: 23
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 615,
            columnNumber: 17
          }, this) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
            "WELCOME TO ",
            /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 621,
              columnNumber: 34
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[#fbbf24]", children: "DINEDASH" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 622,
              columnNumber: 23
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 620,
            columnNumber: 17
          }, this) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 613,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex gap-4 pt-2 animate-slide-up", style: { animationDelay: "0.2s" }, children: [
            banners[currentBannerIndex].linkUrl ? /* @__PURE__ */ jsxDEV(
              "a",
              {
                href: banners[currentBannerIndex].linkUrl,
                className: "h-16 px-10 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-extrabold rounded-full hover:scale-105 transition-transform flex items-center gap-2 text-xs tracking-wider cursor-pointer",
                children: [
                  banners[currentBannerIndex].buttonText || "ORDER NOW",
                  /* @__PURE__ */ jsxDEV(ArrowRight, { className: "w-4 h-4 stroke-[2.5]" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                    lineNumber: 633,
                    columnNumber: 23
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 628,
                columnNumber: 17
              },
              this
            ) : /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" }),
                className: "h-16 px-10 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-extrabold rounded-full hover:scale-105 transition-transform flex items-center gap-2 text-xs tracking-wider cursor-pointer",
                children: [
                  banners[currentBannerIndex].buttonText || "ORDER NOW",
                  /* @__PURE__ */ jsxDEV(ArrowRight, { className: "w-4 h-4 stroke-[2.5]" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                    lineNumber: 641,
                    columnNumber: 23
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 636,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" }),
                className: "h-16 px-10 border-2 border-[#4f4633]/70 hover:border-amber-400 text-white font-extrabold rounded-full hover:bg-slate-800/40 transition-colors text-xs tracking-wider cursor-pointer hidden md:flex items-center",
                children: "VIEW THE MENU"
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 644,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 626,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 607,
          columnNumber: 13
        }, this) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("span", { className: "inline-block bg-[#fbbf24] text-slate-950 px-4 py-1.5 rounded-full font-bold text-[10px] tracking-widest uppercase", children: megaZinger.tag }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 654,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("h1", { className: "text-5xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tighter text-white", children: [
            "THE MEGA ",
            /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 658,
              columnNumber: 28
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[#fbbf24]", children: (megaZinger?.name || "").split(" ").slice(2).join(" ").toUpperCase() || "ZINGER EVO" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 659,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 657,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-sm md:text-base text-[#d3c5ac] max-w-lg leading-relaxed font-semibold", children: megaZinger.description }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 661,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex gap-4 pt-2", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" }),
                className: "h-16 px-10 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-extrabold rounded-full hover:scale-105 transition-transform flex items-center gap-2 text-xs tracking-wider cursor-pointer",
                children: [
                  "ORDER NOW",
                  /* @__PURE__ */ jsxDEV(ArrowRight, { className: "w-4 h-4 stroke-[2.5]" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                    lineNumber: 670,
                    columnNumber: 21
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 665,
                columnNumber: 19
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" }),
                className: "h-16 px-10 border-2 border-[#4f4633]/70 hover:border-amber-400 text-white font-extrabold rounded-full hover:bg-slate-800/40 transition-colors text-xs tracking-wider cursor-pointer",
                children: "VIEW THE MENU"
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 672,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 664,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 653,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 605,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-8 z-30 overflow-x-auto max-w-full px-8 pb-4 custom-scrollbar", children: [...new Set(foodItems.map((f) => f.category))].slice(0, 5).map((category, idx) => {
          const icons = { "Burgers": "🍔", "Pizzas": "🍕", "Drinks": "🍹", "Sides": "🍟", "Desserts": "🍦" };
          const icon = icons[category] || "🍽️";
          return /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => {
                document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" });
                setActiveCategory(category);
              },
              className: `group flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 ${activeCategory === category ? "scale-110" : ""}`,
              children: [
                /* @__PURE__ */ jsxDEV("div", { className: `w-16 h-16 rounded-full bg-[#191f2f]/85 backdrop-blur-md border flex items-center justify-center text-2xl group-hover:bg-[#fbbf24] transition-all shadow-xl ${activeCategory === category ? "border-[#fbbf24] bg-[#fbbf24]" : "border-[#4f4633]"}`, children: icon }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 696,
                  columnNumber: 17
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: `text-[9px] font-bold tracking-widest transition-colors uppercase ${activeCategory === category ? "text-amber-300" : "text-slate-400 group-hover:text-amber-300"}`, children: category }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 699,
                  columnNumber: 17
                }, this)
              ]
            },
            `banner-cat-${idx}`,
            true,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 688,
              columnNumber: 17
            },
            this
          );
        }) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 683,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 584,
        columnNumber: 9
      }, this),
      campaigns.length > 0 && /* @__PURE__ */ jsxDEV("section", { className: "py-12 px-8 max-w-7xl mx-auto bg-slate-900/30 mt-12 mb-12 rounded-[40px] border border-slate-800/40", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-end mb-12", children: /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold uppercase tracking-widest text-[#ec4899]", children: "Limited Time" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 710,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("h2", { className: "text-4xl lg:text-5xl font-black uppercase text-white mt-2 leading-none flex items-center gap-4", children: [
            /* @__PURE__ */ jsxDEV(Megaphone, { className: "text-[#ec4899] w-10 h-10" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 712,
              columnNumber: 19
            }, this),
            " Special Offers"
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 711,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 709,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 708,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: campaigns.map(
          (camp) => /* @__PURE__ */ jsxDEV(
            "div",
            {
              onClick: () => {
                if (camp.target_products?.length > 0) setActiveCampaignModal(camp);
              },
              className: "relative overflow-hidden rounded-[32px] bg-[#191f2f] border border-slate-700 p-6 flex flex-col gap-6 group hover:border-[#ec4899]/50 transition-colors shadow-2xl cursor-pointer",
              children: [
                camp.image_url ? /* @__PURE__ */ jsxDEV("div", { className: "w-full h-48 rounded-2xl overflow-hidden relative border border-slate-700", children: /* @__PURE__ */ jsxDEV("img", { src: `${BACKEND_URL}${camp.image_url}`, alt: camp.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 726,
                  columnNumber: 24
                }, this) }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 725,
                  columnNumber: 15
                }, this) : null,
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "bg-[#ec4899] text-white text-sm font-black px-3 py-1 rounded-full inline-block mb-3", children: [
                    camp.discount_pct,
                    "% OFF"
                  ] }, void 0, true, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                    lineNumber: 731,
                    columnNumber: 21
                  }, this),
                  /* @__PURE__ */ jsxDEV("h3", { className: "text-2xl font-black text-white", children: camp.title }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                    lineNumber: 734,
                    columnNumber: 21
                  }, this),
                  /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 text-sm mt-2", children: camp.description }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                    lineNumber: 735,
                    columnNumber: 21
                  }, this)
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 730,
                  columnNumber: 19
                }, this),
                camp.target_products && camp.target_products.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto", children: (camp.target_products || []).slice(0, 4).map(
                  (p) => /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3", children: [
                    p.image_url ? /* @__PURE__ */ jsxDEV("img", { src: p.image_url.startsWith("http") ? p.image_url : `${BACKEND_URL}${p.image_url}`, className: "w-12 h-12 rounded-lg object-cover" }, void 0, false, {
                      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                      lineNumber: 743,
                      columnNumber: 19
                    }, this) : /* @__PURE__ */ jsxDEV("div", { className: "w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-slate-500 font-bold", children: "?" }, void 0, false, {
                      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                      lineNumber: 745,
                      columnNumber: 19
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { className: "text-left", children: [
                      /* @__PURE__ */ jsxDEV("h4", { className: "font-bold text-white text-sm line-clamp-1", children: p.name }, void 0, false, {
                        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                        lineNumber: 748,
                        columnNumber: 30
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "text-amber-400 font-bold text-xs", children: [
                        "Rs ",
                        p.price
                      ] }, void 0, true, {
                        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                        lineNumber: 749,
                        columnNumber: 30
                      }, this)
                    ] }, void 0, true, {
                      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                      lineNumber: 747,
                      columnNumber: 28
                    }, this)
                  ] }, p.id, true, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                    lineNumber: 741,
                    columnNumber: 17
                  }, this)
                ) }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 739,
                  columnNumber: 15
                }, this)
              ]
            },
            camp.id,
            true,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 719,
              columnNumber: 13
            },
            this
          )
        ) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 717,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 707,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("section", { id: "menu-section", className: "py-24 px-8 max-w-7xl mx-auto", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-end mb-16", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold uppercase tracking-widest text-amber-400", children: "Exclusive drops" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 764,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("h2", { className: "text-4xl lg:text-5xl font-black uppercase text-white mt-2 leading-none", children: "Signature Series" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 765,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-[#d3c5ac] mt-2 text-sm font-medium", children: "Hand-crafted artisan culinary releases from our master chefs." }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 766,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 763,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxDEV("button", { className: "w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors", children: /* @__PURE__ */ jsxDEV(ChevronLeft, { className: "w-5 h-5 text-slate-300" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 770,
              columnNumber: 17
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 769,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("button", { className: "w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors", children: /* @__PURE__ */ jsxDEV(ChevronRight, { className: "w-5 h-5 text-slate-300" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 773,
              columnNumber: 17
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 772,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 768,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 762,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-8", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "md:col-span-7 group relative overflow-hidden rounded-[32px] bg-[#191f2f] aspect-[16/10] border border-slate-800/40", children: [
            /* @__PURE__ */ jsxDEV(
              "img",
              {
                alt: "Pizza",
                className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 image-no-referrer",
                src: midnightPizza.image,
                referrerPolicy: "no-referrer"
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 781,
                columnNumber: 15
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-t from-[#0c1322] via-[#0c1322]/10 to-transparent" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 787,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-8 left-8 right-8 flex justify-between items-end", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[#fbbf24] font-bold text-[10px] tracking-widest uppercase", children: midnightPizza.tag }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 790,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("h3", { className: "text-2xl lg:text-3xl font-black text-white mt-1", children: midnightPizza.name }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 791,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[#d3c5ac] text-xs mt-2 max-w-xs", children: midnightPizza.description }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 792,
                  columnNumber: 19
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 789,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "text-right shrink-0", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-2xl font-black text-[#fbbf24] block", children: [
                  "$",
                  midnightPizza.priceUSD.toFixed(2)
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 795,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    onClick: () => handleAddToCartWithNotify(midnightPizza),
                    className: "mt-4 bg-white hover:bg-amber-300 text-slate-950 w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg cursor-pointer",
                    children: /* @__PURE__ */ jsxDEV(Plus, { className: "w-5 h-5 stroke-[2.5]" }, void 0, false, {
                      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                      lineNumber: 800,
                      columnNumber: 21
                    }, this)
                  },
                  void 0,
                  false,
                  {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                    lineNumber: 796,
                    columnNumber: 19
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 794,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 788,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 780,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "md:col-span-5 group relative overflow-hidden rounded-[32px] bg-[#191f2f] border border-slate-800/40 p-1 flex flex-col justify-end min-h-[350px]", children: [
            /* @__PURE__ */ jsxDEV(
              "img",
              {
                alt: "Pasta",
                className: "absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 image-no-referrer",
                src: rigatoniItem.image,
                referrerPolicy: "no-referrer"
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 807,
                columnNumber: 15
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-t from-[#0c1322] via-[#0c1322]/20 to-transparent" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 813,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "relative z-10 p-8", children: [
              /* @__PURE__ */ jsxDEV("h3", { className: "text-2xl lg:text-3xl font-black text-white", children: rigatoniItem.name }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 815,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-[#d3c5ac] text-xs mt-2", children: rigatoniItem.description }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 816,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mt-6", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-2xl font-black text-[#fbbf24]", children: [
                  "$",
                  rigatoniItem.priceUSD.toFixed(2)
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 818,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    onClick: () => handleAddToCartWithNotify(rigatoniItem),
                    className: "bg-[#fbbf24] hover:bg-amber-400 text-slate-950 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer",
                    children: "Add"
                  },
                  void 0,
                  false,
                  {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                    lineNumber: 819,
                    columnNumber: 19
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 817,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 814,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 806,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "md:col-span-4 group relative overflow-hidden rounded-[32px] bg-[#191f2f] aspect-square border border-slate-800/40", children: [
            /* @__PURE__ */ jsxDEV(
              "img",
              {
                alt: "Shake",
                className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 image-no-referrer",
                src: goldLeafShake.image,
                referrerPolicy: "no-referrer"
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 830,
                columnNumber: 15
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-t from-[#0c1322]/90 to-transparent" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 836,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-6 left-6 right-6 flex justify-between items-end", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("h4", { className: "font-extrabold text-base text-white", children: goldLeafShake.name }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 839,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-bold text-[#fbbf24] block mt-0.5", children: [
                  "$",
                  goldLeafShake.priceUSD.toFixed(2)
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 840,
                  columnNumber: 19
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 838,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => handleAddToCartWithNotify(goldLeafShake),
                  className: "bg-white hover:bg-amber-400 hover:text-slate-950 text-slate-950 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer",
                  children: /* @__PURE__ */ jsxDEV(Plus, { className: "w-4 h-4 stroke-[2.5]" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                    lineNumber: 846,
                    columnNumber: 19
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 842,
                  columnNumber: 17
                },
                this
              )
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 837,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 829,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "md:col-span-4 group relative overflow-hidden rounded-[32px] bg-[#191f2f] aspect-square border border-slate-800/40", children: [
            /* @__PURE__ */ jsxDEV(
              "img",
              {
                alt: "Dessert",
                className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 image-no-referrer",
                src: lavaNoir.image,
                referrerPolicy: "no-referrer"
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 852,
                columnNumber: 15
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-t from-[#0c1322]/90 to-transparent" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 858,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-6 left-6 right-6 flex justify-between items-end", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("h4", { className: "font-extrabold text-base text-white", children: lavaNoir.name }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 861,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-bold text-[#fbbf24] block mt-0.5", children: [
                  "$",
                  lavaNoir.priceUSD.toFixed(2)
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 862,
                  columnNumber: 19
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 860,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => handleAddToCartWithNotify(lavaNoir),
                  className: "bg-white hover:bg-amber-400 hover:text-slate-950 text-slate-950 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer",
                  children: /* @__PURE__ */ jsxDEV(Plus, { className: "w-4 h-4 stroke-[2.5]" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                    lineNumber: 868,
                    columnNumber: 19
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 864,
                  columnNumber: 17
                },
                this
              )
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 859,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 851,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "md:col-span-4 group relative overflow-hidden rounded-[32px] bg-[#191f2f] aspect-square border border-slate-800/40", children: [
            /* @__PURE__ */ jsxDEV(
              "img",
              {
                alt: "Cocktail",
                className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 image-no-referrer",
                src: sunsetSpritz.image,
                referrerPolicy: "no-referrer"
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 874,
                columnNumber: 15
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-t from-[#0c1322]/90 to-transparent" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 880,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-6 left-6 right-6 flex justify-between items-end", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("h4", { className: "font-extrabold text-base text-white", children: sunsetSpritz.name }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 883,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-bold text-[#fbbf24] block mt-0.5", children: [
                  "$",
                  sunsetSpritz.priceUSD.toFixed(2)
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 884,
                  columnNumber: 19
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 882,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => handleAddToCartWithNotify(sunsetSpritz),
                  className: "bg-white hover:bg-amber-400 hover:text-slate-950 text-slate-950 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer",
                  children: /* @__PURE__ */ jsxDEV(Plus, { className: "w-4 h-4 stroke-[2.5]" }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                    lineNumber: 890,
                    columnNumber: 19
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 886,
                  columnNumber: 17
                },
                this
              )
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 881,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 873,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 778,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 761,
        columnNumber: 9
      }, this),
      campaigns.length > 0 && /* @__PURE__ */ jsxDEV("section", { className: "py-8 max-w-7xl mx-auto px-8", children: /* @__PURE__ */ jsxDEV("div", { className: "flex overflow-x-auto hide-scrollbar gap-4 py-4 mt-2", children: campaigns.map(
        (camp) => /* @__PURE__ */ jsxDEV("div", { className: "flex-shrink-0 bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] rounded-xl px-6 py-4 flex items-center gap-4 shadow-lg animate-pulse-slow border border-white/10", children: [
          /* @__PURE__ */ jsxDEV(Tag, { className: "text-white w-8 h-8" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 904,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h4", { className: "text-white font-black text-lg uppercase tracking-widest leading-none", children: camp.title }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 906,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-white/90 font-bold text-sm mt-1", children: [
              camp.discount_pct,
              "% OFF TODAY!"
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 907,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 905,
            columnNumber: 19
          }, this)
        ] }, camp.id, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 903,
          columnNumber: 13
        }, this)
      ) }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 901,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 900,
        columnNumber: 9
      }, this),
      staffMembers.length > 0 && /* @__PURE__ */ jsxDEV("section", { id: "our-staff", className: "relative py-24 max-w-6xl mx-auto text-center px-8 border-t border-slate-800", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold uppercase tracking-widest text-[#fbbf24]", children: "The Faces Behind The Flavor" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 917,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("h2", { className: "text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter text-white mb-6 uppercase mt-2", children: "OUR STAFF" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 918,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-[#d3c5ac] max-w-xl mx-auto text-sm md:text-base font-semibold mb-12 leading-relaxed", children: [
          "Meet the incredible team that makes ",
          storeName,
          " special. From our master chefs to our friendly front-of-house."
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 919,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap justify-center gap-8", children: staffMembers.map(
          (staff) => /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center group w-40", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "w-32 h-32 rounded-full border-4 border-[#191f2f] overflow-hidden bg-slate-800 mb-4 shadow-2xl group-hover:border-[#fbbf24] transition-colors flex items-center justify-center", children: staff.image_url ? /* @__PURE__ */ jsxDEV("img", { src: staff.image_url ? staff.image_url.startsWith("http") ? staff.image_url : `${BACKEND_URL}${staff.image_url}` : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80", alt: staff.name, className: "w-full h-full object-cover" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 928,
              columnNumber: 17
            }, this) : /* @__PURE__ */ jsxDEV(User, { className: "w-12 h-12 text-slate-500" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 930,
              columnNumber: 17
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 926,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("h3", { className: "text-white font-black text-lg tracking-tight", children: staff.name }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 933,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold uppercase tracking-widest text-[#fbbf24] mt-1", children: staff.role?.name || "Staff" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 934,
              columnNumber: 19
            }, this)
          ] }, staff.id, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 925,
            columnNumber: 13
          }, this)
        ) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 923,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 916,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 582,
      columnNumber: 7
    }, this),
    isCartOpen && /* @__PURE__ */ jsxDEV("aside", { id: "landing-side-drawer-cart", className: "fixed right-0 top-0 h-full w-[380px] bg-[#191f2f] shadow-2xl border-l border-slate-800 z-[100] flex flex-col p-6 animate-fade-in", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center pb-4 border-b border-slate-800", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h2", { className: "text-xl font-extrabold text-[#ffe1a7] uppercase tracking-tight", children: "Your Basket" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 947,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#d3c5ac]", children: "Table 42 • Ready in 12 mins" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 948,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 946,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setIsCartOpen(false),
            className: "p-1.5 hover:bg-slate-800 rounded-full text-[#d3c5ac]",
            children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 954,
              columnNumber: 15
            }, this)
          },
          void 0,
          false,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 950,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 945,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto py-6 space-y-4 custom-scrollbar", children: cart.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "text-center py-16 opacity-60", children: [
        /* @__PURE__ */ jsxDEV("p", { className: "font-bold", children: "No items in basket" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 961,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#d3c5ac] mt-1", children: "Order signature series from the landing grids!" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 962,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 960,
        columnNumber: 11
      }, this) : cart.map(
        (c) => /* @__PURE__ */ jsxDEV("div", { className: "flex gap-3 bg-[#141b2b] p-3 rounded-2xl border border-slate-800/40", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0", children: /* @__PURE__ */ jsxDEV(
            "img",
            {
              className: "w-full h-full object-cover image-no-referrer",
              src: c.foodItem.image,
              alt: c.foodItem.name,
              referrerPolicy: "no-referrer"
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 968,
              columnNumber: 21
            },
            this
          ) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 967,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxDEV("h4", { className: "font-extrabold text-sm text-white truncate", children: c.foodItem.name }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 976,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-[#d3c5ac]", children: "Chef Customization" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 977,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mt-2", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3.5 bg-[#191f2f] px-2 py-0.5 rounded-full border border-slate-700/30", children: [
                /* @__PURE__ */ jsxDEV("button", { onClick: () => onDecreaseQuantity(c.foodItem.id), className: "text-[#ffe1a7] text-xs font-bold", children: /* @__PURE__ */ jsxDEV(Minus, { className: "w-3 h-3" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 981,
                  columnNumber: 27
                }, this) }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 980,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-black text-white", children: c.quantity }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 983,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("button", { onClick: () => onIncreaseQuantity(c.foodItem.id), className: "text-[#ffe1a7] text-xs font-bold", children: /* @__PURE__ */ jsxDEV(Plus, { className: "w-3 h-3" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 985,
                  columnNumber: 27
                }, this) }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 984,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 979,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-black text-[#4edea3]", children: [
                "$",
                (c.foodItem.priceUSD * c.quantity).toFixed(2)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 988,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 978,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 975,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("button", { onClick: () => onRemoveFromCart(c.foodItem.id), className: "text-slate-600 hover:text-red-400 self-start pt-1", children: /* @__PURE__ */ jsxDEV(X, { className: "w-4 h-4" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 992,
            columnNumber: 21
          }, this) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 991,
            columnNumber: 19
          }, this)
        ] }, `land-cart-${c.foodItem.id}`, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 966,
          columnNumber: 11
        }, this)
      ) }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 958,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "bg-[#141b2b] p-4 rounded-2xl border border-slate-800 space-y-3", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-xs text-[#d3c5ac]", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "Subtotal:" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1001,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "font-bold", children: [
            "$",
            subtotalUSD.toFixed(2)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1002,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1e3,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-xs text-[#d3c5ac]", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "Estimated Tax (8%):" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1005,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "font-bold", children: [
            "$",
            taxUSD.toFixed(2)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1006,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1004,
          columnNumber: 13
        }, this),
        siteSettings?.module_loyalty_enabled && customer && (customer.loyalty_points || 0) > 0 && /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between pt-2 border-t border-slate-800", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV(Award, { className: "w-4 h-4 text-amber-400" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1012,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-xs text-[#d3c5ac]", children: [
              "Use ",
              customer.loyalty_points,
              " Points (-$",
              (customer.loyalty_points * 0.1).toFixed(2),
              ")"
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1013,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1011,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "checkbox",
              checked: useLoyaltyPoints,
              onChange: (e) => setUseLoyaltyPoints(e.target.checked),
              className: "w-4 h-4 accent-amber-500 rounded cursor-pointer"
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1015,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1010,
          columnNumber: 11
        }, this),
        useLoyaltyPoints && loyaltyDiscount > 0 && /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-xs text-amber-400 font-bold", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "Loyalty Discount:" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1026,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("span", { children: [
            "-$",
            loyaltyDiscount.toFixed(2)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1027,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1025,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-black text-white", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "TOTAL:" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1032,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "text-lg text-[#fbbf24]", children: [
            "$",
            totalUSD.toFixed(2)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1033,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1031,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: async (e) => {
              const btn = e.currentTarget;
              if (btn.disabled) return;
              if (!customer?.name?.trim() || !customer?.phone?.trim() || !customer?.address?.trim()) {
                setCheckoutName(customer?.name || "");
                setCheckoutPhone(customer?.phone || "");
                setCheckoutAddress(customer?.address || "");
                setCheckoutError("");
                setIsCheckoutProfileOpen(true);
                return;
              }
              btn.disabled = true;
              const originalText = btn.textContent;
              btn.textContent = "Encrypting...";
              await submitOrder(customer);
              if (btn) {
                btn.disabled = false;
                btn.textContent = originalText;
              }
            },
            disabled: cart.length === 0 || isSubmittingOrder,
            className: "w-full py-3.5 bg-[#fbbf24] hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow cursor-pointer",
            children: isSubmittingOrder ? "PLACING ORDER..." : "PLACE RESERVATION ORDER"
          },
          void 0,
          false,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1035,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 999,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 944,
      columnNumber: 7
    }, this),
    isTrackOpen && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-[250] flex justify-end", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-black/60 backdrop-blur-sm", onClick: () => setIsTrackOpen(false) }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1072,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("aside", { className: "relative w-full max-w-sm bg-[#191f2f] border-l border-slate-800 flex flex-col h-full shadow-2xl animate-slide-in-right", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center p-6 border-b border-slate-800 shrink-0", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h3", { className: "text-xl font-black text-white flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDEV(MapPin, { className: "w-5 h-5 text-[#4edea3]" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1078,
                columnNumber: 19
              }, this),
              "Track Order"
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1077,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#d3c5ac] mt-1", children: "Enter Order ID or Phone" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1081,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1076,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("button", { onClick: () => setIsTrackOpen(false), className: "text-slate-500 hover:text-white p-2", children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1084,
            columnNumber: 17
          }, this) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1083,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1075,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto p-6 custom-scrollbar", children: !trackResult ? /* @__PURE__ */ jsxDEV("form", { onSubmit: handleTrackOrder, className: "space-y-6", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold uppercase tracking-widest text-[#d3c5ac] block mb-2", children: "Order ID" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1093,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "number",
                value: trackId,
                onChange: (e) => setTrackId(e.target.value),
                placeholder: "e.g. 1001",
                className: "w-full bg-[#141b2b] border border-slate-700 focus:border-[#4edea3] rounded-2xl px-5 py-4 text-white placeholder-slate-600 outline-none transition-colors",
                autoFocus: true
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1094,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1092,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold uppercase tracking-widest text-[#d3c5ac] block mb-2", children: "Phone" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1104,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "tel",
                value: trackPhone,
                onChange: (e) => setTrackPhone(e.target.value),
                placeholder: "e.g. 03001234567",
                className: "w-full bg-[#141b2b] border border-slate-700 focus:border-[#4edea3] rounded-2xl px-5 py-4 text-white placeholder-slate-600 outline-none transition-colors"
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1105,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1103,
            columnNumber: 17
          }, this),
          trackError && /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-red-400 font-bold", children: trackError }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1113,
            columnNumber: 32
          }, this),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "submit",
              disabled: trackLoading,
              className: "w-full py-3.5 bg-[#4edea3] hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer",
              children: trackLoading ? "Searching..." : "Find My Order"
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1114,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1091,
          columnNumber: 13
        }, this) : /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "bg-[#141b2b] rounded-2xl border border-slate-800 p-4 space-y-3", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-start", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("p", { className: "font-black text-white text-base", children: [
                  "Order #",
                  trackResult.id
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 1128,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-[#d3c5ac]", children: [
                  trackResult.customer,
                  " · ",
                  trackResult.timePlaced
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 1129,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1127,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-black text-[#fbbf24]", children: [
                "$",
                trackResult.totalAmount
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1131,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1126,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#d3c5ac] leading-relaxed", children: trackResult.items }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1133,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1125,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
            { label: "Order Placed", sub: trackResult.timePlaced || "Received", done: true },
            {
              label: "Confirmed by Restaurant",
              sub: trackResult.kdsStatus === "PENDING" ? "Waiting for cashier..." : "Accepted ✓",
              done: trackResult.kdsStatus !== "PENDING"
            },
            {
              label: "In Kitchen",
              sub: trackResult.kdsStatus === "PREPARING" ? `~${trackResult.prepTimeMinutes} mins · Ready by ${trackResult.estimatedReadyAt}` : trackResult.kdsStatus === "READY" ? "Done ✓" : "Waiting...",
              done: trackResult.kdsStatus === "PREPARING" || trackResult.kdsStatus === "READY" || trackResult.status === "DISPATCHED" || trackResult.status === "PAID" || trackResult.status === "SETTLED"
            },
            {
              label: "Ready for Delivery",
              sub: trackResult.kdsStatus === "READY" ? "Food is packed!" : "Pending...",
              done: trackResult.kdsStatus === "READY" || trackResult.status === "DISPATCHED" || trackResult.status === "PAID" || trackResult.status === "SETTLED"
            },
            {
              label: "Dispatched",
              sub: trackResult.status === "DISPATCHED" || trackResult.status === "PAID" || trackResult.status === "SETTLED" ? "Rider on the way" : "Waiting for rider...",
              done: trackResult.status === "DISPATCHED" || trackResult.status === "PAID" || trackResult.status === "SETTLED"
            },
            {
              label: "Delivered",
              sub: trackResult.status === "PAID" || trackResult.status === "SETTLED" ? "Cash Collected & Delivered ✓" : "Pending...",
              done: trackResult.status === "PAID" || trackResult.status === "SETTLED"
            }
          ].map(
            (step, i) => /* @__PURE__ */ jsxDEV("div", { className: "flex items-start gap-3 relative", children: [
              i < 5 && /* @__PURE__ */ jsxDEV("div", { className: `absolute left-2.5 top-5 w-[2px] h-6 ${step.done ? "bg-[#4edea3]" : "bg-slate-700"}` }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1168,
                columnNumber: 33
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: `w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all relative z-10 bg-[#191f2f] ${step.done ? "border-[#4edea3] text-[#4edea3]" : "border-slate-700 text-transparent"}`, children: step.done && /* @__PURE__ */ jsxDEV(CheckCircle2, { className: "w-3 h-3 fill-[#4edea3] text-[#191f2f]" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1172,
                columnNumber: 39
              }, this) }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1169,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("p", { className: `text-[10px] font-bold ${step.done ? "text-white" : "text-slate-500"}`, children: step.label }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 1175,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[9px] text-[#d3c5ac]", children: step.sub }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 1176,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1174,
                columnNumber: 23
              }, this)
            ] }, i, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1167,
              columnNumber: 17
            }, this)
          ) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1136,
            columnNumber: 17
          }, this),
          trackResult.status === "DISPATCHED" && trackResult.delivery && /* @__PURE__ */ jsxDEV("div", { className: "bg-[#141b2b] border border-[#4edea3]/30 rounded-xl overflow-hidden mt-4", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "bg-[#4edea3]/10 px-4 py-2 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "w-2 h-2 rounded-full bg-[#4edea3] animate-ping" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1185,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-black uppercase text-[#4edea3]", children: "Rider is approaching!" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1186,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1184,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "relative h-32 bg-slate-900 w-full overflow-hidden flex items-center justify-center", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 border-[0.5px] border-slate-800", style: { backgroundSize: "20px 20px", backgroundImage: "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)" } }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1189,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "w-32 h-32 border border-[#4edea3]/20 rounded-full animate-ping absolute" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1190,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "w-16 h-16 border border-[#4edea3]/40 rounded-full animate-ping absolute" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1191,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "w-4 h-4 bg-[#4edea3] rounded-full z-10 shadow-[0_0_15px_#4edea3] relative flex items-center justify-center", children: /* @__PURE__ */ jsxDEV("div", { className: "absolute -top-6 bg-white text-slate-900 text-[8px] font-bold px-2 py-0.5 rounded whitespace-nowrap", children: "Rider" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1193,
                columnNumber: 25
              }, this) }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1192,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1188,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1183,
            columnNumber: 15
          }, this),
          (trackResult.status === "PAID" || trackResult.status === "SETTLED") && /* @__PURE__ */ jsxDEV("div", { className: "bg-[#141b2b] border border-amber-500/30 rounded-xl p-4 mt-4 text-center", children: trackResult.feedback || feedbackSubmitted ? /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h4", { className: "text-sm font-black text-[#4edea3] mb-1", children: "Thanks for your feedback!" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1203,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center gap-1 my-2", children: [1, 2, 3, 4, 5].map(
              (star) => /* @__PURE__ */ jsxDEV("svg", { className: `w-5 h-5 ${(trackResult.feedback?.rating || feedbackRating) >= star ? "text-amber-400" : "text-slate-600"}`, fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsxDEV("path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1206,
                columnNumber: 197
              }, this) }, star, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1206,
                columnNumber: 21
              }, this)
            ) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1204,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-slate-400", children: [
              '"',
              trackResult.feedback?.comment || feedbackComment,
              '"'
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1209,
              columnNumber: 25
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1202,
            columnNumber: 17
          }, this) : /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h4", { className: "text-sm font-black text-white mb-1", children: "How was your delivery?" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1213,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center gap-2 mb-3", children: [1, 2, 3, 4, 5].map(
              (star) => /* @__PURE__ */ jsxDEV("button", { onClick: () => setFeedbackRating(star), className: "focus:outline-none", children: /* @__PURE__ */ jsxDEV("svg", { className: `w-8 h-8 ${feedbackRating >= star ? "text-amber-400" : "text-slate-700 hover:text-amber-200"} transition-colors`, fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsxDEV("path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1217,
                columnNumber: 201
              }, this) }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1217,
                columnNumber: 31
              }, this) }, star, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1216,
                columnNumber: 21
              }, this)
            ) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1214,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV(
              "textarea",
              {
                placeholder: "Leave a comment (optional)...",
                value: feedbackComment,
                onChange: (e) => setFeedbackComment(e.target.value),
                className: "w-full bg-[#191f2f] border border-slate-700 rounded-xl px-3 py-2 text-[10px] text-white resize-none outline-none focus:border-amber-400 mb-3",
                rows: 2
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1221,
                columnNumber: 25
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("button", { onClick: handleSubmitFeedback, disabled: !feedbackRating || isSubmittingFeedback, className: "w-full py-2 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all", children: "Submit Feedback" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1228,
              columnNumber: 25
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1212,
            columnNumber: 17
          }, this) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1200,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2 mt-4", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => {
                  setTrackResult(null);
                  setTrackId("");
                  setTrackPhone("");
                },
                className: "flex-1 py-2.5 border border-slate-700 hover:border-slate-500 text-[#d3c5ac] font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer",
                children: "Search Again"
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1234,
                columnNumber: 19
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => setIsTrackOpen(false),
                className: "flex-1 py-2.5 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer",
                children: "Close"
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1240,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1233,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1123,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1089,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1073,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 1071,
      columnNumber: 7
    }, this),
    isLoginOpen && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-[#191f2f] border border-slate-700 rounded-[28px] p-8 max-w-sm w-full mx-4 shadow-2xl", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mb-6", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-lg font-black text-white", children: "Sign In" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1260,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#d3c5ac] mt-0.5", children: "Apna naam aur phone enter karein" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1261,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1259,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => {
          setIsLoginOpen(false);
          setLoginError("");
        }, className: "text-slate-500 hover:text-white p-1", children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1264,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1263,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1258,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("form", { onSubmit: handleLogin, className: "space-y-4", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-[10px] font-bold uppercase tracking-widest text-[#d3c5ac] block mb-1.5", children: "Full Name" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1269,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              value: loginName,
              onChange: (e) => setLoginName(e.target.value),
              placeholder: "e.g. Ali Khan",
              className: "w-full bg-[#141b2b] border border-slate-700 focus:border-[#fbbf24] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors",
              autoFocus: true
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1270,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1268,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-[10px] font-bold uppercase tracking-widest text-[#d3c5ac] block mb-1.5", children: "Phone Number" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1280,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "tel",
              value: loginPhone,
              onChange: (e) => setLoginPhone(e.target.value),
              placeholder: "e.g. 03001234567",
              className: "w-full bg-[#141b2b] border border-slate-700 focus:border-[#fbbf24] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1281,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1279,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-[10px] font-bold uppercase tracking-widest text-[#d3c5ac] block mb-1.5", children: "Delivery Address" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1290,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "textarea",
            {
              value: loginAddress,
              onChange: (e) => setLoginAddress(e.target.value),
              placeholder: "e.g. House 123, Street 4, Phase 5...",
              className: "w-full bg-[#141b2b] border border-slate-700 focus:border-[#fbbf24] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors resize-none",
              rows: 2
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1291,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1289,
          columnNumber: 15
        }, this),
        loginError && /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-red-400 font-bold", children: loginError }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1300,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("button", { type: "submit", className: "w-full py-3.5 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all mt-2 cursor-pointer", children: "Sign In" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1302,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-center text-slate-600", children: "No password needed — phone number se pehchana jaata hai" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1305,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1267,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 1257,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 1256,
      columnNumber: 7
    }, this),
    isCheckoutProfileOpen && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-[#191f2f] border border-[#4edea3]/40 rounded-[28px] p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(78,222,163,0.15)] animate-fade-in", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mb-6", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "text-xl font-black text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV(MapPin, { className: "w-5 h-5 text-[#4edea3]" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1318,
              columnNumber: 19
            }, this),
            "Delivery Details"
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1317,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#d3c5ac] mt-1", children: "Please provide your details to complete the order" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1321,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1316,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => {
          setIsCheckoutProfileOpen(false);
          setCheckoutError("");
        }, className: "text-slate-500 hover:text-white p-1 transition-colors bg-[#141b2b] rounded-full", children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1324,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1323,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1315,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("form", { onSubmit: handleCheckoutProfileSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-[10px] font-bold uppercase tracking-widest text-[#d3c5ac] block mb-1.5", children: "Full Name" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1330,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              value: checkoutName,
              onChange: (e) => setCheckoutName(e.target.value),
              placeholder: "e.g. Ali Khan",
              className: "w-full bg-[#141b2b] border border-slate-700 focus:border-[#4edea3] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors",
              autoFocus: true
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1331,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1329,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-[10px] font-bold uppercase tracking-widest text-[#d3c5ac] block mb-1.5", children: "Phone Number" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1341,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "tel",
              value: checkoutPhone,
              onChange: (e) => setCheckoutPhone(e.target.value),
              placeholder: "e.g. 03001234567",
              className: "w-full bg-[#141b2b] border border-slate-700 focus:border-[#4edea3] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1342,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1340,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-[10px] font-bold uppercase tracking-widest text-[#d3c5ac] block mb-1.5", children: "Complete Delivery Address" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1351,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(
            "textarea",
            {
              value: checkoutAddress,
              onChange: (e) => setCheckoutAddress(e.target.value),
              placeholder: "e.g. House 12, Street 3, Block A...",
              className: "w-full bg-[#141b2b] border border-slate-700 focus:border-[#4edea3] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors resize-none",
              rows: 3
            },
            void 0,
            false,
            {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1352,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1350,
          columnNumber: 15
        }, this),
        checkoutError && /* @__PURE__ */ jsxDEV("div", { className: "bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg", children: /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-red-400 font-bold text-center", children: checkoutError }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1363,
          columnNumber: 19
        }, this) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1362,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "submit",
            disabled: isSubmittingOrder,
            className: "w-full py-4 bg-[#4edea3] hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_15px_rgba(78,222,163,0.3)] mt-4 flex justify-center items-center gap-2 cursor-pointer",
            children: isSubmittingOrder ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
              /* @__PURE__ */ jsxDEV("span", { className: "w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1374,
                columnNumber: 21
              }, this),
              "Placing Order..."
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1373,
              columnNumber: 15
            }, this) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
              "Save & Confirm Order",
              /* @__PURE__ */ jsxDEV(ArrowRight, { className: "w-4 h-4" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1380,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1378,
              columnNumber: 15
            }, this)
          },
          void 0,
          false,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1367,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1328,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 1314,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 1313,
      columnNumber: 7
    }, this),
    isMyOrdersOpen && customer && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-[250] flex justify-end", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-black/60 backdrop-blur-sm", onClick: () => setIsMyOrdersOpen(false) }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1392,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("aside", { className: "relative w-full max-w-sm bg-[#141b2b] border-l border-slate-800 flex flex-col h-full shadow-2xl animate-slide-in-right", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center p-6 border-b border-slate-800", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h2", { className: "font-black text-white text-base", children: "My Orders" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1397,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-[#d3c5ac] mt-0.5", children: [
              customer.name,
              " · ",
              customer.phone
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1398,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1396,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxDEV("button", { onClick: handleLogout, className: "text-[10px] text-slate-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors", children: "Logout" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1401,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("button", { onClick: () => setIsMyOrdersOpen(false), className: "text-slate-500 hover:text-white p-1", children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1403,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1402,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1400,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1395,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: myOrders.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "text-center py-16 text-[#d3c5ac]", children: [
          /* @__PURE__ */ jsxDEV(ShoppingCart, { className: "w-10 h-10 mx-auto mb-3 text-slate-700" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1412,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "font-bold text-sm", children: "No orders yet" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1413,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs mt-1 text-slate-600", children: "Jab order karain ge to yahan dikhega" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1414,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1411,
          columnNumber: 13
        }, this) : myOrders.map((ord) => {
          const statusColor = ord.kdsStatus === "READY" ? "text-[#4edea3]" : ord.kdsStatus === "PREPARING" ? "text-amber-400" : ord.kdsStatus === "ACCEPTED" ? "text-blue-400" : "text-slate-500";
          const statusLabel = ord.kdsStatus === "READY" ? "Ready for Pickup" : ord.kdsStatus === "PREPARING" ? `In Kitchen${ord.prepTimeMinutes ? ` (~${ord.prepTimeMinutes} min)` : ""}` : ord.kdsStatus === "ACCEPTED" ? "Confirmed by Restaurant" : "Waiting for Confirmation";
          return /* @__PURE__ */ jsxDEV("div", { className: "bg-[#191f2f] rounded-2xl border border-slate-800 p-4 space-y-3", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-start", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("p", { className: "font-black text-white text-sm", children: [
                  "Order #",
                  ord.id
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 1430,
                  columnNumber: 27
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-[#d3c5ac]", children: ord.timePlaced }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 1431,
                  columnNumber: 27
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1429,
                columnNumber: 25
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: `text-[10px] font-black uppercase tracking-wider ${statusColor}`, children: statusLabel }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1433,
                columnNumber: 25
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1428,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#d3c5ac] leading-relaxed", children: ord.items }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1435,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center pt-1 border-t border-slate-800", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-xs text-slate-500", children: "Total" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1437,
                columnNumber: 25
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-black text-[#fbbf24]", children: [
                "$",
                ord.totalAmount
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1438,
                columnNumber: 25
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1436,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-3 pt-3 mt-3 border-t border-slate-800/50", children: [
              { label: "Order Placed", sub: ord.timePlaced || "Received", done: true },
              {
                label: "Confirmed by Restaurant",
                sub: ord.kdsStatus === "PENDING" ? "Waiting for cashier..." : "Accepted ✓",
                done: ord.kdsStatus !== "PENDING"
              },
              {
                label: "In Kitchen",
                sub: ord.kdsStatus === "PREPARING" ? `~${ord.prepTimeMinutes} mins · Ready by ${ord.estimatedReadyAt}` : ord.kdsStatus === "READY" ? "Done ✓" : "Waiting...",
                done: ord.kdsStatus === "PREPARING" || ord.kdsStatus === "READY" || ord.status === "DISPATCHED" || ord.status === "PAID" || ord.status === "SETTLED"
              },
              {
                label: "Ready for Delivery",
                sub: ord.kdsStatus === "READY" ? "Food is packed!" : "Pending...",
                done: ord.kdsStatus === "READY" || ord.status === "DISPATCHED" || ord.status === "PAID" || ord.status === "SETTLED"
              },
              {
                label: "Dispatched",
                sub: ord.status === "DISPATCHED" || ord.status === "PAID" || ord.status === "SETTLED" ? "Rider on the way" : "Waiting for rider...",
                done: ord.status === "DISPATCHED" || ord.status === "PAID" || ord.status === "SETTLED"
              },
              {
                label: "Delivered",
                sub: ord.status === "PAID" || ord.status === "SETTLED" ? "Cash Collected & Delivered ✓" : "Pending...",
                done: ord.status === "PAID" || ord.status === "SETTLED"
              }
            ].map(
              (step, i) => /* @__PURE__ */ jsxDEV("div", { className: "flex items-start gap-3 relative", children: [
                i < 5 && /* @__PURE__ */ jsxDEV("div", { className: `absolute left-2.5 top-5 w-[2px] h-6 ${step.done ? "bg-[#4edea3]" : "bg-slate-700"}` }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 1473,
                  columnNumber: 39
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: `w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all relative z-10 bg-[#191f2f] ${step.done ? "border-[#4edea3] text-[#4edea3]" : "border-slate-700 text-transparent"}`, children: step.done && /* @__PURE__ */ jsxDEV(CheckCircle2, { className: "w-3 h-3 fill-[#4edea3] text-[#191f2f]" }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 1477,
                  columnNumber: 45
                }, this) }, void 0, false, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 1474,
                  columnNumber: 29
                }, this),
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("p", { className: `text-[10px] font-bold ${step.done ? "text-white" : "text-slate-500"}`, children: step.label }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                    lineNumber: 1480,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("p", { className: "text-[9px] text-[#d3c5ac]", children: step.sub }, void 0, false, {
                    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                    lineNumber: 1481,
                    columnNumber: 31
                  }, this)
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 1479,
                  columnNumber: 29
                }, this)
              ] }, i, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1472,
                columnNumber: 21
              }, this)
            ) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1441,
              columnNumber: 23
            }, this),
            ord.kdsStatus === "READY" && /* @__PURE__ */ jsxDEV("div", { className: "bg-[#4edea3]/10 border border-[#4edea3]/20 rounded-xl px-3 py-2 text-center", children: /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-black text-[#4edea3]", children: "Your order is ready!" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1488,
              columnNumber: 27
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1487,
              columnNumber: 19
            }, this)
          ] }, ord.id, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1427,
            columnNumber: 17
          }, this);
        }) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1409,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "px-4 py-3 border-t border-slate-800 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1499,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-slate-600", children: "Live updates — har 5 seconds mein refresh" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1500,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1498,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1393,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 1391,
      columnNumber: 7
    }, this),
    orderConfirmed && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-[#191f2f] border border-[#fbbf24]/30 rounded-[28px] p-8 max-w-sm w-full mx-4 shadow-2xl", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "text-center mb-6", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "w-14 h-14 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/30 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxDEV(PartyPopper, { className: "w-6 h-6 text-[#fbbf24]" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1513,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1512,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("h3", { className: "text-lg font-black text-white uppercase tracking-tight", children: "Order Confirmed!" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1515,
          columnNumber: 15
        }, this),
        trackedOrderId && /* @__PURE__ */ jsxDEV("div", { className: "mt-3", children: [
          /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-[#d3c5ac] uppercase tracking-widest mb-1", children: "Your Order ID" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1518,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "bg-[#141b2b] border border-[#fbbf24]/40 rounded-xl px-4 py-3 inline-block", children: /* @__PURE__ */ jsxDEV("span", { className: "text-2xl font-black text-[#fbbf24] tracking-wider", children: [
            "#",
            trackedOrderId
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1520,
            columnNumber: 21
          }, this) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1519,
            columnNumber: 19
          }, this),
          !customer && /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-slate-500 mt-2", children: "Yeh ID save kar lein — Track Order se status check kar saktay hain" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1523,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1517,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1511,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "space-y-3 mb-6", children: [
        {
          label: "Order Placed",
          sub: trackedOrder?.timePlaced || "Just now",
          done: true
        },
        {
          label: "Confirmed by Restaurant",
          sub: trackedOrder?.kdsStatus === "PENDING" ? "Waiting for cashier..." : "Accepted ✓",
          done: trackedOrder?.kdsStatus !== "PENDING" && trackedOrder?.kdsStatus != null
        },
        {
          label: "In Kitchen",
          sub: trackedOrder?.kdsStatus === "PREPARING" ? `~${trackedOrder.prepTimeMinutes} mins · Ready by ${trackedOrder.estimatedReadyAt}` : trackedOrder?.kdsStatus === "READY" ? "Done ✓" : "Waiting...",
          done: trackedOrder?.kdsStatus === "PREPARING" || trackedOrder?.kdsStatus === "READY" || trackedOrder?.status === "DISPATCHED" || trackedOrder?.status === "PAID" || trackedOrder?.status === "SETTLED"
        },
        {
          label: "Ready for Delivery",
          sub: trackedOrder?.kdsStatus === "READY" ? "Food is packed!" : "Pending...",
          done: trackedOrder?.kdsStatus === "READY" || trackedOrder?.status === "DISPATCHED" || trackedOrder?.status === "PAID" || trackedOrder?.status === "SETTLED"
        },
        {
          label: "Dispatched",
          sub: trackedOrder?.status === "DISPATCHED" || trackedOrder?.status === "PAID" || trackedOrder?.status === "SETTLED" ? "Rider on the way" : "Waiting for rider...",
          done: trackedOrder?.status === "DISPATCHED" || trackedOrder?.status === "PAID" || trackedOrder?.status === "SETTLED"
        },
        {
          label: "Delivered",
          sub: trackedOrder?.status === "PAID" || trackedOrder?.status === "SETTLED" ? "Cash Collected & Delivered ✓" : "Pending...",
          done: trackedOrder?.status === "PAID" || trackedOrder?.status === "SETTLED"
        }
      ].map(
        (step, i) => /* @__PURE__ */ jsxDEV("div", { className: "flex items-start gap-3 relative", children: [
          i < 5 && /* @__PURE__ */ jsxDEV("div", { className: `absolute left-2.5 top-5 w-[2px] h-6 ${step.done ? "bg-[#4edea3]" : "bg-slate-700"}` }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1568,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: `w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all relative z-10 bg-[#191f2f] ${step.done ? "border-[#4edea3] text-[#4edea3]" : "border-slate-700 text-transparent"}`, children: step.done && /* @__PURE__ */ jsxDEV(CheckCircle2, { className: "w-3 h-3 fill-[#4edea3] text-[#191f2f]" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1572,
            columnNumber: 35
          }, this) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1569,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("p", { className: `text-[10px] font-bold ${step.done ? "text-white" : "text-slate-500"}`, children: step.label }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1575,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-[9px] text-[#d3c5ac]", children: step.sub }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1576,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1574,
            columnNumber: 19
          }, this)
        ] }, i, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1567,
          columnNumber: 13
        }, this)
      ) }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1532,
        columnNumber: 13
      }, this),
      trackedOrder?.status === "DISPATCHED" && trackedOrder?.delivery && /* @__PURE__ */ jsxDEV("div", { className: "bg-[#141b2b] border border-[#4edea3]/30 rounded-xl overflow-hidden mt-4 mb-4", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "bg-[#4edea3]/10 px-4 py-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "w-2 h-2 rounded-full bg-[#4edea3] animate-ping" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1585,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-black uppercase text-[#4edea3]", children: "Rider is approaching!" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1586,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1584,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "relative h-32 bg-slate-900 w-full overflow-hidden flex items-center justify-center", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 border-[0.5px] border-slate-800", style: { backgroundSize: "20px 20px", backgroundImage: "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)" } }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1589,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "w-32 h-32 border border-[#4edea3]/20 rounded-full animate-ping absolute" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1590,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "w-16 h-16 border border-[#4edea3]/40 rounded-full animate-ping absolute" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1591,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "w-4 h-4 bg-[#4edea3] rounded-full z-10 shadow-[0_0_15px_#4edea3] relative flex items-center justify-center", children: /* @__PURE__ */ jsxDEV("div", { className: "absolute -top-6 bg-white text-slate-900 text-[8px] font-bold px-2 py-0.5 rounded whitespace-nowrap", children: "Rider" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1593,
            columnNumber: 21
          }, this) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1592,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1588,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1583,
        columnNumber: 11
      }, this),
      (trackedOrder?.status === "PAID" || trackedOrder?.status === "SETTLED") && /* @__PURE__ */ jsxDEV("div", { className: "bg-[#141b2b] border border-amber-500/30 rounded-xl p-4 mt-4 mb-4 text-center", children: trackedOrder?.feedback || feedbackSubmitted ? /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("h4", { className: "text-sm font-black text-[#4edea3] mb-1", children: "Thanks for your feedback!" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1603,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center gap-1 my-2", children: [1, 2, 3, 4, 5].map(
          (star) => /* @__PURE__ */ jsxDEV("svg", { className: `w-5 h-5 ${(trackedOrder?.feedback?.rating || feedbackRating) >= star ? "text-amber-400" : "text-slate-600"}`, fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsxDEV("path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1606,
            columnNumber: 195
          }, this) }, star, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1606,
            columnNumber: 17
          }, this)
        ) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1604,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-slate-400", children: [
          '"',
          trackedOrder?.feedback?.comment || feedbackComment,
          '"'
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1609,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1602,
        columnNumber: 13
      }, this) : /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("h4", { className: "text-sm font-black text-white mb-1", children: "How was your delivery?" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1613,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-slate-400 mb-3", children: "Rate your experience to help us improve" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1614,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center gap-2 mb-3", children: [1, 2, 3, 4, 5].map(
          (star) => /* @__PURE__ */ jsxDEV("button", { onClick: () => setFeedbackRating(star), className: "focus:outline-none", children: /* @__PURE__ */ jsxDEV("svg", { className: `w-8 h-8 ${feedbackRating >= star ? "text-amber-400" : "text-slate-700 hover:text-amber-200"} transition-colors`, fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsxDEV("path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1618,
            columnNumber: 197
          }, this) }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1618,
            columnNumber: 27
          }, this) }, star, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1617,
            columnNumber: 17
          }, this)
        ) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1615,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV(
          "textarea",
          {
            placeholder: "Leave a comment (optional)...",
            value: feedbackComment,
            onChange: (e) => setFeedbackComment(e.target.value),
            className: "w-full bg-[#191f2f] border border-slate-700 rounded-xl px-3 py-2 text-[10px] text-white resize-none outline-none focus:border-amber-400 mb-3",
            rows: 2
          },
          void 0,
          false,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1622,
            columnNumber: 21
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("button", { onClick: handleSubmitFeedback, disabled: !feedbackRating || isSubmittingFeedback, className: "w-full py-2 bg-[#fbbf24] hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all", children: "Submit Feedback" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1629,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1612,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1600,
        columnNumber: 11
      }, this),
      trackedOrderId && trackedOrder?.status !== "PAID" && trackedOrder?.status !== "SETTLED" && /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 mb-4 bg-[#141b2b] rounded-xl px-4 py-2 border border-slate-800", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse flex-shrink-0" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1638,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-[#d3c5ac]", children: "Live tracking active — updates every 4 seconds" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1639,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1637,
        columnNumber: 11
      }, this),
      !customer && trackedOrderId && /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 mb-3 bg-[#4edea3]/5 border border-[#4edea3]/20 rounded-xl px-4 py-2.5", children: [
        /* @__PURE__ */ jsxDEV(MapPin, { className: "w-3.5 h-3.5 text-[#4edea3] flex-shrink-0" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1645,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-[#4edea3]", children: [
          "Header mein ",
          /* @__PURE__ */ jsxDEV("strong", { children: [
            "Order #",
            trackedOrderId
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1647,
            columnNumber: 31
          }, this),
          " button se live track karein"
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1646,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1644,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex gap-4 mt-6", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => {
              setOrderConfirmed(false);
              setTrackId(String(trackedOrderId));
              setTrackResult(trackedOrder);
              setTrackError("");
              setIsTrackOpen(true);
            },
            className: "flex-1 py-3.5 bg-[#4edea3] text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all",
            children: "Track Your Order"
          },
          void 0,
          false,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1652,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setOrderConfirmed(false),
            className: "flex-1 py-3 border border-[#ffe1a7] text-[#ffe1a7] rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all hover:bg-[#ffe1a7]/10",
            children: "Go back to feeds"
          },
          void 0,
          false,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1664,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1651,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 1509,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 1508,
      columnNumber: 7
    }, this),
    activeCampaignModal && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-[#0c1322]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-[#141b2b] w-full max-w-4xl rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "relative h-64 flex-shrink-0 bg-slate-900", children: [
        activeCampaignModal.image_url ? /* @__PURE__ */ jsxDEV(
          "img",
          {
            src: `${BACKEND_URL}${activeCampaignModal.image_url}`,
            alt: activeCampaignModal.title,
            className: "w-full h-full object-cover"
          },
          void 0,
          false,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1681,
            columnNumber: 13
          },
          this
        ) : /* @__PURE__ */ jsxDEV("div", { className: "w-full h-full bg-gradient-to-br from-[#ec4899]/20 to-purple-900/20 flex items-center justify-center", children: /* @__PURE__ */ jsxDEV(Megaphone, { className: "w-20 h-20 text-[#ec4899]/50" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1688,
          columnNumber: 19
        }, this) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1687,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-t from-[#141b2b] to-transparent" }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1691,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setActiveCampaignModal(null),
            className: "absolute top-6 right-6 w-10 h-10 bg-black/50 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md",
            children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1696,
              columnNumber: 17
            }, this)
          },
          void 0,
          false,
          {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1692,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-6 left-8 right-8", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "inline-block bg-[#ec4899] text-white text-xs font-black px-3 py-1 rounded-full mb-3 shadow-[0_0_15px_rgba(236,72,153,0.5)]", children: [
            activeCampaignModal.discount_pct,
            "% OFF DEAL"
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1699,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("h2", { className: "text-4xl font-black text-white leading-tight", children: activeCampaignModal.title }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1702,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-[#d3c5ac] mt-2 max-w-2xl", children: activeCampaignModal.description }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1703,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1698,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1679,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "p-8 overflow-y-auto custom-scrollbar flex-1 bg-[#191f2f]", children: [
        /* @__PURE__ */ jsxDEV("h3", { className: "text-xl font-bold text-white mb-6 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV(Utensils, { className: "text-[#ec4899]" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1709,
            columnNumber: 17
          }, this),
          "Items included in this offer"
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1708,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: activeCampaignModal.target_products?.map(
          (p) => /* @__PURE__ */ jsxDEV("div", { className: "bg-slate-800/40 border border-slate-700/50 rounded-2xl p-3 flex items-center gap-4 hover:bg-slate-800/80 transition-colors", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "w-20 h-20 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0", children: p.image_url ? /* @__PURE__ */ jsxDEV("img", { src: p.image_url.startsWith("http") ? p.image_url : `${BACKEND_URL}${p.image_url}`, className: "w-full h-full object-cover" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1717,
              columnNumber: 19
            }, this) : /* @__PURE__ */ jsxDEV("div", { className: "w-full h-full flex items-center justify-center text-slate-600 font-black text-2xl", children: "?" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1719,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1715,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxDEV("h4", { className: "font-bold text-white text-sm line-clamp-2 leading-snug", children: p.name }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1723,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 mt-2", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-black text-slate-400 line-through", children: [
                  "$",
                  p.price.toFixed(2)
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 1725,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-lg font-black text-[#ec4899]", children: [
                  "$",
                  (p.price * (1 - activeCampaignModal.discount_pct / 100)).toFixed(2)
                ] }, void 0, true, {
                  fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                  lineNumber: 1726,
                  columnNumber: 25
                }, this)
              ] }, void 0, true, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1724,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1722,
              columnNumber: 21
            }, this)
          ] }, p.id, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1714,
            columnNumber: 15
          }, this)
        ) }, void 0, false, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1712,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1707,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 1678,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 1677,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("footer", { className: "bg-[#141b2b] py-16 px-8 border-t border-slate-800", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxDEV("h2", { className: "font-headline-md text-2xl font-black text-[#ffe1a7] tracking-tight", children: siteSettings?.siteTitle || "D4U" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1741,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#d3c5ac] leading-relaxed", children: "The future of fast-casual dining. Premium culinary quality fused with state-of-the-art POS ordering mechanisms." }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1744,
            columnNumber: 13
          }, this),
          stores.find((s) => s.id === storeId)?.address ? /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#d3c5ac] leading-relaxed flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV(MapPin, { className: "w-4 h-4 text-[#fbbf24] flex-shrink-0" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1749,
              columnNumber: 17
            }, this),
            stores.find((s) => s.id === storeId)?.address
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1748,
            columnNumber: 13
          }, this) : siteSettings?.address && /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#d3c5ac] leading-relaxed flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV(MapPin, { className: "w-4 h-4 text-[#fbbf24] flex-shrink-0" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1754,
              columnNumber: 17
            }, this),
            siteSettings.address
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1753,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxDEV("a", { href: siteSettings?.facebookUrl || "#", target: "_blank", rel: "noreferrer", className: "w-10 h-10 rounded-full bg-[#191f2f]/80 flex items-center justify-center hover:text-[#ffe1a7] text-slate-400 transition-colors", children: /* @__PURE__ */ jsxDEV(Globe, { className: "w-4 h-4" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1760,
              columnNumber: 17
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1759,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("a", { href: siteSettings?.instagramUrl || "#", target: "_blank", rel: "noreferrer", className: "w-10 h-10 rounded-full bg-[#191f2f]/80 flex items-center justify-center hover:text-[#ffe1a7] text-slate-400 transition-colors", children: /* @__PURE__ */ jsxDEV(Share2, { className: "w-4 h-4" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1763,
              columnNumber: 17
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1762,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1758,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1740,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h4", { className: "font-bold mb-6 text-white text-xs uppercase tracking-widest", children: "Contact Us" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1769,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("ul", { className: "space-y-4 text-xs text-[#d3c5ac]", children: [
            stores.find((s) => s.id === storeId)?.phone ? /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: `tel:${stores.find((s) => s.id === storeId)?.phone}`, className: "hover:text-white", children: [
              "Call: ",
              stores.find((s) => s.id === storeId)?.phone
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1772,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1772,
              columnNumber: 15
            }, this) : siteSettings?.contactPhone && /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: `tel:${siteSettings.contactPhone}`, className: "hover:text-white", children: [
              "Call: ",
              siteSettings.contactPhone
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1774,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1774,
              columnNumber: 15
            }, this),
            siteSettings?.whatsappNumber && /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: `https://wa.me/${siteSettings.whatsappNumber.replace(/[^0-9]/g, "")}`, target: "_blank", rel: "noreferrer", className: "hover:text-white text-[#4edea3]", children: [
              "WhatsApp: ",
              siteSettings.whatsappNumber
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1777,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1777,
              columnNumber: 15
            }, this),
            siteSettings?.contactEmail && /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: `mailto:${siteSettings.contactEmail}`, className: "hover:text-white", children: [
              "Email: ",
              siteSettings.contactEmail
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1780,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1780,
              columnNumber: 15
            }, this),
            !siteSettings?.contactPhone && !siteSettings?.whatsappNumber && !siteSettings?.contactEmail && /* @__PURE__ */ jsxDEV(Fragment, { children: [
              /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "#", className: "hover:text-white", children: "Our GOURMET Menu" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1784,
                columnNumber: 23
              }, this) }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1784,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "#", className: "hover:text-white", children: "Bespoke Locations" }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1785,
                columnNumber: 23
              }, this) }, void 0, false, {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1785,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1783,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1770,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1768,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h4", { className: "font-bold mb-6 text-white text-xs uppercase tracking-widest", children: "Company" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1792,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("ul", { className: "space-y-4 text-xs text-[#d3c5ac]", children: [
            /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "#", className: "hover:text-white", children: "Our Culinary Journey" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1794,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1794,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "#", className: "hover:text-white", children: "Corporate Sustainability" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1795,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1795,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "#", className: "hover:text-white", children: "Kitchen Careers" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1796,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1796,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "#", className: "hover:text-white", children: "Intellectual Privacy" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1797,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1797,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1793,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1791,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h4", { className: "font-bold mb-6 text-white text-xs uppercase tracking-widest", children: "Join the Dash" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1802,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#d3c5ac] mb-4", children: "Subscribe for exclusive chef specials and priority reservations." }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1803,
            columnNumber: 13
          }, this),
          newsLetterJoined ? /* @__PURE__ */ jsxDEV("div", { className: "bg-emerald-500/10 border border-emerald-500/20 text-[#4edea3] text-[10px] font-bold p-3 rounded-xl uppercase tracking-wider text-center", children: "✓ Registered successfully!" }, void 0, false, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1806,
            columnNumber: 13
          }, this) : /* @__PURE__ */ jsxDEV("form", { onSubmit: handleNewsletterJoin, className: "flex gap-2", children: [
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "email",
                value: emailValue,
                onChange: (e) => setEmailValue(e.target.value),
                placeholder: "Enter email address",
                className: "flex-1 bg-slate-800 border-none rounded-xl px-4 text-xs focus:ring-1 focus:ring-[#ffe1a7] text-white",
                required: true
              },
              void 0,
              false,
              {
                fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
                lineNumber: 1811,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("button", { type: "submit", className: "bg-[#fbbf24] hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer", children: "Join" }, void 0, false, {
              fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
              lineNumber: 1819,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
            lineNumber: 1810,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
          lineNumber: 1801,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1738,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "mt-16 pt-8 border-t border-slate-800 text-center text-xs text-[#d3c5ac]", children: "© 2026 D4U Restaurant Group. Inspired by the bold. Built for the gourmet." }, void 0, false, {
        fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
        lineNumber: 1826,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
      lineNumber: 1737,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx",
    lineNumber: 481,
    columnNumber: 5
  }, this);
}
_s(LandingMode, "dX3gTkmCoa42a0je53UpnOFtfZk=");
_c = LandingMode;
var _c;
$RefreshReg$(_c, "LandingMode");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "G:/RESTAURANT_POS_WITH_BACKEND/d4u-website/src/components/LandingMode.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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O0FBQUEsYUFuQko7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQXFCQTtBQUFBLFdBcEZGO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFzRkE7QUFBQSxNQUVBLHVCQUFDLFNBQUksV0FBVSwyRUFBeUUseUZBQXhGO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFFQTtBQUFBLFNBM0ZGO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0E0RkE7QUFBQSxPQXAwQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQXMwQ0E7QUFFSjtBQUFDMVAsR0F6dkR1QmYsYUFBVztBQUFBLEtBQVhBO0FBQVcsSUFBQWdTO0FBQUEsYUFBQUEsSUFBQSIsIm5hbWVzIjpbInVzZVN0YXRlIiwidXNlRWZmZWN0IiwiaW8iLCJCQUNLRU5EX1VSTCIsIndpbmRvdyIsImxvY2F0aW9uIiwiaG9zdG5hbWUiLCJzb2NrZXQiLCJTZWFyY2giLCJVc2VyIiwiU2hvcHBpbmdDYXJ0IiwiQXJyb3dSaWdodCIsIkNoZXZyb25MZWZ0IiwiQ2hldnJvblJpZ2h0IiwiUGx1cyIsIk1pbnVzIiwiWCIsIlV0ZW5zaWxzIiwiR2xvYmUiLCJTaGFyZTIiLCJBd2FyZCIsIkNoZWNrQ2lyY2xlMiIsIlBhcnR5UG9wcGVyIiwiTWFwUGluIiwiVGFnIiwiTWVnYXBob25lIiwiTGFuZGluZ01vZGUiLCJzdG9yZUlkIiwic3RvcmVOYW1lIiwic3RvcmVzIiwib25TdG9yZUNoYW5nZSIsImZvb2RJdGVtcyIsImNhcnQiLCJvbkFkZFRvQ2FydCIsIm9uUmVtb3ZlRnJvbUNhcnQiLCJvbkRlY3JlYXNlUXVhbnRpdHkiLCJvbkluY3JlYXNlUXVhbnRpdHkiLCJvbkNsZWFyQ2FydCIsImJhbm5lcnMiLCJwcm9wQmFubmVycyIsImNhbXBhaWducyIsIl9zIiwiaXNDYXJ0T3BlbiIsInNldElzQ2FydE9wZW4iLCJhY3RpdmVDYXRlZ29yeSIsInNldEFjdGl2ZUNhdGVnb3J5IiwiZW1haWxWYWx1ZSIsInNldEVtYWlsVmFsdWUiLCJub3RpZmljYXRpb25Nc2ciLCJzZXROb3RpZmljYXRpb25Nc2ciLCJlcnJvck1zZyIsInNldEVycm9yTXNnIiwibmV3c0xldHRlckpvaW5lZCIsInNldE5ld3NsZXR0ZXJKb2luZWQiLCJvcmRlckNvbmZpcm1lZCIsInNldE9yZGVyQ29uZmlybWVkIiwidHJhY2tlZE9yZGVySWQiLCJzZXRUcmFja2VkT3JkZXJJZCIsInRyYWNrZWRPcmRlciIsInNldFRyYWNrZWRPcmRlciIsImN1c3RvbWVyIiwic2V0Q3VzdG9tZXIiLCJKU09OIiwicGFyc2UiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwiaXNMb2dpbk9wZW4iLCJzZXRJc0xvZ2luT3BlbiIsImxvZ2luTmFtZSIsInNldExvZ2luTmFtZSIsImxvZ2luUGhvbmUiLCJzZXRMb2dpblBob25lIiwibG9naW5BZGRyZXNzIiwic2V0TG9naW5BZGRyZXNzIiwibG9naW5FcnJvciIsInNldExvZ2luRXJyb3IiLCJmZWVkYmFja1JhdGluZyIsInNldEZlZWRiYWNrUmF0aW5nIiwiZmVlZGJhY2tDb21tZW50Iiwic2V0RmVlZGJhY2tDb21tZW50IiwiZmVlZGJhY2tTdWJtaXR0ZWQiLCJzZXRGZWVkYmFja1N1Ym1pdHRlZCIsImlzU3VibWl0dGluZ0ZlZWRiYWNrIiwic2V0SXNTdWJtaXR0aW5nRmVlZGJhY2siLCJpc015T3JkZXJzT3BlbiIsInNldElzTXlPcmRlcnNPcGVuIiwibXlPcmRlcnMiLCJzZXRNeU9yZGVycyIsImlzVHJhY2tPcGVuIiwic2V0SXNUcmFja09wZW4iLCJ0cmFja0lkIiwic2V0VHJhY2tJZCIsInRyYWNrUGhvbmUiLCJzZXRUcmFja1Bob25lIiwidHJhY2tSZXN1bHQiLCJzZXRUcmFja1Jlc3VsdCIsInRyYWNrRXJyb3IiLCJzZXRUcmFja0Vycm9yIiwidHJhY2tMb2FkaW5nIiwic2V0VHJhY2tMb2FkaW5nIiwiY2FyZEV4cGlyeSIsInNldENhcmRFeHBpcnkiLCJjYXJkQ1ZDIiwic2V0Q2FyZENWQyIsImlzUHJvY2Vzc2luZ1BheW1lbnQiLCJzZXRJc1Byb2Nlc3NpbmdQYXltZW50IiwidXNlTG95YWx0eVBvaW50cyIsInNldFVzZUxveWFsdHlQb2ludHMiLCJhY3RpdmVDYW1wYWlnbk1vZGFsIiwic2V0QWN0aXZlQ2FtcGFpZ25Nb2RhbCIsImlzQ2hlY2tvdXRQcm9maWxlT3BlbiIsInNldElzQ2hlY2tvdXRQcm9maWxlT3BlbiIsImNoZWNrb3V0TmFtZSIsInNldENoZWNrb3V0TmFtZSIsImNoZWNrb3V0UGhvbmUiLCJzZXRDaGVja291dFBob25lIiwiY2hlY2tvdXRBZGRyZXNzIiwic2V0Q2hlY2tvdXRBZGRyZXNzIiwic3RhZmZNZW1iZXJzIiwic2V0U3RhZmZNZW1iZXJzIiwiZmV0Y2giLCJ0aGVuIiwicmVzIiwianNvbiIsImRhdGEiLCJBcnJheSIsImlzQXJyYXkiLCJmaWx0ZXIiLCJ1Iiwicm9sZU5hbWUiLCJyb2xlIiwibmFtZSIsInRvTG93ZXJDYXNlIiwiY2F0Y2giLCJjb25zb2xlIiwiZXJyb3IiLCJpZCIsInNpdGVTZXR0aW5ncyIsIm1vZHVsZV9sb3lhbHR5X2VuYWJsZWQiLCJsb3lhbHR5X3BvaW50cyIsInVuZGVmaW5lZCIsInVwZGF0ZWRDdXN0b21lciIsInNldEl0ZW0iLCJzdHJpbmdpZnkiLCJjaGVja291dEVycm9yIiwic2V0Q2hlY2tvdXRFcnJvciIsImlzU3VibWl0dGluZ09yZGVyIiwic2V0SXNTdWJtaXR0aW5nT3JkZXIiLCJzZXRCYW5uZXJzIiwiY3VycmVudEJhbm5lckluZGV4Iiwic2V0Q3VycmVudEJhbm5lckluZGV4Iiwic2V0U2l0ZVNldHRpbmdzIiwibGVuZ3RoIiwiYmFuIiwiaXNBY3RpdmUiLCJzb3J0IiwieCIsInkiLCJkaXNwbGF5T3JkZXIiLCJmZXRjaENtc0RhdGEiLCJzZXR0aW5nc1JlcyIsIm9rIiwiZSIsImludGVydmFsIiwic2V0SW50ZXJ2YWwiLCJwcmV2IiwiY2xlYXJJbnRlcnZhbCIsImZldGNoTXlPcmRlcnMiLCJlbmNvZGVVUklDb21wb25lbnQiLCJwaG9uZSIsImhhbmRsZU9yZGVyVXBkYXRlIiwidXBkYXRlZE9yZGVyIiwiaWR4IiwiZmluZEluZGV4IiwibyIsIm5ld09yZGVycyIsImhhbmRsZUdwc1VwZGF0ZSIsIm9yZGVySWQiLCJkZWxpdmVyeSIsImxhdCIsImxuZyIsIm9uIiwib2ZmIiwiaGFuZGxlTG9naW4iLCJwcmV2ZW50RGVmYXVsdCIsInRyaW0iLCJhZGRyZXNzIiwibWV0aG9kIiwiaGVhZGVycyIsImJvZHkiLCJicmFuZF9pZCIsImMiLCJlcnIiLCJoYW5kbGVMb2dvdXQiLCJyZW1vdmVJdGVtIiwiaGFuZGxlVHJhY2tPcmRlciIsImN1c3RvbWVyUGhvbmUiLCJoYW5kbGVTdWJtaXRGZWVkYmFjayIsInRhcmdldE9yZGVyIiwicmF0aW5nIiwiY29tbWVudCIsImZlZWRiYWNrIiwiZmV0Y2hJbml0aWFsIiwiaGFuZGxlTmV3c2xldHRlckpvaW4iLCJzZXRUaW1lb3V0IiwiaGFuZGxlQWRkVG9DYXJ0V2l0aE5vdGlmeSIsIml0ZW0iLCJmYWxsYmFja0l0ZW0iLCJwcmljZVJzIiwicHJpY2VVU0QiLCJkZXNjcmlwdGlvbiIsImltYWdlIiwiY2F0ZWdvcnkiLCJ0YWciLCJtZWdhWmluZ2VyIiwiZmluZCIsImkiLCJtaWRuaWdodFBpenphIiwicmlnYXRvbmlJdGVtIiwiZ29sZExlYWZTaGFrZSIsImxhdmFOb2lyIiwic3Vuc2V0U3ByaXR6Iiwic3VidG90YWxVU0QiLCJyZWR1Y2UiLCJzdW0iLCJmb29kSXRlbSIsInF1YW50aXR5IiwidGF4VVNEIiwibG95YWx0eURpc2NvdW50IiwiTWF0aCIsIm1pbiIsInRvdGFsVVNEIiwidG90YWxJdGVtQ291bnQiLCJzdWJtaXRPcmRlciIsImN1c3RJbmZvIiwicGF5bG9hZCIsInN0b3JlX2lkIiwiY3VzdG9tZXJBZGRyZXNzIiwiaXRlbXMiLCJtYXAiLCJxdHkiLCJwcmljZSIsInRvdGFsQW1vdW50IiwidG9GaXhlZCIsInNvdXJjZSIsIm5vdGVzIiwib3JkZXIiLCJwb2ludHNVc2VkIiwiY2VpbCIsInBvaW50cyIsInVwZGF0ZWRDIiwibWF4IiwidGV4dCIsInN0YXR1cyIsInVybCIsIm1lc3NhZ2UiLCJoYW5kbGVDaGVja291dFByb2ZpbGVTdWJtaXQiLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsIlN0cmluZyIsInRpdGxlIiwiaW1hZ2VVcmwiLCJzdWJ0aXRsZSIsInNwbGl0Iiwic2xpY2UiLCJqb2luIiwiYW5pbWF0aW9uRGVsYXkiLCJsaW5rVXJsIiwiYnV0dG9uVGV4dCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJzY3JvbGxJbnRvVmlldyIsImJlaGF2aW9yIiwiU2V0IiwiZiIsImljb25zIiwiaWNvbiIsImNhbXAiLCJ0YXJnZXRfcHJvZHVjdHMiLCJpbWFnZV91cmwiLCJkaXNjb3VudF9wY3QiLCJwIiwic3RhcnRzV2l0aCIsInN0YWZmIiwidGFyZ2V0IiwiY2hlY2tlZCIsImJ0biIsImN1cnJlbnRUYXJnZXQiLCJkaXNhYmxlZCIsIm9yaWdpbmFsVGV4dCIsInRleHRDb250ZW50IiwidmFsdWUiLCJ0aW1lUGxhY2VkIiwibGFiZWwiLCJzdWIiLCJkb25lIiwia2RzU3RhdHVzIiwicHJlcFRpbWVNaW51dGVzIiwiZXN0aW1hdGVkUmVhZHlBdCIsInN0ZXAiLCJiYWNrZ3JvdW5kU2l6ZSIsImJhY2tncm91bmRJbWFnZSIsInN0YXIiLCJvcmQiLCJzdGF0dXNDb2xvciIsInN0YXR1c0xhYmVsIiwic2l0ZVRpdGxlIiwicyIsImZhY2Vib29rVXJsIiwiaW5zdGFncmFtVXJsIiwiY29udGFjdFBob25lIiwid2hhdHNhcHBOdW1iZXIiLCJyZXBsYWNlIiwiY29udGFjdEVtYWlsIiwiX2MiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiTGFuZGluZ01vZGUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgaW8gfSBmcm9tICdzb2NrZXQuaW8tY2xpZW50JztcblxuY29uc3QgQkFDS0VORF9VUkwgPSAnaHR0cDovLycgKyAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyAod2luZG93LmxvY2F0aW9uLmhvc3RuYW1lID09PSAnbG9jYWxob3N0JyA/ICcxMjcuMC4wLjEnIDogd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lKSA6ICcxMjcuMC4wLjEnKSArICc6MzAwMSc7XG5jb25zdCBzb2NrZXQgPSBpbyhCQUNLRU5EX1VSTCk7XG5pbXBvcnQgdHlwZSB7IEZvb2RJdGVtLCBDYXJ0SXRlbSB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7XG4gIFNlYXJjaCxcbiAgVXNlcixcbiAgU2hvcHBpbmdDYXJ0LFxuICBBcnJvd1JpZ2h0LFxuICBDaGV2cm9uTGVmdCxcbiAgQ2hldnJvblJpZ2h0LFxuICBQbHVzLFxuICBNaW51cyxcbiAgWCxcbiAgWmFwLFxuICBVdGVuc2lscyxcbiAgR2xvYmUsXG4gIFNoYXJlMixcbiAgQXdhcmQsXG4gIENoZWNrQ2lyY2xlMixcbiAgUGFydHlQb3BwZXIsXG4gIE1hcFBpbixcbiAgQ2xvY2ssXG4gIEJhbmtub3RlLFxuICBDcmVkaXRDYXJkLFxuICBUYWcsXG4gIE1lZ2FwaG9uZVxufSBmcm9tICdsdWNpZGUtcmVhY3QnO1xuXG5pbnRlcmZhY2UgTGFuZGluZ01vZGVQcm9wcyB7XG4gIHN0b3JlSWQ6IG51bWJlcjtcbiAgc3RvcmVOYW1lPzogc3RyaW5nO1xuICBzdG9yZXM/OiBhbnlbXTtcbiAgb25TdG9yZUNoYW5nZT86IChpZDogbnVtYmVyKSA9PiB2b2lkO1xuICBmb29kSXRlbXM6IEZvb2RJdGVtW107XG4gIGNhcnQ6IENhcnRJdGVtW107XG4gIG9uQWRkVG9DYXJ0OiAoaXRlbTogRm9vZEl0ZW0pID0+IHZvaWQ7XG4gIG9uUmVtb3ZlRnJvbUNhcnQ6IChpdGVtSWQ6IHN0cmluZywgcmVtb3ZlQWxsPzogYm9vbGVhbikgPT4gdm9pZDtcbiAgb25EZWNyZWFzZVF1YW50aXR5OiAoaXRlbUlkOiBzdHJpbmcpID0+IHZvaWQ7XG4gIG9uSW5jcmVhc2VRdWFudGl0eTogKGl0ZW1JZDogc3RyaW5nKSA9PiB2b2lkO1xuICBvbkNsZWFyQ2FydDogKCkgPT4gdm9pZDtcbiAgYmFubmVycz86IGFueVtdO1xuICBjYW1wYWlnbnM/OiBhbnlbXTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gTGFuZGluZ01vZGUoe1xuICBzdG9yZUlkLFxuICBzdG9yZU5hbWUgPSAnRDRVJyxcbiAgc3RvcmVzID0gW10sXG4gIG9uU3RvcmVDaGFuZ2UsXG4gIGZvb2RJdGVtcyxcbiAgY2FydCxcbiAgb25BZGRUb0NhcnQsXG4gIG9uUmVtb3ZlRnJvbUNhcnQsXG4gIG9uRGVjcmVhc2VRdWFudGl0eSxcbiAgb25JbmNyZWFzZVF1YW50aXR5LFxuICBvbkNsZWFyQ2FydCxcbiAgYmFubmVyczogcHJvcEJhbm5lcnMgPSBbXSxcbiAgY2FtcGFpZ25zID0gW11cbn06IExhbmRpbmdNb2RlUHJvcHMpIHtcbiAgY29uc3QgW2lzQ2FydE9wZW4sIHNldElzQ2FydE9wZW5dID0gdXNlU3RhdGU8Ym9vbGVhbj4oZmFsc2UpO1xuICBjb25zdCBbYWN0aXZlQ2F0ZWdvcnksIHNldEFjdGl2ZUNhdGVnb3J5XSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xuICBjb25zdCBbZW1haWxWYWx1ZSwgc2V0RW1haWxWYWx1ZV0gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKTtcbiAgY29uc3QgW25vdGlmaWNhdGlvbk1zZywgc2V0Tm90aWZpY2F0aW9uTXNnXSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xuICBjb25zdCBbZXJyb3JNc2csIHNldEVycm9yTXNnXSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xuICBjb25zdCBbbmV3c0xldHRlckpvaW5lZCwgc2V0TmV3c2xldHRlckpvaW5lZF0gPSB1c2VTdGF0ZTxib29sZWFuPihmYWxzZSk7XG4gIGNvbnN0IFtvcmRlckNvbmZpcm1lZCwgc2V0T3JkZXJDb25maXJtZWRdID0gdXNlU3RhdGU8Ym9vbGVhbj4oZmFsc2UpO1xuICBjb25zdCBbdHJhY2tlZE9yZGVySWQsIHNldFRyYWNrZWRPcmRlcklkXSA9IHVzZVN0YXRlPG51bWJlciB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbdHJhY2tlZE9yZGVyLCBzZXRUcmFja2VkT3JkZXJdID0gdXNlU3RhdGU8YW55PihudWxsKTtcblxuICAvLyBDdXN0b21lciBhdXRoXG4gIGNvbnN0IFtjdXN0b21lciwgc2V0Q3VzdG9tZXJdID0gdXNlU3RhdGU8eyBpZD86IG51bWJlcjsgbmFtZTogc3RyaW5nOyBwaG9uZTogc3RyaW5nOyBhZGRyZXNzOiBzdHJpbmc7IGxveWFsdHlfcG9pbnRzPzogbnVtYmVyIH0gfCBudWxsPigoKSA9PiB7XG4gICAgdHJ5IHsgcmV0dXJuIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2Q0dV9jdXN0b21lcicpIHx8ICdudWxsJyk7IH0gY2F0Y2ggeyByZXR1cm4gbnVsbDsgfVxuICB9KTtcbiAgY29uc3QgW2lzTG9naW5PcGVuLCBzZXRJc0xvZ2luT3Blbl0gPSB1c2VTdGF0ZTxib29sZWFuPihmYWxzZSk7XG4gIGNvbnN0IFtsb2dpbk5hbWUsIHNldExvZ2luTmFtZV0gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKTtcbiAgY29uc3QgW2xvZ2luUGhvbmUsIHNldExvZ2luUGhvbmVdID0gdXNlU3RhdGU8c3RyaW5nPignJyk7XG4gIGNvbnN0IFtsb2dpbkFkZHJlc3MsIHNldExvZ2luQWRkcmVzc10gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKTtcbiAgY29uc3QgW2xvZ2luRXJyb3IsIHNldExvZ2luRXJyb3JdID0gdXNlU3RhdGU8c3RyaW5nPignJyk7XG5cbiAgLy8gRmVlZGJhY2sgc3RhdGVzXG4gIGNvbnN0IFtmZWVkYmFja1JhdGluZywgc2V0RmVlZGJhY2tSYXRpbmddID0gdXNlU3RhdGU8bnVtYmVyPigwKTtcbiAgY29uc3QgW2ZlZWRiYWNrQ29tbWVudCwgc2V0RmVlZGJhY2tDb21tZW50XSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xuICBjb25zdCBbZmVlZGJhY2tTdWJtaXR0ZWQsIHNldEZlZWRiYWNrU3VibWl0dGVkXSA9IHVzZVN0YXRlPGJvb2xlYW4+KGZhbHNlKTtcbiAgY29uc3QgW2lzU3VibWl0dGluZ0ZlZWRiYWNrLCBzZXRJc1N1Ym1pdHRpbmdGZWVkYmFja10gPSB1c2VTdGF0ZTxib29sZWFuPihmYWxzZSk7XG5cbiAgLy8gTXkgT3JkZXJzIHBhbmVsXG4gIGNvbnN0IFtpc015T3JkZXJzT3Blbiwgc2V0SXNNeU9yZGVyc09wZW5dID0gdXNlU3RhdGU8Ym9vbGVhbj4oZmFsc2UpO1xuICBjb25zdCBbbXlPcmRlcnMsIHNldE15T3JkZXJzXSA9IHVzZVN0YXRlPGFueVtdPihbXSk7XG5cbiAgLy8gR3Vlc3QgdHJhY2sgb3JkZXJcbiAgY29uc3QgW2lzVHJhY2tPcGVuLCBzZXRJc1RyYWNrT3Blbl0gPSB1c2VTdGF0ZTxib29sZWFuPihmYWxzZSk7XG4gIGNvbnN0IFt0cmFja0lkLCBzZXRUcmFja0lkXSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xuICBjb25zdCBbdHJhY2tQaG9uZSwgc2V0VHJhY2tQaG9uZV0gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKTtcbiAgY29uc3QgW3RyYWNrUmVzdWx0LCBzZXRUcmFja1Jlc3VsdF0gPSB1c2VTdGF0ZTxhbnk+KG51bGwpO1xuICBjb25zdCBbdHJhY2tFcnJvciwgc2V0VHJhY2tFcnJvcl0gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKTtcbiAgY29uc3QgW3RyYWNrTG9hZGluZywgc2V0VHJhY2tMb2FkaW5nXSA9IHVzZVN0YXRlPGJvb2xlYW4+KGZhbHNlKTtcbiAgY29uc3QgW2NhcmRFeHBpcnksIHNldENhcmRFeHBpcnldID0gdXNlU3RhdGU8c3RyaW5nPignJyk7XG4gIGNvbnN0IFtjYXJkQ1ZDLCBzZXRDYXJkQ1ZDXSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xuICBjb25zdCBbaXNQcm9jZXNzaW5nUGF5bWVudCwgc2V0SXNQcm9jZXNzaW5nUGF5bWVudF0gPSB1c2VTdGF0ZTxib29sZWFuPihmYWxzZSk7XG5cbiAgLy8gTG95YWx0eSBTdGF0ZVxuICBjb25zdCBbdXNlTG95YWx0eVBvaW50cywgc2V0VXNlTG95YWx0eVBvaW50c10gPSB1c2VTdGF0ZTxib29sZWFuPihmYWxzZSk7XG5cbiAgLy8gQ2FtcGFpZ24gTW9kYWxcbiAgY29uc3QgW2FjdGl2ZUNhbXBhaWduTW9kYWwsIHNldEFjdGl2ZUNhbXBhaWduTW9kYWxdID0gdXNlU3RhdGU8YW55PihudWxsKTtcblxuICAvLyBDaGVja291dCBQcm9maWxlIE1vZGFsXG4gIGNvbnN0IFtpc0NoZWNrb3V0UHJvZmlsZU9wZW4sIHNldElzQ2hlY2tvdXRQcm9maWxlT3Blbl0gPSB1c2VTdGF0ZTxib29sZWFuPihmYWxzZSk7XG4gIGNvbnN0IFtjaGVja291dE5hbWUsIHNldENoZWNrb3V0TmFtZV0gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKTtcbiAgY29uc3QgW2NoZWNrb3V0UGhvbmUsIHNldENoZWNrb3V0UGhvbmVdID0gdXNlU3RhdGU8c3RyaW5nPignJyk7XG4gIGNvbnN0IFtjaGVja291dEFkZHJlc3MsIHNldENoZWNrb3V0QWRkcmVzc10gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKTtcblxuICAvLyBTdGFmZiBTZWN0aW9uXG4gIGNvbnN0IFtzdGFmZk1lbWJlcnMsIHNldFN0YWZmTWVtYmVyc10gPSB1c2VTdGF0ZTxhbnlbXT4oW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHN0b3JlSWQpIHtcbiAgICAgIGZldGNoKGAke0JBQ0tFTkRfVVJMfS91c2Vycz9zdG9yZV9pZD0ke3N0b3JlSWR9YClcbiAgICAgICAgLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpXG4gICAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICBzZXRTdGFmZk1lbWJlcnMoZGF0YS5maWx0ZXIoKHU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCByb2xlTmFtZSA9IHUucm9sZT8ubmFtZT8udG9Mb3dlckNhc2UoKSB8fCAnJztcbiAgICAgICAgICAgICAgcmV0dXJuIHJvbGVOYW1lICE9PSAncmlkZXInICYmIHJvbGVOYW1lICE9PSAnc3VwZXJhZG1pbic7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcik7XG4gICAgfVxuICB9LCBbc3RvcmVJZF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGN1c3RvbWVyPy5pZCAmJiBzaXRlU2V0dGluZ3M/Lm1vZHVsZV9sb3lhbHR5X2VuYWJsZWQpIHtcbiAgICAgIGZldGNoKGAke0JBQ0tFTkRfVVJMfS9jdXN0b21lcnMvJHtjdXN0b21lci5pZH0vd2FsbGV0YClcbiAgICAgICAgLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpXG4gICAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICAgIGlmIChkYXRhLmxveWFsdHlfcG9pbnRzICE9PSB1bmRlZmluZWQgJiYgZGF0YS5sb3lhbHR5X3BvaW50cyAhPT0gY3VzdG9tZXIubG95YWx0eV9wb2ludHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZWRDdXN0b21lciA9IHsgLi4uY3VzdG9tZXIsIGxveWFsdHlfcG9pbnRzOiBkYXRhLmxveWFsdHlfcG9pbnRzIH07XG4gICAgICAgICAgICBzZXRDdXN0b21lcih1cGRhdGVkQ3VzdG9tZXIpO1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2Q0dV9jdXN0b21lcicsIEpTT04uc3RyaW5naWZ5KHVwZGF0ZWRDdXN0b21lcikpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuICAgIH1cbiAgfSwgW2N1c3RvbWVyPy5pZCwgc2l0ZVNldHRpbmdzPy5tb2R1bGVfbG95YWx0eV9lbmFibGVkXSk7XG4gIGNvbnN0IFtjaGVja291dEVycm9yLCBzZXRDaGVja291dEVycm9yXSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xuICBjb25zdCBbaXNTdWJtaXR0aW5nT3JkZXIsIHNldElzU3VibWl0dGluZ09yZGVyXSA9IHVzZVN0YXRlPGJvb2xlYW4+KGZhbHNlKTtcblxuICAvLyBDTVMgU3RhdGVcbiAgY29uc3QgW2Jhbm5lcnMsIHNldEJhbm5lcnNdID0gdXNlU3RhdGU8YW55W10+KHByb3BCYW5uZXJzIHx8IFtdKTtcbiAgY29uc3QgW2N1cnJlbnRCYW5uZXJJbmRleCwgc2V0Q3VycmVudEJhbm5lckluZGV4XSA9IHVzZVN0YXRlKDApO1xuICBjb25zdCBbc2l0ZVNldHRpbmdzLCBzZXRTaXRlU2V0dGluZ3NdID0gdXNlU3RhdGU8YW55PihudWxsKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChwcm9wQmFubmVycyAmJiBwcm9wQmFubmVycy5sZW5ndGggPiAwKSB7XG4gICAgICBzZXRCYW5uZXJzKHByb3BCYW5uZXJzLmZpbHRlcigoYmFuOiBhbnkpID0+IGJhbi5pc0FjdGl2ZSkuc29ydCgoeDogYW55LCB5OiBhbnkpID0+IHguZGlzcGxheU9yZGVyIC0geS5kaXNwbGF5T3JkZXIpKTtcbiAgICB9XG4gIH0sIFtwcm9wQmFubmVyc10pO1xuICBcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBmZXRjaENtc0RhdGEgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzZXR0aW5nc1JlcyA9IGF3YWl0IGZldGNoKGAke0JBQ0tFTkRfVVJMfS9jbXMvc2V0dGluZ3NgKTtcbiAgICAgICAgaWYgKHNldHRpbmdzUmVzLm9rKSBzZXRTaXRlU2V0dGluZ3MoYXdhaXQgc2V0dGluZ3NSZXMuanNvbigpKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignQ01TIGZldGNoIGVycm9yJywgZSk7XG4gICAgICB9XG4gICAgfTtcbiAgICBmZXRjaENtc0RhdGEoKTtcbiAgfSwgW10pO1xuXG4gIC8vIEF1dG8tc2xpZGUgYmFubmVyc1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChiYW5uZXJzLmxlbmd0aCA8PSAxKSByZXR1cm47XG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBzZXRDdXJyZW50QmFubmVySW5kZXgocHJldiA9PiAocHJldiArIDEpICUgYmFubmVycy5sZW5ndGgpO1xuICAgIH0sIDUwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgfSwgW2Jhbm5lcnNdKTtcblxuICAvLyBJbml0aWFsIGZldGNoIGZvciBNeSBPcmRlcnNcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWN1c3RvbWVyIHx8ICFpc015T3JkZXJzT3BlbikgcmV0dXJuO1xuICAgIGNvbnN0IGZldGNoTXlPcmRlcnMgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtCQUNLRU5EX1VSTH0vb25saW5lLW9yZGVycz9waG9uZT0ke2VuY29kZVVSSUNvbXBvbmVudChjdXN0b21lci5waG9uZSl9YCk7XG4gICAgICAgIGlmIChyZXMub2spIHNldE15T3JkZXJzKGF3YWl0IHJlcy5qc29uKCkpO1xuICAgICAgfSBjYXRjaCB7IC8qIGJyaWRnZSBvZmZsaW5lICovIH1cbiAgICB9O1xuICAgIGZldGNoTXlPcmRlcnMoKTtcbiAgfSwgW2N1c3RvbWVyLCBpc015T3JkZXJzT3Blbl0pO1xuXG4gIC8vIFJlYWwtdGltZSBTb2NrZXQuaW8gU3luYyBmb3IgYWxsIFRyYWNrZXJzXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgaGFuZGxlT3JkZXJVcGRhdGUgPSAodXBkYXRlZE9yZGVyOiBhbnkpID0+IHtcbiAgICAgIC8vIDEuIEF1dG8tdXBkYXRlIE15IE9yZGVycyBsaXN0XG4gICAgICBzZXRNeU9yZGVycyhwcmV2ID0+IHtcbiAgICAgICAgY29uc3QgaWR4ID0gcHJldi5maW5kSW5kZXgobyA9PiBvLmlkID09PSB1cGRhdGVkT3JkZXIuaWQpO1xuICAgICAgICBpZiAoaWR4ID4gLTEpIHtcbiAgICAgICAgICBjb25zdCBuZXdPcmRlcnMgPSBbLi4ucHJldl07XG4gICAgICAgICAgbmV3T3JkZXJzW2lkeF0gPSB1cGRhdGVkT3JkZXI7XG4gICAgICAgICAgcmV0dXJuIG5ld09yZGVycztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJldjtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyAyLiBBdXRvLXVwZGF0ZSBHdWVzdCBUcmFja2VyIEJhZGdlXG4gICAgICBzZXRUcmFja2VkT3JkZXIoKHByZXY6IGFueSkgPT4ge1xuICAgICAgICBpZiAocHJldiAmJiBwcmV2LmlkID09PSB1cGRhdGVkT3JkZXIuaWQpIHJldHVybiB1cGRhdGVkT3JkZXI7XG4gICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIDMuIEF1dG8tdXBkYXRlIFRyYWNrIE9yZGVyIFNpZGViYXIgKEZpeGVzIHRoZSBidWcpXG4gICAgICBzZXRUcmFja1Jlc3VsdCgocHJldjogYW55KSA9PiB7XG4gICAgICAgIGlmIChwcmV2ICYmIHByZXYuaWQgPT09IHVwZGF0ZWRPcmRlci5pZCkgcmV0dXJuIHVwZGF0ZWRPcmRlcjtcbiAgICAgICAgcmV0dXJuIHByZXY7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uc3QgaGFuZGxlR3BzVXBkYXRlID0gKGRhdGE6IGFueSkgPT4ge1xuICAgICAgLy8gZGF0YTogeyBvcmRlcklkLCBsYXQsIGxuZyB9XG4gICAgICBzZXRUcmFja2VkT3JkZXIoKHByZXY6IGFueSkgPT4ge1xuICAgICAgICBpZiAocHJldiAmJiBwcmV2LmlkID09PSBkYXRhLm9yZGVySWQpIHtcbiAgICAgICAgICByZXR1cm4geyAuLi5wcmV2LCBkZWxpdmVyeTogeyAuLi5wcmV2LmRlbGl2ZXJ5LCBsYXQ6IGRhdGEubGF0LCBsbmc6IGRhdGEubG5nIH0gfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJldjtcbiAgICAgIH0pO1xuICAgICAgc2V0VHJhY2tSZXN1bHQoKHByZXY6IGFueSkgPT4ge1xuICAgICAgICBpZiAocHJldiAmJiBwcmV2LmlkID09PSBkYXRhLm9yZGVySWQpIHtcbiAgICAgICAgICByZXR1cm4geyAuLi5wcmV2LCBkZWxpdmVyeTogeyAuLi5wcmV2LmRlbGl2ZXJ5LCBsYXQ6IGRhdGEubGF0LCBsbmc6IGRhdGEubG5nIH0gfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJldjtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzb2NrZXQub24oJ29yZGVyX3VwZGF0ZWQnLCBoYW5kbGVPcmRlclVwZGF0ZSk7XG4gICAgc29ja2V0Lm9uKCdncHNfdXBkYXRlJywgaGFuZGxlR3BzVXBkYXRlKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgc29ja2V0Lm9mZignb3JkZXJfdXBkYXRlZCcsIGhhbmRsZU9yZGVyVXBkYXRlKTtcbiAgICAgIHNvY2tldC5vZmYoJ2dwc191cGRhdGUnLCBoYW5kbGVHcHNVcGRhdGUpO1xuICAgIH07XG4gIH0sIFtdKTtcblxuICBjb25zdCBoYW5kbGVMb2dpbiA9IGFzeW5jIChlOiBSZWFjdC5Gb3JtRXZlbnQpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgbmFtZSA9IGxvZ2luTmFtZS50cmltKCk7XG4gICAgY29uc3QgcGhvbmUgPSBsb2dpblBob25lLnRyaW0oKTtcbiAgICBjb25zdCBhZGRyZXNzID0gbG9naW5BZGRyZXNzLnRyaW0oKTtcbiAgICBpZiAoIW5hbWUgfHwgIXBob25lIHx8ICFhZGRyZXNzKSB7IHNldExvZ2luRXJyb3IoJ05hbWUsIFBob25lIGF1ciBBZGRyZXNzIHNhYiB6YXJvb3JpIGhhaW4nKTsgcmV0dXJuOyB9XG4gICAgaWYgKHBob25lLmxlbmd0aCA8IDcpIHsgc2V0TG9naW5FcnJvcignVmFsaWQgcGhvbmUgbnVtYmVyIGVudGVyIGthcmVpbicpOyByZXR1cm47IH1cbiAgICBcbiAgICB0cnkge1xuICAgICAgLy8gUmVnaXN0ZXIgb3IgZmV0Y2ggY3VzdG9tZXIgZnJvbSBiYWNrZW5kXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtCQUNLRU5EX1VSTH0vY3VzdG9tZXJzYCwge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYnJhbmRfaWQ6IDEsIG5hbWUsIHBob25lLCBhZGRyZXNzIH0pXG4gICAgICB9KTtcbiAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGNvbnN0IGMgPSB7IGlkOiBkYXRhLmlkLCBuYW1lOiBkYXRhLm5hbWUsIHBob25lOiBkYXRhLnBob25lLCBhZGRyZXNzOiBkYXRhLmFkZHJlc3MgfHwgYWRkcmVzcywgbG95YWx0eV9wb2ludHM6IGRhdGEubG95YWx0eV9wb2ludHMgfHwgMCB9O1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnZDR1X2N1c3RvbWVyJywgSlNPTi5zdHJpbmdpZnkoYykpO1xuICAgICAgICBzZXRDdXN0b21lcihjKTtcbiAgICAgICAgc2V0SXNMb2dpbk9wZW4oZmFsc2UpO1xuICAgICAgICBzZXRMb2dpbk5hbWUoJycpO1xuICAgICAgICBzZXRMb2dpblBob25lKCcnKTtcbiAgICAgICAgc2V0TG9naW5BZGRyZXNzKCcnKTtcbiAgICAgICAgc2V0TG9naW5FcnJvcignJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRMb2dpbkVycm9yKCdTZXJ2ZXIgZXJyb3Igd2hpbGUgc2F2aW5nIGN1c3RvbWVyJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBzZXRMb2dpbkVycm9yKCdOZXR3b3JrIGVycm9yIGNvbm5lY3RpbmcgdG8gYmFja2VuZCcpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBoYW5kbGVMb2dvdXQgPSAoKSA9PiB7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2Q0dV9jdXN0b21lcicpO1xuICAgIHNldEN1c3RvbWVyKG51bGwpO1xuICAgIHNldElzTXlPcmRlcnNPcGVuKGZhbHNlKTtcbiAgICBzZXRNeU9yZGVycyhbXSk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlVHJhY2tPcmRlciA9IGFzeW5jIChlOiBSZWFjdC5Gb3JtRXZlbnQpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgaWQgPSB0cmFja0lkLnRyaW0oKTtcbiAgICBjb25zdCBwaG9uZSA9IHRyYWNrUGhvbmUudHJpbSgpO1xuICAgIGlmICghaWQgJiYgIXBob25lKSB7IHNldFRyYWNrRXJyb3IoJ09yZGVyIElEIHlhIFBob25lIHphcm9vcmkgaGFpJyk7IHJldHVybjsgfVxuICAgIHNldFRyYWNrTG9hZGluZyh0cnVlKTtcbiAgICBzZXRUcmFja0Vycm9yKCcnKTtcbiAgICBzZXRUcmFja1Jlc3VsdChudWxsKTtcbiAgICB0cnkge1xuICAgICAgaWYgKGlkKSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke0JBQ0tFTkRfVVJMfS9vbmxpbmUtb3JkZXJzLyR7aWR9YCk7XG4gICAgICAgIGlmICghcmVzLm9rKSB7IHNldFRyYWNrRXJyb3IoJ09yZGVyIG5haGkgbWlsYSDigJQgSUQgY2hlY2sga2FyZWluJyk7IHNldFRyYWNrTG9hZGluZyhmYWxzZSk7IHJldHVybjsgfVxuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgaWYgKHBob25lICYmIGRhdGEuY3VzdG9tZXJQaG9uZSAmJiBkYXRhLmN1c3RvbWVyUGhvbmUgIT09IHBob25lKSB7XG4gICAgICAgICAgc2V0VHJhY2tFcnJvcignUGhvbmUgbnVtYmVyIG1hdGNoIG5haGkga2l5YScpO1xuICAgICAgICAgIHNldFRyYWNrTG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHNldFRyYWNrUmVzdWx0KGRhdGEpO1xuICAgICAgfSBlbHNlIGlmIChwaG9uZSkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtCQUNLRU5EX1VSTH0vb25saW5lLW9yZGVycz9waG9uZT0ke2VuY29kZVVSSUNvbXBvbmVudChwaG9uZSl9YCk7XG4gICAgICAgIGlmICghcmVzLm9rKSB7IHNldFRyYWNrRXJyb3IoJ0ZhaWxlZCB0byBmZXRjaCBvcmRlcnMnKTsgc2V0VHJhY2tMb2FkaW5nKGZhbHNlKTsgcmV0dXJuOyB9XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBpZiAoIWRhdGEgfHwgZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBzZXRUcmFja0Vycm9yKCdJcyBwaG9uZSBudW1iZXIgcGFyIGtvaSBvcmRlciBuYWhpIG1pbGEnKTsgXG4gICAgICAgICAgc2V0VHJhY2tMb2FkaW5nKGZhbHNlKTsgXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHNldFRyYWNrUmVzdWx0KGRhdGFbZGF0YS5sZW5ndGggLSAxXSk7IC8vIHRoZSBtb3N0IHJlY2VudCBvbmVcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIHNldFRyYWNrRXJyb3IoJ0JyaWRnZSBvZmZsaW5lIOKAlCBiYWFkIG1laW4gdHJ5IGthcmVpbicpO1xuICAgIH1cbiAgICBzZXRUcmFja0xvYWRpbmcoZmFsc2UpO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVN1Ym1pdEZlZWRiYWNrID0gYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHRhcmdldE9yZGVyID0gdHJhY2tSZXN1bHQgfHwgdHJhY2tlZE9yZGVyO1xuICAgIGlmICghdGFyZ2V0T3JkZXIgfHwgIWZlZWRiYWNrUmF0aW5nKSByZXR1cm47XG4gICAgc2V0SXNTdWJtaXR0aW5nRmVlZGJhY2sodHJ1ZSk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke0JBQ0tFTkRfVVJMfS9vbmxpbmUtb3JkZXJzLyR7dGFyZ2V0T3JkZXIuaWR9L2ZlZWRiYWNrYCwge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcmF0aW5nOiBmZWVkYmFja1JhdGluZywgY29tbWVudDogZmVlZGJhY2tDb21tZW50IH0pXG4gICAgICB9KTtcbiAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAgc2V0RmVlZGJhY2tTdWJtaXR0ZWQodHJ1ZSk7XG4gICAgICAgIGlmICh0cmFja1Jlc3VsdCkge1xuICAgICAgICAgIHNldFRyYWNrUmVzdWx0KHsgLi4udHJhY2tSZXN1bHQsIGZlZWRiYWNrOiB7IHJhdGluZzogZmVlZGJhY2tSYXRpbmcsIGNvbW1lbnQ6IGZlZWRiYWNrQ29tbWVudCB9IH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0cmFja2VkT3JkZXIpIHtcbiAgICAgICAgICBzZXRUcmFja2VkT3JkZXIoeyAuLi50cmFja2VkT3JkZXIsIGZlZWRiYWNrOiB7IHJhdGluZzogZmVlZGJhY2tSYXRpbmcsIGNvbW1lbnQ6IGZlZWRiYWNrQ29tbWVudCB9IH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICAgIHNldElzU3VibWl0dGluZ0ZlZWRiYWNrKGZhbHNlKTtcbiAgfTtcblxuICAvLyBJbml0aWFsIGZldGNoIGZvciBHdWVzdCBUcmFja2VyIEJhZGdlXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF0cmFja2VkT3JkZXJJZCkgcmV0dXJuO1xuICAgIGNvbnN0IGZldGNoSW5pdGlhbCA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke0JBQ0tFTkRfVVJMfS9vbmxpbmUtb3JkZXJzLyR7dHJhY2tlZE9yZGVySWR9YCk7XG4gICAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAgICBzZXRUcmFja2VkT3JkZXIoYXdhaXQgcmVzLmpzb24oKSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggeyAvKiBicmlkZ2Ugb2ZmbGluZSAqLyB9XG4gICAgfTtcbiAgICBmZXRjaEluaXRpYWwoKTtcbiAgfSwgW3RyYWNrZWRPcmRlcklkXSk7XG5cbiAgY29uc3QgaGFuZGxlTmV3c2xldHRlckpvaW4gPSAoZTogUmVhY3QuRm9ybUV2ZW50KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmICghZW1haWxWYWx1ZSkgcmV0dXJuO1xuICAgIHNldE5ld3NsZXR0ZXJKb2luZWQodHJ1ZSk7XG4gICAgc2V0RW1haWxWYWx1ZSgnJyk7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBzZXROZXdzbGV0dGVySm9pbmVkKGZhbHNlKTtcbiAgICB9LCA0MDAwKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVBZGRUb0NhcnRXaXRoTm90aWZ5ID0gKGl0ZW06IEZvb2RJdGVtKSA9PiB7XG4gICAgb25BZGRUb0NhcnQoaXRlbSk7XG4gICAgc2V0Tm90aWZpY2F0aW9uTXNnKGBBZGRlZCAke2l0ZW0ubmFtZX0gdG8gQmFza2V0IWApO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgc2V0Tm90aWZpY2F0aW9uTXNnKCcnKTtcbiAgICB9LCAyMDAwKTtcbiAgfTtcblxuICBjb25zdCBmYWxsYmFja0l0ZW06IEZvb2RJdGVtID0geyBcbiAgICBpZDogJzAnLCBuYW1lOiAnTG9hZGluZy4uLicsIHByaWNlUnM6IDAsIHByaWNlVVNEOiAwLCBcbiAgICBkZXNjcmlwdGlvbjogJ1BsZWFzZSB3YWl0Li4uJywgXG4gICAgaW1hZ2U6ICdodHRwczovL2ltYWdlcy51bnNwbGFzaC5jb20vcGhvdG8tMTU0NjA2OTkwMS1iYTk1OTlhN2U2M2M/YXV0bz1mb3JtYXQmZml0PWNyb3Amdz0zMDAmcT04MCcsIFxuICAgIGNhdGVnb3J5OiAnJywgdGFnOiAnJyBcbiAgfTtcblxuICBjb25zdCBtZWdhWmluZ2VyID0gZm9vZEl0ZW1zLmZpbmQoaSA9PiBpLmlkID09PSAnMycpIHx8IGZvb2RJdGVtc1swXSB8fCBmYWxsYmFja0l0ZW07XG4gIGNvbnN0IG1pZG5pZ2h0UGl6emEgPSBmb29kSXRlbXMuZmluZChpID0+IGkuaWQgPT09ICc4JykgfHwgZm9vZEl0ZW1zWzFdIHx8IGZhbGxiYWNrSXRlbTtcbiAgY29uc3QgcmlnYXRvbmlJdGVtID0gZm9vZEl0ZW1zLmZpbmQoaSA9PiBpLmlkID09PSAnMTEnKSB8fCBmb29kSXRlbXNbMl0gfHwgZmFsbGJhY2tJdGVtO1xuICBjb25zdCBnb2xkTGVhZlNoYWtlID0gZm9vZEl0ZW1zLmZpbmQoaSA9PiBpLmlkID09PSAnMTQnKSB8fCBmb29kSXRlbXNbM10gfHwgZmFsbGJhY2tJdGVtO1xuICBjb25zdCBsYXZhTm9pciA9IGZvb2RJdGVtcy5maW5kKGkgPT4gaS5pZCA9PT0gJzE1JykgfHwgZm9vZEl0ZW1zWzRdIHx8IGZhbGxiYWNrSXRlbTtcbiAgY29uc3Qgc3Vuc2V0U3ByaXR6ID0gZm9vZEl0ZW1zLmZpbmQoaSA9PiBpLmlkID09PSAnMTMnKSB8fCBmb29kSXRlbXNbNV0gfHwgZmFsbGJhY2tJdGVtO1xuXG4gIGNvbnN0IHN1YnRvdGFsVVNEID0gY2FydC5yZWR1Y2UoKHN1bSwgaXRlbSkgPT4gc3VtICsgaXRlbS5mb29kSXRlbS5wcmljZVVTRCAqIGl0ZW0ucXVhbnRpdHksIDApO1xuICBjb25zdCB0YXhVU0QgPSBzdWJ0b3RhbFVTRCAqIDAuMDg7XG4gIGNvbnN0IGxveWFsdHlEaXNjb3VudCA9ICh1c2VMb3lhbHR5UG9pbnRzICYmIGN1c3RvbWVyPy5sb3lhbHR5X3BvaW50cykgPyBNYXRoLm1pbihjdXN0b21lci5sb3lhbHR5X3BvaW50cyAqIDAuMTAsIHN1YnRvdGFsVVNEKSA6IDA7XG4gIGNvbnN0IHRvdGFsVVNEID0gc3VidG90YWxVU0QgKyB0YXhVU0QgLSBsb3lhbHR5RGlzY291bnQ7XG4gIGNvbnN0IHRvdGFsSXRlbUNvdW50ID0gY2FydC5yZWR1Y2UoKHN1bSwgaXRlbSkgPT4gc3VtICsgaXRlbS5xdWFudGl0eSwgMCk7XG5cbiAgY29uc3Qgc3VibWl0T3JkZXIgPSBhc3luYyAoY3VzdEluZm86IHsgaWQ/OiBudW1iZXI7IG5hbWU6IHN0cmluZzsgcGhvbmU6IHN0cmluZzsgYWRkcmVzczogc3RyaW5nOyBsb3lhbHR5X3BvaW50cz86IG51bWJlciB9KSA9PiB7XG4gICAgc2V0SXNTdWJtaXR0aW5nT3JkZXIodHJ1ZSk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICAgIHN0b3JlX2lkOiBzdG9yZUlkLFxuICAgICAgICBjdXN0b21lcjogY3VzdEluZm8ubmFtZSB8fCAnT25saW5lIEd1ZXN0JyxcbiAgICAgICAgY3VzdG9tZXJQaG9uZTogY3VzdEluZm8ucGhvbmUgfHwgJycsXG4gICAgICAgIGN1c3RvbWVyQWRkcmVzczogY3VzdEluZm8uYWRkcmVzcyB8fCAnMTIzIFRlc3QgQWRkcmVzcywgQ2l0eScsXG4gICAgICAgIGl0ZW1zOiBKU09OLnN0cmluZ2lmeShjYXJ0Lm1hcChjID0+ICh7XG4gICAgICAgICAgaWQ6IGMuZm9vZEl0ZW0uaWQsXG4gICAgICAgICAgbmFtZTogYy5mb29kSXRlbS5uYW1lLFxuICAgICAgICAgIHF0eTogYy5xdWFudGl0eSxcbiAgICAgICAgICBwcmljZTogYy5mb29kSXRlbS5wcmljZVVTRFxuICAgICAgICB9KSkpLFxuICAgICAgICB0b3RhbEFtb3VudDogdG90YWxVU0QudG9GaXhlZCgyKSxcbiAgICAgICAgc291cmNlOiAnV2Vic2l0ZScsXG4gICAgICAgIG5vdGVzOiAnJyxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke0JBQ0tFTkRfVVJMfS9vbmxpbmUtb3JkZXJzYCwge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpXG4gICAgICB9KTtcbiAgICAgICAgaWYgKHJlcy5vaykge1xuICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICAgIHNldFRyYWNrZWRPcmRlcklkKGRhdGEub3JkZXI/LmlkIHx8IG51bGwpO1xuICAgICAgICAgIHNldFRyYWNrZWRPcmRlcihkYXRhLm9yZGVyIHx8IG51bGwpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIERlZHVjdCBwb2ludHMgbG9jYWxseSBpZiB1c2VkXG4gICAgICAgICAgaWYgKHVzZUxveWFsdHlQb2ludHMgJiYgY3VzdEluZm8uaWQgJiYgbG95YWx0eURpc2NvdW50ID4gMCkge1xuICAgICAgICAgICAgY29uc3QgcG9pbnRzVXNlZCA9IE1hdGguY2VpbChsb3lhbHR5RGlzY291bnQgLyAwLjEwKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGF3YWl0IGZldGNoKGAke0JBQ0tFTkRfVVJMfS9jdXN0b21lcnMvJHtjdXN0SW5mby5pZH0vcmVkZWVtYCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcG9pbnRzOiBwb2ludHNVc2VkIH0pXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBjb25zdCB1cGRhdGVkQyA9IHsgLi4uY3VzdEluZm8sIGxveWFsdHlfcG9pbnRzOiBNYXRoLm1heCgwLCAoY3VzdEluZm8ubG95YWx0eV9wb2ludHMgfHwgMCkgLSBwb2ludHNVc2VkKSB9O1xuICAgICAgICAgICAgICBzZXRDdXN0b21lcih1cGRhdGVkQyk7XG4gICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdkNHVfY3VzdG9tZXInLCBKU09OLnN0cmluZ2lmeSh1cGRhdGVkQykpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7IGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWRlZW0gcG9pbnRzJywgZXJyKTsgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIG9uQ2xlYXJDYXJ0KCk7XG4gICAgICAgICAgc2V0SXNDYXJ0T3BlbihmYWxzZSk7XG4gICAgICAgICAgc2V0T3JkZXJDb25maXJtZWQodHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGVyciA9IGF3YWl0IHJlcy50ZXh0KCk7XG4gICAgICAgIHNldEVycm9yTXNnKCdGYWlsZWQgdG8gcGxhY2Ugb3JkZXIgKEhUVFAgJyArIHJlcy5zdGF0dXMgKyAnIGF0ICcgKyByZXMudXJsICsgJyk6ICcgKyBlcnIpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHNldEVycm9yTXNnKCcnKSwgODAwMCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgc2V0RXJyb3JNc2coJ05ldHdvcmsgZXJyb3IgY29ubmVjdGluZyB0byBiYWNrZW5kOiAnICsgZXJyb3IubWVzc2FnZSk7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHNldEVycm9yTXNnKCcnKSwgODAwMCk7XG4gICAgfVxuICAgIHNldElzU3VibWl0dGluZ09yZGVyKGZhbHNlKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVDaGVja291dFByb2ZpbGVTdWJtaXQgPSBhc3luYyAoZTogUmVhY3QuRm9ybUV2ZW50KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IG5hbWUgPSBjaGVja291dE5hbWUudHJpbSgpO1xuICAgIGNvbnN0IHBob25lID0gY2hlY2tvdXRQaG9uZS50cmltKCk7XG4gICAgY29uc3QgYWRkcmVzcyA9IGNoZWNrb3V0QWRkcmVzcy50cmltKCk7XG5cbiAgICBpZiAoIW5hbWUgfHwgIXBob25lIHx8ICFhZGRyZXNzKSB7XG4gICAgICBzZXRDaGVja291dEVycm9yKCdOYW1lLCBQaG9uZSwgYW5kIERlbGl2ZXJ5IEFkZHJlc3MgYXJlIGFsbCByZXF1aXJlZC4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHBob25lLmxlbmd0aCA8IDcpIHtcbiAgICAgIHNldENoZWNrb3V0RXJyb3IoJ1BsZWFzZSBlbnRlciBhIHZhbGlkIHBob25lIG51bWJlci4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjID0geyBuYW1lLCBwaG9uZSwgYWRkcmVzcyB9O1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdkNHVfY3VzdG9tZXInLCBKU09OLnN0cmluZ2lmeShjKSk7XG4gICAgc2V0Q3VzdG9tZXIoYyk7XG4gICAgc2V0SXNDaGVja291dFByb2ZpbGVPcGVuKGZhbHNlKTtcbiAgICBcbiAgICBhd2FpdCBzdWJtaXRPcmRlcihjKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgaWQ9XCJsYW5kaW5nLWxheW91dC1yb290XCIgY2xhc3NOYW1lPVwibWluLWgtc2NyZWVuIGJnLVsjMGMxMzIyXSB0ZXh0LVsjZGNlMmY3XSBzZWxlY3Qtbm9uZSBmb250LXNhbnMgb3ZlcmZsb3cteC1oaWRkZW5cIj5cblxuICAgICAge25vdGlmaWNhdGlvbk1zZyAmJiAoXG4gICAgICAgIDxkaXYgaWQ9XCJ0b2FzdC1ub3RpZnlcIiBjbGFzc05hbWU9XCJmaXhlZCBib3R0b20tNiBsZWZ0LTYgei1bOTk5XSBiZy1bI2ZmZTFhN10gdGV4dC1zbGF0ZS05NTAgcHgtNSBweS0zLjUgcm91bmRlZC14bCBmb250LWJvbGQgdGV4dC14cyB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSBzaGFkb3ctMnhsIGFuaW1hdGUtYm91bmNlXCI+XG4gICAgICAgICAgPENoZWNrQ2lyY2xlMiBjbGFzc05hbWU9XCJ3LTQgaC00IHRleHQtWyMwMDM4MjRdXCIgLz5cbiAgICAgICAgICA8c3Bhbj57bm90aWZpY2F0aW9uTXNnfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7ZXJyb3JNc2cgJiYgKFxuICAgICAgICA8ZGl2IGlkPVwidG9hc3QtZXJyb3JcIiBjbGFzc05hbWU9XCJmaXhlZCBib3R0b20tNiBsZWZ0LTYgei1bOTk5XSBiZy1yZWQtNTAwIHRleHQtd2hpdGUgcHgtNSBweS0zLjUgcm91bmRlZC14bCBmb250LWJvbGQgdGV4dC14cyB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNSBzaGFkb3ctMnhsIGFuaW1hdGUtYm91bmNlXCI+XG4gICAgICAgICAgPHNwYW4+e2Vycm9yTXNnfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICA8aGVhZGVyIGlkPVwibGFuZGluZy1tYXN0ZXItaGVhZGVyXCIgY2xhc3NOYW1lPVwic3RpY2t5IHRvcC0wIGxlZnQtMCB3LWZ1bGwgei01MCB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0zMDAgcHgtOCBoLTIwIGZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBiZy1bIzBjMTMyMl0vOTAgYmFja2Ryb3AtYmx1ci1tZCBib3JkZXItYiBib3JkZXItc2xhdGUtODAwLzQwXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEwXCI+XG4gICAgICAgICAgPGgxIGNsYXNzTmFtZT1cImZvbnQtaGVhZGxpbmUtbWQgdGV4dC0yeGwgZm9udC1ibGFjayB0ZXh0LVsjZmZlMWE3XSB0cmFja2luZy10aWdodCBjdXJzb3ItcG9pbnRlclwiPkQ0VSAtIHtzdG9yZU5hbWV9PC9oMT5cbiAgICAgICAgICA8bmF2IGNsYXNzTmFtZT1cImhpZGRlbiBtZDpmbGV4IGl0ZW1zLWNlbnRlciBnYXAtNlwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQteHMgdGV4dC1bI2ZmZTFhN10gYm9yZGVyLWItMiBib3JkZXItWyNmZmUxYTddIHBiLTEgdHJhbnNpdGlvbi1hbGwgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBjdXJzb3ItcG9pbnRlclwiPk1lbnU8L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC14cyB0ZXh0LVsjZDNjNWFjXSBob3Zlcjp0ZXh0LVsjZmZlMWE3XSB0cmFuc2l0aW9uLWFsbCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IGN1cnNvci1wb2ludGVyXCI+RGVhbHM8L3NwYW4+XG4gICAgICAgICAgICB7c2l0ZVNldHRpbmdzPy5tb2R1bGVfbG95YWx0eV9lbmFibGVkICYmIChcbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQteHMgdGV4dC1bI2QzYzVhY10gaG92ZXI6dGV4dC1bI2ZmZTFhN10gdHJhbnNpdGlvbi1hbGwgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBjdXJzb3ItcG9pbnRlclwiPlJld2FyZHM8L3NwYW4+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQteHMgdGV4dC1bI2QzYzVhY10gaG92ZXI6dGV4dC1bI2ZmZTFhN10gdHJhbnNpdGlvbi1hbGwgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBjdXJzb3ItcG9pbnRlclwiPlN1cHBvcnQ8L3NwYW4+XG4gICAgICAgICAgPC9uYXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTRcIj5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cInAtMiB0ZXh0LVsjZDNjNWFjXSBob3Zlcjp0ZXh0LVsjZmZlMWE3XSB0cmFuc2l0aW9uLWNvbG9yc1wiPlxuICAgICAgICAgICAgPFNlYXJjaCBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICBcbiAgICAgICAgICB7LyogUmVtb3ZlZCBicmFuY2ggZHJvcGRvd24gYXMgcGVyIHJlcXVpcmVtZW50ICovfVxuXG4gICAgICAgICAge2N1c3RvbWVyID8gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNNeU9yZGVyc09wZW4odHJ1ZSl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgYmctWyMxOTFmMmZdIGJvcmRlciBib3JkZXItWyNmYmJmMjRdLzQwIGhvdmVyOmJvcmRlci1bI2ZiYmYyNF0gcHgtMyBweS0xLjUgcm91bmRlZC1mdWxsIHRyYW5zaXRpb24tYWxsXCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy02IGgtNiByb3VuZGVkLWZ1bGwgYmctWyNmYmJmMjRdIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtc2xhdGUtOTAwIHRleHQtWzEwcHhdIGZvbnQtYmxhY2tcIj5cbiAgICAgICAgICAgICAgICAgIHsoY3VzdG9tZXIubmFtZSB8fCAnVScpLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHRleHQtWyNmZmUxYTddIG1heC13LVs4MHB4XSB0cnVuY2F0ZSBoaWRkZW4gc206YmxvY2tcIj57Y3VzdG9tZXIubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICB7c2l0ZVNldHRpbmdzPy5tb2R1bGVfbG95YWx0eV9lbmFibGVkICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgYmctZ3JhZGllbnQtdG8tciBmcm9tLWFtYmVyLTUwMC8yMCB0by1hbWJlci02MDAvMjAgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvNDAgcHgtMyBweS0xLjUgcm91bmRlZC1mdWxsXCIgdGl0bGU9XCJZb3VyIExveWFsdHkgUG9pbnRzXCI+XG4gICAgICAgICAgICAgICAgICA8QXdhcmQgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjUgdGV4dC1hbWJlci00MDBcIiAvPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJsYWNrIHRleHQtYW1iZXItNDAwXCI+e2N1c3RvbWVyLmxveWFsdHlfcG9pbnRzIHx8IDB9IHB0czwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgIHsvKiBJZiBndWVzdCBoYXMgYW4gYWN0aXZlIG9yZGVyIOKAlCBzaG93IGxpdmUgb3JkZXIgYmFkZ2UgKi99XG4gICAgICAgICAgICAgIHt0cmFja2VkT3JkZXJJZCAmJiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXRUcmFja0lkKFN0cmluZyh0cmFja2VkT3JkZXJJZCkpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUcmFja1Jlc3VsdCh0cmFja2VkT3JkZXIpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUcmFja0Vycm9yKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0SXNUcmFja09wZW4odHJ1ZSk7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgYmctWyMxNDFiMmJdIGJvcmRlciBib3JkZXItWyM0ZWRlYTNdLzQwIGhvdmVyOmJvcmRlci1bIzRlZGVhM10gcHgtMyBweS0xLjUgcm91bmRlZC1mdWxsIHRyYW5zaXRpb24tYWxsXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ3LTIgaC0yIHJvdW5kZWQtZnVsbCBiZy1bIzRlZGVhM10gYW5pbWF0ZS1wdWxzZSBmbGV4LXNocmluay0wXCIgLz5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ibGFjayB0ZXh0LVsjNGVkZWEzXVwiPk9yZGVyICN7dHJhY2tlZE9yZGVySWR9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICB7c2l0ZVNldHRpbmdzPy5tb2R1bGVfbG95YWx0eV9lbmFibGVkICYmIChcbiAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldElzTG9naW5PcGVuKHRydWUpfSBjbGFzc05hbWU9XCJwLTIgdGV4dC1bI2QzYzVhY10gaG92ZXI6dGV4dC1bI2ZmZTFhN10gdHJhbnNpdGlvbi1jb2xvcnNcIj5cbiAgICAgICAgICAgICAgICAgIDxVc2VyIGNsYXNzTmFtZT1cInctNSBoLTVcIiAvPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgICBcbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldElzVHJhY2tPcGVuKHRydWUpOyBzZXRUcmFja1Jlc3VsdChudWxsKTsgc2V0VHJhY2tFcnJvcignJyk7IHNldFRyYWNrSWQoJycpOyBzZXRUcmFja1Bob25lKCcnKTsgfX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiB0ZXh0LVsjNGVkZWEzXSBob3ZlcjpzY2FsZS0xMTAgdHJhbnNpdGlvbi10cmFuc2Zvcm0gY3Vyc29yLXBvaW50ZXIgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiXG4gICAgICAgICAgICB0aXRsZT1cIlRyYWNrIE9yZGVyXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8TWFwUGluIGNsYXNzTmFtZT1cInctNSBoLTUgc3Ryb2tlLVsyXVwiIC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBoaWRkZW4gc206YmxvY2tcIj5UcmFjazwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzQ2FydE9wZW4oIWlzQ2FydE9wZW4pfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwicmVsYXRpdmUgcC0yIHRleHQtWyNmZmUxYTddIGhvdmVyOnNjYWxlLTExMCB0cmFuc2l0aW9uLXRyYW5zZm9ybSBjdXJzb3ItcG9pbnRlciBtbC0xXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8U2hvcHBpbmdDYXJ0IGNsYXNzTmFtZT1cInctNiBoLTYgc3Ryb2tlLVsyXVwiIC8+XG4gICAgICAgICAgICB7dG90YWxJdGVtQ291bnQgPiAwICYmIChcbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYWJzb2x1dGUgdG9wLTAgcmlnaHQtMCBiZy1bI2ZiYmYyNF0gdGV4dC1zbGF0ZS05NTAgdGV4dC1bMTBweF0gZm9udC1ibGFjayB3LTUgaC01IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLXNsYXRlLTkwMFwiPlxuICAgICAgICAgICAgICAgIHt0b3RhbEl0ZW1Db3VudH1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2hlYWRlcj5cblxuICAgICAgPG1haW4gY2xhc3NOYW1lPVwicmVsYXRpdmUgcGItMjRcIj5cblxuICAgICAgICA8c2VjdGlvbiBpZD1cImxhbmRpbmctaGVyb1wiIGNsYXNzTmFtZT1cInJlbGF0aXZlIGgtWzkwdmhdIHctZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LXN0YXJ0IG92ZXJmbG93LWhpZGRlbiBweC04XCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIHotMCB0cmFuc2l0aW9uLW9wYWNpdHkgZHVyYXRpb24tMTAwMFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzBjMTMyMl0gdmlhLVsjMGMxMzIyXS84MCB0by10cmFuc3BhcmVudCB6LTEwXCI+PC9kaXY+XG4gICAgICAgICAgICB7YmFubmVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgICAgICA8aW1nXG4gICAgICAgICAgICAgICAga2V5PXtiYW5uZXJzW2N1cnJlbnRCYW5uZXJJbmRleF0uaWR9XG4gICAgICAgICAgICAgICAgYWx0PXtiYW5uZXJzW2N1cnJlbnRCYW5uZXJJbmRleF0udGl0bGV9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY292ZXIgb2JqZWN0LWNlbnRlciBpbWFnZS1uby1yZWZlcnJlciBhbmltYXRlLWZhZGUtaW5cIlxuICAgICAgICAgICAgICAgIHNyYz17YCR7QkFDS0VORF9VUkx9JHtiYW5uZXJzW2N1cnJlbnRCYW5uZXJJbmRleF0uaW1hZ2VVcmx9YH1cbiAgICAgICAgICAgICAgICByZWZlcnJlclBvbGljeT1cIm5vLXJlZmVycmVyXCJcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDxpbWdcbiAgICAgICAgICAgICAgICBhbHQ9XCJEZWZhdWx0IEhlcm8gQmFubmVyXCJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBvYmplY3QtY2VudGVyIGltYWdlLW5vLXJlZmVycmVyXCJcbiAgICAgICAgICAgICAgICBzcmM9e21lZ2FaaW5nZXIuaW1hZ2V9XG4gICAgICAgICAgICAgICAgcmVmZXJyZXJQb2xpY3k9XCJuby1yZWZlcnJlclwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSB6LTIwIG1heC13LTN4bCBzcGFjZS15LTZcIj5cbiAgICAgICAgICAgIHtiYW5uZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAge2Jhbm5lcnNbY3VycmVudEJhbm5lckluZGV4XS5zdWJ0aXRsZSAmJiAoXG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpbmxpbmUtYmxvY2sgYmctWyNmYmJmMjRdIHRleHQtc2xhdGUtOTUwIHB4LTQgcHktMS41IHJvdW5kZWQtZnVsbCBmb250LWJvbGQgdGV4dC1bMTBweF0gdHJhY2tpbmctd2lkZXN0IHVwcGVyY2FzZSBhbmltYXRlLXNsaWRlLXVwXCI+XG4gICAgICAgICAgICAgICAgICAgIHtiYW5uZXJzW2N1cnJlbnRCYW5uZXJJbmRleF0uc3VidGl0bGV9XG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC01eGwgbWQ6dGV4dC03eGwgbGc6dGV4dC04eGwgZm9udC1ibGFjayBsZWFkaW5nLXRpZ2h0IHRyYWNraW5nLXRpZ2h0ZXIgdGV4dC13aGl0ZSBhbmltYXRlLXNsaWRlLXVwXCI+XG4gICAgICAgICAgICAgICAgICB7YmFubmVyc1tjdXJyZW50QmFubmVySW5kZXhdLnRpdGxlID8gKFxuICAgICAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICAgIHtiYW5uZXJzW2N1cnJlbnRCYW5uZXJJbmRleF0udGl0bGUuc3BsaXQoJyAnKS5zbGljZSgwLCAtMSkuam9pbignICcpfSA8YnIvPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWyNmYmJmMjRdXCI+e2Jhbm5lcnNbY3VycmVudEJhbm5lckluZGV4XS50aXRsZS5zcGxpdCgnICcpLnNsaWNlKC0xKS5qb2luKCcgJyl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgV0VMQ09NRSBUTyA8YnIvPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWyNmYmJmMjRdXCI+RElORURBU0g8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2gxPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtNCBwdC0yIGFuaW1hdGUtc2xpZGUtdXBcIiBzdHlsZT17eyBhbmltYXRpb25EZWxheTogJzAuMnMnIH19PlxuICAgICAgICAgICAgICAgICAge2Jhbm5lcnNbY3VycmVudEJhbm5lckluZGV4XS5saW5rVXJsID8gKFxuICAgICAgICAgICAgICAgICAgICA8YVxuICAgICAgICAgICAgICAgICAgICAgIGhyZWY9e2Jhbm5lcnNbY3VycmVudEJhbm5lckluZGV4XS5saW5rVXJsfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImgtMTYgcHgtMTAgYmctWyNmYmJmMjRdIGhvdmVyOmJnLWFtYmVyLTQwMCB0ZXh0LXNsYXRlLTk1MCBmb250LWV4dHJhYm9sZCByb3VuZGVkLWZ1bGwgaG92ZXI6c2NhbGUtMTA1IHRyYW5zaXRpb24tdHJhbnNmb3JtIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgdHJhY2tpbmctd2lkZXIgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAge2Jhbm5lcnNbY3VycmVudEJhbm5lckluZGV4XS5idXR0b25UZXh0IHx8ICdPUkRFUiBOT1cnfVxuICAgICAgICAgICAgICAgICAgICAgIDxBcnJvd1JpZ2h0IGNsYXNzTmFtZT1cInctNCBoLTQgc3Ryb2tlLVsyLjVdXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51LXNlY3Rpb24nKT8uc2Nyb2xsSW50b1ZpZXcoeyBiZWhhdmlvcjogJ3Ntb290aCcgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaC0xNiBweC0xMCBiZy1bI2ZiYmYyNF0gaG92ZXI6YmctYW1iZXItNDAwIHRleHQtc2xhdGUtOTUwIGZvbnQtZXh0cmFib2xkIHJvdW5kZWQtZnVsbCBob3ZlcjpzY2FsZS0xMDUgdHJhbnNpdGlvbi10cmFuc2Zvcm0gZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyB0cmFja2luZy13aWRlciBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICB7YmFubmVyc1tjdXJyZW50QmFubmVySW5kZXhdLmJ1dHRvblRleHQgfHwgJ09SREVSIE5PVyd9XG4gICAgICAgICAgICAgICAgICAgICAgPEFycm93UmlnaHQgY2xhc3NOYW1lPVwidy00IGgtNCBzdHJva2UtWzIuNV1cIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51LXNlY3Rpb24nKT8uc2Nyb2xsSW50b1ZpZXcoeyBiZWhhdmlvcjogJ3Ntb290aCcgfSl9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImgtMTYgcHgtMTAgYm9yZGVyLTIgYm9yZGVyLVsjNGY0NjMzXS83MCBob3Zlcjpib3JkZXItYW1iZXItNDAwIHRleHQtd2hpdGUgZm9udC1leHRyYWJvbGQgcm91bmRlZC1mdWxsIGhvdmVyOmJnLXNsYXRlLTgwMC80MCB0cmFuc2l0aW9uLWNvbG9ycyB0ZXh0LXhzIHRyYWNraW5nLXdpZGVyIGN1cnNvci1wb2ludGVyIGhpZGRlbiBtZDpmbGV4IGl0ZW1zLWNlbnRlclwiXG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIFZJRVcgVEhFIE1FTlVcbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaW5saW5lLWJsb2NrIGJnLVsjZmJiZjI0XSB0ZXh0LXNsYXRlLTk1MCBweC00IHB5LTEuNSByb3VuZGVkLWZ1bGwgZm9udC1ib2xkIHRleHQtWzEwcHhdIHRyYWNraW5nLXdpZGVzdCB1cHBlcmNhc2VcIj5cbiAgICAgICAgICAgICAgICAgIHttZWdhWmluZ2VyLnRhZ31cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtNXhsIG1kOnRleHQtN3hsIGxnOnRleHQtOHhsIGZvbnQtYmxhY2sgbGVhZGluZy10aWdodCB0cmFja2luZy10aWdodGVyIHRleHQtd2hpdGVcIj5cbiAgICAgICAgICAgICAgICAgIFRIRSBNRUdBIDxici8+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsjZmJiZjI0XVwiPnsobWVnYVppbmdlcj8ubmFtZSB8fCAnJykuc3BsaXQoJyAnKS5zbGljZSgyKS5qb2luKCcgJykudG9VcHBlckNhc2UoKSB8fCAnWklOR0VSIEVWTyd9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvaDE+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSBtZDp0ZXh0LWJhc2UgdGV4dC1bI2QzYzVhY10gbWF4LXctbGcgbGVhZGluZy1yZWxheGVkIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgIHttZWdhWmluZ2VyLmRlc2NyaXB0aW9ufVxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTQgcHQtMlwiPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudS1zZWN0aW9uJyk/LnNjcm9sbEludG9WaWV3KHsgYmVoYXZpb3I6ICdzbW9vdGgnIH0pfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJoLTE2IHB4LTEwIGJnLVsjZmJiZjI0XSBob3ZlcjpiZy1hbWJlci00MDAgdGV4dC1zbGF0ZS05NTAgZm9udC1leHRyYWJvbGQgcm91bmRlZC1mdWxsIGhvdmVyOnNjYWxlLTEwNSB0cmFuc2l0aW9uLXRyYW5zZm9ybSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIHRyYWNraW5nLXdpZGVyIGN1cnNvci1wb2ludGVyXCJcbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgT1JERVIgTk9XXG4gICAgICAgICAgICAgICAgICAgIDxBcnJvd1JpZ2h0IGNsYXNzTmFtZT1cInctNCBoLTQgc3Ryb2tlLVsyLjVdXCIgLz5cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudS1zZWN0aW9uJyk/LnNjcm9sbEludG9WaWV3KHsgYmVoYXZpb3I6ICdzbW9vdGgnIH0pfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJoLTE2IHB4LTEwIGJvcmRlci0yIGJvcmRlci1bIzRmNDYzM10vNzAgaG92ZXI6Ym9yZGVyLWFtYmVyLTQwMCB0ZXh0LXdoaXRlIGZvbnQtZXh0cmFib2xkIHJvdW5kZWQtZnVsbCBob3ZlcjpiZy1zbGF0ZS04MDAvNDAgdHJhbnNpdGlvbi1jb2xvcnMgdGV4dC14cyB0cmFja2luZy13aWRlciBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIFZJRVcgVEhFIE1FTlVcbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGJvdHRvbS0xMiBsZWZ0LTEvMiAtdHJhbnNsYXRlLXgtMS8yIGZsZXggZ2FwLTggei0zMCBvdmVyZmxvdy14LWF1dG8gbWF4LXctZnVsbCBweC04IHBiLTQgY3VzdG9tLXNjcm9sbGJhclwiPlxuICAgICAgICAgICAge1suLi5uZXcgU2V0KGZvb2RJdGVtcy5tYXAoZiA9PiBmLmNhdGVnb3J5KSldLnNsaWNlKDAsIDUpLm1hcCgoY2F0ZWdvcnksIGlkeCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBpY29uczogYW55ID0geyAnQnVyZ2Vycyc6ICfwn42UJywgJ1Bpenphcyc6ICfwn42VJywgJ0RyaW5rcyc6ICfwn425JywgJ1NpZGVzJzogJ/CfjZ8nLCAnRGVzc2VydHMnOiAn8J+NpicgfTtcbiAgICAgICAgICAgICAgY29uc3QgaWNvbiA9IGljb25zW2NhdGVnb3J5XSB8fCAn8J+Nve+4jyc7XG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBrZXk9e2BiYW5uZXItY2F0LSR7aWR4fWB9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51LXNlY3Rpb24nKT8uc2Nyb2xsSW50b1ZpZXcoeyBiZWhhdmlvcjogJ3Ntb290aCcgfSk7XG4gICAgICAgICAgICAgICAgICAgc2V0QWN0aXZlQ2F0ZWdvcnkoY2F0ZWdvcnkpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgZ3JvdXAgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgZ2FwLTIgY3Vyc29yLXBvaW50ZXIgZmxleC1zaHJpbmstMCAke2FjdGl2ZUNhdGVnb3J5ID09PSBjYXRlZ29yeSA/ICdzY2FsZS0xMTAnIDogJyd9YH1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgdy0xNiBoLTE2IHJvdW5kZWQtZnVsbCBiZy1bIzE5MWYyZl0vODUgYmFja2Ryb3AtYmx1ci1tZCBib3JkZXIgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC0yeGwgZ3JvdXAtaG92ZXI6YmctWyNmYmJmMjRdIHRyYW5zaXRpb24tYWxsIHNoYWRvdy14bCAke2FjdGl2ZUNhdGVnb3J5ID09PSBjYXRlZ29yeSA/ICdib3JkZXItWyNmYmJmMjRdIGJnLVsjZmJiZjI0XScgOiAnYm9yZGVyLVsjNGY0NjMzXSd9YH0+XG4gICAgICAgICAgICAgICAgICB7aWNvbn1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B0ZXh0LVs5cHhdIGZvbnQtYm9sZCB0cmFja2luZy13aWRlc3QgdHJhbnNpdGlvbi1jb2xvcnMgdXBwZXJjYXNlICR7YWN0aXZlQ2F0ZWdvcnkgPT09IGNhdGVnb3J5ID8gJ3RleHQtYW1iZXItMzAwJyA6ICd0ZXh0LXNsYXRlLTQwMCBncm91cC1ob3Zlcjp0ZXh0LWFtYmVyLTMwMCd9YH0+e2NhdGVnb3J5fTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L3NlY3Rpb24+XG5cbiAgICAgICAge2NhbXBhaWducy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJweS0xMiBweC04IG1heC13LTd4bCBteC1hdXRvIGJnLXNsYXRlLTkwMC8zMCBtdC0xMiBtYi0xMiByb3VuZGVkLVs0MHB4XSBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMC80MFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1lbmQgbWItMTJcIj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IHRleHQtWyNlYzQ4OTldXCI+TGltaXRlZCBUaW1lPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LTR4bCBsZzp0ZXh0LTV4bCBmb250LWJsYWNrIHVwcGVyY2FzZSB0ZXh0LXdoaXRlIG10LTIgbGVhZGluZy1ub25lIGZsZXggaXRlbXMtY2VudGVyIGdhcC00XCI+XG4gICAgICAgICAgICAgICAgICA8TWVnYXBob25lIGNsYXNzTmFtZT1cInRleHQtWyNlYzQ4OTldIHctMTAgaC0xMFwiIC8+IFNwZWNpYWwgT2ZmZXJzXG4gICAgICAgICAgICAgICAgPC9oMj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0xIG1kOmdyaWQtY29scy0yIGdhcC04XCI+XG4gICAgICAgICAgICAgIHtjYW1wYWlnbnMubWFwKGNhbXAgPT4gKFxuICAgICAgICAgICAgICAgIDxkaXYgXG4gICAgICAgICAgICAgICAgICBrZXk9e2NhbXAuaWR9IFxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBpZiAoY2FtcC50YXJnZXRfcHJvZHVjdHM/Lmxlbmd0aCA+IDApIHNldEFjdGl2ZUNhbXBhaWduTW9kYWwoY2FtcCk7IH19XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJyZWxhdGl2ZSBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC1bMzJweF0gYmctWyMxOTFmMmZdIGJvcmRlciBib3JkZXItc2xhdGUtNzAwIHAtNiBmbGV4IGZsZXgtY29sIGdhcC02IGdyb3VwIGhvdmVyOmJvcmRlci1bI2VjNDg5OV0vNTAgdHJhbnNpdGlvbi1jb2xvcnMgc2hhZG93LTJ4bCBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2NhbXAuaW1hZ2VfdXJsID8gKFxuICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgaC00OCByb3VuZGVkLTJ4bCBvdmVyZmxvdy1oaWRkZW4gcmVsYXRpdmUgYm9yZGVyIGJvcmRlci1zbGF0ZS03MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e2Ake0JBQ0tFTkRfVVJMfSR7Y2FtcC5pbWFnZV91cmx9YH0gYWx0PXtjYW1wLnRpdGxlfSBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBncm91cC1ob3ZlcjpzY2FsZS0xMDUgdHJhbnNpdGlvbi10cmFuc2Zvcm0gZHVyYXRpb24tNzAwXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyNlYzQ4OTldIHRleHQtd2hpdGUgdGV4dC1zbSBmb250LWJsYWNrIHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgaW5saW5lLWJsb2NrIG1iLTNcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7Y2FtcC5kaXNjb3VudF9wY3R9JSBPRkZcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJsYWNrIHRleHQtd2hpdGVcIj57Y2FtcC50aXRsZX08L2gzPlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCB0ZXh0LXNtIG10LTJcIj57Y2FtcC5kZXNjcmlwdGlvbn08L3A+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAge2NhbXAudGFyZ2V0X3Byb2R1Y3RzICYmIGNhbXAudGFyZ2V0X3Byb2R1Y3RzLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTEgc206Z3JpZC1jb2xzLTIgZ2FwLTQgbXQtYXV0b1wiPlxuICAgICAgICAgICAgICAgICAgICAgIHsoY2FtcC50YXJnZXRfcHJvZHVjdHMgfHwgW10pLnNsaWNlKDAsIDQpLm1hcCgocDogYW55KSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17cC5pZH0gY2xhc3NOYW1lPVwiYmctc2xhdGUtODAwLzUwIGJvcmRlciBib3JkZXItc2xhdGUtNzAwLzUwIHJvdW5kZWQteGwgcC0zIGZsZXggaXRlbXMtY2VudGVyIGdhcC0zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB7cC5pbWFnZV91cmwgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtwLmltYWdlX3VybC5zdGFydHNXaXRoKCdodHRwJykgPyBwLmltYWdlX3VybCA6IGAke0JBQ0tFTkRfVVJMfSR7cC5pbWFnZV91cmx9YH0gY2xhc3NOYW1lPVwidy0xMiBoLTEyIHJvdW5kZWQtbGcgb2JqZWN0LWNvdmVyXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xMiBoLTEyIHJvdW5kZWQtbGcgYmctc2xhdGUtNzAwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtc2xhdGUtNTAwIGZvbnQtYm9sZFwiPj88L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtbGVmdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtd2hpdGUgdGV4dC1zbSBsaW5lLWNsYW1wLTFcIj57cC5uYW1lfTwvaDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1hbWJlci00MDAgZm9udC1ib2xkIHRleHQteHNcIj5ScyB7cC5wcmljZX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L3NlY3Rpb24+XG4gICAgICAgICl9XG5cbiAgICAgICAgPHNlY3Rpb24gaWQ9XCJtZW51LXNlY3Rpb25cIiBjbGFzc05hbWU9XCJweS0yNCBweC04IG1heC13LTd4bCBteC1hdXRvXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1lbmQgbWItMTZcIj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgdGV4dC1hbWJlci00MDBcIj5FeGNsdXNpdmUgZHJvcHM8L3NwYW4+XG4gICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LTR4bCBsZzp0ZXh0LTV4bCBmb250LWJsYWNrIHVwcGVyY2FzZSB0ZXh0LXdoaXRlIG10LTIgbGVhZGluZy1ub25lXCI+U2lnbmF0dXJlIFNlcmllczwvaDI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWyNkM2M1YWNdIG10LTIgdGV4dC1zbSBmb250LW1lZGl1bVwiPkhhbmQtY3JhZnRlZCBhcnRpc2FuIGN1bGluYXJ5IHJlbGVhc2VzIGZyb20gb3VyIG1hc3RlciBjaGVmcy48L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMlwiPlxuICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cInctMTIgaC0xMiByb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci1zbGF0ZS03MDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgaG92ZXI6Ymctc2xhdGUtODAwIHRyYW5zaXRpb24tY29sb3JzXCI+XG4gICAgICAgICAgICAgICAgPENoZXZyb25MZWZ0IGNsYXNzTmFtZT1cInctNSBoLTUgdGV4dC1zbGF0ZS0zMDBcIiAvPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJ3LTEyIGgtMTIgcm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItc2xhdGUtNzAwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGhvdmVyOmJnLXNsYXRlLTgwMCB0cmFuc2l0aW9uLWNvbG9yc1wiPlxuICAgICAgICAgICAgICAgIDxDaGV2cm9uUmlnaHQgY2xhc3NOYW1lPVwidy01IGgtNSB0ZXh0LXNsYXRlLTMwMFwiIC8+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTEgbWQ6Z3JpZC1jb2xzLTEyIGdhcC04XCI+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWQ6Y29sLXNwYW4tNyBncm91cCByZWxhdGl2ZSBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC1bMzJweF0gYmctWyMxOTFmMmZdIGFzcGVjdC1bMTYvMTBdIGJvcmRlciBib3JkZXItc2xhdGUtODAwLzQwXCI+XG4gICAgICAgICAgICAgIDxpbWdcbiAgICAgICAgICAgICAgICBhbHQ9XCJQaXp6YVwiXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY292ZXIgZ3JvdXAtaG92ZXI6c2NhbGUtMTA1IHRyYW5zaXRpb24tdHJhbnNmb3JtIGR1cmF0aW9uLTcwMCBpbWFnZS1uby1yZWZlcnJlclwiXG4gICAgICAgICAgICAgICAgc3JjPXttaWRuaWdodFBpenphLmltYWdlfVxuICAgICAgICAgICAgICAgIHJlZmVycmVyUG9saWN5PVwibm8tcmVmZXJyZXJcIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjMGMxMzIyXSB2aWEtWyMwYzEzMjJdLzEwIHRvLXRyYW5zcGFyZW50XCI+PC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgYm90dG9tLTggbGVmdC04IHJpZ2h0LTggZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtZW5kXCI+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWyNmYmJmMjRdIGZvbnQtYm9sZCB0ZXh0LVsxMHB4XSB0cmFja2luZy13aWRlc3QgdXBwZXJjYXNlXCI+e21pZG5pZ2h0UGl6emEudGFnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBsZzp0ZXh0LTN4bCBmb250LWJsYWNrIHRleHQtd2hpdGUgbXQtMVwiPnttaWRuaWdodFBpenphLm5hbWV9PC9oMz5cbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWyNkM2M1YWNdIHRleHQteHMgbXQtMiBtYXgtdy14c1wiPnttaWRuaWdodFBpenphLmRlc2NyaXB0aW9ufTwvcD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtcmlnaHQgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYmxhY2sgdGV4dC1bI2ZiYmYyNF0gYmxvY2tcIj4ke21pZG5pZ2h0UGl6emEucHJpY2VVU0QudG9GaXhlZCgyKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZUFkZFRvQ2FydFdpdGhOb3RpZnkobWlkbmlnaHRQaXp6YSl9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm10LTQgYmctd2hpdGUgaG92ZXI6YmctYW1iZXItMzAwIHRleHQtc2xhdGUtOTUwIHctMTIgaC0xMiByb3VuZGVkLWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYWN0aXZlOnNjYWxlLTkwIHRyYW5zaXRpb24tdHJhbnNmb3JtIHNoYWRvdy1sZyBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxQbHVzIGNsYXNzTmFtZT1cInctNSBoLTUgc3Ryb2tlLVsyLjVdXCIgLz5cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1kOmNvbC1zcGFuLTUgZ3JvdXAgcmVsYXRpdmUgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtWzMycHhdIGJnLVsjMTkxZjJmXSBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMC80MCBwLTEgZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWVuZCBtaW4taC1bMzUwcHhdXCI+XG4gICAgICAgICAgICAgIDxpbWdcbiAgICAgICAgICAgICAgICBhbHQ9XCJQYXN0YVwiXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgaW5zZXQtMCB3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBncm91cC1ob3ZlcjpzY2FsZS0xMDUgdHJhbnNpdGlvbi10cmFuc2Zvcm0gZHVyYXRpb24tNzAwIGltYWdlLW5vLXJlZmVycmVyXCJcbiAgICAgICAgICAgICAgICBzcmM9e3JpZ2F0b25pSXRlbS5pbWFnZX1cbiAgICAgICAgICAgICAgICByZWZlcnJlclBvbGljeT1cIm5vLXJlZmVycmVyXCJcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bIzBjMTMyMl0gdmlhLVsjMGMxMzIyXS8yMCB0by10cmFuc3BhcmVudFwiPjwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIHotMTAgcC04XCI+XG4gICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtMnhsIGxnOnRleHQtM3hsIGZvbnQtYmxhY2sgdGV4dC13aGl0ZVwiPntyaWdhdG9uaUl0ZW0ubmFtZX08L2gzPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWyNkM2M1YWNdIHRleHQteHMgbXQtMlwiPntyaWdhdG9uaUl0ZW0uZGVzY3JpcHRpb259PC9wPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIG10LTZcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYmxhY2sgdGV4dC1bI2ZiYmYyNF1cIj4ke3JpZ2F0b25pSXRlbS5wcmljZVVTRC50b0ZpeGVkKDIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlQWRkVG9DYXJ0V2l0aE5vdGlmeShyaWdhdG9uaUl0ZW0pfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1bI2ZiYmYyNF0gaG92ZXI6YmctYW1iZXItNDAwIHRleHQtc2xhdGUtOTUwIHB4LTYgcHktMiByb3VuZGVkLWZ1bGwgZm9udC1ib2xkIHRleHQteHMgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIEFkZFxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWQ6Y29sLXNwYW4tNCBncm91cCByZWxhdGl2ZSBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC1bMzJweF0gYmctWyMxOTFmMmZdIGFzcGVjdC1zcXVhcmUgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAvNDBcIj5cbiAgICAgICAgICAgICAgPGltZ1xuICAgICAgICAgICAgICAgIGFsdD1cIlNoYWtlXCJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBncm91cC1ob3ZlcjpzY2FsZS0xMDUgdHJhbnNpdGlvbi10cmFuc2Zvcm0gZHVyYXRpb24tNzAwIGltYWdlLW5vLXJlZmVycmVyXCJcbiAgICAgICAgICAgICAgICBzcmM9e2dvbGRMZWFmU2hha2UuaW1hZ2V9XG4gICAgICAgICAgICAgICAgcmVmZXJyZXJQb2xpY3k9XCJuby1yZWZlcnJlclwiXG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgaW5zZXQtMCBiZy1ncmFkaWVudC10by10IGZyb20tWyMwYzEzMjJdLzkwIHRvLXRyYW5zcGFyZW50XCI+PC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgYm90dG9tLTYgbGVmdC02IHJpZ2h0LTYgZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtZW5kXCI+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJmb250LWV4dHJhYm9sZCB0ZXh0LWJhc2UgdGV4dC13aGl0ZVwiPntnb2xkTGVhZlNoYWtlLm5hbWV9PC9oND5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ib2xkIHRleHQtWyNmYmJmMjRdIGJsb2NrIG10LTAuNVwiPiR7Z29sZExlYWZTaGFrZS5wcmljZVVTRC50b0ZpeGVkKDIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVBZGRUb0NhcnRXaXRoTm90aWZ5KGdvbGRMZWFmU2hha2UpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctd2hpdGUgaG92ZXI6YmctYW1iZXItNDAwIGhvdmVyOnRleHQtc2xhdGUtOTUwIHRleHQtc2xhdGUtOTUwIHctOSBoLTkgcm91bmRlZC1mdWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGFjdGl2ZTpzY2FsZS05MCB0cmFuc2l0aW9uLXRyYW5zZm9ybSBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPFBsdXMgY2xhc3NOYW1lPVwidy00IGgtNCBzdHJva2UtWzIuNV1cIiAvPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1kOmNvbC1zcGFuLTQgZ3JvdXAgcmVsYXRpdmUgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtWzMycHhdIGJnLVsjMTkxZjJmXSBhc3BlY3Qtc3F1YXJlIGJvcmRlciBib3JkZXItc2xhdGUtODAwLzQwXCI+XG4gICAgICAgICAgICAgIDxpbWdcbiAgICAgICAgICAgICAgICBhbHQ9XCJEZXNzZXJ0XCJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBncm91cC1ob3ZlcjpzY2FsZS0xMDUgdHJhbnNpdGlvbi10cmFuc2Zvcm0gZHVyYXRpb24tNzAwIGltYWdlLW5vLXJlZmVycmVyXCJcbiAgICAgICAgICAgICAgICBzcmM9e2xhdmFOb2lyLmltYWdlfVxuICAgICAgICAgICAgICAgIHJlZmVycmVyUG9saWN5PVwibm8tcmVmZXJyZXJcIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjMGMxMzIyXS85MCB0by10cmFuc3BhcmVudFwiPjwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGJvdHRvbS02IGxlZnQtNiByaWdodC02IGZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWVuZFwiPlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwiZm9udC1leHRyYWJvbGQgdGV4dC1iYXNlIHRleHQtd2hpdGVcIj57bGF2YU5vaXIubmFtZX08L2g0PlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJvbGQgdGV4dC1bI2ZiYmYyNF0gYmxvY2sgbXQtMC41XCI+JHtsYXZhTm9pci5wcmljZVVTRC50b0ZpeGVkKDIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVBZGRUb0NhcnRXaXRoTm90aWZ5KGxhdmFOb2lyKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLXdoaXRlIGhvdmVyOmJnLWFtYmVyLTQwMCBob3Zlcjp0ZXh0LXNsYXRlLTk1MCB0ZXh0LXNsYXRlLTk1MCB3LTkgaC05IHJvdW5kZWQtZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBhY3RpdmU6c2NhbGUtOTAgdHJhbnNpdGlvbi10cmFuc2Zvcm0gY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxQbHVzIGNsYXNzTmFtZT1cInctNCBoLTQgc3Ryb2tlLVsyLjVdXCIgLz5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtZDpjb2wtc3Bhbi00IGdyb3VwIHJlbGF0aXZlIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLVszMnB4XSBiZy1bIzE5MWYyZl0gYXNwZWN0LXNxdWFyZSBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMC80MFwiPlxuICAgICAgICAgICAgICA8aW1nXG4gICAgICAgICAgICAgICAgYWx0PVwiQ29ja3RhaWxcIlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvdmVyIGdyb3VwLWhvdmVyOnNjYWxlLTEwNSB0cmFuc2l0aW9uLXRyYW5zZm9ybSBkdXJhdGlvbi03MDAgaW1hZ2Utbm8tcmVmZXJyZXJcIlxuICAgICAgICAgICAgICAgIHNyYz17c3Vuc2V0U3ByaXR6LmltYWdlfVxuICAgICAgICAgICAgICAgIHJlZmVycmVyUG9saWN5PVwibm8tcmVmZXJyZXJcIlxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjMGMxMzIyXS85MCB0by10cmFuc3BhcmVudFwiPjwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGJvdHRvbS02IGxlZnQtNiByaWdodC02IGZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWVuZFwiPlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwiZm9udC1leHRyYWJvbGQgdGV4dC1iYXNlIHRleHQtd2hpdGVcIj57c3Vuc2V0U3ByaXR6Lm5hbWV9PC9oND5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ib2xkIHRleHQtWyNmYmJmMjRdIGJsb2NrIG10LTAuNVwiPiR7c3Vuc2V0U3ByaXR6LnByaWNlVVNELnRvRml4ZWQoMil9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZUFkZFRvQ2FydFdpdGhOb3RpZnkoc3Vuc2V0U3ByaXR6KX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLXdoaXRlIGhvdmVyOmJnLWFtYmVyLTQwMCBob3Zlcjp0ZXh0LXNsYXRlLTk1MCB0ZXh0LXNsYXRlLTk1MCB3LTkgaC05IHJvdW5kZWQtZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBhY3RpdmU6c2NhbGUtOTAgdHJhbnNpdGlvbi10cmFuc2Zvcm0gY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxQbHVzIGNsYXNzTmFtZT1cInctNCBoLTQgc3Ryb2tlLVsyLjVdXCIgLz5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L3NlY3Rpb24+XG5cbiAgICAgICAgey8qIEFjdGl2ZSBDYW1wYWlnbnMgQmFubmVyICovfVxuICAgICAgICB7Y2FtcGFpZ25zLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInB5LTggbWF4LXctN3hsIG14LWF1dG8gcHgtOFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IG92ZXJmbG93LXgtYXV0byBoaWRlLXNjcm9sbGJhciBnYXAtNCBweS00IG10LTJcIj5cbiAgICAgICAgICAgICAge2NhbXBhaWducy5tYXAoY2FtcCA9PiAoXG4gICAgICAgICAgICAgICAgPGRpdiBrZXk9e2NhbXAuaWR9IGNsYXNzTmFtZT1cImZsZXgtc2hyaW5rLTAgYmctZ3JhZGllbnQtdG8tciBmcm9tLVsjZWM0ODk5XSB0by1bIzhiNWNmNl0gcm91bmRlZC14bCBweC02IHB5LTQgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTQgc2hhZG93LWxnIGFuaW1hdGUtcHVsc2Utc2xvdyBib3JkZXIgYm9yZGVyLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgICAgICA8VGFnIGNsYXNzTmFtZT1cInRleHQtd2hpdGUgdy04IGgtOFwiIC8+XG4gICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC13aGl0ZSBmb250LWJsYWNrIHRleHQtbGcgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBsZWFkaW5nLW5vbmVcIj57Y2FtcC50aXRsZX08L2g0PlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXdoaXRlLzkwIGZvbnQtYm9sZCB0ZXh0LXNtIG10LTFcIj57Y2FtcC5kaXNjb3VudF9wY3R9JSBPRkYgVE9EQVkhPC9wPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9zZWN0aW9uPlxuICAgICAgICApfVxuXG4gICAgICAgIHtzdGFmZk1lbWJlcnMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgPHNlY3Rpb24gaWQ9XCJvdXItc3RhZmZcIiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBweS0yNCBtYXgtdy02eGwgbXgtYXV0byB0ZXh0LWNlbnRlciBweC04IGJvcmRlci10IGJvcmRlci1zbGF0ZS04MDBcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgdGV4dC1bI2ZiYmYyNF1cIj5UaGUgRmFjZXMgQmVoaW5kIFRoZSBGbGF2b3I8L3NwYW4+XG4gICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC00eGwgbWQ6dGV4dC01eGwgbGc6dGV4dC02eGwgZm9udC1leHRyYWJvbGQgdHJhY2tpbmctdGlnaHRlciB0ZXh0LXdoaXRlIG1iLTYgdXBwZXJjYXNlIG10LTJcIj5PVVIgU1RBRkY8L2gyPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bI2QzYzVhY10gbWF4LXcteGwgbXgtYXV0byB0ZXh0LXNtIG1kOnRleHQtYmFzZSBmb250LXNlbWlib2xkIG1iLTEyIGxlYWRpbmctcmVsYXhlZFwiPlxuICAgICAgICAgICAgICBNZWV0IHRoZSBpbmNyZWRpYmxlIHRlYW0gdGhhdCBtYWtlcyB7c3RvcmVOYW1lfSBzcGVjaWFsLiBGcm9tIG91ciBtYXN0ZXIgY2hlZnMgdG8gb3VyIGZyaWVuZGx5IGZyb250LW9mLWhvdXNlLlxuICAgICAgICAgICAgPC9wPlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGp1c3RpZnktY2VudGVyIGdhcC04XCI+XG4gICAgICAgICAgICAgIHtzdGFmZk1lbWJlcnMubWFwKHN0YWZmID0+IChcbiAgICAgICAgICAgICAgICA8ZGl2IGtleT17c3RhZmYuaWR9IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGdyb3VwIHctNDBcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0zMiBoLTMyIHJvdW5kZWQtZnVsbCBib3JkZXItNCBib3JkZXItWyMxOTFmMmZdIG92ZXJmbG93LWhpZGRlbiBiZy1zbGF0ZS04MDAgbWItNCBzaGFkb3ctMnhsIGdyb3VwLWhvdmVyOmJvcmRlci1bI2ZiYmYyNF0gdHJhbnNpdGlvbi1jb2xvcnMgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAge3N0YWZmLmltYWdlX3VybCA/IChcbiAgICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17c3RhZmYuaW1hZ2VfdXJsID8gKHN0YWZmLmltYWdlX3VybC5zdGFydHNXaXRoKCdodHRwJykgPyBzdGFmZi5pbWFnZV91cmwgOiBgJHtCQUNLRU5EX1VSTH0ke3N0YWZmLmltYWdlX3VybH1gKSA6ICdodHRwczovL2ltYWdlcy51bnNwbGFzaC5jb20vcGhvdG8tMTU0NDAwNTMxMy05NGRkZjAyODZkZjI/dz0zMDAmcT04MCd9IGFsdD17c3RhZmYubmFtZX0gY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY292ZXJcIiAvPlxuICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgIDxVc2VyIGNsYXNzTmFtZT1cInctMTIgaC0xMiB0ZXh0LXNsYXRlLTUwMFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LXdoaXRlIGZvbnQtYmxhY2sgdGV4dC1sZyB0cmFja2luZy10aWdodFwiPntzdGFmZi5uYW1lfTwvaDM+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IHRleHQtWyNmYmJmMjRdIG10LTFcIj57c3RhZmYucm9sZT8ubmFtZSB8fCAnU3RhZmYnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L3NlY3Rpb24+XG4gICAgICAgICl9XG5cbiAgICAgIDwvbWFpbj5cblxuICAgICAge2lzQ2FydE9wZW4gJiYgKFxuICAgICAgICA8YXNpZGUgaWQ9XCJsYW5kaW5nLXNpZGUtZHJhd2VyLWNhcnRcIiBjbGFzc05hbWU9XCJmaXhlZCByaWdodC0wIHRvcC0wIGgtZnVsbCB3LVszODBweF0gYmctWyMxOTFmMmZdIHNoYWRvdy0yeGwgYm9yZGVyLWwgYm9yZGVyLXNsYXRlLTgwMCB6LVsxMDBdIGZsZXggZmxleC1jb2wgcC02IGFuaW1hdGUtZmFkZS1pblwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIHBiLTQgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTgwMFwiPlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1leHRyYWJvbGQgdGV4dC1bI2ZmZTFhN10gdXBwZXJjYXNlIHRyYWNraW5nLXRpZ2h0XCI+WW91ciBCYXNrZXQ8L2gyPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtWyNkM2M1YWNdXCI+VGFibGUgNDIg4oCiIFJlYWR5IGluIDEyIG1pbnM8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNDYXJ0T3BlbihmYWxzZSl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMS41IGhvdmVyOmJnLXNsYXRlLTgwMCByb3VuZGVkLWZ1bGwgdGV4dC1bI2QzYzVhY11cIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8WCBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHB5LTYgc3BhY2UteS00IGN1c3RvbS1zY3JvbGxiYXJcIj5cbiAgICAgICAgICAgIHtjYXJ0Lmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS0xNiBvcGFjaXR5LTYwXCI+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1ib2xkXCI+Tm8gaXRlbXMgaW4gYmFza2V0PC9wPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1bI2QzYzVhY10gbXQtMVwiPk9yZGVyIHNpZ25hdHVyZSBzZXJpZXMgZnJvbSB0aGUgbGFuZGluZyBncmlkcyE8L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgY2FydC5tYXAoKGMpID0+IChcbiAgICAgICAgICAgICAgICA8ZGl2IGtleT17YGxhbmQtY2FydC0ke2MuZm9vZEl0ZW0uaWR9YH0gY2xhc3NOYW1lPVwiZmxleCBnYXAtMyBiZy1bIzE0MWIyYl0gcC0zIHJvdW5kZWQtMnhsIGJvcmRlciBib3JkZXItc2xhdGUtODAwLzQwXCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTYgaC0xNiByb3VuZGVkLXhsIG92ZXJmbG93LWhpZGRlbiBiZy1zbGF0ZS05MDAgc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgPGltZ1xuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvdmVyIGltYWdlLW5vLXJlZmVycmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICBzcmM9e2MuZm9vZEl0ZW0uaW1hZ2V9XG4gICAgICAgICAgICAgICAgICAgICAgYWx0PXtjLmZvb2RJdGVtLm5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgcmVmZXJyZXJQb2xpY3k9XCJuby1yZWZlcnJlclwiXG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cImZvbnQtZXh0cmFib2xkIHRleHQtc20gdGV4dC13aGl0ZSB0cnVuY2F0ZVwiPntjLmZvb2RJdGVtLm5hbWV9PC9oND5cbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1bI2QzYzVhY11cIj5DaGVmIEN1c3RvbWl6YXRpb248L3A+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIG10LTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zLjUgYmctWyMxOTFmMmZdIHB4LTIgcHktMC41IHJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLXNsYXRlLTcwMC8zMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBvbkRlY3JlYXNlUXVhbnRpdHkoYy5mb29kSXRlbS5pZCl9IGNsYXNzTmFtZT1cInRleHQtWyNmZmUxYTddIHRleHQteHMgZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxNaW51cyBjbGFzc05hbWU9XCJ3LTMgaC0zXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJsYWNrIHRleHQtd2hpdGVcIj57Yy5xdWFudGl0eX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IG9uSW5jcmVhc2VRdWFudGl0eShjLmZvb2RJdGVtLmlkKX0gY2xhc3NOYW1lPVwidGV4dC1bI2ZmZTFhN10gdGV4dC14cyBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPFBsdXMgY2xhc3NOYW1lPVwidy0zIGgtM1wiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYmxhY2sgdGV4dC1bIzRlZGVhM11cIj4keyhjLmZvb2RJdGVtLnByaWNlVVNEICogYy5xdWFudGl0eSkudG9GaXhlZCgyKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IG9uUmVtb3ZlRnJvbUNhcnQoYy5mb29kSXRlbS5pZCl9IGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNjAwIGhvdmVyOnRleHQtcmVkLTQwMCBzZWxmLXN0YXJ0IHB0LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgPFggY2xhc3NOYW1lPVwidy00IGgtNFwiIC8+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTQxYjJiXSBwLTQgcm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAgc3BhY2UteS0zXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIHRleHQteHMgdGV4dC1bI2QzYzVhY11cIj5cbiAgICAgICAgICAgICAgPHNwYW4+U3VidG90YWw6PC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LWJvbGRcIj4ke3N1YnRvdGFsVVNELnRvRml4ZWQoMil9PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIHRleHQteHMgdGV4dC1bI2QzYzVhY11cIj5cbiAgICAgICAgICAgICAgPHNwYW4+RXN0aW1hdGVkIFRheCAoOCUpOjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkXCI+JHt0YXhVU0QudG9GaXhlZCgyKX08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAge3NpdGVTZXR0aW5ncz8ubW9kdWxlX2xveWFsdHlfZW5hYmxlZCAmJiBjdXN0b21lciAmJiAoY3VzdG9tZXIubG95YWx0eV9wb2ludHMgfHwgMCkgPiAwICYmIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcHQtMiBib3JkZXItdCBib3JkZXItc2xhdGUtODAwXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgPEF3YXJkIGNsYXNzTmFtZT1cInctNCBoLTQgdGV4dC1hbWJlci00MDBcIiAvPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LVsjZDNjNWFjXVwiPlVzZSB7Y3VzdG9tZXIubG95YWx0eV9wb2ludHN9IFBvaW50cyAoLSR7KGN1c3RvbWVyLmxveWFsdHlfcG9pbnRzISAqIDAuMTApLnRvRml4ZWQoMil9KTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIiBcbiAgICAgICAgICAgICAgICAgIGNoZWNrZWQ9e3VzZUxveWFsdHlQb2ludHN9IFxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRVc2VMb3lhbHR5UG9pbnRzKGUudGFyZ2V0LmNoZWNrZWQpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy00IGgtNCBhY2NlbnQtYW1iZXItNTAwIHJvdW5kZWQgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAge3VzZUxveWFsdHlQb2ludHMgJiYgbG95YWx0eURpc2NvdW50ID4gMCAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gdGV4dC14cyB0ZXh0LWFtYmVyLTQwMCBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj5Mb3lhbHR5IERpc2NvdW50Ojwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Bhbj4tJHtsb3lhbHR5RGlzY291bnQudG9GaXhlZCgyKX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgcHQtMiBib3JkZXItdCBib3JkZXItc2xhdGUtODAwIHRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlXCI+XG4gICAgICAgICAgICAgIDxzcGFuPlRPVEFMOjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1sZyB0ZXh0LVsjZmJiZjI0XVwiPiR7dG90YWxVU0QudG9GaXhlZCgyKX08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBidG4gPSBlLmN1cnJlbnRUYXJnZXQ7XG4gICAgICAgICAgICAgICAgaWYgKGJ0bi5kaXNhYmxlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICghY3VzdG9tZXI/Lm5hbWU/LnRyaW0oKSB8fCAhY3VzdG9tZXI/LnBob25lPy50cmltKCkgfHwgIWN1c3RvbWVyPy5hZGRyZXNzPy50cmltKCkpIHtcbiAgICAgICAgICAgICAgICAgIHNldENoZWNrb3V0TmFtZShjdXN0b21lcj8ubmFtZSB8fCAnJyk7XG4gICAgICAgICAgICAgICAgICBzZXRDaGVja291dFBob25lKGN1c3RvbWVyPy5waG9uZSB8fCAnJyk7XG4gICAgICAgICAgICAgICAgICBzZXRDaGVja291dEFkZHJlc3MoY3VzdG9tZXI/LmFkZHJlc3MgfHwgJycpO1xuICAgICAgICAgICAgICAgICAgc2V0Q2hlY2tvdXRFcnJvcignJyk7XG4gICAgICAgICAgICAgICAgICBzZXRJc0NoZWNrb3V0UHJvZmlsZU9wZW4odHJ1ZSk7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgYnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcmlnaW5hbFRleHQgPSBidG4udGV4dENvbnRlbnQ7XG4gICAgICAgICAgICAgICAgYnRuLnRleHRDb250ZW50ID0gJ0VuY3J5cHRpbmcuLi4nO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGF3YWl0IHN1Ym1pdE9yZGVyKGN1c3RvbWVyKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoYnRuKSB7XG4gICAgICAgICAgICAgICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGJ0bi50ZXh0Q29udGVudCA9IG9yaWdpbmFsVGV4dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIGRpc2FibGVkPXtjYXJ0Lmxlbmd0aCA9PT0gMCB8fCBpc1N1Ym1pdHRpbmdPcmRlcn1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB5LTMuNSBiZy1bI2ZiYmYyNF0gaG92ZXI6YmctYW1iZXItNDAwIGRpc2FibGVkOm9wYWNpdHktNDAgdGV4dC1zbGF0ZS05NTAgZm9udC1ibGFjayB0ZXh0LXhzIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3Qgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCBzaGFkb3cgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7aXNTdWJtaXR0aW5nT3JkZXIgPyAnUExBQ0lORyBPUkRFUi4uLicgOiAnUExBQ0UgUkVTRVJWQVRJT04gT1JERVInfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvYXNpZGU+XG4gICAgICApfVxuXG4gICAgICB7LyogVHJhY2sgT3JkZXIgU2lkZWJhciAqL31cbiAgICAgIHtpc1RyYWNrT3BlbiAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZml4ZWQgaW5zZXQtMCB6LVsyNTBdIGZsZXgganVzdGlmeS1lbmRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgYmctYmxhY2svNjAgYmFja2Ryb3AtYmx1ci1zbVwiIG9uQ2xpY2s9eygpID0+IHNldElzVHJhY2tPcGVuKGZhbHNlKX0gLz5cbiAgICAgICAgICA8YXNpZGUgY2xhc3NOYW1lPVwicmVsYXRpdmUgdy1mdWxsIG1heC13LXNtIGJnLVsjMTkxZjJmXSBib3JkZXItbCBib3JkZXItc2xhdGUtODAwIGZsZXggZmxleC1jb2wgaC1mdWxsIHNoYWRvdy0yeGwgYW5pbWF0ZS1zbGlkZS1pbi1yaWdodFwiPlxuICAgICAgICAgICAgey8qIEhlYWRlciAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIHAtNiBib3JkZXItYiBib3JkZXItc2xhdGUtODAwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ibGFjayB0ZXh0LXdoaXRlIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICA8TWFwUGluIGNsYXNzTmFtZT1cInctNSBoLTUgdGV4dC1bIzRlZGVhM11cIiAvPlxuICAgICAgICAgICAgICAgICAgVHJhY2sgT3JkZXJcbiAgICAgICAgICAgICAgICA8L2gzPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1bI2QzYzVhY10gbXQtMVwiPkVudGVyIE9yZGVyIElEIG9yIFBob25lPC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBzZXRJc1RyYWNrT3BlbihmYWxzZSl9IGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtd2hpdGUgcC0yXCI+XG4gICAgICAgICAgICAgICAgPFggY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBTY3JvbGxhYmxlIENvbnRlbnQgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy15LWF1dG8gcC02IGN1c3RvbS1zY3JvbGxiYXJcIj5cbiAgICAgICAgICAgICAgeyF0cmFja1Jlc3VsdCA/IChcbiAgICAgICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZVRyYWNrT3JkZXJ9IGNsYXNzTmFtZT1cInNwYWNlLXktNlwiPlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCB0ZXh0LVsjZDNjNWFjXSBibG9jayBtYi0yXCI+T3JkZXIgSUQ8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17dHJhY2tJZH1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0VHJhY2tJZChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiZS5nLiAxMDAxXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMTQxYjJiXSBib3JkZXIgYm9yZGVyLXNsYXRlLTcwMCBmb2N1czpib3JkZXItWyM0ZWRlYTNdIHJvdW5kZWQtMnhsIHB4LTUgcHktNCB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTYwMCBvdXRsaW5lLW5vbmUgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IHRleHQtWyNkM2M1YWNdIGJsb2NrIG1iLTJcIj5QaG9uZTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRlbFwiXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0cmFja1Bob25lfVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRUcmFja1Bob25lKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJlLmcuIDAzMDAxMjM0NTY3XCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMTQxYjJiXSBib3JkZXIgYm9yZGVyLXNsYXRlLTcwMCBmb2N1czpib3JkZXItWyM0ZWRlYTNdIHJvdW5kZWQtMnhsIHB4LTUgcHktNCB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTYwMCBvdXRsaW5lLW5vbmUgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7dHJhY2tFcnJvciAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtcmVkLTQwMCBmb250LWJvbGRcIj57dHJhY2tFcnJvcn08L3A+fVxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RyYWNrTG9hZGluZ31cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweS0zLjUgYmctWyM0ZWRlYTNdIGhvdmVyOmJnLWVtZXJhbGQtNDAwIGRpc2FibGVkOm9wYWNpdHktNTAgdGV4dC1zbGF0ZS05NTAgZm9udC1ibGFjayB0ZXh0LXhzIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3Qgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge3RyYWNrTG9hZGluZyA/ICdTZWFyY2hpbmcuLi4nIDogJ0ZpbmQgTXkgT3JkZXInfVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICAgICAgICAgIHsvKiBPcmRlciBmb3VuZCDigJQgc2hvdyBkZXRhaWxzICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNDFiMmJdIHJvdW5kZWQtMnhsIGJvcmRlciBib3JkZXItc2xhdGUtODAwIHAtNCBzcGFjZS15LTNcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtc3RhcnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LWJsYWNrIHRleHQtd2hpdGUgdGV4dC1iYXNlXCI+T3JkZXIgI3t0cmFja1Jlc3VsdC5pZH08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1bI2QzYzVhY11cIj57dHJhY2tSZXN1bHQuY3VzdG9tZXJ9IMK3IHt0cmFja1Jlc3VsdC50aW1lUGxhY2VkfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ibGFjayB0ZXh0LVsjZmJiZjI0XVwiPiR7dHJhY2tSZXN1bHQudG90YWxBbW91bnR9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtWyNkM2M1YWNdIGxlYWRpbmctcmVsYXhlZFwiPnt0cmFja1Jlc3VsdC5pdGVtc308L3A+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktM1wiPlxuICAgICAgICAgICAgICAgICAge1tcbiAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ09yZGVyIFBsYWNlZCcsIHN1YjogdHJhY2tSZXN1bHQudGltZVBsYWNlZCB8fCAnUmVjZWl2ZWQnLCBkb25lOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0NvbmZpcm1lZCBieSBSZXN0YXVyYW50JyxcbiAgICAgICAgICAgICAgICAgICAgICBzdWI6IHRyYWNrUmVzdWx0Lmtkc1N0YXR1cyA9PT0gJ1BFTkRJTkcnID8gJ1dhaXRpbmcgZm9yIGNhc2hpZXIuLi4nIDogJ0FjY2VwdGVkIOKckycsXG4gICAgICAgICAgICAgICAgICAgICAgZG9uZTogdHJhY2tSZXN1bHQua2RzU3RhdHVzICE9PSAnUEVORElORycsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0luIEtpdGNoZW4nLFxuICAgICAgICAgICAgICAgICAgICAgIHN1YjogdHJhY2tSZXN1bHQua2RzU3RhdHVzID09PSAnUFJFUEFSSU5HJ1xuICAgICAgICAgICAgICAgICAgICAgICAgPyBgfiR7dHJhY2tSZXN1bHQucHJlcFRpbWVNaW51dGVzfSBtaW5zIMK3IFJlYWR5IGJ5ICR7dHJhY2tSZXN1bHQuZXN0aW1hdGVkUmVhZHlBdH1gXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHRyYWNrUmVzdWx0Lmtkc1N0YXR1cyA9PT0gJ1JFQURZJyA/ICdEb25lIOKckycgOiAnV2FpdGluZy4uLicsXG4gICAgICAgICAgICAgICAgICAgICAgZG9uZTogdHJhY2tSZXN1bHQua2RzU3RhdHVzID09PSAnUFJFUEFSSU5HJyB8fCB0cmFja1Jlc3VsdC5rZHNTdGF0dXMgPT09ICdSRUFEWScgfHwgdHJhY2tSZXN1bHQuc3RhdHVzID09PSAnRElTUEFUQ0hFRCcgfHwgdHJhY2tSZXN1bHQuc3RhdHVzID09PSAnUEFJRCcgfHwgdHJhY2tSZXN1bHQuc3RhdHVzID09PSAnU0VUVExFRCcsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ1JlYWR5IGZvciBEZWxpdmVyeScsXG4gICAgICAgICAgICAgICAgICAgICAgc3ViOiB0cmFja1Jlc3VsdC5rZHNTdGF0dXMgPT09ICdSRUFEWScgPyAnRm9vZCBpcyBwYWNrZWQhJyA6ICdQZW5kaW5nLi4uJyxcbiAgICAgICAgICAgICAgICAgICAgICBkb25lOiB0cmFja1Jlc3VsdC5rZHNTdGF0dXMgPT09ICdSRUFEWScgfHwgdHJhY2tSZXN1bHQuc3RhdHVzID09PSAnRElTUEFUQ0hFRCcgfHwgdHJhY2tSZXN1bHQuc3RhdHVzID09PSAnUEFJRCcgfHwgdHJhY2tSZXN1bHQuc3RhdHVzID09PSAnU0VUVExFRCcsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0Rpc3BhdGNoZWQnLFxuICAgICAgICAgICAgICAgICAgICAgIHN1YjogKHRyYWNrUmVzdWx0LnN0YXR1cyA9PT0gJ0RJU1BBVENIRUQnIHx8IHRyYWNrUmVzdWx0LnN0YXR1cyA9PT0gJ1BBSUQnIHx8IHRyYWNrUmVzdWx0LnN0YXR1cyA9PT0gJ1NFVFRMRUQnKSA/ICdSaWRlciBvbiB0aGUgd2F5JyA6ICdXYWl0aW5nIGZvciByaWRlci4uLicsXG4gICAgICAgICAgICAgICAgICAgICAgZG9uZTogdHJhY2tSZXN1bHQuc3RhdHVzID09PSAnRElTUEFUQ0hFRCcgfHwgdHJhY2tSZXN1bHQuc3RhdHVzID09PSAnUEFJRCcgfHwgdHJhY2tSZXN1bHQuc3RhdHVzID09PSAnU0VUVExFRCcsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0RlbGl2ZXJlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgc3ViOiAodHJhY2tSZXN1bHQuc3RhdHVzID09PSAnUEFJRCcgfHwgdHJhY2tSZXN1bHQuc3RhdHVzID09PSAnU0VUVExFRCcpID8gJ0Nhc2ggQ29sbGVjdGVkICYgRGVsaXZlcmVkIOKckycgOiAnUGVuZGluZy4uLicsXG4gICAgICAgICAgICAgICAgICAgICAgZG9uZTogdHJhY2tSZXN1bHQuc3RhdHVzID09PSAnUEFJRCcgfHwgdHJhY2tSZXN1bHQuc3RhdHVzID09PSAnU0VUVExFRCcsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBdLm1hcCgoc3RlcCwgaSkgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17aX0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1zdGFydCBnYXAtMyByZWxhdGl2ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgIHtpIDwgNSAmJiA8ZGl2IGNsYXNzTmFtZT17YGFic29sdXRlIGxlZnQtMi41IHRvcC01IHctWzJweF0gaC02ICR7c3RlcC5kb25lID8gJ2JnLVsjNGVkZWEzXScgOiAnYmctc2xhdGUtNzAwJ31gfT48L2Rpdj59XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2B3LTUgaC01IHJvdW5kZWQtZnVsbCBmbGV4LXNocmluay0wIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJvcmRlci0yIHRyYW5zaXRpb24tYWxsIHJlbGF0aXZlIHotMTAgYmctWyMxOTFmMmZdICR7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGVwLmRvbmUgPyAnYm9yZGVyLVsjNGVkZWEzXSB0ZXh0LVsjNGVkZWEzXScgOiAnYm9yZGVyLXNsYXRlLTcwMCB0ZXh0LXRyYW5zcGFyZW50J1xuICAgICAgICAgICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzdGVwLmRvbmUgJiYgPENoZWNrQ2lyY2xlMiBjbGFzc05hbWU9XCJ3LTMgaC0zIGZpbGwtWyM0ZWRlYTNdIHRleHQtWyMxOTFmMmZdXCIgLz59XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT17YHRleHQtWzEwcHhdIGZvbnQtYm9sZCAke3N0ZXAuZG9uZSA/ICd0ZXh0LXdoaXRlJyA6ICd0ZXh0LXNsYXRlLTUwMCd9YH0+e3N0ZXAubGFiZWx9PC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LVsjZDNjNWFjXVwiPntzdGVwLnN1Yn08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7dHJhY2tSZXN1bHQuc3RhdHVzID09PSAnRElTUEFUQ0hFRCcgJiYgdHJhY2tSZXN1bHQuZGVsaXZlcnkgJiYgKFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE0MWIyYl0gYm9yZGVyIGJvcmRlci1bIzRlZGVhM10vMzAgcm91bmRlZC14bCBvdmVyZmxvdy1oaWRkZW4gbXQtNFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjNGVkZWEzXS8xMCBweC00IHB5LTIgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMiBoLTIgcm91bmRlZC1mdWxsIGJnLVsjNGVkZWEzXSBhbmltYXRlLXBpbmdcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYmxhY2sgdXBwZXJjYXNlIHRleHQtWyM0ZWRlYTNdXCI+UmlkZXIgaXMgYXBwcm9hY2hpbmchPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBoLTMyIGJnLXNsYXRlLTkwMCB3LWZ1bGwgb3ZlcmZsb3ctaGlkZGVuIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIGJvcmRlci1bMC41cHhdIGJvcmRlci1zbGF0ZS04MDBcIiBzdHlsZT17eyBiYWNrZ3JvdW5kU2l6ZTogJzIwcHggMjBweCcsIGJhY2tncm91bmRJbWFnZTogJ2xpbmVhci1ncmFkaWVudCh0byByaWdodCwgIzFlMjkzYiAxcHgsIHRyYW5zcGFyZW50IDFweCksIGxpbmVhci1ncmFkaWVudCh0byBib3R0b20sICMxZTI5M2IgMXB4LCB0cmFuc3BhcmVudCAxcHgpJyB9fSAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0zMiBoLTMyIGJvcmRlciBib3JkZXItWyM0ZWRlYTNdLzIwIHJvdW5kZWQtZnVsbCBhbmltYXRlLXBpbmcgYWJzb2x1dGVcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xNiBoLTE2IGJvcmRlciBib3JkZXItWyM0ZWRlYTNdLzQwIHJvdW5kZWQtZnVsbCBhbmltYXRlLXBpbmcgYWJzb2x1dGVcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy00IGgtNCBiZy1bIzRlZGVhM10gcm91bmRlZC1mdWxsIHotMTAgc2hhZG93LVswXzBfMTVweF8jNGVkZWEzXSByZWxhdGl2ZSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSAtdG9wLTYgYmctd2hpdGUgdGV4dC1zbGF0ZS05MDAgdGV4dC1bOHB4XSBmb250LWJvbGQgcHgtMiBweS0wLjUgcm91bmRlZCB3aGl0ZXNwYWNlLW5vd3JhcFwiPlJpZGVyPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgIHsodHJhY2tSZXN1bHQuc3RhdHVzID09PSAnUEFJRCcgfHwgdHJhY2tSZXN1bHQuc3RhdHVzID09PSAnU0VUVExFRCcpICYmIChcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNDFiMmJdIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHJvdW5kZWQteGwgcC00IG10LTQgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAge3RyYWNrUmVzdWx0LmZlZWRiYWNrIHx8IGZlZWRiYWNrU3VibWl0dGVkID8gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtWyM0ZWRlYTNdIG1iLTFcIj5UaGFua3MgZm9yIHlvdXIgZmVlZGJhY2shPC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWNlbnRlciBnYXAtMSBteS0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtbMSwgMiwgMywgNCwgNV0ubWFwKHN0YXIgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdmcga2V5PXtzdGFyfSBjbGFzc05hbWU9e2B3LTUgaC01ICR7KHRyYWNrUmVzdWx0LmZlZWRiYWNrPy5yYXRpbmcgfHwgZmVlZGJhY2tSYXRpbmcpID49IHN0YXIgPyAndGV4dC1hbWJlci00MDAnIDogJ3RleHQtc2xhdGUtNjAwJ31gfSBmaWxsPVwiY3VycmVudENvbG9yXCIgdmlld0JveD1cIjAgMCAyMCAyMFwiPjxwYXRoIGQ9XCJNOS4wNDkgMi45MjdjLjMtLjkyMSAxLjYwMy0uOTIxIDEuOTAyIDBsMS4wNyAzLjI5MmExIDEgMCAwMC45NS42OWgzLjQ2MmMuOTY5IDAgMS4zNzEgMS4yNC41ODggMS44MWwtMi44IDIuMDM0YTEgMSAwIDAwLS4zNjQgMS4xMThsMS4wNyAzLjI5MmMuMy45MjEtLjc1NSAxLjY4OC0xLjU0IDEuMTE4bC0yLjgtMi4wMzRhMSAxIDAgMDAtMS4xNzUgMGwtMi44IDIuMDM0Yy0uNzg0LjU3LTEuODM4LS4xOTctMS41MzktMS4xMThsMS4wNy0zLjI5MmExIDEgMCAwMC0uMzY0LTEuMTE4TDIuOTggOC43MmMtLjc4My0uNTctLjM4LTEuODEuNTg4LTEuODFoMy40NjFhMSAxIDAgMDAuOTUxLS42OWwxLjA3LTMuMjkyelwiIC8+PC9zdmc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMFwiPlwie3RyYWNrUmVzdWx0LmZlZWRiYWNrPy5jb21tZW50IHx8IGZlZWRiYWNrQ29tbWVudH1cIjwvcD5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlIG1iLTFcIj5Ib3cgd2FzIHlvdXIgZGVsaXZlcnk/PC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWNlbnRlciBnYXAtMiBtYi0zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtbMSwgMiwgMywgNCwgNV0ubWFwKHN0YXIgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24ga2V5PXtzdGFyfSBvbkNsaWNrPXsoKSA9PiBzZXRGZWVkYmFja1JhdGluZyhzdGFyKX0gY2xhc3NOYW1lPVwiZm9jdXM6b3V0bGluZS1ub25lXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3ZnIGNsYXNzTmFtZT17YHctOCBoLTggJHtmZWVkYmFja1JhdGluZyA+PSBzdGFyID8gJ3RleHQtYW1iZXItNDAwJyA6ICd0ZXh0LXNsYXRlLTcwMCBob3Zlcjp0ZXh0LWFtYmVyLTIwMCd9IHRyYW5zaXRpb24tY29sb3JzYH0gZmlsbD1cImN1cnJlbnRDb2xvclwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIj48cGF0aCBkPVwiTTkuMDQ5IDIuOTI3Yy4zLS45MjEgMS42MDMtLjkyMSAxLjkwMiAwbDEuMDcgMy4yOTJhMSAxIDAgMDAuOTUuNjloMy40NjJjLjk2OSAwIDEuMzcxIDEuMjQuNTg4IDEuODFsLTIuOCAyLjAzNGExIDEgMCAwMC0uMzY0IDEuMTE4bDEuMDcgMy4yOTJjLjMuOTIxLS43NTUgMS42ODgtMS41NCAxLjExOGwtMi44LTIuMDM0YTEgMSAwIDAwLTEuMTc1IDBsLTIuOCAyLjAzNGMtLjc4NC41Ny0xLjgzOC0uMTk3LTEuNTM5LTEuMTE4bDEuMDctMy4yOTJhMSAxIDAgMDAtLjM2NC0xLjExOEwyLjk4IDguNzJjLS43ODMtLjU3LS4zOC0xLjgxLjU4OC0xLjgxaDMuNDYxYTEgMSAwIDAwLjk1MS0uNjlsMS4wNy0zLjI5MnpcIiAvPjwvc3ZnPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiTGVhdmUgYSBjb21tZW50IChvcHRpb25hbCkuLi5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZmVlZGJhY2tDb21tZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRGZWVkYmFja0NvbW1lbnQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyMxOTFmMmZdIGJvcmRlciBib3JkZXItc2xhdGUtNzAwIHJvdW5kZWQteGwgcHgtMyBweS0yIHRleHQtWzEwcHhdIHRleHQtd2hpdGUgcmVzaXplLW5vbmUgb3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1hbWJlci00MDAgbWItM1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJvd3M9ezJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtoYW5kbGVTdWJtaXRGZWVkYmFja30gZGlzYWJsZWQ9eyFmZWVkYmFja1JhdGluZyB8fCBpc1N1Ym1pdHRpbmdGZWVkYmFja30gY2xhc3NOYW1lPVwidy1mdWxsIHB5LTIgYmctWyNmYmJmMjRdIGhvdmVyOmJnLWFtYmVyLTQwMCB0ZXh0LXNsYXRlLTk1MCBmb250LWJsYWNrIHRleHQtWzEwcHhdIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3Qgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbFwiPlN1Ym1pdCBGZWVkYmFjazwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTIgbXQtNFwiPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7IHNldFRyYWNrUmVzdWx0KG51bGwpOyBzZXRUcmFja0lkKCcnKTsgc2V0VHJhY2tQaG9uZSgnJyk7IH19XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBweS0yLjUgYm9yZGVyIGJvcmRlci1zbGF0ZS03MDAgaG92ZXI6Ym9yZGVyLXNsYXRlLTUwMCB0ZXh0LVsjZDNjNWFjXSBmb250LWJvbGQgdGV4dC14cyB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICBTZWFyY2ggQWdhaW5cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc1RyYWNrT3BlbihmYWxzZSl9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBweS0yLjUgYmctWyNmYmJmMjRdIGhvdmVyOmJnLWFtYmVyLTQwMCB0ZXh0LXNsYXRlLTk1MCBmb250LWJsYWNrIHRleHQteHMgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCByb3VuZGVkLXhsIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyXCJcbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgQ2xvc2VcbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2FzaWRlPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBDdXN0b21lciBMb2dpbiBNb2RhbCAqL31cbiAgICAgIHtpc0xvZ2luT3BlbiAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZml4ZWQgaW5zZXQtMCB6LVszMDBdIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLWJsYWNrLzcwIGJhY2tkcm9wLWJsdXItc21cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjMTkxZjJmXSBib3JkZXIgYm9yZGVyLXNsYXRlLTcwMCByb3VuZGVkLVsyOHB4XSBwLTggbWF4LXctc20gdy1mdWxsIG14LTQgc2hhZG93LTJ4bFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgbWItNlwiPlxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtYmxhY2sgdGV4dC13aGl0ZVwiPlNpZ24gSW48L2gzPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1bI2QzYzVhY10gbXQtMC41XCI+QXBuYSBuYWFtIGF1ciBwaG9uZSBlbnRlciBrYXJlaW48L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHsgc2V0SXNMb2dpbk9wZW4oZmFsc2UpOyBzZXRMb2dpbkVycm9yKCcnKTsgfX0gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC13aGl0ZSBwLTFcIj5cbiAgICAgICAgICAgICAgICA8WCBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVMb2dpbn0gY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IHRleHQtWyNkM2M1YWNdIGJsb2NrIG1iLTEuNVwiPkZ1bGwgTmFtZTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17bG9naW5OYW1lfVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0TG9naW5OYW1lKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiZS5nLiBBbGkgS2hhblwiXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyMxNDFiMmJdIGJvcmRlciBib3JkZXItc2xhdGUtNzAwIGZvY3VzOmJvcmRlci1bI2ZiYmYyNF0gcm91bmRlZC14bCBweC00IHB5LTMgdGV4dC1zbSB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTYwMCBvdXRsaW5lLW5vbmUgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IHRleHQtWyNkM2M1YWNdIGJsb2NrIG1iLTEuNVwiPlBob25lIE51bWJlcjwvbGFiZWw+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICB0eXBlPVwidGVsXCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtsb2dpblBob25lfVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0TG9naW5QaG9uZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cImUuZy4gMDMwMDEyMzQ1NjdcIlxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMTQxYjJiXSBib3JkZXIgYm9yZGVyLXNsYXRlLTcwMCBmb2N1czpib3JkZXItWyNmYmJmMjRdIHJvdW5kZWQteGwgcHgtNCBweS0zIHRleHQtc20gdGV4dC13aGl0ZSBwbGFjZWhvbGRlci1zbGF0ZS02MDAgb3V0bGluZS1ub25lIHRyYW5zaXRpb24tY29sb3JzXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgdGV4dC1bI2QzYzVhY10gYmxvY2sgbWItMS41XCI+RGVsaXZlcnkgQWRkcmVzczwvbGFiZWw+XG4gICAgICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17bG9naW5BZGRyZXNzfVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0TG9naW5BZGRyZXNzKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiZS5nLiBIb3VzZSAxMjMsIFN0cmVldCA0LCBQaGFzZSA1Li4uXCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1bIzE0MWIyYl0gYm9yZGVyIGJvcmRlci1zbGF0ZS03MDAgZm9jdXM6Ym9yZGVyLVsjZmJiZjI0XSByb3VuZGVkLXhsIHB4LTQgcHktMyB0ZXh0LXNtIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNjAwIG91dGxpbmUtbm9uZSB0cmFuc2l0aW9uLWNvbG9ycyByZXNpemUtbm9uZVwiXG4gICAgICAgICAgICAgICAgICByb3dzPXsyfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICB7bG9naW5FcnJvciAmJiAoXG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LXJlZC00MDAgZm9udC1ib2xkXCI+e2xvZ2luRXJyb3J9PC9wPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIiBjbGFzc05hbWU9XCJ3LWZ1bGwgcHktMy41IGJnLVsjZmJiZjI0XSBob3ZlcjpiZy1hbWJlci00MDAgdGV4dC1zbGF0ZS05NTAgZm9udC1ibGFjayB0ZXh0LXhzIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3Qgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCBtdC0yIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgU2lnbiBJblxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1jZW50ZXIgdGV4dC1zbGF0ZS02MDBcIj5ObyBwYXNzd29yZCBuZWVkZWQg4oCUIHBob25lIG51bWJlciBzZSBwZWhjaGFuYSBqYWF0YSBoYWk8L3A+XG4gICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIENoZWNrb3V0IFByb2ZpbGUgTW9kYWwgKi99XG4gICAgICB7aXNDaGVja291dFByb2ZpbGVPcGVuICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIHotWzMwMF0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctYmxhY2svNzAgYmFja2Ryb3AtYmx1ci1zbVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxOTFmMmZdIGJvcmRlciBib3JkZXItWyM0ZWRlYTNdLzQwIHJvdW5kZWQtWzI4cHhdIHAtOCBtYXgtdy1tZCB3LWZ1bGwgbXgtNCBzaGFkb3ctWzBfMF81MHB4X3JnYmEoNzgsMjIyLDE2MywwLjE1KV0gYW5pbWF0ZS1mYWRlLWluXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBtYi02XCI+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ibGFjayB0ZXh0LXdoaXRlIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICA8TWFwUGluIGNsYXNzTmFtZT1cInctNSBoLTUgdGV4dC1bIzRlZGVhM11cIiAvPlxuICAgICAgICAgICAgICAgICAgRGVsaXZlcnkgRGV0YWlsc1xuICAgICAgICAgICAgICAgIDwvaDM+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LVsjZDNjNWFjXSBtdC0xXCI+UGxlYXNlIHByb3ZpZGUgeW91ciBkZXRhaWxzIHRvIGNvbXBsZXRlIHRoZSBvcmRlcjwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17KCkgPT4geyBzZXRJc0NoZWNrb3V0UHJvZmlsZU9wZW4oZmFsc2UpOyBzZXRDaGVja291dEVycm9yKCcnKTsgfX0gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC13aGl0ZSBwLTEgdHJhbnNpdGlvbi1jb2xvcnMgYmctWyMxNDFiMmJdIHJvdW5kZWQtZnVsbFwiPlxuICAgICAgICAgICAgICAgIDxYIGNsYXNzTmFtZT1cInctNSBoLTVcIiAvPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgXG4gICAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlQ2hlY2tvdXRQcm9maWxlU3VibWl0fSBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgdGV4dC1bI2QzYzVhY10gYmxvY2sgbWItMS41XCI+RnVsbCBOYW1lPC9sYWJlbD5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtjaGVja291dE5hbWV9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRDaGVja291dE5hbWUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJlLmcuIEFsaSBLaGFuXCJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1bIzE0MWIyYl0gYm9yZGVyIGJvcmRlci1zbGF0ZS03MDAgZm9jdXM6Ym9yZGVyLVsjNGVkZWEzXSByb3VuZGVkLXhsIHB4LTQgcHktMyB0ZXh0LXNtIHRleHQtd2hpdGUgcGxhY2Vob2xkZXItc2xhdGUtNjAwIG91dGxpbmUtbm9uZSB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgdGV4dC1bI2QzYzVhY10gYmxvY2sgbWItMS41XCI+UGhvbmUgTnVtYmVyPC9sYWJlbD5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZWxcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2NoZWNrb3V0UGhvbmV9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRDaGVja291dFBob25lKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiZS5nLiAwMzAwMTIzNDU2N1wiXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyMxNDFiMmJdIGJvcmRlciBib3JkZXItc2xhdGUtNzAwIGZvY3VzOmJvcmRlci1bIzRlZGVhM10gcm91bmRlZC14bCBweC00IHB5LTMgdGV4dC1zbSB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTYwMCBvdXRsaW5lLW5vbmUgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCB0ZXh0LVsjZDNjNWFjXSBibG9jayBtYi0xLjVcIj5Db21wbGV0ZSBEZWxpdmVyeSBBZGRyZXNzPC9sYWJlbD5cbiAgICAgICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtjaGVja291dEFkZHJlc3N9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRDaGVja291dEFkZHJlc3MoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJlLmcuIEhvdXNlIDEyLCBTdHJlZXQgMywgQmxvY2sgQS4uLlwiXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctWyMxNDFiMmJdIGJvcmRlciBib3JkZXItc2xhdGUtNzAwIGZvY3VzOmJvcmRlci1bIzRlZGVhM10gcm91bmRlZC14bCBweC00IHB5LTMgdGV4dC1zbSB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLXNsYXRlLTYwMCBvdXRsaW5lLW5vbmUgdHJhbnNpdGlvbi1jb2xvcnMgcmVzaXplLW5vbmVcIlxuICAgICAgICAgICAgICAgICAgcm93cz17M31cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIHtjaGVja291dEVycm9yICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXJlZC01MDAvMTAgYm9yZGVyIGJvcmRlci1yZWQtNTAwLzIwIHB4LTMgcHktMiByb3VuZGVkLWxnXCI+XG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtcmVkLTQwMCBmb250LWJvbGQgdGV4dC1jZW50ZXJcIj57Y2hlY2tvdXRFcnJvcn08L3A+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIiBcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17aXNTdWJtaXR0aW5nT3JkZXJ9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB5LTQgYmctWyM0ZWRlYTNdIGhvdmVyOmJnLWVtZXJhbGQtNDAwIGRpc2FibGVkOm9wYWNpdHktNTAgdGV4dC1zbGF0ZS05NTAgZm9udC1ibGFjayB0ZXh0LXhzIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3Qgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCBzaGFkb3ctWzBfNHB4XzE1cHhfcmdiYSg3OCwyMjIsMTYzLDAuMyldIG10LTQgZmxleCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgZ2FwLTIgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2lzU3VibWl0dGluZ09yZGVyID8gKFxuICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidy00IGgtNCBib3JkZXItMiBib3JkZXItc2xhdGUtOTUwIGJvcmRlci10LXRyYW5zcGFyZW50IHJvdW5kZWQtZnVsbCBhbmltYXRlLXNwaW5cIiAvPlxuICAgICAgICAgICAgICAgICAgICBQbGFjaW5nIE9yZGVyLi4uXG4gICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgU2F2ZSAmIENvbmZpcm0gT3JkZXJcbiAgICAgICAgICAgICAgICAgICAgPEFycm93UmlnaHQgY2xhc3NOYW1lPVwidy00IGgtNFwiIC8+XG4gICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogTXkgT3JkZXJzIFBhbmVsICovfVxuICAgICAge2lzTXlPcmRlcnNPcGVuICYmIGN1c3RvbWVyICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIHotWzI1MF0gZmxleCBqdXN0aWZ5LWVuZFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgaW5zZXQtMCBiZy1ibGFjay82MCBiYWNrZHJvcC1ibHVyLXNtXCIgb25DbGljaz17KCkgPT4gc2V0SXNNeU9yZGVyc09wZW4oZmFsc2UpfSAvPlxuICAgICAgICAgIDxhc2lkZSBjbGFzc05hbWU9XCJyZWxhdGl2ZSB3LWZ1bGwgbWF4LXctc20gYmctWyMxNDFiMmJdIGJvcmRlci1sIGJvcmRlci1zbGF0ZS04MDAgZmxleCBmbGV4LWNvbCBoLWZ1bGwgc2hhZG93LTJ4bCBhbmltYXRlLXNsaWRlLWluLXJpZ2h0XCI+XG4gICAgICAgICAgICB7LyogSGVhZGVyICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgcC02IGJvcmRlci1iIGJvcmRlci1zbGF0ZS04MDBcIj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwiZm9udC1ibGFjayB0ZXh0LXdoaXRlIHRleHQtYmFzZVwiPk15IE9yZGVyczwvaDI+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1bI2QzYzVhY10gbXQtMC41XCI+e2N1c3RvbWVyLm5hbWV9IMK3IHtjdXN0b21lci5waG9uZX08L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtoYW5kbGVMb2dvdXR9IGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtcmVkLTQwMCBmb250LWJvbGQgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIHRyYW5zaXRpb24tY29sb3JzXCI+TG9nb3V0PC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBzZXRJc015T3JkZXJzT3BlbihmYWxzZSl9IGNsYXNzTmFtZT1cInRleHQtc2xhdGUtNTAwIGhvdmVyOnRleHQtd2hpdGUgcC0xXCI+XG4gICAgICAgICAgICAgICAgICA8WCBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIE9yZGVycyBMaXN0ICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHAtNCBzcGFjZS15LTRcIj5cbiAgICAgICAgICAgICAge215T3JkZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHB5LTE2IHRleHQtWyNkM2M1YWNdXCI+XG4gICAgICAgICAgICAgICAgICA8U2hvcHBpbmdDYXJ0IGNsYXNzTmFtZT1cInctMTAgaC0xMCBteC1hdXRvIG1iLTMgdGV4dC1zbGF0ZS03MDBcIiAvPlxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc21cIj5ObyBvcmRlcnMgeWV0PC9wPlxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyBtdC0xIHRleHQtc2xhdGUtNjAwXCI+SmFiIG9yZGVyIGthcmFpbiBnZSB0byB5YWhhbiBkaWtoZWdhPC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIG15T3JkZXJzLm1hcCgob3JkKSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBzdGF0dXNDb2xvciA9XG4gICAgICAgICAgICAgICAgICAgIG9yZC5rZHNTdGF0dXMgPT09ICdSRUFEWScgPyAndGV4dC1bIzRlZGVhM10nIDpcbiAgICAgICAgICAgICAgICAgICAgb3JkLmtkc1N0YXR1cyA9PT0gJ1BSRVBBUklORycgPyAndGV4dC1hbWJlci00MDAnIDpcbiAgICAgICAgICAgICAgICAgICAgb3JkLmtkc1N0YXR1cyA9PT0gJ0FDQ0VQVEVEJyA/ICd0ZXh0LWJsdWUtNDAwJyA6ICd0ZXh0LXNsYXRlLTUwMCc7XG4gICAgICAgICAgICAgICAgICBjb25zdCBzdGF0dXNMYWJlbCA9XG4gICAgICAgICAgICAgICAgICAgIG9yZC5rZHNTdGF0dXMgPT09ICdSRUFEWScgPyAnUmVhZHkgZm9yIFBpY2t1cCcgOlxuICAgICAgICAgICAgICAgICAgICBvcmQua2RzU3RhdHVzID09PSAnUFJFUEFSSU5HJyA/IGBJbiBLaXRjaGVuJHtvcmQucHJlcFRpbWVNaW51dGVzID8gYCAofiR7b3JkLnByZXBUaW1lTWludXRlc30gbWluKWAgOiAnJ31gIDpcbiAgICAgICAgICAgICAgICAgICAgb3JkLmtkc1N0YXR1cyA9PT0gJ0FDQ0VQVEVEJyA/ICdDb25maXJtZWQgYnkgUmVzdGF1cmFudCcgOiAnV2FpdGluZyBmb3IgQ29uZmlybWF0aW9uJztcbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtvcmQuaWR9IGNsYXNzTmFtZT1cImJnLVsjMTkxZjJmXSByb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLXNsYXRlLTgwMCBwLTQgc3BhY2UteS0zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1zdGFydFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1ibGFjayB0ZXh0LXdoaXRlIHRleHQtc21cIj5PcmRlciAje29yZC5pZH08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtWyNkM2M1YWNdXCI+e29yZC50aW1lUGxhY2VkfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdGV4dC1bMTBweF0gZm9udC1ibGFjayB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgJHtzdGF0dXNDb2xvcn1gfT57c3RhdHVzTGFiZWx9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1bI2QzYzVhY10gbGVhZGluZy1yZWxheGVkXCI+e29yZC5pdGVtc308L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiBpdGVtcy1jZW50ZXIgcHQtMSBib3JkZXItdCBib3JkZXItc2xhdGUtODAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwXCI+VG90YWw8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC1bI2ZiYmYyNF1cIj4ke29yZC50b3RhbEFtb3VudH08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgey8qIERldGFpbGVkIHRyYWNraW5nIHRpbWVsaW5lICovfVxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0zIHB0LTMgbXQtMyBib3JkZXItdCBib3JkZXItc2xhdGUtODAwLzUwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7W1xuICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnT3JkZXIgUGxhY2VkJywgc3ViOiBvcmQudGltZVBsYWNlZCB8fCAnUmVjZWl2ZWQnLCBkb25lOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0NvbmZpcm1lZCBieSBSZXN0YXVyYW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWI6IG9yZC5rZHNTdGF0dXMgPT09ICdQRU5ESU5HJyA/ICdXYWl0aW5nIGZvciBjYXNoaWVyLi4uJyA6ICdBY2NlcHRlZCDinJMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmU6IG9yZC5rZHNTdGF0dXMgIT09ICdQRU5ESU5HJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnSW4gS2l0Y2hlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViOiBvcmQua2RzU3RhdHVzID09PSAnUFJFUEFSSU5HJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBgfiR7b3JkLnByZXBUaW1lTWludXRlc30gbWlucyDCtyBSZWFkeSBieSAke29yZC5lc3RpbWF0ZWRSZWFkeUF0fWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogb3JkLmtkc1N0YXR1cyA9PT0gJ1JFQURZJyA/ICdEb25lIOKckycgOiAnV2FpdGluZy4uLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZTogb3JkLmtkc1N0YXR1cyA9PT0gJ1BSRVBBUklORycgfHwgb3JkLmtkc1N0YXR1cyA9PT0gJ1JFQURZJyB8fCBvcmQuc3RhdHVzID09PSAnRElTUEFUQ0hFRCcgfHwgb3JkLnN0YXR1cyA9PT0gJ1BBSUQnIHx8IG9yZC5zdGF0dXMgPT09ICdTRVRUTEVEJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnUmVhZHkgZm9yIERlbGl2ZXJ5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWI6IG9yZC5rZHNTdGF0dXMgPT09ICdSRUFEWScgPyAnRm9vZCBpcyBwYWNrZWQhJyA6ICdQZW5kaW5nLi4uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb25lOiBvcmQua2RzU3RhdHVzID09PSAnUkVBRFknIHx8IG9yZC5zdGF0dXMgPT09ICdESVNQQVRDSEVEJyB8fCBvcmQuc3RhdHVzID09PSAnUEFJRCcgfHwgb3JkLnN0YXR1cyA9PT0gJ1NFVFRMRUQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdEaXNwYXRjaGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWI6IChvcmQuc3RhdHVzID09PSAnRElTUEFUQ0hFRCcgfHwgb3JkLnN0YXR1cyA9PT0gJ1BBSUQnIHx8IG9yZC5zdGF0dXMgPT09ICdTRVRUTEVEJykgPyAnUmlkZXIgb24gdGhlIHdheScgOiAnV2FpdGluZyBmb3IgcmlkZXIuLi4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmU6IG9yZC5zdGF0dXMgPT09ICdESVNQQVRDSEVEJyB8fCBvcmQuc3RhdHVzID09PSAnUEFJRCcgfHwgb3JkLnN0YXR1cyA9PT0gJ1NFVFRMRUQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdEZWxpdmVyZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YjogKG9yZC5zdGF0dXMgPT09ICdQQUlEJyB8fCBvcmQuc3RhdHVzID09PSAnU0VUVExFRCcpID8gJ0Nhc2ggQ29sbGVjdGVkICYgRGVsaXZlcmVkIOKckycgOiAnUGVuZGluZy4uLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZTogb3JkLnN0YXR1cyA9PT0gJ1BBSUQnIHx8IG9yZC5zdGF0dXMgPT09ICdTRVRUTEVEJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIF0ubWFwKChzdGVwLCBpKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtpfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLXN0YXJ0IGdhcC0zIHJlbGF0aXZlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2kgPCA1ICYmIDxkaXYgY2xhc3NOYW1lPXtgYWJzb2x1dGUgbGVmdC0yLjUgdG9wLTUgdy1bMnB4XSBoLTYgJHtzdGVwLmRvbmUgPyAnYmctWyM0ZWRlYTNdJyA6ICdiZy1zbGF0ZS03MDAnfWB9PjwvZGl2Pn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YHctNSBoLTUgcm91bmRlZC1mdWxsIGZsZXgtc2hyaW5rLTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYm9yZGVyLTIgdHJhbnNpdGlvbi1hbGwgcmVsYXRpdmUgei0xMCBiZy1bIzE5MWYyZl0gJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXAuZG9uZSA/ICdib3JkZXItWyM0ZWRlYTNdIHRleHQtWyM0ZWRlYTNdJyA6ICdib3JkZXItc2xhdGUtNzAwIHRleHQtdHJhbnNwYXJlbnQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3N0ZXAuZG9uZSAmJiA8Q2hlY2tDaXJjbGUyIGNsYXNzTmFtZT1cInctMyBoLTMgZmlsbC1bIzRlZGVhM10gdGV4dC1bIzE5MWYyZl1cIiAvPn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPXtgdGV4dC1bMTBweF0gZm9udC1ib2xkICR7c3RlcC5kb25lID8gJ3RleHQtd2hpdGUnIDogJ3RleHQtc2xhdGUtNTAwJ31gfT57c3RlcC5sYWJlbH08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtWyNkM2M1YWNdXCI+e3N0ZXAuc3VifTwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICB7b3JkLmtkc1N0YXR1cyA9PT0gJ1JFQURZJyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLVsjNGVkZWEzXS8xMCBib3JkZXIgYm9yZGVyLVsjNGVkZWEzXS8yMCByb3VuZGVkLXhsIHB4LTMgcHktMiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYmxhY2sgdGV4dC1bIzRlZGVhM11cIj5Zb3VyIG9yZGVyIGlzIHJlYWR5ITwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBMaXZlIGluZGljYXRvciAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtNCBweS0zIGJvcmRlci10IGJvcmRlci1zbGF0ZS04MDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidy0yIGgtMiByb3VuZGVkLWZ1bGwgYmctWyNmYmJmMjRdIGFuaW1hdGUtcHVsc2VcIiAvPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTYwMFwiPkxpdmUgdXBkYXRlcyDigJQgaGFyIDUgc2Vjb25kcyBtZWluIHJlZnJlc2g8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2FzaWRlPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBDdXN0b20gT3JkZXIgQ29uZmlybWF0aW9uICsgTGl2ZSBUcmFja2luZyBNb2RhbCAqL31cbiAgICAgIHtvcmRlckNvbmZpcm1lZCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZml4ZWQgaW5zZXQtMCB6LVsyMDBdIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLWJsYWNrLzcwIGJhY2tkcm9wLWJsdXItc20gYW5pbWF0ZS1mYWRlLWluXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE5MWYyZl0gYm9yZGVyIGJvcmRlci1bI2ZiYmYyNF0vMzAgcm91bmRlZC1bMjhweF0gcC04IG1heC13LXNtIHctZnVsbCBteC00IHNoYWRvdy0yeGxcIj5cbiAgICAgICAgICAgIHsvKiBIZWFkZXIgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtY2VudGVyIG1iLTZcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTE0IGgtMTQgcm91bmRlZC1mdWxsIGJnLVsjZmJiZjI0XS8xMCBib3JkZXIgYm9yZGVyLVsjZmJiZjI0XS8zMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBteC1hdXRvIG1iLTRcIj5cbiAgICAgICAgICAgICAgICA8UGFydHlQb3BwZXIgY2xhc3NOYW1lPVwidy02IGgtNiB0ZXh0LVsjZmJiZjI0XVwiIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LWJsYWNrIHRleHQtd2hpdGUgdXBwZXJjYXNlIHRyYWNraW5nLXRpZ2h0XCI+T3JkZXIgQ29uZmlybWVkITwvaDM+XG4gICAgICAgICAgICAgIHt0cmFja2VkT3JkZXJJZCAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC0zXCI+XG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LVsjZDNjNWFjXSB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IG1iLTFcIj5Zb3VyIE9yZGVyIElEPC9wPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1bIzE0MWIyYl0gYm9yZGVyIGJvcmRlci1bI2ZiYmYyNF0vNDAgcm91bmRlZC14bCBweC00IHB5LTMgaW5saW5lLWJsb2NrXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYmxhY2sgdGV4dC1bI2ZiYmYyNF0gdHJhY2tpbmctd2lkZXJcIj4je3RyYWNrZWRPcmRlcklkfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgeyFjdXN0b21lciAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIG10LTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICBZZWggSUQgc2F2ZSBrYXIgbGVpbiDigJQgVHJhY2sgT3JkZXIgc2Ugc3RhdHVzIGNoZWNrIGthciBzYWt0YXkgaGFpblxuICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBMaXZlIFN0YXR1cyBUaW1lbGluZSAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0zIG1iLTZcIj5cbiAgICAgICAgICAgICAge1tcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBsYWJlbDogJ09yZGVyIFBsYWNlZCcsXG4gICAgICAgICAgICAgICAgICBzdWI6IHRyYWNrZWRPcmRlcj8udGltZVBsYWNlZCB8fCAnSnVzdCBub3cnLFxuICAgICAgICAgICAgICAgICAgZG9uZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGxhYmVsOiAnQ29uZmlybWVkIGJ5IFJlc3RhdXJhbnQnLFxuICAgICAgICAgICAgICAgICAgc3ViOiB0cmFja2VkT3JkZXI/Lmtkc1N0YXR1cyA9PT0gJ1BFTkRJTkcnID8gJ1dhaXRpbmcgZm9yIGNhc2hpZXIuLi4nIDogJ0FjY2VwdGVkIOKckycsXG4gICAgICAgICAgICAgICAgICBkb25lOiB0cmFja2VkT3JkZXI/Lmtkc1N0YXR1cyAhPT0gJ1BFTkRJTkcnICYmIHRyYWNrZWRPcmRlcj8ua2RzU3RhdHVzICE9IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBsYWJlbDogJ0luIEtpdGNoZW4nLFxuICAgICAgICAgICAgICAgICAgc3ViOiB0cmFja2VkT3JkZXI/Lmtkc1N0YXR1cyA9PT0gJ1BSRVBBUklORydcbiAgICAgICAgICAgICAgICAgICAgPyBgfiR7dHJhY2tlZE9yZGVyLnByZXBUaW1lTWludXRlc30gbWlucyDCtyBSZWFkeSBieSAke3RyYWNrZWRPcmRlci5lc3RpbWF0ZWRSZWFkeUF0fWBcbiAgICAgICAgICAgICAgICAgICAgOiB0cmFja2VkT3JkZXI/Lmtkc1N0YXR1cyA9PT0gJ1JFQURZJyA/ICdEb25lIOKckycgOiAnV2FpdGluZy4uLicsXG4gICAgICAgICAgICAgICAgICBkb25lOiB0cmFja2VkT3JkZXI/Lmtkc1N0YXR1cyA9PT0gJ1BSRVBBUklORycgfHwgdHJhY2tlZE9yZGVyPy5rZHNTdGF0dXMgPT09ICdSRUFEWScgfHwgdHJhY2tlZE9yZGVyPy5zdGF0dXMgPT09ICdESVNQQVRDSEVEJyB8fCB0cmFja2VkT3JkZXI/LnN0YXR1cyA9PT0gJ1BBSUQnIHx8IHRyYWNrZWRPcmRlcj8uc3RhdHVzID09PSAnU0VUVExFRCcsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBsYWJlbDogJ1JlYWR5IGZvciBEZWxpdmVyeScsXG4gICAgICAgICAgICAgICAgICBzdWI6IHRyYWNrZWRPcmRlcj8ua2RzU3RhdHVzID09PSAnUkVBRFknID8gJ0Zvb2QgaXMgcGFja2VkIScgOiAnUGVuZGluZy4uLicsXG4gICAgICAgICAgICAgICAgICBkb25lOiB0cmFja2VkT3JkZXI/Lmtkc1N0YXR1cyA9PT0gJ1JFQURZJyB8fCB0cmFja2VkT3JkZXI/LnN0YXR1cyA9PT0gJ0RJU1BBVENIRUQnIHx8IHRyYWNrZWRPcmRlcj8uc3RhdHVzID09PSAnUEFJRCcgfHwgdHJhY2tlZE9yZGVyPy5zdGF0dXMgPT09ICdTRVRUTEVEJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGxhYmVsOiAnRGlzcGF0Y2hlZCcsXG4gICAgICAgICAgICAgICAgICBzdWI6ICh0cmFja2VkT3JkZXI/LnN0YXR1cyA9PT0gJ0RJU1BBVENIRUQnIHx8IHRyYWNrZWRPcmRlcj8uc3RhdHVzID09PSAnUEFJRCcgfHwgdHJhY2tlZE9yZGVyPy5zdGF0dXMgPT09ICdTRVRUTEVEJykgPyAnUmlkZXIgb24gdGhlIHdheScgOiAnV2FpdGluZyBmb3IgcmlkZXIuLi4nLFxuICAgICAgICAgICAgICAgICAgZG9uZTogdHJhY2tlZE9yZGVyPy5zdGF0dXMgPT09ICdESVNQQVRDSEVEJyB8fCB0cmFja2VkT3JkZXI/LnN0YXR1cyA9PT0gJ1BBSUQnIHx8IHRyYWNrZWRPcmRlcj8uc3RhdHVzID09PSAnU0VUVExFRCcsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBsYWJlbDogJ0RlbGl2ZXJlZCcsXG4gICAgICAgICAgICAgICAgICBzdWI6ICh0cmFja2VkT3JkZXI/LnN0YXR1cyA9PT0gJ1BBSUQnIHx8IHRyYWNrZWRPcmRlcj8uc3RhdHVzID09PSAnU0VUVExFRCcpID8gJ0Nhc2ggQ29sbGVjdGVkICYgRGVsaXZlcmVkIOKckycgOiAnUGVuZGluZy4uLicsXG4gICAgICAgICAgICAgICAgICBkb25lOiB0cmFja2VkT3JkZXI/LnN0YXR1cyA9PT0gJ1BBSUQnIHx8IHRyYWNrZWRPcmRlcj8uc3RhdHVzID09PSAnU0VUVExFRCcsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXS5tYXAoKHN0ZXAsIGkpID0+IChcbiAgICAgICAgICAgICAgICA8ZGl2IGtleT17aX0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1zdGFydCBnYXAtMyByZWxhdGl2ZVwiPlxuICAgICAgICAgICAgICAgICAge2kgPCA1ICYmIDxkaXYgY2xhc3NOYW1lPXtgYWJzb2x1dGUgbGVmdC0yLjUgdG9wLTUgdy1bMnB4XSBoLTYgJHtzdGVwLmRvbmUgPyAnYmctWyM0ZWRlYTNdJyA6ICdiZy1zbGF0ZS03MDAnfWB9PjwvZGl2Pn1cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgdy01IGgtNSByb3VuZGVkLWZ1bGwgZmxleC1zaHJpbmstMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBib3JkZXItMiB0cmFuc2l0aW9uLWFsbCByZWxhdGl2ZSB6LTEwIGJnLVsjMTkxZjJmXSAke1xuICAgICAgICAgICAgICAgICAgICBzdGVwLmRvbmUgPyAnYm9yZGVyLVsjNGVkZWEzXSB0ZXh0LVsjNGVkZWEzXScgOiAnYm9yZGVyLXNsYXRlLTcwMCB0ZXh0LXRyYW5zcGFyZW50J1xuICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICB7c3RlcC5kb25lICYmIDxDaGVja0NpcmNsZTIgY2xhc3NOYW1lPVwidy0zIGgtMyBmaWxsLVsjNGVkZWEzXSB0ZXh0LVsjMTkxZjJmXVwiIC8+fVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9e2B0ZXh0LVsxMHB4XSBmb250LWJvbGQgJHtzdGVwLmRvbmUgPyAndGV4dC13aGl0ZScgOiAndGV4dC1zbGF0ZS01MDAnfWB9PntzdGVwLmxhYmVsfTwvcD5cbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LVsjZDNjNWFjXVwiPntzdGVwLnN1Yn08L3A+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAge3RyYWNrZWRPcmRlcj8uc3RhdHVzID09PSAnRElTUEFUQ0hFRCcgJiYgdHJhY2tlZE9yZGVyPy5kZWxpdmVyeSAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNDFiMmJdIGJvcmRlciBib3JkZXItWyM0ZWRlYTNdLzMwIHJvdW5kZWQteGwgb3ZlcmZsb3ctaGlkZGVuIG10LTQgbWItNFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyM0ZWRlYTNdLzEwIHB4LTQgcHktMiBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTIgaC0yIHJvdW5kZWQtZnVsbCBiZy1bIzRlZGVhM10gYW5pbWF0ZS1waW5nXCIgLz5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYmxhY2sgdXBwZXJjYXNlIHRleHQtWyM0ZWRlYTNdXCI+UmlkZXIgaXMgYXBwcm9hY2hpbmchPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgaC0zMiBiZy1zbGF0ZS05MDAgdy1mdWxsIG92ZXJmbG93LWhpZGRlbiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIGJvcmRlci1bMC41cHhdIGJvcmRlci1zbGF0ZS04MDBcIiBzdHlsZT17eyBiYWNrZ3JvdW5kU2l6ZTogJzIwcHggMjBweCcsIGJhY2tncm91bmRJbWFnZTogJ2xpbmVhci1ncmFkaWVudCh0byByaWdodCwgIzFlMjkzYiAxcHgsIHRyYW5zcGFyZW50IDFweCksIGxpbmVhci1ncmFkaWVudCh0byBib3R0b20sICMxZTI5M2IgMXB4LCB0cmFuc3BhcmVudCAxcHgpJyB9fSAvPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTMyIGgtMzIgYm9yZGVyIGJvcmRlci1bIzRlZGVhM10vMjAgcm91bmRlZC1mdWxsIGFuaW1hdGUtcGluZyBhYnNvbHV0ZVwiIC8+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTYgaC0xNiBib3JkZXIgYm9yZGVyLVsjNGVkZWEzXS80MCByb3VuZGVkLWZ1bGwgYW5pbWF0ZS1waW5nIGFic29sdXRlXCIgLz5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy00IGgtNCBiZy1bIzRlZGVhM10gcm91bmRlZC1mdWxsIHotMTAgc2hhZG93LVswXzBfMTVweF8jNGVkZWEzXSByZWxhdGl2ZSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIC10b3AtNiBiZy13aGl0ZSB0ZXh0LXNsYXRlLTkwMCB0ZXh0LVs4cHhdIGZvbnQtYm9sZCBweC0yIHB5LTAuNSByb3VuZGVkIHdoaXRlc3BhY2Utbm93cmFwXCI+UmlkZXI8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIHsodHJhY2tlZE9yZGVyPy5zdGF0dXMgPT09ICdQQUlEJyB8fCB0cmFja2VkT3JkZXI/LnN0YXR1cyA9PT0gJ1NFVFRMRUQnKSAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNDFiMmJdIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHJvdW5kZWQteGwgcC00IG10LTQgbWItNCB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgIHt0cmFja2VkT3JkZXI/LmZlZWRiYWNrIHx8IGZlZWRiYWNrU3VibWl0dGVkID8gKFxuICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LVsjNGVkZWEzXSBtYi0xXCI+VGhhbmtzIGZvciB5b3VyIGZlZWRiYWNrITwvaDQ+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWNlbnRlciBnYXAtMSBteS0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAge1sxLCAyLCAzLCA0LCA1XS5tYXAoc3RhciA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3ZnIGtleT17c3Rhcn0gY2xhc3NOYW1lPXtgdy01IGgtNSAkeyh0cmFja2VkT3JkZXI/LmZlZWRiYWNrPy5yYXRpbmcgfHwgZmVlZGJhY2tSYXRpbmcpID49IHN0YXIgPyAndGV4dC1hbWJlci00MDAnIDogJ3RleHQtc2xhdGUtNjAwJ31gfSBmaWxsPVwiY3VycmVudENvbG9yXCIgdmlld0JveD1cIjAgMCAyMCAyMFwiPjxwYXRoIGQ9XCJNOS4wNDkgMi45MjdjLjMtLjkyMSAxLjYwMy0uOTIxIDEuOTAyIDBsMS4wNyAzLjI5MmExIDEgMCAwMC45NS42OWgzLjQ2MmMuOTY5IDAgMS4zNzEgMS4yNC41ODggMS44MWwtMi44IDIuMDM0YTEgMSAwIDAwLS4zNjQgMS4xMThsMS4wNyAzLjI5MmMuMy45MjEtLjc1NSAxLjY4OC0xLjU0IDEuMTE4bC0yLjgtMi4wMzRhMSAxIDAgMDAtMS4xNzUgMGwtMi44IDIuMDM0Yy0uNzg0LjU3LTEuODM4LS4xOTctMS41MzktMS4xMThsMS4wNy0zLjI5MmExIDEgMCAwMC0uMzY0LTEuMTE4TDIuOTggOC43MmMtLjc4My0uNTctLjM4LTEuODEuNTg4LTEuODFoMy40NjFhMSAxIDAgMDAuOTUxLS42OWwxLjA3LTMuMjkyelwiIC8+PC9zdmc+XG4gICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMFwiPlwie3RyYWNrZWRPcmRlcj8uZmVlZGJhY2s/LmNvbW1lbnQgfHwgZmVlZGJhY2tDb21tZW50fVwiPC9wPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBtYi0xXCI+SG93IHdhcyB5b3VyIGRlbGl2ZXJ5PzwvaDQ+XG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDAwIG1iLTNcIj5SYXRlIHlvdXIgZXhwZXJpZW5jZSB0byBoZWxwIHVzIGltcHJvdmU8L3A+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWNlbnRlciBnYXAtMiBtYi0zXCI+XG4gICAgICAgICAgICAgICAgICAgICAge1sxLCAyLCAzLCA0LCA1XS5tYXAoc3RhciA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGtleT17c3Rhcn0gb25DbGljaz17KCkgPT4gc2V0RmVlZGJhY2tSYXRpbmcoc3Rhcil9IGNsYXNzTmFtZT1cImZvY3VzOm91dGxpbmUtbm9uZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3ZnIGNsYXNzTmFtZT17YHctOCBoLTggJHtmZWVkYmFja1JhdGluZyA+PSBzdGFyID8gJ3RleHQtYW1iZXItNDAwJyA6ICd0ZXh0LXNsYXRlLTcwMCBob3Zlcjp0ZXh0LWFtYmVyLTIwMCd9IHRyYW5zaXRpb24tY29sb3JzYH0gZmlsbD1cImN1cnJlbnRDb2xvclwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIj48cGF0aCBkPVwiTTkuMDQ5IDIuOTI3Yy4zLS45MjEgMS42MDMtLjkyMSAxLjkwMiAwbDEuMDcgMy4yOTJhMSAxIDAgMDAuOTUuNjloMy40NjJjLjk2OSAwIDEuMzcxIDEuMjQuNTg4IDEuODFsLTIuOCAyLjAzNGExIDEgMCAwMC0uMzY0IDEuMTE4bDEuMDcgMy4yOTJjLjMuOTIxLS43NTUgMS42ODgtMS41NCAxLjExOGwtMi44LTIuMDM0YTEgMSAwIDAwLTEuMTc1IDBsLTIuOCAyLjAzNGMtLjc4NC41Ny0xLjgzOC0uMTk3LTEuNTM5LTEuMTE4bDEuMDctMy4yOTJhMSAxIDAgMDAtLjM2NC0xLjExOEwyLjk4IDguNzJjLS43ODMtLjU3LS4zOC0xLjgxLjU4OC0xLjgxaDMuNDYxYTEgMSAwIDAwLjk1MS0uNjlsMS4wNy0zLjI5MnpcIiAvPjwvc3ZnPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkxlYXZlIGEgY29tbWVudCAob3B0aW9uYWwpLi4uXCJcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17ZmVlZGJhY2tDb21tZW50fVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldEZlZWRiYWNrQ29tbWVudChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLVsjMTkxZjJmXSBib3JkZXIgYm9yZGVyLXNsYXRlLTcwMCByb3VuZGVkLXhsIHB4LTMgcHktMiB0ZXh0LVsxMHB4XSB0ZXh0LXdoaXRlIHJlc2l6ZS1ub25lIG91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItYW1iZXItNDAwIG1iLTNcIlxuICAgICAgICAgICAgICAgICAgICAgIHJvd3M9ezJ9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17aGFuZGxlU3VibWl0RmVlZGJhY2t9IGRpc2FibGVkPXshZmVlZGJhY2tSYXRpbmcgfHwgaXNTdWJtaXR0aW5nRmVlZGJhY2t9IGNsYXNzTmFtZT1cInctZnVsbCBweS0yIGJnLVsjZmJiZjI0XSBob3ZlcjpiZy1hbWJlci00MDAgdGV4dC1zbGF0ZS05NTAgZm9udC1ibGFjayB0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGxcIj5TdWJtaXQgRmVlZGJhY2s8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgey8qIFBvbGxpbmcgaW5kaWNhdG9yICovfVxuICAgICAgICAgICAge3RyYWNrZWRPcmRlcklkICYmIHRyYWNrZWRPcmRlcj8uc3RhdHVzICE9PSAnUEFJRCcgJiYgdHJhY2tlZE9yZGVyPy5zdGF0dXMgIT09ICdTRVRUTEVEJyAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbWItNCBiZy1bIzE0MWIyYl0gcm91bmRlZC14bCBweC00IHB5LTIgYm9yZGVyIGJvcmRlci1zbGF0ZS04MDBcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ3LTIgaC0yIHJvdW5kZWQtZnVsbCBiZy1bI2ZiYmYyNF0gYW5pbWF0ZS1wdWxzZSBmbGV4LXNocmluay0wXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtWyNkM2M1YWNdXCI+TGl2ZSB0cmFja2luZyBhY3RpdmUg4oCUIHVwZGF0ZXMgZXZlcnkgNCBzZWNvbmRzPC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIHshY3VzdG9tZXIgJiYgdHJhY2tlZE9yZGVySWQgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG1iLTMgYmctWyM0ZWRlYTNdLzUgYm9yZGVyIGJvcmRlci1bIzRlZGVhM10vMjAgcm91bmRlZC14bCBweC00IHB5LTIuNVwiPlxuICAgICAgICAgICAgICAgIDxNYXBQaW4gY2xhc3NOYW1lPVwidy0zLjUgaC0zLjUgdGV4dC1bIzRlZGVhM10gZmxleC1zaHJpbmstMFwiIC8+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1bIzRlZGVhM11cIj5cbiAgICAgICAgICAgICAgICAgIEhlYWRlciBtZWluIDxzdHJvbmc+T3JkZXIgI3t0cmFja2VkT3JkZXJJZH08L3N0cm9uZz4gYnV0dG9uIHNlIGxpdmUgdHJhY2sga2FyZWluXG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTQgbXQtNlwiPlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgc2V0T3JkZXJDb25maXJtZWQoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgc2V0VHJhY2tJZChTdHJpbmcodHJhY2tlZE9yZGVySWQpKTtcbiAgICAgICAgICAgICAgICAgIHNldFRyYWNrUmVzdWx0KHRyYWNrZWRPcmRlcik7XG4gICAgICAgICAgICAgICAgICBzZXRUcmFja0Vycm9yKCcnKTtcbiAgICAgICAgICAgICAgICAgIHNldElzVHJhY2tPcGVuKHRydWUpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIHB5LTMuNSBiZy1bIzRlZGVhM10gdGV4dC1zbGF0ZS05NTAgcm91bmRlZC14bCBmb250LWJsYWNrIHRleHQteHMgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgVHJhY2sgWW91ciBPcmRlclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldE9yZGVyQ29uZmlybWVkKGZhbHNlKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgcHktMyBib3JkZXIgYm9yZGVyLVsjZmZlMWE3XSB0ZXh0LVsjZmZlMWE3XSByb3VuZGVkLXhsIGZvbnQtYm9sZCB0ZXh0LXhzIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGhvdmVyOmJnLVsjZmZlMWE3XS8xMFwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICBHbyBiYWNrIHRvIGZlZWRzXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIENhbXBhaWduIERldGFpbHMgTW9kYWwgKi99XG4gICAgICB7YWN0aXZlQ2FtcGFpZ25Nb2RhbCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZml4ZWQgaW5zZXQtMCBiZy1bIzBjMTMyMl0vOTAgYmFja2Ryb3AtYmx1ci1tZCB6LVsxMDBdIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctWyMxNDFiMmJdIHctZnVsbCBtYXgtdy00eGwgcm91bmRlZC1bMzJweF0gYm9yZGVyIGJvcmRlci1zbGF0ZS04MDAgc2hhZG93LTJ4bCBvdmVyZmxvdy1oaWRkZW4gZmxleCBmbGV4LWNvbCBtYXgtaC1bOTB2aF1cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgaC02NCBmbGV4LXNocmluay0wIGJnLXNsYXRlLTkwMFwiPlxuICAgICAgICAgICAgICB7YWN0aXZlQ2FtcGFpZ25Nb2RhbC5pbWFnZV91cmwgPyAoXG4gICAgICAgICAgICAgICAgPGltZyBcbiAgICAgICAgICAgICAgICAgIHNyYz17YCR7QkFDS0VORF9VUkx9JHthY3RpdmVDYW1wYWlnbk1vZGFsLmltYWdlX3VybH1gfSBcbiAgICAgICAgICAgICAgICAgIGFsdD17YWN0aXZlQ2FtcGFpZ25Nb2RhbC50aXRsZX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvdmVyXCIgXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgYmctZ3JhZGllbnQtdG8tYnIgZnJvbS1bI2VjNDg5OV0vMjAgdG8tcHVycGxlLTkwMC8yMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgPE1lZ2FwaG9uZSBjbGFzc05hbWU9XCJ3LTIwIGgtMjAgdGV4dC1bI2VjNDg5OV0vNTBcIiAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjMTQxYjJiXSB0by10cmFuc3BhcmVudFwiPjwvZGl2PlxuICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEFjdGl2ZUNhbXBhaWduTW9kYWwobnVsbCl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgdG9wLTYgcmlnaHQtNiB3LTEwIGgtMTAgYmctYmxhY2svNTAgaG92ZXI6YmctYmxhY2sgdGV4dC13aGl0ZSByb3VuZGVkLWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdHJhbnNpdGlvbi1jb2xvcnMgYmFja2Ryb3AtYmx1ci1tZFwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8WCBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgYm90dG9tLTYgbGVmdC04IHJpZ2h0LThcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpbmxpbmUtYmxvY2sgYmctWyNlYzQ4OTldIHRleHQtd2hpdGUgdGV4dC14cyBmb250LWJsYWNrIHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgbWItMyBzaGFkb3ctWzBfMF8xNXB4X3JnYmEoMjM2LDcyLDE1MywwLjUpXVwiPlxuICAgICAgICAgICAgICAgICAge2FjdGl2ZUNhbXBhaWduTW9kYWwuZGlzY291bnRfcGN0fSUgT0ZGIERFQUxcbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQtNHhsIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBsZWFkaW5nLXRpZ2h0XCI+e2FjdGl2ZUNhbXBhaWduTW9kYWwudGl0bGV9PC9oMj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsjZDNjNWFjXSBtdC0yIG1heC13LTJ4bFwiPnthY3RpdmVDYW1wYWlnbk1vZGFsLmRlc2NyaXB0aW9ufTwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTggb3ZlcmZsb3cteS1hdXRvIGN1c3RvbS1zY3JvbGxiYXIgZmxleC0xIGJnLVsjMTkxZjJmXVwiPlxuICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWJvbGQgdGV4dC13aGl0ZSBtYi02IGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPFV0ZW5zaWxzIGNsYXNzTmFtZT1cInRleHQtWyNlYzQ4OTldXCIgLz5cbiAgICAgICAgICAgICAgICBJdGVtcyBpbmNsdWRlZCBpbiB0aGlzIG9mZmVyXG4gICAgICAgICAgICAgIDwvaDM+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMSBtZDpncmlkLWNvbHMtMiBsZzpncmlkLWNvbHMtMyBnYXAtNFwiPlxuICAgICAgICAgICAgICAgIHthY3RpdmVDYW1wYWlnbk1vZGFsLnRhcmdldF9wcm9kdWN0cz8ubWFwKChwOiBhbnkpID0+IChcbiAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtwLmlkfSBjbGFzc05hbWU9XCJiZy1zbGF0ZS04MDAvNDAgYm9yZGVyIGJvcmRlci1zbGF0ZS03MDAvNTAgcm91bmRlZC0yeGwgcC0zIGZsZXggaXRlbXMtY2VudGVyIGdhcC00IGhvdmVyOmJnLXNsYXRlLTgwMC84MCB0cmFuc2l0aW9uLWNvbG9yc1wiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMjAgaC0yMCByb3VuZGVkLXhsIG92ZXJmbG93LWhpZGRlbiBiZy1zbGF0ZS05MDAgZmxleC1zaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgICAgICAgIHtwLmltYWdlX3VybCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtwLmltYWdlX3VybC5zdGFydHNXaXRoKCdodHRwJykgPyBwLmltYWdlX3VybCA6IGAke0JBQ0tFTkRfVVJMfSR7cC5pbWFnZV91cmx9YH0gY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY292ZXJcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1zbGF0ZS02MDAgZm9udC1ibGFjayB0ZXh0LTJ4bFwiPj88L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtd2hpdGUgdGV4dC1zbSBsaW5lLWNsYW1wLTIgbGVhZGluZy1zbnVnXCI+e3AubmFtZX08L2g0PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbXQtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtc2xhdGUtNDAwIGxpbmUtdGhyb3VnaFwiPiR7cC5wcmljZS50b0ZpeGVkKDIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1ibGFjayB0ZXh0LVsjZWM0ODk5XVwiPiR7KHAucHJpY2UgKiAoMSAtIGFjdGl2ZUNhbXBhaWduTW9kYWwuZGlzY291bnRfcGN0IC8gMTAwKSkudG9GaXhlZCgyKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgPGZvb3RlciBjbGFzc05hbWU9XCJiZy1bIzE0MWIyYl0gcHktMTYgcHgtOCBib3JkZXItdCBib3JkZXItc2xhdGUtODAwXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWF4LXctN3hsIG14LWF1dG8gZ3JpZCBncmlkLWNvbHMtMSBtZDpncmlkLWNvbHMtNCBnYXAtMTJcIj5cblxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS02XCI+XG4gICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwiZm9udC1oZWFkbGluZS1tZCB0ZXh0LTJ4bCBmb250LWJsYWNrIHRleHQtWyNmZmUxYTddIHRyYWNraW5nLXRpZ2h0XCI+XG4gICAgICAgICAgICAgIHtzaXRlU2V0dGluZ3M/LnNpdGVUaXRsZSB8fCAnRDRVJ31cbiAgICAgICAgICAgIDwvaDI+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtWyNkM2M1YWNdIGxlYWRpbmctcmVsYXhlZFwiPlxuICAgICAgICAgICAgICBUaGUgZnV0dXJlIG9mIGZhc3QtY2FzdWFsIGRpbmluZy4gUHJlbWl1bSBjdWxpbmFyeSBxdWFsaXR5IGZ1c2VkIHdpdGggc3RhdGUtb2YtdGhlLWFydCBQT1Mgb3JkZXJpbmcgbWVjaGFuaXNtcy5cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIHtzdG9yZXMuZmluZChzID0+IHMuaWQgPT09IHN0b3JlSWQpPy5hZGRyZXNzID8gKFxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtWyNkM2M1YWNdIGxlYWRpbmctcmVsYXhlZCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxNYXBQaW4gY2xhc3NOYW1lPVwidy00IGgtNCB0ZXh0LVsjZmJiZjI0XSBmbGV4LXNocmluay0wXCIgLz5cbiAgICAgICAgICAgICAgICB7c3RvcmVzLmZpbmQocyA9PiBzLmlkID09PSBzdG9yZUlkKT8uYWRkcmVzc31cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgKSA6IHNpdGVTZXR0aW5ncz8uYWRkcmVzcyAmJiAoXG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1bI2QzYzVhY10gbGVhZGluZy1yZWxheGVkIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgPE1hcFBpbiBjbGFzc05hbWU9XCJ3LTQgaC00IHRleHQtWyNmYmJmMjRdIGZsZXgtc2hyaW5rLTBcIiAvPlxuICAgICAgICAgICAgICAgIHtzaXRlU2V0dGluZ3MuYWRkcmVzc31cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtM1wiPlxuICAgICAgICAgICAgICA8YSBocmVmPXtzaXRlU2V0dGluZ3M/LmZhY2Vib29rVXJsIHx8ICcjJ30gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlclwiIGNsYXNzTmFtZT1cInctMTAgaC0xMCByb3VuZGVkLWZ1bGwgYmctWyMxOTFmMmZdLzgwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGhvdmVyOnRleHQtWyNmZmUxYTddIHRleHQtc2xhdGUtNDAwIHRyYW5zaXRpb24tY29sb3JzXCI+XG4gICAgICAgICAgICAgICAgPEdsb2JlIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPlxuICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgIDxhIGhyZWY9e3NpdGVTZXR0aW5ncz8uaW5zdGFncmFtVXJsIHx8ICcjJ30gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlclwiIGNsYXNzTmFtZT1cInctMTAgaC0xMCByb3VuZGVkLWZ1bGwgYmctWyMxOTFmMmZdLzgwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGhvdmVyOnRleHQtWyNmZmUxYTddIHRleHQtc2xhdGUtNDAwIHRyYW5zaXRpb24tY29sb3JzXCI+XG4gICAgICAgICAgICAgICAgPFNoYXJlMiBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cbiAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cImZvbnQtYm9sZCBtYi02IHRleHQtd2hpdGUgdGV4dC14cyB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0XCI+Q29udGFjdCBVczwvaDQ+XG4gICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwic3BhY2UteS00IHRleHQteHMgdGV4dC1bI2QzYzVhY11cIj5cbiAgICAgICAgICAgICAge3N0b3Jlcy5maW5kKHMgPT4gcy5pZCA9PT0gc3RvcmVJZCk/LnBob25lID8gKFxuICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPXtgdGVsOiR7c3RvcmVzLmZpbmQocyA9PiBzLmlkID09PSBzdG9yZUlkKT8ucGhvbmV9YH0gY2xhc3NOYW1lPVwiaG92ZXI6dGV4dC13aGl0ZVwiPkNhbGw6IHtzdG9yZXMuZmluZChzID0+IHMuaWQgPT09IHN0b3JlSWQpPy5waG9uZX08L2E+PC9saT5cbiAgICAgICAgICAgICAgKSA6IHNpdGVTZXR0aW5ncz8uY29udGFjdFBob25lICYmIChcbiAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj17YHRlbDoke3NpdGVTZXR0aW5ncy5jb250YWN0UGhvbmV9YH0gY2xhc3NOYW1lPVwiaG92ZXI6dGV4dC13aGl0ZVwiPkNhbGw6IHtzaXRlU2V0dGluZ3MuY29udGFjdFBob25lfTwvYT48L2xpPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICB7c2l0ZVNldHRpbmdzPy53aGF0c2FwcE51bWJlciAmJiAoXG4gICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9e2BodHRwczovL3dhLm1lLyR7c2l0ZVNldHRpbmdzLndoYXRzYXBwTnVtYmVyLnJlcGxhY2UoL1teMC05XS9nLCAnJyl9YH0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlclwiIGNsYXNzTmFtZT1cImhvdmVyOnRleHQtd2hpdGUgdGV4dC1bIzRlZGVhM11cIj5XaGF0c0FwcDoge3NpdGVTZXR0aW5ncy53aGF0c2FwcE51bWJlcn08L2E+PC9saT5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAge3NpdGVTZXR0aW5ncz8uY29udGFjdEVtYWlsICYmIChcbiAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj17YG1haWx0bzoke3NpdGVTZXR0aW5ncy5jb250YWN0RW1haWx9YH0gY2xhc3NOYW1lPVwiaG92ZXI6dGV4dC13aGl0ZVwiPkVtYWlsOiB7c2l0ZVNldHRpbmdzLmNvbnRhY3RFbWFpbH08L2E+PC9saT5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgeyFzaXRlU2V0dGluZ3M/LmNvbnRhY3RQaG9uZSAmJiAhc2l0ZVNldHRpbmdzPy53aGF0c2FwcE51bWJlciAmJiAhc2l0ZVNldHRpbmdzPy5jb250YWN0RW1haWwgJiYgKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9XCJob3Zlcjp0ZXh0LXdoaXRlXCI+T3VyIEdPVVJNRVQgTWVudTwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCIgY2xhc3NOYW1lPVwiaG92ZXI6dGV4dC13aGl0ZVwiPkJlc3Bva2UgTG9jYXRpb25zPC9hPjwvbGk+XG4gICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L3VsPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJmb250LWJvbGQgbWItNiB0ZXh0LXdoaXRlIHRleHQteHMgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdFwiPkNvbXBhbnk8L2g0PlxuICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cInNwYWNlLXktNCB0ZXh0LXhzIHRleHQtWyNkM2M1YWNdXCI+XG4gICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiIGNsYXNzTmFtZT1cImhvdmVyOnRleHQtd2hpdGVcIj5PdXIgQ3VsaW5hcnkgSm91cm5leTwvYT48L2xpPlxuICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9XCJob3Zlcjp0ZXh0LXdoaXRlXCI+Q29ycG9yYXRlIFN1c3RhaW5hYmlsaXR5PC9hPjwvbGk+XG4gICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiIGNsYXNzTmFtZT1cImhvdmVyOnRleHQtd2hpdGVcIj5LaXRjaGVuIENhcmVlcnM8L2E+PC9saT5cbiAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCIgY2xhc3NOYW1lPVwiaG92ZXI6dGV4dC13aGl0ZVwiPkludGVsbGVjdHVhbCBQcml2YWN5PC9hPjwvbGk+XG4gICAgICAgICAgICA8L3VsPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJmb250LWJvbGQgbWItNiB0ZXh0LXdoaXRlIHRleHQteHMgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdFwiPkpvaW4gdGhlIERhc2g8L2g0PlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LVsjZDNjNWFjXSBtYi00XCI+U3Vic2NyaWJlIGZvciBleGNsdXNpdmUgY2hlZiBzcGVjaWFscyBhbmQgcHJpb3JpdHkgcmVzZXJ2YXRpb25zLjwvcD5cblxuICAgICAgICAgICAge25ld3NMZXR0ZXJKb2luZWQgPyAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctZW1lcmFsZC01MDAvMTAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8yMCB0ZXh0LVsjNGVkZWEzXSB0ZXh0LVsxMHB4XSBmb250LWJvbGQgcC0zIHJvdW5kZWQteGwgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAg4pyTIFJlZ2lzdGVyZWQgc3VjY2Vzc2Z1bGx5IVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVOZXdzbGV0dGVySm9pbn0gY2xhc3NOYW1lPVwiZmxleCBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgdHlwZT1cImVtYWlsXCJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtlbWFpbFZhbHVlfVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFbWFpbFZhbHVlKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiRW50ZXIgZW1haWwgYWRkcmVzc1wiXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgYmctc2xhdGUtODAwIGJvcmRlci1ub25lIHJvdW5kZWQteGwgcHgtNCB0ZXh0LXhzIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLVsjZmZlMWE3XSB0ZXh0LXdoaXRlXCJcbiAgICAgICAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIiBjbGFzc05hbWU9XCJiZy1bI2ZiYmYyNF0gaG92ZXI6YmctYW1iZXItNDAwIHRleHQtc2xhdGUtOTUwIHB4LTQgcHktMi41IHJvdW5kZWQteGwgZm9udC1ib2xkIHRleHQteHMgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIHRyYW5zaXRpb24tY29sb3JzIGN1cnNvci1wb2ludGVyXCI+Sm9pbjwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtMTYgcHQtOCBib3JkZXItdCBib3JkZXItc2xhdGUtODAwIHRleHQtY2VudGVyIHRleHQteHMgdGV4dC1bI2QzYzVhY11cIj5cbiAgICAgICAgICDCqSAyMDI2IEQ0VSBSZXN0YXVyYW50IEdyb3VwLiBJbnNwaXJlZCBieSB0aGUgYm9sZC4gQnVpbHQgZm9yIHRoZSBnb3VybWV0LlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZm9vdGVyPlxuXG4gICAgPC9kaXY+XG4gICk7XG59XG4iXSwiZmlsZSI6Ikc6L1JFU1RBVVJBTlRfUE9TX1dJVEhfQkFDS0VORC9kNHUtd2Vic2l0ZS9zcmMvY29tcG9uZW50cy9MYW5kaW5nTW9kZS50c3gifQ==