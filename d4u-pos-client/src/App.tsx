import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client';
import { BACKEND_URL } from './config/backend';
import { calculateSubtotalWithTax } from './utils/cartTotals';
import { syncOfflineOrders as syncOfflineOrdersRequest, ApiRequestError, apiFetch } from './pos/api';
import * as cartEngine from './cart/cartEngine';
import type { CartLineItem } from './cart/cartTypes';
import { generateHeldOrderId } from './cart/heldOrderId';
import { customConfirm } from './utils/alerts';
import { validateDeliveryCustomerInfo, resolveCustomerMode } from './customer/customerEngine';
import { lookupCustomerByPhone, createCustomer, fetchCustomers } from './pos/api';
import { getDeviceId, storeTokens, refreshAccessToken } from './pos/session';
import { formatCurrency } from './utils/currency';
const socket = io(BACKEND_URL);
import { Home, Search, Printer, Trash2, Plus, Minus, Store, Clock, X, Settings, Moon, Banknote, PauseCircle, Globe, Truck, Users, MapPin, Phone, CheckCircle, Navigation, MessageCircle, ChefHat, Lock, Check, CreditCard, Landmark, User, Maximize, Receipt, LogOut, UtensilsCrossed, AlertTriangle } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db';
import KitchenDisplay from './StitchKDS'
import TVDisplay from './TVDisplay'
import AdminDashboard from './AdminDashboard'
import StaffManagement from './StaffManagement'
import TvBoard from './pages/TvBoard'
import { PrintBill, PrintKOT, PrintShiftCloseReceipt } from './PrintTemplates'
import KitchenView from './kds/components/KitchenView'
import type { Order, OrderStatus } from './kds/types'
import { AlertCircle } from 'lucide-react'

const KOTTimer = ({ kot }: { kot: any }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (kot.status !== 'PREPARING') {
      setTimeLeft('');
      return;
    }
    const updateTimer = () => {
      if (!kot.startTime) return;
      const start = new Date(kot.startTime).getTime();
      const target = start + kot.prepTimeMinutes * 60000;
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Time Up!');
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [kot]);

  if (kot.status === 'NEW') return <span style={{ color: 'var(--text-muted)' }}>Waiting...</span>;
  if (kot.status === 'READY') {
    return kot.isLate ? <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>LATE READY</span> : <span style={{ color: 'var(--accent-green)' }}>READY</span>;
  }
  return <span style={{ color: 'var(--accent-yellow)', fontWeight: 'bold' }}>{timeLeft}</span>;
};

const USERS: any[] = [];

function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState({ phone: false, password: false, invalid: false, msg: '' });
  const [loading, setLoading]   = useState(false);
  const [showTerminalLogin, setShowTerminalLogin] = useState(false);
  const [terminalPinInput, setTerminalPinInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneErr    = !phone.trim();
    const passwordErr = !password.trim();
    if (phoneErr || passwordErr) { setErrors({ phone: phoneErr, password: passwordErr, invalid: false, msg: '' }); return; }

    setLoading(true);
    try {
      const res = await fetch(BACKEND_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': getDeviceId() },
        body: JSON.stringify({ phone, pin: password })
      });
      const data = await res.json();

      if (res.ok && data.user) {
        if (data.access_token) {
          // Stores refresh_token too — see pos/session.ts's proactive silent
          // refresh, which keeps this session alive for a full shift instead
          // of silently expiring 1 hour after login.
          storeTokens(data.access_token, data.refresh_token);
        }
        onLogin({
          email: data.user.phone,
          password: password,
          name: data.user.name,
          role: data.user.role || 'Cashier',
          id: data.user.id,
          store_id: data.user.store_id
        });
      } else {
        setErrors({ phone: false, password: false, invalid: true, msg: data.message || 'Invalid credentials' });
      }
    } catch (e) {
      console.error(e);
      setErrors({ phone: false, password: false, invalid: true, msg: 'Server connection failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a0a00 0%, #3d1f00 40%, #1a0a00 100%)', fontFamily: "'Outfit', sans-serif", position: 'relative', overflow: 'hidden' }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,140,0,0.08)', top: '-100px', right: '-100px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,140,0,0.05)', bottom: '-80px', left: '-80px', pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px 36px', width: '340px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>

        {/* Logo */}
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(145deg, #f5a623, #e8820c)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', boxShadow: '0 8px 20px rgba(232,130,12,0.4)', border: '4px solid #fff3e0', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: '6px', border: '1.5px dashed rgba(255,255,255,0.6)', borderRadius: '50%' }} />
          <span style={{ fontSize: '2rem', fontWeight: '900', color: 'white', letterSpacing: '-1px', lineHeight: 1 }}>D4U</span>
          <span style={{ fontSize: '0.42rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.85)', letterSpacing: '2px', marginTop: '2px', textTransform: 'uppercase' }}>POS</span>
        </div>

        {/* Title */}
        <p style={{ fontSize: '0.72rem', fontWeight: '800', letterSpacing: '3px', color: '#555', marginBottom: '22px', textTransform: 'uppercase' }}>SIGN IN</p>

        {/* Invalid error */}
        {errors.invalid && (
          <div style={{ width: '100%', background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: '8px', padding: '9px 14px', fontSize: '0.8rem', color: '#cf1322', marginBottom: '14px', textAlign: 'center' }}>
            {errors.msg || 'Invalid phone or PIN'}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Phone */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Phone Number (e.g. 03000000001)"
              value={phone}
              onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: false, invalid: false })); }}
              style={{ width: '100%', padding: '12px 40px 12px 14px', border: `1px solid ${errors.phone ? '#ff4d4f' : '#ddd'}`, borderRadius: '8px', fontSize: '0.9rem', outline: 'none', color: '#333', boxSizing: 'border-box', background: errors.phone ? '#fff2f0' : 'white' }}
            />
            {errors.phone && (
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ff4d4f', fontSize: '1rem' }}>⚠</span>
            )}
          </div>

          {/* Password (PIN) */}
          <div style={{ position: 'relative' }}>
            <input
              type="password"
              placeholder="PIN"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: false, invalid: false })); }}
              style={{ width: '100%', padding: '12px 40px 12px 14px', border: `1px solid ${errors.password ? '#ff4d4f' : '#ddd'}`, borderRadius: '8px', fontSize: '0.9rem', outline: 'none', color: '#333', boxSizing: 'border-box', background: errors.password ? '#fff2f0' : 'white' }}
            />
            {errors.password && (
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ff4d4f', fontSize: '1rem' }}>⚠</span>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '13px', background: loading ? '#f5c97a' : 'linear-gradient(135deg, #f5a623, #e8820c)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '0.5px', boxShadow: '0 4px 14px rgba(232,130,12,0.35)', transition: 'all 0.2s', marginTop: '4px' }}
          >
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                Logging in...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Login
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowTerminalLogin(true)}
            style={{ width: '100%', padding: '12px', background: 'transparent', border: '1.5px solid #f5a623', borderRadius: '8px', color: '#f5a623', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', marginTop: '4px' }}
          >
            Waiter Terminal Login
          </button>
        </form>

        {/* Terminal Login Modal */}
        {showTerminalLogin && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '300px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <h3 style={{ margin: 0, color: '#333', fontSize: '1.2rem', textAlign: 'center' }}>Enter Terminal PIN</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.8rem', textAlign: 'center' }}>Issued by Cashier from Garage settings</p>
              <input 
                type="text" 
                autoFocus
                placeholder="PIN" 
                value={terminalPinInput} 
                onChange={e => setTerminalPinInput(e.target.value)} 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '4px', outline: 'none' }} 
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setShowTerminalLogin(false); setTerminalPinInput(''); }} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '8px', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button 
                  onClick={() => {
                    if (!terminalPinInput.trim()) return;
                    fetch(BACKEND_URL + '/terminal/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ pin: terminalPinInput.trim() })
                    }).then(res => res.json()).then(data => {
                      if (data.success) {
                        if (data.access_token) localStorage.setItem('d4u_pos_token', data.access_token);
                        onLogin({
                          email: terminalPinInput,
                          password: terminalPinInput,
                          name: data.waiter_name,
                          role: 'Waiter',
                          id: 0,
                          store_id: data.store_id
                        });
                      } else {
                        setErrors(p => ({ ...p, invalid: true, msg: 'Invalid Terminal PIN' }));
                        setShowTerminalLogin(false);
                      }
                    }).catch(() => {
                      setErrors(p => ({ ...p, invalid: true, msg: 'Connection failed' }));
                      setShowTerminalLogin(false);
                    });
                  }}
                  style={{ flex: 1, padding: '10px', background: '#f5a623', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                  Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demo hint */}
        <p style={{ marginTop: '18px', fontSize: '0.7rem', color: '#aaa', textAlign: 'center', lineHeight: '1.5' }}>
          Demo: <strong>03000000001</strong> / <strong>1234</strong><br/>
          Manager: <strong>03000000002</strong> / <strong>manager123</strong>
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function POSApp({ currentUser, dayStartTime, onLogout, onCashOut }: { currentUser: typeof USERS[0]; dayStartTime: Date | null; onLogout: () => void; onCashOut: () => void }) {
  const isWaiterMode = currentUser?.role === 'Waiter';

  const [activeMenu, setActiveMenu] = useState('Home');
  const [isWaiterConnected, setIsWaiterConnected] = useState(false);
  const inventoryItems = useLiveQuery(() => db.inventory.toArray()) || [];
  const lowStockItems = inventoryItems.filter(ing => ing.currentStock <= ing.warningThreshold);
  const [activeCategoryGroupId, setActiveCategoryGroupId] = useState<number | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<number | string | null>('ALL')
  const [categoryInitialized, setCategoryInitialized] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([])
  
  // WhatsApp Simulation State (for future real WhatsApp API integration)
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState<any>(null);

  // Removed: fake WhatsApp message simulation timer
  // Real WhatsApp integration requires WhatsApp Business API webhook

  const [orderType, setOrderType] = useState(isWaiterMode ? 'Dine In' : 'Dine In')
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [cart, setCart] = useState<CartLineItem[]>([])
  const [time, setTime] = useState(new Date())
  const [dayClosePin, setDayClosePin] = useState('')
  const [pendingLastDaySettlements, setPendingLastDaySettlements] = useState<any[]>([])
  // Recently-settled deliveries, kept visible instead of vanishing the
  // instant Settle Cash succeeds — so the cashier sees "Completed", not the
  // order silently disappearing. Bounded so this never grows unbounded over
  // a long shift; not persisted, matches activeDeliveries' own lifetime.
  const [completedDeliveries, setCompletedDeliveries] = useState<any[]>([])

  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [modalType, setModalType] = useState<'NONE' | 'CASH_OUT' | 'DAY_CLOSE' | 'HOLD_ORDERS' | 'SETTINGS' | 'PAYMENT' | 'MANAGER_AUTH' | 'KOT_PREVIEW' | 'ADD_CUSTOM_ITEM' | 'CASHIER_LOGIN' | 'DELIVERY_DETAILS' | 'DISCOUNT_AUTH' | 'SELECT_VARIANT' | 'ADD_ONS' | 'CUSTOMER_HISTORY'>('NONE');
  const [pendingVariantProduct, setPendingVariantProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'SIZES' | 'TOPPINGS'>('SIZES');
  // Accumulated Extra Toppings picks for the SELECT_VARIANT modal, keyed by
  // modifier group id -- committed into the cart line together with
  // whichever size the cashier picks (or on its own if the product has no
  // variants at all), rather than each topping becoming its own cart line.
  const [selectedModifiers, setSelectedModifiers] = useState<{ [groupId: number]: { modifierId: number; name: string; price: number }[] }>({});
  // Which size to commit to the cart when the cashier hits "Add to Cart"
  // from the Extra Toppings tab directly, without switching back to Choose
  // Size first. Defaults to the product's first variant if never touched.
  const [toppingsVariantId, setToppingsVariantId] = useState<number | null>(null);
  const [waiterPinModalOpen, setWaiterPinModalOpen] = useState(false);
  const [generatedWaiterPin, setGeneratedWaiterPin] = useState('');
  const [isGeneratingTabletLink, setIsGeneratingTabletLink] = useState(false);
  // Blocking validation errors (e.g. "no table selected") need the cashier/
  // waiter to actually notice and acknowledge them — a header toast is too
  // easy to miss, so these use a centered popup instead.
  const [alertModalMessage, setAlertModalMessage] = useState<string | null>(null);
  const [activeWaiters, setActiveWaiters] = useState<any[]>([]);
  const [terminalSessions, setTerminalSessions] = useState<any[]>([]);
  const [cashier, setCashier] = useState<{ name: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem('d4u_cashier') || 'null'); } catch { return null; }
  });
  const [cashierLoginName, setCashierLoginName] = useState('');
  // Held orders are persisted in Dexie (see db.ts `heldOrders` table) so they survive
  // a reload/crash instead of living only in React state.
  const heldOrders = useLiveQuery(() => db.heldOrders.toArray()) || [];
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error' | 'delivery', action?: { label: string; onClick: () => void }} | null>(null);
  const [kotSearchQuery, setKotSearchQuery] = useState('');
  const [kotStatusFilter, setKotStatusFilter] = useState('ALL');

  const [posSettings, setPosSettings] = useState(() => {
    const saved = localStorage.getItem('d4u_pos_settings');
    return saved ? JSON.parse(saved) : {
      printerName: 'Default Printer',
      billPrintQty: 1,
      kotPrintQty: 1,
      kotMode: 'SCREEN',
      tillLockEnabled: false,
      duplicateKOTEnabled: true,
      allowCustomItems: false,
      discountPassword: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('d4u_pos_settings', JSON.stringify(posSettings));
  }, [posSettings]);

  // Per-branch Tax % + Delivery settings (CmsSettings) -- was previously
  // hardcoded to 10% everywhere in this component with no per-branch
  // concept at all. Mirrors the same fetch the outer App() component
  // already makes for itself; POSApp doesn't receive that state as a prop.
  const [branchSettings, setBranchSettings] = useState<any>(null);
  const taxRate = (branchSettings?.tax_percentage ?? 0) / 100;
  useEffect(() => {
    if (!currentUser?.store_id) return;
    fetch(`${BACKEND_URL}/cms/settings?store_id=${currentUser.store_id}`)
      .then(res => res.json())
      .then(setBranchSettings)
      .catch(console.error);
  }, [currentUser?.store_id]);

  // The access token expires after 1 hour, but a POS terminal is meant to
  // stay logged in for a full shift — proactively refresh it well before
  // expiry so every API call in the app keeps working silently instead of
  // failing with "Invalid or expired authentication token" mid-shift.
  useEffect(() => {
    refreshAccessToken();
    const interval = setInterval(() => { refreshAccessToken(); }, 45 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (toast && toast.type !== 'error') {
      // Delivery-ready alerts stay for 30s; other notifications dismiss after 10s
      const duration = toast.type === 'delivery' ? 30000 : 10000;
      const timer = setTimeout(() => {
        setToast(null);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [cashGiven, setCashGiven] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Digital Link' | 'Split' | 'COD'>('Cash');

  // A Delivery order is paid on arrival, not at the counter -- no cash/card/
  // digital-link/split choice or tendered-amount entry makes sense yet, so
  // the only real "payment method" at this step is Cash on Delivery.
  // Non-delivery order types keep the existing in-person options untouched.
  useEffect(() => {
    if (modalType === 'PAYMENT' && orderType === 'Delivery') setPaymentMethod('COD');
    else if (modalType === 'PAYMENT' && paymentMethod === 'COD') setPaymentMethod('Cash');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalType, orderType]);
  const [splitCash, setSplitCash] = useState('');
  const [splitCard, setSplitCard] = useState('');
  const [isTillLocked, setIsTillLocked] = useState(true);
  const [printData, setPrintData] = useState<{ type: 'NONE' | 'BILL' | 'KOT' | 'SHIFT_CLOSE', data: any, printCount: number }>({ type: 'NONE', data: null, printCount: 1 });
  const [denomCounts, setDenomCounts] = useState<{ [key: number]: number }>({
    5000: 0, 1000: 0, 500: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0
  });
  const [handoverManagerName, setHandoverManagerName] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [pendingDuplicateKot, setPendingDuplicateKot] = useState<any>(null);
  
  // (Duplicates removed)
  const [isCashedOut, setIsCashedOut] = useState<boolean>(false);
  const [isTerminalLockedByUser, setIsTerminalLockedByUser] = useState<boolean>(false);
  const [terminalUnlockPin, setTerminalUnlockPin] = useState<string>('');
  const [waiterNameInput, setWaiterNameInput] = useState('');
  const [generatedTerminalPin, setGeneratedTerminalPin] = useState('');

  const [selectedChatId, setSelectedChatId] = useState(1)

  const [activeShift] = useState<'Shift 1' | 'Shift 2'>('Shift 1');
  const [shift1Sales, setShift1Sales] = useState(14500);
  const [shift2Sales, setShift2Sales] = useState(10000);

  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemCode, setCustomItemCode] = useState('');
  const [customItemCategory, setCustomItemCategory] = useState<number>(0);
  const [customItemImg, setCustomItemImg] = useState('');
  const [customItemImgFile, setCustomItemImgFile] = useState<File | null>(null);

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomItemImgFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomItemImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetCustomItemForm = () => {
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemCode('');
    setCustomItemCategory(0);
    setCustomItemImg('');
    setCustomItemImgFile(null);
  };

  const kots = useLiveQuery(() => db.kots.toArray()) || [];
  const filteredKots = kots
    .filter(k => {
      const query = kotSearchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        k.orderId.toString().includes(query) || 
        (k.customer && k.customer.toLowerCase().includes(query)) ||
        (k.items && k.items.toLowerCase().includes(query));
      
      const matchesStatus = kotStatusFilter === 'ALL' || k.status === kotStatusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => (b.id || 0) - (a.id || 0));

  const mappedOrders: Order[] = kots.map(kot => {
    let parsedItems: any[] = [];
    try {
      if (kot.items && kot.items.trim().startsWith('[')) {
        const arr = JSON.parse(kot.items);
        parsedItems = arr.map((item: any) => ({
          quantity: item.qty || 1,
          name: item.name || 'Unknown Item',
          modifiers: item.modifiers || []
        }));
      } else {
        const parts = (kot.items || '').split(',').map((p: string) => p.trim());
        parsedItems = parts.map((p: string) => {
          const match = p.match(/^(\d+)x\s+(.+)$/);
          if (match) return { quantity: parseInt(match[1]), name: match[2] };
          return { quantity: 1, name: p };
        });
      }
    } catch(e) {}

    let elapsed = 0;
    if (kot.status === 'PREPARING' && kot.startTime) {
      elapsed = Math.floor((time.getTime() - new Date(kot.startTime).getTime()) / 1000);
      if (elapsed < 0) elapsed = 0;
    }

    let status: OrderStatus = 'pending';
    if (kot.status === 'PREPARING') status = 'preparing';
    if (kot.status === 'READY') status = 'completed';

    const totalSecs = (kot.prepTimeMinutes || 10) * 60;
    const remaining = totalSecs - elapsed;
    
    return {
      id: kot.orderId.toString(),
      tableName: kot.type || 'Takeaway',
      items: parsedItems,
      instructions: kot.notes || '',
      status: status,
      timerTotalSeconds: totalSecs,
      timerElapsedSeconds: elapsed,
      isUrgent: remaining <= 120,
      createdAt: kot.timePlaced,
      completedAt: kot.status === 'READY' ? new Date().toISOString() : undefined,
    };
  });

  const [orderNotes, setOrderNotes] = useState('');

  const onlineOrdersList = useLiveQuery(
    () => db.kots.where('status').equals('PENDING').toArray()
  )?.filter(kot => kot.type === 'Online') || [];

  // Fetch online orders from backend (website orders)
  const [backendOnlineOrders, setBackendOnlineOrders] = useState<any[]>([]);

  // Waiter tablet orders, as seen by the cashier's "Waiter" panel -- real
  // Order rows (order_source === 'WAITER') from GET /pos-orders, not the
  // old dead TERMINAL_ORDER_RECEIVED socket relay + local-only Dexie table
  // that nothing populated anymore (a fake "Accept & Send to KDS" button
  // wrote a random fake order id, never the real one the waiter's order
  // actually got). The real KOT is already live in the kitchen the instant
  // the waiter sends it -- this panel is a read-only view of that same real
  // data, plus a real Settle action, not a second "send to kitchen" step.
  const [terminalPanelOrders, setTerminalPanelOrders] = useState<any[]>([]);
  const fetchTerminalPanelOrders = useCallback(() => {
    if (!currentUser?.store_id) return;
    apiFetch(`/pos-orders?store_id=${currentUser.store_id}`, { auth: true })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then((orders: any[]) => setTerminalPanelOrders((orders || []).filter(o => o.order_source === 'WAITER' && o.status !== 'SETTLED' && o.status !== 'VOIDED')))
      .catch(err => console.error('Failed to fetch waiter terminal orders', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.store_id]);

  // Fetch once a store is known (keeps the sidebar badge count right even
  // before the cashier opens the tab) and again whenever they switch to it.
  useEffect(() => { fetchTerminalPanelOrders(); }, [fetchTerminalPanelOrders]);
  useEffect(() => { if (activeMenu === 'Terminal') fetchTerminalPanelOrders(); }, [activeMenu, fetchTerminalPanelOrders]);

  // Settles a READY waiter order directly via the real settle endpoint --
  // NOT by reloading it into the cart and running it through the normal Pay
  // flow, which would create a second, duplicate order (this order already
  // exists in the backend; the waiter created it when they sent it).
  const handleSettleWaiterOrder = async (order: any, method: 'CASH' | 'CARD') => {
    try {
      const res = await apiFetch(`/pos-orders/${order.id}/settle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method: method, amount_received: order.total_amount }),
        auth: true,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setToast({ message: data.message || `Failed to settle Order #${order.id}.`, type: 'error' });
        return;
      }
      if (posSettings.billPrintQty > 0) {
        setPrintData({
          type: 'BILL',
          data: {
            orderType: `Dine In (${order.table_no})`,
            cart: (order.items || []).map((i: any) => ({ name: i.product?.name || `Item #${i.product_id}`, qty: i.quantity, price: i.price })),
            subTotal: order.total_amount - (order.tax_amount || 0),
            tax: order.tax_amount || 0,
            taxPercent: branchSettings?.tax_percentage ?? 0,
            grandTotal: order.total_amount,
            cashGiven: order.total_amount,
            returnAmount: 0,
            paymentMethod: method,
            time: new Date().toLocaleString(),
          },
          printCount: posSettings.billPrintQty,
        });
      }
      setToast({ message: `Order #${order.id} settled!`, type: 'success' });
      fetchTerminalPanelOrders();
    } catch (e) {
      setToast({ message: `Network error — could not settle Order #${order.id}.`, type: 'error' });
    }
  };

  // Offline Sync Engine
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  useEffect(() => {
    const BASE_INTERVAL_MS = 30000;
    const MAX_INTERVAL_MS = 5 * 60000;
    let consecutiveFailures = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay = Math.min(BASE_INTERVAL_MS * Math.pow(2, consecutiveFailures), MAX_INTERVAL_MS);
      timeoutId = setTimeout(syncOfflineOrders, delay);
    };

    const syncOfflineOrders = async () => {
      if (!navigator.onLine) {
        scheduleNext();
        return;
      }
      try {
        const unsynced = await db.kots.where('synced').equals('false').toArray();
        const unsyncedReal = unsynced.length === 0 ? await db.kots.filter(k => k.synced === false).toArray() : unsynced; // Dexie query fallback
        setPendingSyncCount(unsyncedReal.length);

        if (unsyncedReal.length === 0) {
          consecutiveFailures = 0;
          setSyncStatus('idle');
          scheduleNext();
          return;
        }

        setSyncStatus('syncing');
        await syncOfflineOrdersRequest(unsyncedReal);
        const syncedIds = unsyncedReal.map(o => o.id!);
        await db.kots.where('id').anyOf(syncedIds).modify({ synced: true });
        console.log(`[Offline Sync] Successfully synced ${syncedIds.length} orders.`);
        consecutiveFailures = 0;
        setSyncStatus('idle');
        setPendingSyncCount(0);
      } catch (e) {
        consecutiveFailures = Math.min(consecutiveFailures + 1, 5);
        setSyncStatus('error');
        const message = e instanceof ApiRequestError ? e.message : String(e);
        console.error(`[Offline Sync] Sync failed (attempt ${consecutiveFailures}):`, message);
      }
      scheduleNext();
    };

    // Initial sync check
    timeoutId = setTimeout(syncOfflineOrders, 5000);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    // Initial fetch
    const fetchInitialData = async () => {
      try {
        const storeId = currentUser?.store_id;
        // currentUser never carries a `.token` field — the real access token
        // lives in localStorage (set at login, see LoginScreen/session.ts).
        // Using currentUser?.token here always sent "Bearer undefined",
        // making this fetch 401 silently on every page refresh — the online
        // order was only ever visible via the live socket event, never
        // reloaded from the backend afterwards.
        const res = await apiFetch(`/online-orders?store_id=${storeId}`, { auth: true });
        if (res.ok) setBackendOnlineOrders(await res.json());

        // Recover Active Deliveries after a browser refresh. activeDeliveries
        // is plain React state — it starts empty on every mount and, before
        // this, was never rebuilt from anything, so an accepted online order
        // visually vanished on refresh even though its Order/KOT rows were
        // already durable in the backend. activeOnly=true reuses the same
        // /online-orders endpoint the Incoming panel already calls (see
        // OnlineOrdersService.getAllOnlineOrders) rather than adding a new
        // route — it returns everything the cashier has accepted but that
        // hasn't reached SETTLED yet.
        const activeRes = await apiFetch(`/online-orders?store_id=${storeId}&activeOnly=true`, { auth: true });
        if (activeRes.ok) {
          const activeOrders: any[] = await activeRes.json();
          if (activeOrders.length > 0) {
            const products = await db.products.toArray();
            const parseOrderItems = (order: any) => {
              try {
                if (order.items && order.items.trim().startsWith('[')) {
                  const arr = JSON.parse(order.items);
                  return arr.map((i: any) => {
                    const product = products.find(p => p.name.toLowerCase() === (i.name || '').toLowerCase());
                    return { id: Date.now() + Math.random(), name: i.name, price: product ? product.price : (i.price || 0), qty: i.qty || i.quantity || 1, img: '', desc: 'Online Order Item' };
                  });
                }
              } catch (e) { /* fall through to comma-separated parsing */ }
              return (order.items || '').split(',').map((part: string) => {
                const m = part.trim().match(/^(\d+)x\s+(.+)$/);
                let name = part.trim(); let qty = 1;
                if (m) { qty = parseInt(m[1]); name = m[2].trim(); }
                const product = products.find(p => p.name.toLowerCase() === name.toLowerCase());
                return { id: Date.now() + Math.random(), name, price: product ? product.price : 0, qty, img: '', desc: 'Online Order Item' };
              }).filter((i: any) => i.name);
            };

            const hydrated = activeOrders.map(order => {
              const amount = parseFloat(order.totalAmount) || 0;
              return {
                id: order.orderId || order.id,
                bridgeOrderId: order.id,
                customer: order.customer || 'Online Guest',
                address: order.customerAddress || 'No Address Provided',
                customerAddress: order.customerAddress || 'No Address Provided',
                // Matches the label handleAcceptOnlineOrder shows for a
                // freshly-accepted order — so a card looks identical whether
                // it was just created this session or recovered on reload.
                status: order.status === 'CONFIRMED' ? 'PENDING_CHEF' : order.status,
                rider: order.status === 'CONFIRMED' ? 'Pending Chef Acceptance' : 'Active Rider',
                cod: amount,
                totalAmount: amount,
                riderDistance: 'N/A',
                lat: '50%',
                lng: '50%',
                items: parseOrderItems(order),
              };
            });

            setActiveDeliveries(prev => {
              const existingIds = new Set(prev.map(d => d.bridgeOrderId));
              const toAdd = hydrated.filter(d => !existingIds.has(d.bridgeOrderId));
              return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
            });
          }
        }

        const riderRes = await apiFetch(`/rider-orders?store_id=${storeId}`, { auth: true });
        if (riderRes.ok) {
          const riderOrders: any[] = await riderRes.json();
          setActiveDeliveries(prev => {
            let changed = false;
            const existingIds = new Set(prev.map(d => d.bridgeOrderId));
            const newCards: any[] = [];

            const updated = prev.map(d => {
              const ro = riderOrders.find(o => o.id === d.bridgeOrderId);
              if (ro && d.status !== 'SETTLED') {
                let newStatus = d.status;
                if (ro.status === 'RIDER_ACCEPTED' && d.status !== 'ON_WAY') newStatus = 'ON_WAY';
                if (ro.status === 'PICKED_UP' && d.status !== 'ON_WAY') newStatus = 'ON_WAY';
                if (ro.status === 'DELIVERED' && d.status !== 'DELIVERED') newStatus = 'DELIVERED';
                if (newStatus !== d.status) { changed = true; return { ...d, status: newStatus, rider: 'Active Rider' }; }
              }
              return d;
            });

            for (const ro of riderOrders) {
              if (!existingIds.has(ro.id) && ro.status !== 'SETTLED' && ro.status !== 'NEW' && ro.status !== 'PREPARING') {
                changed = true;
                let parsedItems: any[] = [];
                try {
                  parsedItems = (ro.items || '').split(',').map((part: string) => {
                    const m = part.trim().match(/^(\d+)x\s+(.+)$/);
                    if (m) return { id: Date.now() + Math.random(), name: m[2].trim(), price: 0, qty: parseInt(m[1]), img: '', desc: 'Delivery Item' };
                    return { id: Date.now() + Math.random(), name: part.trim(), price: 0, qty: 1, img: '', desc: 'Delivery Item' };
                  }).filter((i: any) => i.name);
                } catch (e) {}

                let newStatus = ro.status;
                if (ro.status === 'RIDER_ACCEPTED' || ro.status === 'PICKED_UP') newStatus = 'ON_WAY';
                
                newCards.push({
                  id: ro.orderId || ro.id,
                  bridgeOrderId: ro.id,
                  customer: ro.customer || 'Guest',
                  address: ro.customerAddress || 'No Address Provided',
                  customerAddress: ro.customerAddress || 'No Address Provided',
                  status: newStatus,
                  rider: ro.claimedByRiderName ? `Rider: ${ro.claimedByRiderName}` : 'Waiting for Rider',
                  cod: parseFloat(ro.totalAmount) || 0,
                  totalAmount: parseFloat(ro.totalAmount) || 0,
                  riderDistance: 'N/A',
                  lat: ro.delivery?.lat ? ro.delivery.lat + '%' : '50%',
                  lng: ro.delivery?.lng ? ro.delivery.lng + '%' : '50%',
                  items: parsedItems,
                  // POS-native delivery order (created directly at the POS, not
                  // via the website) — its bridgeOrderId is a real pos-orders
                  // Order id, not an OnlineOrder id, so status-progression
                  // actions below must PATCH /pos-orders/:id/status instead of
                  // /online-orders/:id. formatPosOrderForRider (backend) sets
                  // isPos: true precisely so this can be told apart here.
                  isPos: !!ro.isPos,
                });
              }
            }

            return changed ? [...updated, ...newCards] : prev;
          });
        }
      } catch { /* backend offline */ }
    };
    fetchInitialData();

    const handleNewOrder = (order: any) => {
      setBackendOnlineOrders(prev => {
        if (!prev.find(o => o.id === order.id)) {
          setToast({ message: `New Order Received: #${order.id}`, type: 'success' });
          // Optional: play a notification sound here
          return [...prev, order];
        }
        return prev;
      });
    };

    const handleOrderUpdated = (order: any) => {
      setBackendOnlineOrders(prev => {
        const idx = prev.findIndex(o => o.id === order.id);
        if (idx > -1) {
          const arr = [...prev];
          arr[idx] = order;
          return arr;
        }
        return prev;
      });

      // KITCHEN_PREPARING/READY: the only reliable, device-independent signal
      // that a delivery card should leave PENDING_CHEF — broadcast directly by
      // KotsService.updateKotStatus the instant a KOT for this order changes
      // in the kitchen, regardless of whether any KDS/TV Board tab is open
      // anywhere. Without this, the card only ever advanced via a local
      // Dexie (db.kots) watcher that depends on KDS happening to be open in a
      // tab on this same browser — never true when the kitchen display is a
      // separate device, which is the normal deployment.
      if (['KITCHEN_PREPARING', 'READY', 'RIDER_ARRIVED', 'PRINT_BILL', 'DISPATCHED', 'RIDER_ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PAID', 'WAITING_CASH_SETTLEMENT', 'SETTLED'].includes(order.status)) {
        setActiveDeliveries(prev => {
          const updated = [...prev];
          const existIdx = updated.findIndex(d => d.bridgeOrderId === order.id);
          if (existIdx > -1) {
            let newStatus = order.status;
            if (order.status === 'KITCHEN_PREPARING') newStatus = 'PREPARING';
            // PICKED_UP means the Rider confirmed food pickup from restaurant — OUT_FOR_DELIVERY
            // is the backend equivalent. Both map to OUT_FOR_DELIVERY since the card UI
            // checks del.status === 'OUT_FOR_DELIVERY' for the 'on-way' visual class.
            if (order.status === 'PICKED_UP') newStatus = 'OUT_FOR_DELIVERY';
            if (order.status === 'DELIVERED' || order.status === 'PAID') newStatus = 'DELIVERED';
            // RIDER_ACCEPTED, RIDER_ARRIVED, WAITING_CASH_SETTLEMENT pass through as-is —
            // the card UI reads these raw strings for action buttons and display text.
            const riderLabel = order.claimedByRiderName ? `Rider: ${order.claimedByRiderName}` : (newStatus === 'PREPARING' ? 'Chef Preparing' : 'Active Rider');
            if (newStatus !== updated[existIdx].status || riderLabel !== updated[existIdx].rider) {
              if (updated[existIdx].status !== 'READY' && newStatus === 'READY') {
                setToast({ message: `🚀 DELIVERY READY — Order #${updated[existIdx].id || updated[existIdx].bridgeOrderId} is ready for rider pickup.`, type: 'delivery', action: { label: 'Open Delivery', onClick: () => setActiveMenu('Delivery') } });
              }
              updated[existIdx] = { ...updated[existIdx], status: newStatus, rider: riderLabel };
            }
          } else if ((order.type?.toUpperCase() === 'DELIVERY' || order.type?.toUpperCase() === 'ONLINE') && order.status !== 'SETTLED' && order.status !== 'CANCELLED') {
            let parsedItems: any[] = [];
            try {
              if (typeof order.items === 'string' && order.items.trim().startsWith('[')) {
                parsedItems = JSON.parse(order.items).map((i: any) => ({
                  id: Date.now() + Math.random(), name: i.name, price: i.price || 0, qty: i.qty || i.quantity || 1, img: '', desc: 'Delivery Item'
                }));
              } else {
                parsedItems = (order.items || '').split(',').map((part: string) => {
                  const m = part.trim().match(/^(\d+)x\s+(.+)$/);
                  let name = part.trim(); let qty = 1;
                  if (m) { qty = parseInt(m[1]); name = m[2].trim(); }
                  return { id: Date.now() + Math.random(), name, price: 0, qty, img: '', desc: 'Delivery Item' };
                }).filter((i: any) => i.name);
              }
            } catch (e) {}

            let newStatus = order.status;
            if (order.status === 'KITCHEN_PREPARING') newStatus = 'PREPARING';
            if (order.status === 'PICKED_UP') newStatus = 'OUT_FOR_DELIVERY';
            if (order.status === 'DELIVERED' || order.status === 'PAID') newStatus = 'DELIVERED';
            const riderLabel = order.claimedByRiderName ? `Rider: ${order.claimedByRiderName}` : (newStatus === 'PREPARING' ? 'Chef Preparing' : 'Waiting for Rider');
            const amount = parseFloat(order.totalAmount) || 0;
            
            const newCard = {
              id: order.orderId || order.id,
              bridgeOrderId: order.id,
              customer: order.customer || 'Guest',
              address: order.customerAddress || 'No Address Provided',
              customerAddress: order.customerAddress || 'No Address Provided',
              status: newStatus,
              rider: riderLabel,
              cod: amount,
              totalAmount: amount,
              riderDistance: 'N/A',
              lat: order.delivery?.lat ? order.delivery.lat + '%' : '50%',
              lng: order.delivery?.lng ? order.delivery.lng + '%' : '50%',
              items: parsedItems,
              // See the isPos comment on the /rider-orders reconciliation
              // block above — same reason, same flag, same source field.
              isPos: !!order.isPos,
            };
            updated.push(newCard);
            
            if (newStatus === 'READY') {
              setToast({ message: `🚀 DELIVERY READY — Order #${newCard.id} is ready for rider pickup.`, type: 'delivery', action: { label: 'Open Delivery', onClick: () => setActiveMenu('Delivery') } });
            }
          }
          return updated;
        });
        
        // Also update pendingLastDaySettlements if it matches an old order being settled
        if (order.status === 'SETTLED') {
          setPendingLastDaySettlements(prev => prev.filter(d => d.bridgeOrderId !== order.id));
          // Covers the case where a DIFFERENT terminal pressed Settle Cash —
          // that terminal's own click handler already moved its card to
          // completedDeliveries; this terminal only heard about it via the
          // socket broadcast, so it must do the same move here to stay in
          // sync (same "land on Completed instead of vanishing" fix).
          setActiveDeliveries(prev => {
            const settledCard = prev.find(d => d.bridgeOrderId === order.id);
            if (!settledCard) return prev;
            setCompletedDeliveries(cPrev => [{ ...settledCard, status: 'SETTLED' }, ...cPrev].slice(0, 20));
            return prev.filter(d => d.bridgeOrderId !== order.id);
          });
        }
      }
    };

      const handleNegativeInventoryAlert = (data: any) => {
        // Only show to Manager or Admin
        if (currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN') {
          setToast({
            message: `URGENT: ${data.name} is out of stock (Balance: ${data.balance}). Please update inventory!`,
            type: 'error' // Displayed as red alert
          });
        }
      };

      // Real order data changing (new order placed, settled, or voided) --
      // refetches the Waiter panel's list rather than trying to patch state
      // from each event's own (minimal) payload shape.
      const handleTerminalPanelRefresh = () => fetchTerminalPanelOrders();

      const joinStore = () => {
        socket.emit('join_store', { store_id: currentUser?.store_id });
      };

      if (socket.connected) {
        joinStore();
      }

      socket.on('connect', joinStore);
      socket.on('new_order', handleNewOrder);
      socket.on('order_updated', handleOrderUpdated);
      socket.on('negative_inventory_alert', handleNegativeInventoryAlert);
      socket.on('new_kot', handleTerminalPanelRefresh);
      socket.on('order_settled', handleTerminalPanelRefresh);
      socket.on('order_voided', handleTerminalPanelRefresh);
      socket.on('waiter_connected', () => setIsWaiterConnected(true));
      socket.on('waiter_disconnected', () => setIsWaiterConnected(false));
      socket.on('update_active_waiters', (waiters: any[]) => {
        setActiveWaiters(waiters);
      });
      socket.on('marketing_update', () => {
        if (currentUser?.store_id) {
          // MARKETING-003 §1/§2: routed through the shared CampaignResolverService (channel=pos).
          // GET /marketing/campaign?channel= requires crm.view (staff-only,
          // unlike the public /marketing/campaign/visible the website uses)
          // -- this was a bare unauthenticated fetch(), which always 401'd.
          // With no `res.ok` guard here, setActiveCampaigns got called with
          // the 401 error body itself (an object, not an array), silently
          // corrupting activeCampaigns for every consumer (discount badges,
          // BOGO cards, the Discounted filter, the stacking-block check)
          // the instant any campaign changed anywhere in the system.
          apiFetch(`/marketing/campaign?store_id=${currentUser.store_id}&channel=pos`, { auth: true })
            .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
            .then(setActiveCampaigns)
            .catch(console.error);
        }
      });
      
      return () => {
        socket.off('connect', joinStore);
        socket.off('new_order', handleNewOrder);
        socket.off('order_updated', handleOrderUpdated);
        socket.off('negative_inventory_alert', handleNegativeInventoryAlert);
        socket.off('new_kot', handleTerminalPanelRefresh);
        socket.off('order_settled', handleTerminalPanelRefresh);
        socket.off('order_voided', handleTerminalPanelRefresh);
        socket.off('waiter_connected');
        socket.off('waiter_disconnected');
        socket.off('marketing_update');
      };
    }, [currentUser]);

  // ---------------------------------------------------------------
  // WAITER MODE: own-orders tracking, heartbeat, real-time status toasts
  // ---------------------------------------------------------------
  const [waiterTab, setWaiterTab] = useState<'MENU' | 'ORDERS'>('MENU');
  const [waiterOrders, setWaiterOrders] = useState<any[]>([]);
  const knownWaiterOrderIds = useRef<Set<number>>(new Set());

  // The "My Orders" overlay must cover only the content area below the
  // header, not the header itself — measured dynamically (rather than
  // hardcoded) since the header's height varies (toast banner, low-stock
  // alert, wrapping, etc.).
  const mainRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [waiterOverlayTop, setWaiterOverlayTop] = useState(0);
  useEffect(() => {
    if (!isWaiterMode) return;
    const measure = () => {
      if (headerRef.current && mainRef.current) {
        setWaiterOverlayTop(headerRef.current.getBoundingClientRect().bottom - mainRef.current.getBoundingClientRect().top);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (headerRef.current) observer.observe(headerRef.current);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [isWaiterMode, toast]);

  const fetchWaiterOrders = async () => {
    if (!isWaiterMode || !currentUser?.sessionId) return;
    try {
      const res = await apiFetch(`/pos-orders?store_id=${currentUser.store_id}&terminal_session_id=${currentUser.sessionId}`, { auth: true });
      if (!res.ok) return;
      const orders = await res.json();
      // "Order accepted by cashier" — a small toast the first time an order this
      // waiter sent shows up as persisted (skipped on the very first load, so
      // reopening the app doesn't fire a toast burst for every existing order).
      const isFirstLoad = knownWaiterOrderIds.current.size === 0;
      for (const o of orders) {
        if (!knownWaiterOrderIds.current.has(o.id)) {
          knownWaiterOrderIds.current.add(o.id);
          if (!isFirstLoad) {
            setToast({ message: `Table ${o.table_no || ''}: Order accepted by cashier.`, type: 'success' });
          }
        }
      }
      setWaiterOrders(orders);
    } catch (e) { /* offline — keep showing last known list */ }
  };

  useEffect(() => {
    if (!isWaiterMode || !currentUser?.sessionId) return;
    fetchWaiterOrders();
    const interval = setInterval(fetchWaiterOrders, 15000);
    const heartbeat = setInterval(() => {
      socket.emit('waiter_heartbeat', { session_id: currentUser.sessionId });
    }, 25000);
    return () => { clearInterval(interval); clearInterval(heartbeat); };
  }, [isWaiterMode, currentUser?.sessionId]);

  useEffect(() => {
    if (!isWaiterMode) return;
    const handleKdsUpdate = (data: { kot_id: number; order_id: number; status: string; store_id: number }) => {
      if (data.store_id !== currentUser?.store_id) return;
      const mine = waiterOrders.find(o => o.id === data.order_id);
      if (!mine) return;
      if (data.status === 'PREPARING') setToast({ message: `Table ${mine.table_no || ''}: Kitchen started preparing your order.`, type: 'success' });
      if (data.status === 'READY') setToast({ message: `Table ${mine.table_no || ''}: Order is ready!`, type: 'success' });
      fetchWaiterOrders();
    };
    socket.on('kds_update', handleKdsUpdate);
    return () => { socket.off('kds_update', handleKdsUpdate); };
  }, [isWaiterMode, waiterOrders, currentUser?.store_id]);

  // ---------------------------------------------------------------
  // CASHIER: persistent "Connected Waiters" list (backed by TerminalSession,
  // not just in-memory socket state — survives a POS refresh).
  // ---------------------------------------------------------------
  const fetchTerminalSessions = async () => {
    if (isWaiterMode || !currentUser?.store_id) return;
    try {
      const res = await apiFetch(`/terminal/sessions?store_id=${currentUser.store_id}`, { auth: true });
      if (res.ok) setTerminalSessions(await res.json());
    } catch (e) { /* ignore — list just won't refresh this tick */ }
  };

  useEffect(() => {
    if (isWaiterMode) return;
    fetchTerminalSessions();
    const interval = setInterval(fetchTerminalSessions, 15000);
    socket.on('waiter_sessions_updated', fetchTerminalSessions);
    return () => { clearInterval(interval); socket.off('waiter_sessions_updated', fetchTerminalSessions); };
  }, [isWaiterMode, currentUser?.store_id]);

  const handleDisconnectSession = async (id: number) => {
    await apiFetch(`/terminal/sessions/${id}/disconnect`, { method: 'POST', auth: true });
    fetchTerminalSessions();
  };

  const handleDisconnectAllSessions = async () => {
    if (!(await customConfirm('Disconnect all connected waiter tablets?'))) return;
    await apiFetch(`/terminal/sessions/disconnect-all?store_id=${currentUser.store_id}`, { method: 'POST', auth: true });
    fetchTerminalSessions();
  };

  const handleReconnectSession = async (id: number) => {
    await apiFetch(`/terminal/sessions/${id}/reconnect`, { method: 'POST', auth: true });
    fetchTerminalSessions();
  };

  const allOnlineOrders = [...onlineOrdersList, ...backendOnlineOrders];

  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const activeDeliveriesRef = useRef<any[]>([]);
  useEffect(() => { activeDeliveriesRef.current = activeDeliveries; }, [activeDeliveries]);

  // Repeating "settle cash with rider" reminder for the cashier — fires once
  // immediately, then every 3 minutes for as long as any delivery sits at
  // WAITING_CASH_SETTLEMENT, reusing the same toast styling/action already
  // used for the "DELIVERY READY" alerts below. Reads activeDeliveriesRef
  // (not activeDeliveries directly) so the interval is set up once instead
  // of restarting on every delivery-list update.
  useEffect(() => {
    const remindPendingSettlements = () => {
      const pending = activeDeliveriesRef.current.filter(d => d.status === 'WAITING_CASH_SETTLEMENT');
      if (pending.length === 0) return;
      const total = pending.reduce((sum, d) => sum + (Number(d.totalAmount || d.cod) || 0), 0);
      const orderList = pending.map(d => `#${d.id}`).join(', ');
      setToast({
        message: `💵 Settle Rs. ${total.toFixed(2)} in cash with Rider — Order ${orderList}`,
        type: 'delivery',
        action: { label: 'Open Delivery', onClick: () => setActiveMenu('Delivery') },
      });
    };

    remindPendingSettlements();
    const interval = setInterval(remindPendingSettlements, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const categoryGroups = useLiveQuery(() => db.category_groups?.toArray()) || []
  const categories = useLiveQuery(() => db.categories.toArray()) || []
  const allProducts = useLiveQuery(() => db.products.toArray()) || []
  const products = useLiveQuery(() =>
    typeof activeCategoryId === 'number'
      ? db.products.where('category_id').equals(activeCategoryId).toArray()
      : db.products.toArray(),
    [activeCategoryId]
  ) || []

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const storeId = currentUser?.store_id;
        const res = await fetch(`${BACKEND_URL}/catalog/category-groups/hierarchy/store/${storeId}?channel=pos`);
        if (res.ok) {
          const data = await res.json();
          // Run clear + repopulate as one Dexie transaction: if bulkPut throws partway
          // through, the clear is rolled back too, so a failed sync can never leave the
          // offline catalog empty.
          await db.transaction('rw', db.category_groups, db.categories, db.products, async () => {
            await db.category_groups.clear();
            await db.categories.clear();
            await db.products.clear();

            if (data.category_groups && data.category_groups.length > 0) {
              await db.category_groups.bulkPut(data.category_groups.map((cg: any) => ({
                id: cg.id,
                name: cg.name,
                sort_order: cg.sort_order || 0,
                icon: cg.icon,
                color: cg.color,
                is_active: cg.is_active
              })));
            }

            const allCategories = [
              ...(data.category_groups || []).flatMap((g: any) => g.categories.map((c: any) => ({ ...c, category_group_id: g.id }))),
              ...(data.categories || [])
            ];

            if (allCategories.length > 0) {
              await db.categories.bulkPut(allCategories.map((c: any) => ({
                id: c.id,
                store_id: storeId,
                name: c.name,
                category_group_id: c.category_group_id || null
              })));
            }

            const allProducts = allCategories.flatMap((c: any) => (c.products || []).map((p: any) => ({ ...p, parent_category_id: c.id })));
            const uniqueProductsMap = new Map(allProducts.map((p: any) => [p.id, p]));
            const uniqueProducts = Array.from(uniqueProductsMap.values());

            if (uniqueProducts.length > 0) {
              await db.products.bulkPut(uniqueProducts.map((p: any) => ({
                id: p.id,
                category_id: p.parent_category_id,
                name: p.name,
                price: p.price,
                desc: p.sku || 'No description',
                // Almost none of this store's 145 products have a real
                // uploaded image_url. This used to fall back to an external
                // Unsplash URL -- fine for a handful of cards (one category,
                // ~5 items), but "All Items" renders the SAME external image
                // 140+ times at once, which the browser throttles/queues per
                // host, so most cards stayed blank until they trickled in (if
                // ever, on a slow/restricted network). No network dependency
                // now -- the card itself renders a local placeholder icon
                // when img is empty (see product-img-wrapper below).
                img: p.image_url || '',
                variants: p.variants,
                // Flattened from the raw ProductModifierGroup join rows into
                // {id, name, is_required, min_selection, max_selection,
                // modifiers} so the Extra Toppings tab doesn't need to know
                // about the join-table shape.
                modifierGroups: (p.modifierGroups || []).map((mg: any) => ({
                  id: mg.modifierGroup?.id,
                  name: mg.modifierGroup?.name,
                  is_required: mg.modifierGroup?.is_required,
                  min_selection: mg.modifierGroup?.min_selection,
                  max_selection: mg.modifierGroup?.max_selection,
                  modifiers: mg.modifierGroup?.modifiers || [],
                })),
                categories: p.categories,
                isApproved: p.status === 'APPROVED'
              })));
            }
          });
        }

        // MARKETING-003 §1/§2: routed through the shared CampaignResolverService (channel=pos).
        // Same missing-auth bug as the marketing_update socket handler above
        // -- this endpoint requires crm.view, so the unauthenticated call
        // always 401'd and `campRes.ok` was always false, meaning
        // activeCampaigns silently stayed at its initial [] forever: no
        // discount badge, no BOGO card, no Discounted-filter match, no
        // stacking block, ever, on POS, from the very first load.
        const campRes = await apiFetch(`/marketing/campaign?store_id=${storeId}&channel=pos`, { auth: true });
        if (campRes.ok) setActiveCampaigns(await campRes.json());

      } catch (err) {
        console.error('Failed to sync catalog:', err);
      }
    };
    fetchCatalog();
  }, [currentUser]);

  useEffect(() => {
    if (categories.length > 0 && !categoryInitialized) {
      setActiveCategoryId(categories[0].id)
      setCategoryInitialized(true)
    }
  }, [categories, categoryInitialized])

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (printData.type !== 'NONE') {
      setTimeout(() => {
        window.print();
        if (printData.type === 'BILL' && posSettings.tillLockEnabled) {
          setIsTillLocked(false);
          setToast({ message: 'Drawer Opened! Please Lock Till after transaction.', type: 'info' });
        }

        if (printData.type === 'KOT') {
          setModalType('KOT_PREVIEW');
        } else {
          setPrintData({ type: 'NONE', data: null, printCount: 1 });
        }
      }, 500);
    }
  }, [printData]);

  const prevKotsRef = useRef<any[]>([]);
  useEffect(() => {
    if (kots.length > 0 && prevKotsRef.current.length > 0) {
      const newlyReady = kots.filter(k => k.status === 'READY' && prevKotsRef.current.find(p => p.id === k.id)?.status !== 'READY');
      if (newlyReady.length > 0) {
        newlyReady.forEach(async kot => {
          if (kot.type === 'Delivery') {
            let bridgeOk = true;
            if (kot.bridgeOrderId) {
              try {
                const res = await apiFetch(`/online-orders/${kot.bridgeOrderId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'READY', kdsStatus: 'READY' }),
                  auth: true,
                });
                bridgeOk = res.ok;
              } catch (e) {
                bridgeOk = false;
              }
            }
            setToast(bridgeOk
              ? { message: `Kitchen has completed Order #${kot.orderId}`, type: 'success' }
              : { message: `Order #${kot.orderId} is ready locally but the online tracker was NOT updated.`, type: 'error' });
            setActiveDeliveries(prev => prev.map(d => d.id === kot.orderId ? { ...d, status: 'READY', rider: 'Waiting for Rider' } : d));
          } else {
            setToast({ message: `KOT Order #${kot.orderId} is READY for ${kot.type}!`, type: 'success' });
          }
          setTimeout(() => setToast(null), 5000);
        });
      }

      const newlyPreparing = kots.filter(k => k.status === 'PREPARING' && prevKotsRef.current.find(p => p.id === k.id)?.status !== 'PREPARING');
      if (newlyPreparing.length > 0) {
        newlyPreparing.forEach(async kot => {
          if (kot.type === 'Delivery' && kot.bridgeOrderId) {
            try {
              const res = await apiFetch(`/online-orders/${kot.bridgeOrderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  kdsStatus: 'ACCEPTED',
                  estimatedReadyAt: new Date(new Date(kot.startTime).getTime() + (kot.prepTimeMinutes * 60000)).toISOString()
                }),
                auth: true,
              });

              if (res.ok) {
                setActiveDeliveries(prev => {
                  const existing = prev.find(d => d.id === kot.orderId);
                  if (existing) {
                    return prev.map(d => d.id === kot.orderId ? { ...d, status: 'PREPARING', rider: `Chef Prep: ${kot.prepTimeMinutes}m` } : d);
                  }
                  return [...prev, {
                    id: kot.orderId,
                    bridgeOrderId: kot.bridgeOrderId,
                    customer: kot.customer || 'Guest',
                    address: kot.customerAddress || 'Pending Address...',
                    status: 'PREPARING',
                    rider: `Chef Prep: ${kot.prepTimeMinutes}m`,
                    cod: kot.totalAmount || 0,
                    riderDistance: 'N/A',
                    lat: '50%',
                    lng: '50%'
                  }];
                });
                setToast({ message: `Order #${kot.orderId} is Preparing in KDS!`, type: 'info' });
              } else {
                setToast({ message: `Order #${kot.orderId} started preparing, but the online tracker was NOT updated.`, type: 'error' });
              }
            } catch {
              setToast({ message: `Order #${kot.orderId} started preparing, but the online tracker was NOT updated (network error).`, type: 'error' });
            }
          }
        });
      }
    }
    prevKotsRef.current = [...kots];
  }, [kots]);

  useEffect(() => {
    const handleGpsUpdate = (data: any) => {
      setActiveDeliveries(prev => prev.map(d => 
        d.bridgeOrderId === data.orderId 
          ? { ...d, lat: data.lat + '%', lng: data.lng + '%' } 
          : d
      ));
    };
    socket.on('gps_update', handleGpsUpdate);
    return () => { socket.off('gps_update', handleGpsUpdate); };
  }, []);

  const getProductDiscount = (product: any) => cartEngine.getProductDiscount(product, activeCampaigns, currentUser?.store_id);

  const addToCart = (product: any, variant?: any, modifiers?: import('./pos/types').CartModifier[]) => {
    setCart(prev => cartEngine.addToCart(prev, product, variant, modifiers));
  }

  const updateQty = (id: any, delta: number) => {
    setCart(prev => cartEngine.updateCartItemQty(prev, id, delta));
  }

  // cartEngine.removeCartItem is available as an explicit, non-quantity-based removal
  // helper for future UI wiring; not yet called from any screen (no UI/UX change here).

  const handleRepeatOrder = async (itemsStr: string) => {
    const items = itemsStr.split(',').map(s => s.trim());
    const newCartItems: any[] = [];

    // Use live products from IndexedDB (synced from backend)
    const liveProducts = await db.products.toArray();

    items.forEach(item => {
      const match = item.match(/^(\d+)x\s+(.+)$/);
      if (match) {
        const qty = parseInt(match[1]);
        const name = match[2].trim();
        // Fuzzy match: exact name first, then partial match
        const prod = liveProducts.find(p => p.name.toLowerCase() === name.toLowerCase())
          || liveProducts.find(p => p.name.toLowerCase().includes(name.toLowerCase())
            || name.toLowerCase().includes(p.name.toLowerCase()));
        if (prod) {
          newCartItems.push({ ...prod, qty });
        }
      }
    });

    if (newCartItems.length > 0) {
      setCart(newCartItems);
      setOrderType('Delivery');
      setActiveMenu('Home');
    } else {
      setToast({ message: 'Could not match items from live menu. Please add manually.', type: 'error' });
    }
  };

  // WhatsApp chats: No hardcoded/simulated data. Real WhatsApp API integration required.
  const simulatedChats: { id: number; phone: string; name: string; isOld: boolean; message: string; history: string; repeatItems: string }[] = [];

  const handleConvertWhatsAppOrder = (chat: { id: number; phone: string; name: string; isOld: boolean; message: string; history: string; repeatItems: string }) => {
    handleRepeatOrder(chat.repeatItems);
  };

  const sendWaiterOrder = () => {
    if (cart.length === 0) return setToast({ message: 'Cart is empty', type: 'error' });
    if (orderType === 'Dine In' && (!tableNumber || tableNumber === 'T1')) {
      // Just a warning, but we can allow T1
    }
    
    const orderData = {
      store_id: currentUser?.store_id,
      waiter_name: currentUser?.name || 'Waiter',
      terminal_pin: currentUser?.password || '',
      table_no: tableNumber || 'T1',
      items: cart,
      total: grandTotal,
      timestamp: new Date().toISOString()
    };
    
    socket.emit('NEW_TERMINAL_ORDER', orderData);
    setToast({ message: 'Order sent to Cashier!', type: 'success' });
    setCart([]);
  };

  const handleCreateKOT = async () => {
    if (cart.length === 0) return setToast({ message: 'Cart is empty', type: 'error' });
    if (!validateDeliveryCustomerInfo(orderType, customerName, customerAddress, customerPhone).valid) {
      setPendingDeliveryAction('KOT');
      return setModalType('DELIVERY_DETAILS');
    }

    // This is the actual "order placed under this customer" moment for a
    // Delivery order (KOT now, settle/pay later) -- previously customer_id
    // was only ever attached at the separate "Pay" flow, which a
    // KOT-then-COD delivery order never reaches until much later (if at
    // all, before this point the offline-sync engine already persisted the
    // order with no customer link — see PosOrdersService.syncOfflineOrders).
    // Mirrors the same GUEST-becomes-a-real-Customer behavior already used
    // at Pay.
    let resolvedCustomerId: number | null = liveCustomer?.id ?? null;
    if (!resolvedCustomerId && customerPhone.trim() && resolveCustomerMode(liveCustomer) === 'GUEST') {
      try {
        const newCustomerRecord = await createCustomer({
          brand_id: currentUser?.brand_id,
          phone: customerPhone.trim(),
          name: customerName || 'Walk-in',
        });
        resolvedCustomerId = newCustomerRecord.id;
      } catch (e) { console.log('Error saving customer', e); }
    }

    const itemsSummary = cart.map(item => `${item.qty}x ${item.name}`).join(', ');

    // Delivery orders must follow the SAME kitchen -> rider pipeline as
    // Website orders (KotsService.updateKotStatus already has a dedicated
    // order_source === 'DELIVERY' branch that broadcasts the Rider offer and
    // feeds the POS's own Active Deliveries panel the instant the KOT is
    // marked READY) — but that only fires for a genuine backend Order+KOT.
    // The local-only db.kots path below never creates one: it's flushed by
    // the offline-sync engine (PosOrdersService.syncOfflineOrders) as a bare
    // Order with no linked KOT row at all, order_source hardcoded to
    // 'OFFLINE_SYNC', and status jumped straight to DELIVERED/PAID the
    // instant it syncs — the order is marked "delivered" without ever
    // entering the kitchen/rider workflow. Try the real endpoint first here,
    // exactly like the Pay Now flow already does a few hundred lines down;
    // fall back to the existing local-only KOT (unchanged, still needed for
    // genuine offline order-taking) only if that network call fails.
    if (orderType === 'Delivery') {
      try {
        const res = await apiFetch('/pos-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          auth: true,
          body: JSON.stringify({
            store_id: currentUser.store_id,
            created_by: currentUser?.id || 1,
            customer_id: resolvedCustomerId,
            order_source: 'Delivery',
            delivery_address: customerAddress,
            notes: orderNotes,
            items: cart.map((i: any) => ({
              product_id: i.id || 1,
              variant_id: i.variant_id,
              quantity: i.qty,
              price: i.price,
              special_inst: i.modifiers?.length > 0 ? i.modifiers.map((m: any) => `+ ${m.name}`).join(', ') : '',
            })),
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || `Order failed (HTTP ${res.status})`);

        if (posSettings.kotMode === 'PRINT' && posSettings.kotPrintQty > 0) {
          setPrintData({
            type: 'KOT',
            data: {
              orderId: data?.id,
              type: 'Delivery',
              customer: customerName,
              customerPhone,
              customerAddress,
              items: itemsSummary,
              notes: orderNotes,
              timePlaced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              totalAmount: grandTotal,
              paymentMethod: paymentMethod === 'Split' ? `Split (Cash: ${splitCash}, Card: ${splitCard})` : paymentMethod,
              isDuplicate: false,
              time: new Date().toLocaleString(),
            },
            printCount: posSettings.kotPrintQty,
          });
        }
        setCart([]);
        setOrderNotes('');
        setToast({ message: `Delivery Order #${data?.id} sent to Kitchen!`, type: 'success' });
        return;
      } catch (e) {
        console.error('Delivery KOT backend create failed, falling back to local:', e);
        // Fall through to the local-only path below (genuine offline case).
      }
    }

    const nextOrderId = Math.floor(Math.random() * 100000);

    const newKot = {
      orderId: nextOrderId,
      type: orderType === 'Dine In' ? `Dine In (${tableNumber})` : orderType,
      customer: customerName,
      customerPhone: customerPhone,
      customerAddress: customerAddress,
      customer_id: resolvedCustomerId,
      items: itemsSummary,
      // itemsData/synced/store_id were never set on this object anywhere in
      // the app -- itemsData isn't even declared here, meaning the offline
      // sync engine's own query for "unsynced" rows never matched this
      // record (synced stayed undefined, never literal false) and, even if
      // it somehow had, the backend had nothing to parse (no itemsData) and
      // no store_id to satisfy its own validation. This KOT was never going
      // to leave the browser. Matches the shape the Pay Now flow's own
      // offline fallback already uses correctly.
      itemsData: JSON.stringify(cart),
      synced: false,
      store_id: currentUser.store_id,
      created_by: currentUser?.id || 1,
      notes: orderNotes,
      timePlaced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      prepTimeMinutes: 0,
      status: 'NEW' as const,
      startTime: '',
      totalAmount: grandTotal,
      paymentMethod: paymentMethod === 'Split' ? `Split (Cash: ${splitCash}, Card: ${splitCard})` : paymentMethod,
      printCount: posSettings.kotMode === 'PRINT' ? 1 : 0
    };

    await db.kots.add(newKot);

    if (posSettings.kotMode === 'PRINT' && posSettings.kotPrintQty > 0) {
      setPrintData({ type: 'KOT', data: { ...newKot, isDuplicate: false, time: new Date().toLocaleString() }, printCount: posSettings.kotPrintQty });
    }

    setCart([]);
    setOrderNotes('');
  };

  // handleReprintKOT removed because it was unused

  const triggerKotPrint = async (kot: any) => {
    if (posSettings.kotMode !== 'PRINT') return;
    await db.kots.update(kot.id, { printCount: kot.printCount + 1 });
    setPrintData({ type: 'KOT', data: { ...kot, isDuplicate: kot.printCount > 0, time: new Date().toLocaleString() }, printCount: posSettings.kotPrintQty || 1 });
  };

  const handleAcceptOnlineOrder = async (order: any) => {
    const newKot = {
      orderId: order.orderId || order.id,
      type: 'Delivery',
      items: order.items || '',
      notes: order.notes || '',
      timePlaced: order.timePlaced || new Date().toLocaleTimeString(),
      prepTimeMinutes: 0,
      status: 'NEW' as const,
      startTime: '',
      printCount: 0,
      totalAmount: parseFloat(order.totalAmount) || 0,
      customer: order.customer || 'Online Guest',
      source: order.source || 'Website',
      bridgeOrderId: order.id,
      customerAddress: order.customerAddress || 'No Address Provided',
    };

    // Patch bridge: kdsStatus → NEW_KOT. The backend creates the real
    // kitchen-facing Order+KOT from this (see
    // OnlineOrdersService.createKitchenTicketForOnlineOrder) — that row,
    // synced via GET /kots + the 'kds_update' broadcast, is what the KDS
    // screen renders. newKot below is a local, unpersisted object used only
    // for this receipt printout and the POS's own Delivery-tab card; it
    // must NOT be written to db.kots, since Dexie is shared across every
    // tab/route on this origin (including /kitchen) and a persisted local
    // row here would show up on the real KDS as a phantom duplicate ticket
    // with no backend counterpart to sync against.
    let bridgeSucceeded = false;
    try {
      const res = await apiFetch(`/online-orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kdsStatus: 'NEW_KOT' }),
        auth: true,
      });
      if (res.ok) {
        bridgeSucceeded = true;
        // Immediately remove from local UI so it disappears from Online tab
        setBackendOnlineOrders(prev => prev.filter(o => o.id !== order.id));
      } else {
        const data = await res.json().catch(() => ({}));
        setToast({ message: data.message || `Order #${order.id} was NOT sent to the kitchen. It will remain in Online Orders — please try Accept again.`, type: 'error' });
      }
    } catch {
      setToast({ message: `Order #${order.id} was NOT sent to the kitchen (network error). It will remain in Online Orders — please try Accept again.`, type: 'error' });
    }

    if (!bridgeSucceeded) return;

    // Trigger KOT print (local receipt only — id is for the printout, not a Dexie row)
    triggerKotPrint({ ...newKot, id: Date.now() });

    const products = await db.products.toArray();
    // This only ever handled the comma-separated text format; the live
    // website's JSON-array items (no name, only product_id) fell through to
    // .split(',') fragmenting the raw JSON text itself into garbage "items".
    // Missing lookup was the same product_id gap as the two render sites
    // above, just with no JSON branch here at all to have the bug in.
    let parsedCart: any[];
    if (order.items && order.items.trim().startsWith('[')) {
      const arr = JSON.parse(order.items);
      parsedCart = arr.map((i: any) => {
        // The website's Product.id is a string, so product_id arrives here
        // as e.g. "196" while db.products keys are numeric -- a strict ===
        // never matched, so every website order showed "Unknown item"
        // regardless of whether the product actually existed locally.
        const product = products.find(p => String(p.id) === String(i.product_id ?? i.id));
        const name = i.name || product?.name || 'Unknown item';
        return { id: Date.now() + Math.random(), name, price: product ? product.price : (i.price || 0), qty: i.qty || i.quantity || 1, img: '', desc: 'Online Order Item' };
      });
    } else {
      parsedCart = (order.items || '').split(',').map((part: string) => {
        const m = part.trim().match(/^(\d+)x\s+(.+)$/);
        let name = part.trim();
        let qty = 1;
        if (m) { qty = parseInt(m[1]); name = m[2].trim(); }
        const product = products.find(p => p.name.toLowerCase() === name.toLowerCase());
        const price = product ? product.price : 0;
        return { id: Date.now() + Math.random(), name, price, qty, img: '', desc: 'Online Order Item' };
      }).filter((i: any) => i.name);
    }

    // Add to Active Deliveries
    setActiveDeliveries(prev => {
      if (prev.find(d => d.id === newKot.orderId)) return prev;
      return [...prev, {
        id: newKot.orderId,
        bridgeOrderId: newKot.bridgeOrderId,
        customer: newKot.customer,
        address: newKot.customerAddress,
        status: 'PENDING_CHEF',
        rider: 'Pending Chef Acceptance',
        cod: newKot.totalAmount,
        riderDistance: 'N/A',
        lat: '50%',
        lng: '50%',
        items: parsedCart
      }];
    });

    setToast({ message: `Order #${newKot.orderId} sent to KDS and Delivery!`, type: 'success' });
  };

  const handleSendTerminalOrder = async () => {
    if (cart.length === 0) return setAlertModalMessage('Cart is empty. Please add items before sending the order.');
    if (!tableNumber) return setAlertModalMessage('Please select a Table Number before sending the order.');

    // Waiter orders go through the same /pos-orders endpoint (and therefore the
    // same Order+KOT persistence, table assignment, and KDS broadcast) as any
    // other order — no parallel order system, so KDS/TV/POS all read the same
    // status from the same place.
    try {
      const res = await apiFetch('/pos-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        auth: true,
        body: JSON.stringify({
          store_id: currentUser.store_id,
          created_by: 0,
          items: cart.map((i: any) => ({
            product_id: i.id || 1,
            variant_id: i.variant_id,
            quantity: i.qty,
            price: i.price,
            special_inst: i.modifiers?.length > 0 ? i.modifiers.map((m: any) => `+ ${m.name}`).join(', ') : '',
          })),
          order_source: 'WAITER',
          table_no: tableNumber,
          terminal_session_id: currentUser.sessionId,
          notes: `Waiter: ${currentUser.name || 'Waiter Tablet'}`,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || `Order failed (HTTP ${res.status})`);

      setToast({ message: 'Order sent to POS!', type: 'success' });
      setCart([]);
      setTableNumber('');
    } catch (e: any) {
      console.error('Send terminal order failed:', e);
      setAlertModalMessage(e?.message || 'Failed to send order — please retry.');
    }
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    db.heldOrders.put({ id: generateHeldOrderId(), cart, orderType, time: new Date() });
    setCart([]);
  }

  const handleResumeOrder = (id: number) => {
    const orderToResume = heldOrders.find(o => o.id === id);
    if (orderToResume) {
      db.heldOrders.delete(id);
      if (cart.length > 0) {
        db.heldOrders.put({ id: generateHeldOrderId(), cart, orderType, time: new Date() });
      }
      setCart(orderToResume.cart);
      setOrderType(orderToResume.orderType);
      setModalType('NONE');
    }
  }

  // Removes a held order without resuming it (Cancel Hold), after confirmation.
  const handleCancelHeldOrder = async (id: number) => {
    const confirmed = await customConfirm('This held order will be permanently removed and cannot be resumed.');
    if (!confirmed) return;
    await db.heldOrders.delete(id);
  }

  const cartHasCompanyPromotion = () => cart.some(item => cartEngine.hasActiveCompanyPromotion(item, activeCampaigns, currentUser?.store_id));

  // MARKETING-002 promotion priority: Manual Override (manager PIN) sits above
  // Company Promotion — a manager can explicitly authorize bypassing the
  // block for this one transaction; it resets once the sale completes/cart clears.
  const [promotionOverrideActive, setPromotionOverrideActive] = useState(false);
  const [pendingOverrideReason, setPendingOverrideReason] = useState<'discount' | 'promotion_block' | null>(null);

  const handleDiscountChange = (val: string) => {
    const newVal = Number(val);
    // Per-item promotion priority (cartEngine.calculateOrderTotals): a
    // discount% typed here is now automatically scoped to only the
    // non-promotional cart lines, so it's no longer all-or-nothing — no
    // block needed just because SOME item in the cart happens to carry a
    // company promotion. The bill summary shows which items were excluded.
    if (newVal > discountPercent && posSettings.discountPassword) {
      setPendingDiscount(val);
      setPendingOverrideReason('discount');
      setModalType('DISCOUNT_AUTH');
    } else {
      setDiscountPercent(newVal);
    }
  }

  const [checkoutDiscount, setCheckoutDiscount] = useState<number>(0);

  // CRM History Modal State
  const [crmHistoryModal, setCrmHistoryModal] = useState<any>(null); // holds customer data
  const [crmHistoryTab, setCrmHistoryTab] = useState<'orders' | 'wishlist' | 'addresses' | 'loyalty'>('orders');
  // Same tier thresholds as the website's deriveLoyaltyTier (App.tsx) --
  // kept in sync intentionally so a customer sees the same tier label
  // whether a cashier looks them up here or they check the website.
  const deriveLoyaltyTierLabel = (points: number) => (points >= 2000 ? 'VIP' : points >= 500 ? 'Platinum Member' : 'Gold Member');

  const handleViewCustomerHistory = async (id: number | string) => {
    try {
      // `user.token` was never a real variable in this scope -- every call
      // threw ReferenceError, silently caught below as a generic toast, so
      // this modal never actually loaded from either of its two entry
      // points (checkout sidebar's "View History", and now the CRM grid).
      const res = await apiFetch(`/customers/${id}/orders`, { auth: true });
      if (!res.ok) throw new Error('History fetch failed');
      const data = await res.json();
      // Wishlist -- same public endpoint the website's Account page uses,
      // resolved against the already-loaded local catalog for name/image.
      let favoriteProducts: any[] = [];
      try {
        const favRes = await apiFetch(`/online-orders/favorites/${id}`, { auth: true });
        if (favRes.ok) {
          const favProductIds: number[] = await favRes.json();
          const catalog = await db.products.toArray();
          favoriteProducts = favProductIds
            .map((pid) => catalog.find((p) => p.id === pid))
            .filter(Boolean);
        }
      } catch { /* wishlist is additive -- history still shows without it */ }
      // Loyalty ledger -- which order(s) earned/redeemed how many points, so
      // the Loyalty tab can show more than just the current balance.
      let loyaltyTransactions: any[] = [];
      try {
        const walletRes = await apiFetch(`/customers/${id}/wallet`, { auth: true });
        if (walletRes.ok) loyaltyTransactions = (await walletRes.json()).transactions || [];
      } catch { /* additive -- history still shows without it */ }
      setCrmHistoryModal({ ...data, favoriteProducts, loyaltyTransactions });
      setModalType('CUSTOMER_HISTORY');
    } catch (e) {
      setToast({ message: 'Failed to load order history', type: 'error' });
    }
  };
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountPasswordInput, setDiscountPasswordInput] = useState('');
  const [pendingDiscount, setPendingDiscount] = useState('');
  const [pendingDeliveryAction, setPendingDeliveryAction] = useState<'KOT' | 'PAY' | null>(null);
  const [tableNumber, setTableNumber] = useState<string>(isWaiterMode ? '' : 'T1');
  // Cashier-chosen amount of the attached customer's points to redeem on
  // this order (partial, not all-or-nothing).
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  // Moved above the calculateOrderTotals call below, which reads
  // liveCustomer?.loyalty_points -- was previously declared further down,
  // which would be a temporal-dead-zone error at this new call site.
  const [liveCustomer, setLiveCustomer] = useState<any>(null);

  // Defensive reset: without this, pointsToRedeem only ever cleared after a
  // successful order submit -- a cancelled/cleared cart left it stale, so
  // the very next item added to a fresh order silently inherited a
  // redemption the cashier never clicked "Redeem Points" for THIS order.
  // Also resets if the attached customer changes mid-order, so a
  // redemption never carries over onto a different customer's points.
  useEffect(() => {
    if (cart.length === 0 && pointsToRedeem > 0) setPointsToRedeem(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length]);
  useEffect(() => {
    if (pointsToRedeem > 0) setPointsToRedeem(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveCustomer?.id]);

  const {
    subTotal, promoDiscountAmount, bogoDiscountAmount, bundleDiscountAmount, giftDiscountAmount, afterPromo, discountAmount,
    loyaltyDiscount, itemLoyaltyDiscount, deliveryLoyaltyDiscount, pointsRedeemed,
    totalDiscountAmount, afterDiscount, tax, deliveryFee, grandTotal, giftApplications
  } = cartEngine.calculateOrderTotals(cart, activeCampaigns, currentUser?.store_id, discountPercent, taxRate, {
    isDelivery: orderType === 'Delivery',
    fee: branchSettings?.delivery_fee ?? 0,
    freeThreshold: branchSettings?.min_order_free_delivery ?? 0,
  }, {
    pointsToRedeem,
    pointValue: (window as any).d4u_loyalty_point_value ?? 0,
    availablePoints: liveCustomer?.loyalty_points ?? 0,
  });

  // CRM customer list -- was previously 3 hardcoded demo customers in a
  // local-only Dexie table (db.crmCustomers), completely disconnected from
  // the real Customer table every other CRM/checkout/website surface reads
  // and writes. Now the same real, synchronized data everywhere else uses.
  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const refreshCrmCustomers = () => {
    if (!currentUser?.brand_id || !currentUser?.store_id) return;
    fetchCustomers({ brandId: currentUser.brand_id, storeId: currentUser.store_id })
      .then(setCrmCustomers)
      .catch(() => setCrmCustomers([]));
  };
  useEffect(() => {
    refreshCrmCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.brand_id, currentUser?.store_id]);

  const [crmSearch, setCrmSearch] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (customerPhone.length >= 10) {
      lookupCustomerByPhone(customerPhone)
        .then((c) => {
          setLiveCustomer(c);
          // Never overwrite a name the cashier already typed — only fills
          // it in when the field is still blank. Address is deliberately
          // NOT auto-filled here: a returning customer can have several
          // saved addresses, so the cashier picks one explicitly (see the
          // address chips rendered next to the loyalty-points block).
          if (c && !customerName.trim()) setCustomerName(c.name);
        })
        .catch(() => setLiveCustomer(null));
    } else {
      setLiveCustomer(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerPhone]);

  // Delivery Details modal's "pick a customer from a list while typing"
  // search-as-you-type -- partial phone/name match, separate from the exact
  // 10+-digit lookup above. Debounced so it doesn't fire on every keystroke.
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  useEffect(() => {
    if (customerPhone.trim().length >= 3 && customerPhone.trim().length < 11 && currentUser?.brand_id) {
      const handle = setTimeout(() => {
        fetchCustomers({ brandId: currentUser.brand_id, storeId: currentUser.store_id, search: customerPhone.trim() })
          .then((results) => { setCustomerSearchResults(results.slice(0, 6)); setShowCustomerDropdown(true); })
          .catch(() => setCustomerSearchResults([]));
      }, 300);
      return () => clearTimeout(handle);
    }
    setCustomerSearchResults([]);
    setShowCustomerDropdown(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerPhone, currentUser?.brand_id, currentUser?.store_id]);

  const selectCustomerFromSearch = (c: any) => {
    setCustomerPhone(c.phone);
    setCustomerName(c.name);
    setLiveCustomer(c);
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
  };

  // Address picker inside the Delivery Details modal: defaults to the
  // saved-address picker whenever the resolved customer has any; the
  // cashier can still switch to typing a fresh one-off address. Re-derived
  // whenever a different customer resolves.
  const [useManualDeliveryAddress, setUseManualDeliveryAddress] = useState(false);
  useEffect(() => {
    const addresses = liveCustomer?.addresses || [];
    if (addresses.length === 0) {
      setUseManualDeliveryAddress(true);
    } else {
      setUseManualDeliveryAddress(false);
      // Exactly one saved address -- nothing to choose between, pre-select
      // it (still visible/changeable, not silently locked in).
      if (addresses.length === 1) setCustomerAddress(addresses[0].address);
    }
  }, [liveCustomer]);

  // "+ Enter a different address" used to be a one-off override that never
  // saved anywhere -- next order, the cashier had to type it again. Persists
  // via the same public POST /online-orders/addresses endpoint the website's
  // own Account page already uses, so an address added here is immediately
  // available on the website too (and vice versa), not just this one order.
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  const persistNewDeliveryAddress = async (): Promise<void> => {
    if (!liveCustomer?.id || !saveNewAddress || !customerAddress.trim() || !newAddressLabel.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/online-orders/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: liveCustomer.id,
          label: newAddressLabel.trim(),
          address: customerAddress.trim(),
          is_default: (liveCustomer.addresses || []).length === 0,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setLiveCustomer((prev: any) => prev ? { ...prev, addresses: [...(prev.addresses || []), saved] } : prev);
      }
    } catch (e) {
      console.error('Failed to save new delivery address', e);
    }
  };

  if (window.location.pathname === '/kitchen') {
    // Was rendering with no props at all, so the branch name never had a
    // store_id to resolve from and Chef PIN login had no logged-in user's
    // token to authenticate with — POSApp already has both right here.
    return <KitchenDisplay currentUser={currentUser} onLogout={onLogout} />;
  }
  
  if (window.location.pathname === '/tv') {
    return <TVDisplay />;
  }

  // Real-time GPS sync handled globally by WebSockets above

  const [branchName, setBranchName] = useState(`Branch ${currentUser?.store_id}`);
  
  useEffect(() => {
    fetch(`${BACKEND_URL}/stores`)
      .then(res => res.json())
      .then(data => {
         const stores = Array.isArray(data) ? data : (data.value || data.stores || []);
         const s = stores.find((x: any) => x.id === (currentUser?.store_id));
         if (s) setBranchName(s.name);
      }).catch(console.error);
  }, [currentUser?.store_id]);

  return (
    <div className="pos-layout" onClick={() => showMoreMenu && setShowMoreMenu(false)}>
      {(syncStatus === 'error' || (syncStatus !== 'idle' && pendingSyncCount > 0)) && (
        <div
          title={syncStatus === 'error' ? 'Some orders are waiting to sync with the server' : 'Syncing offline orders...'}
          style={{
            position: 'fixed', bottom: '10px', right: '10px', zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '20px',
            background: syncStatus === 'error' ? 'rgba(220,38,38,0.92)' : 'rgba(30,41,59,0.92)',
            color: 'white', fontSize: '0.75rem', fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)', pointerEvents: 'none'
          }}
        >
          <span
            style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: syncStatus === 'error' ? '#fca5a5' : '#facc15'
            }}
          />
          {syncStatus === 'error'
            ? `${pendingSyncCount} order${pendingSyncCount === 1 ? '' : 's'} pending sync`
            : `Syncing ${pendingSyncCount} order${pendingSyncCount === 1 ? '' : 's'}...`}
        </div>
      )}

      {/* SIDEBAR */}
      {!isWaiterMode && (
      <aside className="sidebar">
        <div
          className={`sidebar-logo-btn ${activeMenu === 'Dashboard' ? 'active' : ''}`}
          onClick={() => setActiveMenu('Dashboard')}
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', padding: '15px 0', borderBottom: '1px solid var(--border-color)', width: '100%', marginBottom: '10px' }}
          title="Admin Dashboard"
        >
          <Store size={28} color={activeMenu === 'Dashboard' ? 'var(--accent-yellow)' : 'white'} />
        </div>

        <div className={`sidebar-item ${activeMenu === 'Home' ? 'active' : ''}`} onClick={() => setActiveMenu('Home')}>
          <div className="icon-box"><Home size={22} /></div><span>POS</span>
        </div>
        <div className={`sidebar-item ${activeMenu === 'KOT' ? 'active' : ''}`} onClick={() => setActiveMenu('KOT')}>
          <div className="icon-box" style={{ position: 'relative' }}>
            <ChefHat size={22} color={activeMenu === 'KOT' ? 'white' : 'var(--text-muted)'} />
            {kots.filter(k => k.status === 'PREPARING').length > 0 && (
              <span style={{ position: 'absolute', top: '0', right: '0', background: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '2px 5px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                {kots.filter(k => k.status === 'PREPARING').length}
              </span>
            )}
          </div>
          <span>KOT</span>
        </div>
        <div className={`sidebar-item ${activeMenu === 'Online' ? 'active' : ''}`} onClick={() => setActiveMenu('Online')}>
          <div className="icon-box" style={{ position: 'relative' }}>
            <Globe size={22} />
            {allOnlineOrders.length > 0 && <span style={{ position: 'absolute', top: '0', right: '0', background: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '2px 5px', fontSize: '0.65rem', fontWeight: 'bold' }}>{allOnlineOrders.length}</span>}
          </div>
          <span>Online</span>
        </div>
        {posSettings.terminalEngineEnabled && (
          <div
            className={`sidebar-item ${activeMenu === 'Terminal' ? 'active' : ''}`}
            onClick={() => setActiveMenu('Terminal')}
          >
            <div className="icon-box" style={{ position: 'relative' }}>
              <Navigation size={20} color={isWaiterConnected ? '#4edea3' : undefined} />
              {terminalPanelOrders.filter(o => o.status === 'PENDING').length > 0 && <span style={{ position: 'absolute', top: '0', right: '0', background: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '2px 5px', fontSize: '0.65rem', fontWeight: 'bold' }}>{terminalPanelOrders.filter(o => o.status === 'PENDING').length}</span>}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '4px', color: isWaiterConnected ? '#4edea3' : undefined }}>Waiter</span>
          </div>
        )}
        <div className={`sidebar-item ${activeMenu === 'Delivery' ? 'active' : ''}`} onClick={() => setActiveMenu('Delivery')}>
          <div className="icon-box" style={{ position: 'relative' }}>
            <Truck size={22} />
            {activeDeliveries.filter(d => ['READY', 'RIDER_ARRIVED', 'PRINT_BILL', 'WAITING_CASH_SETTLEMENT'].includes(d.status)).length > 0 && (
              <span style={{ position: 'absolute', top: '0', right: '0', background: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '2px 5px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                {activeDeliveries.filter(d => ['READY', 'RIDER_ARRIVED', 'PRINT_BILL', 'WAITING_CASH_SETTLEMENT'].includes(d.status)).length}
              </span>
            )}
          </div>
          <span>Delivery</span>
        </div>
        <div className={`sidebar-item ${activeMenu === 'Staff' ? 'active' : ''}`} onClick={() => setActiveMenu('Staff')}>
          <div className="icon-box"><Users size={22} /></div><span>Staff</span>
        </div>
        <div className={`sidebar-item ${activeMenu === 'Customers' ? 'active' : ''}`} onClick={() => setActiveMenu('Customers')}>
          <div className="icon-box"><Users size={22} /></div><span>CRM</span>
        </div>
        <div className={`sidebar-item ${activeMenu === 'WhatsApp' ? 'active' : ''}`} onClick={() => setActiveMenu('WhatsApp')}>
          <div className="icon-box" style={{ background: activeMenu === 'WhatsApp' ? '#25D366' : 'transparent', color: activeMenu === 'WhatsApp' ? 'white' : 'var(--text-muted)' }}>
            <MessageCircle size={22} color={activeMenu === 'WhatsApp' ? 'white' : '#25D366'} />
          </div>
          <span style={{ color: activeMenu === 'WhatsApp' ? '#25D366' : 'var(--text-muted)' }}>WhatsApp</span>
        </div>

        <div className={`sidebar-item ${activeMenu === 'Settings' ? 'active' : ''}`} onClick={() => setModalType('SETTINGS')}>
          <div className="icon-box"><Settings size={22} /></div>
          <span>Settings</span>
        </div>


      </aside>
      )}

      {/* MAIN CONTENT AREA */}
      <main ref={mainRef} className="main-content" style={{ position: 'relative' }}>
        {lowStockItems.length > 0 && (
          <div style={{ background: '#ef4444', color: 'white', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem', animation: 'pulse 2s infinite' }}>
            <AlertCircle size={18} />
            LOW STOCK ALERT: {lowStockItems.map(i => `${i.name} (${i.currentStock} left)`).join(', ')}
          </div>
        )}
        <header ref={headerRef} className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)', padding: '12px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '20px', gap: '20px' }}>
          <div className="header-info" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {activeMenu === 'Dashboard' ? (
              <h1 style={{ fontSize: '1.4rem', color: 'white', fontWeight: 'bold', margin: 0, whiteSpace: 'nowrap' }}>POS Dashboard</h1>
            ) : (
              <h1 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, whiteSpace: 'nowrap', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.5px' }}>
                <Store size={20} color="var(--accent-yellow)" /> 
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span><span style={{ color: 'var(--accent-yellow)' }}>D4U</span> POS</span>
                  <span style={{fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)', marginTop: '-2px'}}>({branchName})</span>
                </div>
              </h1>
            )}
          </div>

          {isWaiterMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', background: 'var(--bg-base)', borderRadius: '8px', padding: '4px', gap: '4px' }}>
                <button onClick={() => setWaiterTab('MENU')} style={{ background: waiterTab === 'MENU' ? 'var(--accent-yellow)' : 'transparent', color: waiterTab === 'MENU' ? 'black' : 'var(--text-muted)', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Menu</button>
                <button onClick={() => setWaiterTab('ORDERS')} style={{ background: waiterTab === 'ORDERS' ? 'var(--accent-yellow)' : 'transparent', color: waiterTab === 'ORDERS' ? 'black' : 'var(--text-muted)', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Orders {waiterOrders.length > 0 ? `(${waiterOrders.length})` : ''}</button>
              </div>
              <button onClick={onLogout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogOut size={18} /> Logout
              </button>
            </div>
          )}

          {/* TOAST NOTIFICATION AREA (IN HEADER) */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {toast && (
              <div
                className="blink-animation"
                style={{
                  background: toast.type === 'delivery' ? 'rgba(245, 158, 11, 0.15)' : toast.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${toast.type === 'delivery' ? '#f59e0b' : toast.type === 'success' ? '#22c55e' : '#ef4444'}`,
                  color: toast.type === 'delivery' ? '#fcd34d' : toast.type === 'success' ? '#4ade80' : '#f87171',
                  padding: '10px 20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center',
                  gap: '10px', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  cursor: toast.type === 'error' ? 'pointer' : 'default'
                }}
                onClick={() => { if (toast.type === 'error') setToast(null); }}
              >
                {toast.type === 'delivery' ? <span style={{fontSize:'1.1rem'}}>🛵</span> : toast.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
                <span>{toast.message}</span>
                {toast.action && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toast.action!.onClick(); setToast(null); }}
                    style={{ marginLeft: '8px', padding: '4px 12px', background: '#f59e0b', color: '#1c1c1c', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', flexShrink: 0, justifyItems: 'flex-end', justifyContent: 'flex-end' }}>
            
            {/* Date Time Block */}
            {!isWaiterMode && activeMenu !== 'Dashboard' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                <Clock size={16} color="var(--accent-yellow)" />
                {dayStartTime ? `${dayStartTime.toLocaleDateString()} | ${dayStartTime.toLocaleTimeString()}` : 'N/A'}
              </div>
            )}

            {/* Cashier Login */}
            {!isWaiterMode && (
            <div>
              {cashier ? (
                <button
                  onClick={() => { 
                    setCashier(null); 
                    localStorage.removeItem('d4u_cashier'); 
                    setToast({ message: 'Cashier Logged Out', type: 'info' }); 
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ef4444', borderRadius: 'var(--radius-md)', padding: '10px 16px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                >
                  <User size={16} /> {cashier.name} (Logout)
                </button>
              ) : (
                <button
                  onClick={() => { setCashierLoginName(''); setModalType('CASHIER_LOGIN'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-yellow)', border: 'none', color: 'black', borderRadius: 'var(--radius-md)', padding: '10px 16px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(251, 191, 36, 0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <User size={16} /> Cashier Login
                </button>
              )}
            </div>
            )}

            {!isWaiterMode && (
              <>
                {/* Cash Out */}
                <button
              onClick={() => setModalType('CASH_OUT')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: 'var(--radius-md)', padding: '6px 12px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-yellow)'; e.currentTarget.style.color = 'var(--accent-yellow)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'white'; }}
            >
              <Banknote size={14} /> Cash Out
            </button>

            {/* Shift / Day Close & Handover */}
            <button
              onClick={() => setModalType('DAY_CLOSE')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(129, 140, 248, 0.15)', border: '1px solid #818cf8', color: '#a5b4fc', borderRadius: 'var(--radius-md)', padding: '6px 12px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(129, 140, 248, 0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(129, 140, 248, 0.15)'; }}
              title="Close Shift & Handover Cash"
            >
              <Moon size={14} /> Shift / Day Close
            </button>

            {/* Lock Terminal */}
            <button
              onClick={() => setIsTerminalLockedByUser(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fcd34d', borderRadius: 'var(--radius-md)', padding: '6px 12px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.color = '#fbbf24'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = '#fcd34d'; }}
              title="Lock Terminal"
            >
              <Lock size={14} /> Lock Terminal
            </button>
            </>
            )}

            {/* Full Screen */}
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: 'var(--radius-md)', padding: '6px 12px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-yellow)'; e.currentTarget.style.color = 'var(--accent-yellow)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'white'; }}
            >
              <Maximize size={14} />
            </button>

            {/* Global Search */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', padding: '6px 12px', width: '220px', transition: 'border-color 0.2s' }}>
              <Search size={14} color="#64748b" style={{ marginRight: '8px' }} />
              <input type="text" placeholder="Global Search..." style={{ flex: 1, background: 'transparent', border: 'none', color: 'black', outline: 'none', fontSize: '0.85rem' }} />
            </div>
          </div>
        </header>

        {/* WAITER: MY ORDERS TAB (overlay — Menu view underneath is untouched).
            Positioned to start below the header (measured via ResizeObserver
            above) so only the tab content switches — the header stays visible. */}
        {isWaiterMode && waiterTab === 'ORDERS' && (
          <div style={{ position: 'absolute', top: waiterOverlayTop, left: 0, right: 0, bottom: 0, background: 'var(--bg-base)', zIndex: 500, overflowY: 'auto', padding: '20px' }}>
            <h2 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '16px' }}>My Orders</h2>
            {waiterOrders.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>No orders sent yet.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {waiterOrders.map((order: any) => {
                const kotStatus = order.kot?.status || order.status || 'PENDING';
                const statusColor = kotStatus === 'READY' ? 'var(--accent-green)' : kotStatus === 'PREPARING' ? 'var(--accent-yellow)' : kotStatus === 'CANCELLED' ? '#ef4444' : 'var(--text-muted)';
                let etaMinutes: number | null = null;
                if (kotStatus === 'PREPARING' && order.kot?.acceptedAt) {
                  const elapsedMin = (Date.now() - new Date(order.kot.acceptedAt).getTime()) / 60000;
                  etaMinutes = Math.max(0, Math.round(15 - elapsedMin)); // best-effort default prep window
                }
                return (
                  <div key={order.id} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: 'white', fontWeight: 'bold' }}>Order #{order.id} — Table {order.table_no || 'N/A'}</span>
                      <span style={{ color: statusColor, fontWeight: 'bold', fontSize: '0.85rem' }}>{kotStatus}</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '6px' }}>
                      {order.items?.map((i: any) => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                      {etaMinutes !== null && <span>~{etaMinutes} min remaining</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {activeMenu === 'Dashboard' && (
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            <AdminDashboard currentUser={currentUser} />
          </div>
        )}

        {/* STAFF MANAGEMENT VIEW */}
        {activeMenu === 'Staff' && (
          <StaffManagement />
        )}

        {/* HOME (POS) VIEW */}
        {activeMenu === 'Home' && (
          <>
            {/* The promotional "SALE — X% OFF" banner carousel and the
                always-visible "BOGO Deals" strip used to render here on
                every view (All Items, every category, etc.) the moment any
                campaign existed -- that marketing-style promo placement
                belongs on the customer-facing website, not the cashier's
                working screen. BOGO offers are still fully available to the
                cashier: they render as offer cards inside the Discounted
                filter (activeCategoryId === 'DISCOUNT', in the product grid
                below), consistent with every other discounted item. */}
            {/* Product search -- filter logic already existed (searchQuery/setSearchQuery
                below), there was simply no input for the cashier to type into. */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name..."
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.85rem' }}
              />
            </div>
            {/* TOP ROW: Main Navigation */}
            <div className="nav-categories" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
              <button
                className={`nav-category-btn ${activeCategoryId === null && activeCategoryGroupId === null ? 'active' : ''}`}
                onClick={() => { setActiveCategoryGroupId(null); setActiveCategoryId(null); setCategoryInitialized(true); }}
              >
                All Items
              </button>
              
              <button 
                className={`nav-category-btn ${activeCategoryId === 'DISCOUNT' ? 'active' : ''}`}
                onClick={() => { setActiveCategoryId('DISCOUNT'); setActiveCategoryGroupId(null); }}
              >
                <span style={{ color: '#fbbf24', marginRight: '5px' }}>🔥</span> Discounted
              </button>

              {/* Visible Category Groups (Max 5 to account for All Items & Discounted) */}
              {categoryGroups.slice(0, 5).map(cg => (
                <button 
                  key={cg.id} 
                  className={`nav-category-btn ${activeCategoryGroupId === cg.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategoryGroupId(cg.id);
                    // Auto-select first category in group
                    const groupCats = categories.filter(c => c.category_group_id === cg.id);
                    if (groupCats.length > 0) setActiveCategoryId(groupCats[0].id);
                    else setActiveCategoryId(null); // No categories
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {cg.color && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cg.color }}></div>}
                  {cg.name}
                </button>
              ))}

              {/* Overflow 'More' Dropdown */}
              {categoryGroups.length > 5 && (
                <div style={{ position: 'relative' }}>
                  <select
                    className={`nav-category-btn`}
                    style={{ appearance: 'none', paddingRight: '30px', outline: 'none', cursor: 'pointer', background: '#1e293b', color: 'white' }}
                    value={activeCategoryGroupId !== null && activeCategoryGroupId > categoryGroups[4]?.id ? activeCategoryGroupId : ''}
                    onChange={(e) => {
                      const id = parseInt(e.target.value);
                      if (id) {
                        setActiveCategoryGroupId(id);
                        const groupCats = categories.filter(c => c.category_group_id === id);
                        if (groupCats.length > 0) setActiveCategoryId(groupCats[0].id);
                        else setActiveCategoryId(null);
                      }
                    }}
                  >
                    <option value="" disabled>More...</option>
                    {categoryGroups.slice(5).map(cg => (
                      <option key={cg.id} value={cg.id}>{cg.name}</option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>▼</div>
                </div>
              )}
            </div>

            {/* SECOND ROW: Categories ONLY */}
            {(categoryGroups.length === 0 || activeCategoryGroupId !== null || activeCategoryId === 'DISCOUNT') && (
            <div className="nav-categories" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', borderBottom: '1px solid #1e293b', marginBottom: '15px' }}>
              {categories
                .filter(c => !['extra toppings', 'add-ons', 'addons'].includes(c.name.toLowerCase()))
                .filter(c => {
                  if (activeCategoryId === 'DISCOUNT') {
                    // Show categories containing discounted products
                    return products.some(p => getProductDiscount(p) > 0 && (p.category_id === c.id || p.categories?.some((cat:any) => cat.id === c.id)));
                  }
                  if (activeCategoryGroupId !== null) {
                    // Show categories belonging to the selected group
                    return c.category_group_id === activeCategoryGroupId;
                  }
                  // All Items (activeCategoryId === null && activeCategoryGroupId === null)
                  return true;
                })
                .map(c => (
                <button 
                  key={c.id} 
                  className={`nav-category-btn ${activeCategoryId === c.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategoryId(c.id);
                    if (c.category_group_id) {
                      setActiveCategoryGroupId(c.category_group_id);
                    }
                  }}
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  {c.name}
                </button>
              ))}
            </div>
            )}
            <div className="product-grid">
              {/* BOGO offer cards -- combines the campaign's buy+get products into
                  one written offer, shown only in the Discounted section (not as a
                  badge on the raw buy/get products themselves). Adding it puts both
                  real products in the cart; cartEngine's existing applyBogoRewards
                  automatically discounts the get-item once both are present -- no
                  new reward math here. */}
              {activeCategoryId === 'DISCOUNT' && cartEngine.getActiveBogoCampaigns(activeCampaigns)
                .filter((c: any) => c.buyProduct && c.getProduct)
                .map((camp: any) => (
                  <div
                    key={`bogo-${camp.id}`}
                    className="product-card"
                    onClick={() => {
                      for (let i = 0; i < (camp.buy_qty || 1); i++) addToCart(camp.buyProduct);
                      for (let i = 0; i < (camp.reward_qty || 1); i++) addToCart(camp.getProduct);
                      setToast({ message: `Added: Buy ${camp.buyProduct.name} Get ${camp.getProduct.name}!`, type: 'success' });
                    }}
                    style={{ position: 'relative', cursor: 'pointer' }}
                  >
                    <div style={{
                      position: 'absolute', top: '10px', left: '0',
                      background: 'linear-gradient(135deg, #ec4899, #be185d)',
                      color: 'white', fontWeight: '900', fontSize: '0.72rem',
                      padding: '4px 10px 4px 8px', borderRadius: '0 20px 20px 0',
                      zIndex: 10, letterSpacing: '0.05em',
                    }}>
                      🎁 BOGO
                    </div>
                    <div className="product-img-wrapper">
                      {camp.buyProduct.image_url ? (
                        <img src={camp.buyProduct.image_url} alt={camp.buyProduct.name} className="product-img" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <UtensilsCrossed size={22} />
                        </div>
                      )}
                    </div>
                    <div className="product-name">
                      Buy {camp.buyProduct.name} Get {camp.getProduct.name}{camp.reward_type === 'PERCENTAGE' ? ` (${camp.discount_pct}% OFF)` : ' FREE'}
                    </div>
                    <div className="product-price-badge">Rs. {camp.buyProduct.price}</div>
                  </div>
                ))}
              {products.filter(prod => {
                if (activeCategoryId === 0 && prod.categories?.some((c:any) => ['extra toppings', 'add-ons', 'addons'].includes((c.name || '').toLowerCase()))) return false;
                if (searchQuery && !prod.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                if (activeCategoryId === 'DISCOUNT' && getProductDiscount(prod) === 0) return false;
                return true;
              }).map(prod => {
                const discount = getProductDiscount(prod);
                const isBogoProduct = cartEngine.getActiveBogoCampaigns(activeCampaigns).some(c => c.buy_product_id === prod.id || c.get_product_id === prod.id);
                return (
                <div
                  key={prod.id}
                  className="product-card"
                  onClick={() => {
                    if (prod.isApproved === false) {
                      setToast({ message: 'This item requires Admin approval before sale.', type: 'error' });
                    } else if ((prod.variants && prod.variants.length > 0) || (prod.modifierGroups && prod.modifierGroups.length > 0)) {
                      setPendingVariantProduct(prod);
                      setSelectedModifiers({});
                      setModalType('SELECT_VARIANT');
                    } else {
                      addToCart(prod);
                    }
                  }}
                  style={{ position: 'relative', opacity: prod.isApproved === false ? 0.6 : 1, cursor: prod.isApproved === false ? 'not-allowed' : 'pointer' }}
                >
                  {discount > 0 && (
                    <div style={{
                      position: 'absolute', top: '10px', left: '0',
                      background: 'linear-gradient(135deg, #ec4899, #be185d)',
                      color: 'white', fontWeight: '900', fontSize: '0.72rem',
                      padding: '4px 10px 4px 8px',
                      borderRadius: '0 20px 20px 0',
                      zIndex: 10,
                      letterSpacing: '0.05em',
                      boxShadow: '2px 2px 8px rgba(236,72,153,0.5)',
                      display: 'flex', alignItems: 'center', gap: '3px'
                    }}>
                      🔥 {discount}% OFF
                    </div>
                  )}
                  {isBogoProduct && (
                    <div style={{
                      position: 'absolute', top: discount > 0 ? '34px' : '10px', left: '0',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: 'black', fontWeight: '900', fontSize: '0.65rem',
                      padding: '3px 10px 3px 8px',
                      borderRadius: '0 20px 20px 0',
                      zIndex: 10,
                      letterSpacing: '0.05em',
                    }}>
                      BOGO
                    </div>
                  )}
                  <div className="product-img-wrapper">
                    {prod.img ? (
                      <img src={prod.img} alt={prod.name} className="product-img" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <UtensilsCrossed size={22} />
                      </div>
                    )}
                  </div>
                  <div className="product-name">{prod.name}</div>
                  <div className="product-price-badge" style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                    {discount > 0 && !(prod.variants && prod.variants.length > 0) && (
                      <span style={{ 
                        textDecoration: 'line-through', 
                        textDecorationThickness: '2px',
                        textDecorationColor: '#7c2d12',
                        color: '#92400e', 
                        fontSize: '0.85rem',
                        fontWeight: '700'
                      }}>Rs. {prod.price}</span>
                    )}
                    {prod.variants && prod.variants.length > 0 ? (
                      <span style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}>Choose Size</span>
                    ) : (
                      <span>Rs. {discount > 0 ? (prod.price * (1 - discount/100)).toFixed(0) : prod.price}</span>
                    )}
                  </div>
                  {prod.isApproved === false && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', borderRadius: '10px' }}>
                      <Lock size={40} color="var(--accent-yellow)" />
                      <span style={{ color: 'white', fontWeight: 'bold', marginTop: '10px' }}>Pending Approval</span>
                    </div>
                  )}
                </div>
              )})}
              {posSettings.allowCustomItems && !isWaiterMode && (
                <div
                  onClick={() => setModalType('ADD_CUSTOM_ITEM')}
                  style={{ border: '2px dashed #334155', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', minHeight: '200px', color: '#cbd5e1', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-yellow)'; e.currentTarget.style.color = 'var(--accent-yellow)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#cbd5e1'; }}
                >
                  <Plus size={40} style={{ marginBottom: '15px' }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Submit Product Request</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* KOT MONITOR & HISTORY VIEW */}
        {activeMenu === 'KOT' && (
          <div style={{ display: 'flex', gap: '20px', flex: 1, height: '100%', minHeight: 0 }}>
            {/* Left Side: KOT History / Log (25% width) */}
            <div style={{ width: '25%', background: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', minHeight: 0 }}>
              <h3 style={{ color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', marginTop: 0, fontSize: '1.2rem' }}>
                <Receipt size={20} /> KOT History & Log
              </h3>
              
              {/* Search & Filters */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="Search ID/Customer..."
                  value={kotSearchQuery}
                  onChange={e => setKotSearchQuery(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                />
                <select
                  value={kotStatusFilter}
                  onChange={e => setKotStatusFilter(e.target.value)}
                  style={{ padding: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                >
                  <option value="ALL">All Status</option>
                  <option value="NEW">New</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
                </select>
              </div>

              {/* KOT List */}
              <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredKots.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '0.9rem' }}>
                    No KOT records found.
                  </div>
                ) : (
                  filteredKots.map(k => (
                    <div key={k.id} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white' }}>#{k.orderId} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.75rem' }}>({k.type})</span></span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          background: k.status === 'READY' ? 'rgba(78, 222, 163, 0.1)' : k.status === 'PREPARING' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                          color: k.status === 'READY' ? '#4edea3' : k.status === 'PREPARING' ? '#fbbf24' : '#94a3b8',
                          border: k.status === 'READY' ? '1px solid rgba(78, 222, 163, 0.3)' : k.status === 'PREPARING' ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(148, 163, 184, 0.3)'
                        }}>
                          {k.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                        {(() => {
                          try {
                            if (k.items && k.items.trim().startsWith('[')) {
                              const arr = JSON.parse(k.items);
                              return arr.map((i: any) => `${i.qty || 1}x ${i.name}`).join('\n');
                            }
                          } catch(e) {}
                          return k.items.replace(/,\s*/g, '\n');
                        })()}
                      </div>
                      {k.notes && (
                        <div style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(251,191,36,0.05)', padding: '6px', borderRadius: '4px', borderLeft: '3px solid #fbbf24' }}>
                          Note: {k.notes}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px' }}>
                        <span>Placed: {k.timePlaced}</span>
                        <span>Prints: {k.printCount}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Side: Active KOT monitor view (75% width) */}
            <div style={{ width: '75%', background: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', minHeight: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.2rem' }}>
                  <ChefHat size={20} /> Active Kitchen Tickets
                </h3>
                {posSettings.kotMode === 'SCREEN' && (
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '0.8rem' }}>Screen Active</span>
                     <button className="btn-action btn-order" onClick={() => window.open('/kitchen', '_blank')} style={{ padding: '6px 12px', fontSize: '0.75rem', minHeight: '30px' }}>
                       Open Screen
                     </button>
                   </div>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <KitchenView 
                  orders={mappedOrders}
                  onMarkReady={() => {}}
                  onSimulateOrder={() => {}}
                  isEmergencyStop={false}
                  readOnly={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* ONLINE ORDERS VIEW */}
        {activeMenu === 'Online' && (
          <div style={{ padding: '20px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <h2 style={{ marginBottom: '20px', color: 'var(--accent-yellow)', flexShrink: 0 }}>Incoming Online Orders</h2>
            <div className="custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', overflowY: 'auto', paddingRight: '10px' }}>
              {allOnlineOrders.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '0.95rem', gridColumn: '1 / -1' }}>
                  No pending online orders
                </div>
              )}
              {allOnlineOrders.map(order => (
                <div key={order.id} style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'var(--bg-base)', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: `5px solid var(--primary)` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '4px' }}>#{order.orderId || order.id} — {order.source || 'Website'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Customer: {order.customer || 'Guest'} | Time: {order.timePlaced}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                        {order.totalAmount ? formatCurrency(Number(order.totalAmount)) : '—'}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pending Approval</div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flex: 1 }}>
                    Items: {(() => {
                      try {
                        if (order.items && order.items.trim().startsWith('[')) {
                          const arr = JSON.parse(order.items);
                          // CheckoutView.tsx sends {product_id, quantity} with
                          // no name at all — look it up from the already-
                          // synced local catalog instead of trusting a name
                          // field that was never there.
                          return arr.map((i: any) => {
                            // Website's Product.id is a string ("196"); db.products
                            // keys are numeric -- strict === never matched.
                            const product = allProducts.find((p: any) => String(p.id) === String(i.product_id ?? i.id));
                            const name = i.name || product?.name || 'Unknown item';
                            return `${i.qty || i.quantity || 1}x ${name}`;
                          }).join(', ');
                        }
                      } catch(e) {}
                      return order.items;
                    })()}
                  </div>
                  
                  {order.kdsStatus === 'ACCEPTED' ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1, padding: '12px', fontWeight: 'bold', textAlign: 'center', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent-green)', borderRadius: '5px', border: '1px solid var(--accent-green)' }}>
                        <CheckCircle size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }} />
                        Accepted (Timer: {(() => { const kot = kots.find(k => k.bridgeOrderId === order.id); return kot ? <KOTTimer kot={kot} /> : 'N/A'; })()})
                      </div>
                      <button className="btn-action" onClick={async () => {
                        const products = await db.products.toArray();
                        let parsedCart: any[] = [];
                        try {
                          if (order.items && order.items.trim().startsWith('[')) {
                            const arr = JSON.parse(order.items);
                            // Same gap as the Items preview above: these entries
                            // carry product_id, not name — matching by name (i.name
                            // is undefined here) never found anything and threw
                            // inside this try/catch, silently printing an empty bill.
                            parsedCart = arr.map((i: any) => {
                              // Website's Product.id is a string ("196"); db.products
                              // keys are numeric -- strict === never matched.
                              const product = products.find(p => String(p.id) === String(i.product_id ?? i.id));
                              const name = i.name || product?.name || 'Unknown item';
                              return { name, price: product ? product.price : (i.price || 0), qty: i.qty || i.quantity || 1 };
                            });
                          } else {
                            parsedCart = (order.items || '').split(',').map((part: string) => {
                              const m = part.trim().match(/^(\d+)x\s+(.+)$/);
                              let name = part.trim(); let qty = 1;
                              if (m) { qty = parseInt(m[1]); name = m[2].trim(); }
                              const product = products.find(p => p.name.toLowerCase() === name.toLowerCase());
                              return { name, price: product ? product.price : 0, qty };
                            });
                          }
                        } catch(e) {}
                        // Use the order's own real, already-decided figures (tax,
                        // delivery fee, loyalty discount) instead of
                        // calculateSubtotalWithTax's blind recompute, which has no
                        // discount/loyalty awareness at all -- order already has
                        // these fields straight from the backend, no extra fetch needed.
                        const subTotal = parsedCart.reduce((s: number, i: any) => s + (i.price || 0) * (i.qty || 1), 0);
                        const grandTotal = parseFloat(order.totalAmount) || 0;
                        setPrintData({ type: 'BILL', data: { orderType: 'Delivery', cart: parsedCart, orderId: order.id, subTotal, tax: order.tax_amount || 0, taxPercent: branchSettings?.tax_percentage ?? 0, loyaltyDiscount: order.loyalty_discount || 0, deliveryFee: order.delivery_fee || 0, grandTotal, cashGiven: grandTotal, returnAmount: 0, time: new Date().toLocaleString() }, printCount: posSettings.billPrintQty || 1 });
                      }} style={{ padding: '12px 20px', background: 'var(--accent-yellow)', color: 'black', fontWeight: 'bold', borderRadius: '5px', border: 'none', cursor: 'pointer' }} title="Print Bill Slip">
                        <Printer size={18} />
                      </button>
                    </div>
                  ) : order.kdsStatus === 'NEW_KOT' ? (
                    <div style={{ padding: '12px', width: '100%', fontWeight: 'bold', textAlign: 'center', background: 'rgba(251, 191, 36, 0.1)', color: 'var(--accent-yellow)', borderRadius: '5px', border: '1px solid var(--accent-yellow)' }}>
                      <Clock size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }} />
                      Sent to KDS (Pending Chef)
                    </div>
                  ) : (
                    <button className="btn-action btn-order" style={{ padding: '12px', width: '100%', fontWeight: 'bold' }} onClick={async () => {
                      handleAcceptOnlineOrder(order);
                    }}>Accept & Send to KDS</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TERMINAL ORDERS VIEW */}
        {activeMenu === 'Terminal' && (
          <div style={{ padding: '20px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
              <h2 style={{ margin: 0, color: 'var(--accent-green)' }}><Navigation size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }} />Incoming Terminal Orders</h2>
              <button
                disabled={isGeneratingTabletLink}
                onClick={async () => {
                  if (!currentUser?.store_id) {
                    setToast({ message: 'No branch/store detected for this session. Please re-login.', type: 'error' });
                    return;
                  }
                  setIsGeneratingTabletLink(true);
                  try {
                    const res = await apiFetch('/terminal/generate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ store_id: currentUser.store_id, waiter_name: 'Waiter' }),
                      auth: true,
                    });
                    const data = await res.json().catch(() => null);
                    if (res.ok && data?.success) {
                      setGeneratedWaiterPin(data.pin);
                      setWaiterPinModalOpen(true);
                    } else {
                      setToast({ message: data?.message || `Failed to generate tablet link (HTTP ${res.status}). Try logging in again.`, type: 'error' });
                    }
                  } catch (e) {
                    console.error('Generate Tablet Link failed:', e);
                    setToast({ message: 'Network error while generating tablet link. Check your connection to the server.', type: 'error' });
                  } finally {
                    setIsGeneratingTabletLink(false);
                  }
                }}
                style={{ background: 'var(--accent-green)', color: 'black', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: isGeneratingTabletLink ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isGeneratingTabletLink ? 0.6 : 1 }}
              >
                <Plus size={18} /> {isGeneratingTabletLink ? 'Generating...' : 'Generate Tablet Link'}
              </button>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Navigation size={20} color="var(--accent-green)" /> Connected Waiters ({terminalSessions.length})
                </h3>
                {terminalSessions.length > 0 && (
                  <button onClick={handleDisconnectAllSessions} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    Disconnect All
                  </button>
                )}
              </div>

              {terminalSessions.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)' }}>
                  No tablets currently connected. Generate a PIN to let waiters login.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                  {terminalSessions.map((session) => {
                    const isOnline = !!session.socket_id;
                    const statusLabel = !session.is_active ? 'DISCONNECTED' : isOnline ? 'ONLINE' : 'OFFLINE';
                    const statusColor = !session.is_active ? '#94a3b8' : isOnline ? 'var(--accent-green)' : '#f59e0b';
                    return (
                      <div key={session.id} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px', opacity: session.is_active ? 1 : 0.7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusColor, boxShadow: isOnline ? `0 0 10px ${statusColor}` : 'none' }}></div>
                            <span style={{ color: 'white', fontWeight: 'bold' }}>{session.device_name || session.waiter_name || 'Unnamed device'}</span>
                          </div>
                          <span style={{ color: statusColor, fontSize: '0.75rem', fontWeight: 'bold' }}>{statusLabel}</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Waiter: {session.waiter_name}</div>
                        {session.table_no && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Table: {session.table_no}</div>}
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Connected: {session.connected_at ? new Date(session.connected_at).toLocaleString() : 'N/A'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Last activity: {session.last_activity_at ? new Date(session.last_activity_at).toLocaleTimeString() : 'N/A'}</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          {session.is_active ? (
                            <button onClick={() => handleDisconnectSession(session.id)} style={{ flex: 1, background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
                              Disconnect
                            </button>
                          ) : (
                            <button onClick={() => handleReconnectSession(session.id)} style={{ flex: 1, background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
                              Reconnect
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pending Orders (left) / Active Terminal Orders in Kitchen (right) — split into
                two columns. Real Order rows (order_source === 'WAITER'), not the old dead
                socket relay + local-only Dexie table -- the KOT is already live in the
                kitchen the instant the waiter sends it, so this is a read-only view of that
                same real data plus a real Settle action, not a second "send to kitchen" step. */}
            {(() => {
              const pendingWaiterOrders = terminalPanelOrders.filter(o => o.status === 'PENDING');
              const activeWaiterOrders = terminalPanelOrders.filter(o => o.status === 'PREPARING' || o.status === 'READY');
              const waiterNameFor = (order: any) => terminalSessions.find((s: any) => s.id === order.terminal_session_id)?.waiter_name || 'Waiter';
              const orderItemsList = (order: any) => (order.items || []).map((i: any) => ({
                name: i.product?.name || `Item #${i.product_id}`,
                qty: i.quantity,
                price: i.price,
              }));
              return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start', marginTop: '20px' }}>
            <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 10px 0' }}>
              <h3 style={{ margin: 0, color: 'white' }}>Pending Orders</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', paddingRight: '10px' }}>
              {pendingWaiterOrders.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '0.95rem' }}>
                  No pending terminal orders
                </div>
              )}
              {pendingWaiterOrders.map(order => (
                <div key={order.id} style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'var(--bg-base)', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: `5px solid var(--accent-yellow)` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: 'white' }}>Table {order.table_no}</h3>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Waiter: {waiterNameFor(order)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '1.1rem' }}>Rs. {(order.total_amount || 0).toFixed(2)}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{order.business_date ? new Date(order.business_date).toLocaleTimeString() : ''}</div>
                    </div>
                  </div>

                  <div style={{ background: '#0f172a', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: '#cbd5e1' }}>
                    {orderItemsList(order).map((i: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{i.qty}x {i.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>Rs. {i.price * i.qty}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '12px', width: '100%', fontWeight: 'bold', textAlign: 'center', background: 'rgba(251, 191, 36, 0.1)', color: 'var(--accent-yellow)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-yellow)' }}>
                    <Clock size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }} />
                    Already sent to Kitchen — awaiting chef
                  </div>
                </div>
              ))}
            </div>
            </div>

            <div>
            <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>Active Terminal Orders (In Kitchen)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', paddingRight: '10px' }}>
              {activeWaiterOrders.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '0.95rem' }}>
                  No active terminal orders
                </div>
              )}
              {activeWaiterOrders.map(order => (
                <div key={order.id} style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'var(--bg-base)', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: `5px solid ${order.status === 'READY' ? 'var(--accent-green)' : 'var(--accent-yellow)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: 'white' }}>Table {order.table_no}</h3>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Order #{order.id} · Waiter: {waiterNameFor(order)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '1.1rem' }}>Rs. {(order.total_amount || 0).toFixed(2)}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{order.business_date ? new Date(order.business_date).toLocaleTimeString() : ''}</div>
                    </div>
                  </div>

                  <div style={{ background: '#0f172a', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: '#cbd5e1' }}>
                    {orderItemsList(order).map((i: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{i.qty}x {i.name}</span>
                      </div>
                    ))}
                  </div>

                  {order.status === 'READY' ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn-action" style={{ flex: 1, background: 'var(--accent-green)', color: '#00311f', fontWeight: 'bold', border: 'none', padding: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} onClick={() => handleSettleWaiterOrder(order, 'CASH')}>
                        <Printer size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }} />
                        Settle (Cash)
                      </button>
                      <button className="btn-action" style={{ flex: 1, background: 'var(--bg-panel)', color: 'white', border: '1px solid var(--border-color)', fontWeight: 'bold', padding: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} onClick={() => handleSettleWaiterOrder(order, 'CARD')}>
                        Settle (Card)
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '12px', width: '100%', fontWeight: 'bold', textAlign: 'center', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: 'var(--radius-sm)', border: '1px solid #3b82f6' }}>
                      <Clock size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }} />
                      Preparing in Kitchen
                    </div>
                  )}
                </div>
              ))}
            </div>
            </div>
            </div>
              );
            })()}
          </div>
        )}

        {/* DELIVERY VIEW */}
        {activeMenu === 'Delivery' && (
          <div className="delivery-container animate-slide-up">
            <div className="delivery-sidebar">
              <div className="delivery-sidebar-header">
                <h2 style={{ color: 'var(--accent-yellow)', margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>Active Deliveries</h2>
                <span style={{ backgroundColor: 'var(--border-color)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                  {activeDeliveries.length + pendingLastDaySettlements.length} Active
                </span>
              </div>
              <div className="delivery-list custom-scrollbar">
                {[...activeDeliveries].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0)).map(del => (
                  <div key={del.id} className={`delivery-card ${selectedDeliveryId === del.id ? 'active' : ''}`} onClick={() => setSelectedDeliveryId(del.id)}>
                    <div className="delivery-card-header">
                      <div>
                        <div className="delivery-card-title">Order #{del.id}</div>
                        <div className="delivery-card-subtitle">{del.rider}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <span className={`delivery-status ${del.status === 'OUT_FOR_DELIVERY' ? 'on-way status-pulse' : del.status === 'KITCHEN_PREPARING' ? 'preparing' : del.status === 'DISPATCHED' ? 'dispatched' : del.status === 'ONLINE_ORDER_RECEIVED' ? 'bg-slate-700 text-slate-300' : 'delivered'}`}>
                          {del.status === 'WAITING_CASH_SETTLEMENT' ? 'Delivered - Settlement Pending' : del.status === 'SETTLED' ? 'Completed' : del.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="delivery-address"><MapPin size={14} /><span>{del.address}</span></div>
                    {['READY', 'RIDER_ARRIVED', 'PRINT_BILL', 'WAITING_CASH_SETTLEMENT'].includes(del.status) && (
                      <div className="delivery-settlement-box" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center w-full">
                          {del.status === 'READY' && (
                            <button className="btn-action bg-blue-500 text-white font-bold px-4 py-2" style={{ width: '100%', borderRadius: '4px' }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const res = await apiFetch(del.isPos ? `/pos-orders/${del.bridgeOrderId}/status` : `/online-orders/${del.bridgeOrderId}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'RIDER_ARRIVED' }),
                                    auth: true,
                                  });
                                  if (!res.ok) {
                                    const data = await res.json().catch(() => ({}));
                                    setToast({ message: data.message || `Failed to mark Order #${del.bridgeOrderId} as Rider Arrived.`, type: 'error' });
                                  }
                                } catch {
                                  setToast({ message: `Network error — could not mark Order #${del.bridgeOrderId} as Rider Arrived.`, type: 'error' });
                                }
                              }}
                            >
                              Rider Arrived
                            </button>
                          )}
                          {del.status === 'RIDER_ARRIVED' && (
                            <button className="btn-action bg-green-500 text-white font-bold px-4 py-2 flex justify-center items-center gap-2" style={{ width: '100%', borderRadius: '4px' }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                // Reprint must use the order's real, already-decided
                                // figures -- calculateSubtotalWithTax has no discount/
                                // loyalty awareness at all, so it silently dropped any
                                // redemption, campaign discount, or delivery fee the
                                // order actually charged (tax was also just a re-derived
                                // guess, not the real persisted amount).
                                const subTotal = (del.items || []).reduce((s: number, i: any) => s + (i.price || 0) * (i.qty || 1), 0);
                                let printData: any = { orderType: 'Delivery', cart: del.items, orderId: del.id, subTotal, taxPercent: branchSettings?.tax_percentage ?? 0, time: new Date().toLocaleString() };
                                try {
                                  const res = await apiFetch(del.isPos ? `/pos-orders/${del.bridgeOrderId}` : `/online-orders/${del.bridgeOrderId}`, { auth: true });
                                  if (!res.ok) throw new Error('fetch failed');
                                  const order = await res.json();
                                  const total = del.isPos ? (order.total_amount ?? 0) : (parseFloat(order.totalAmount) || 0);
                                  printData = {
                                    ...printData,
                                    promoDiscount: del.isPos ? (order.discount || 0) : 0,
                                    loyaltyDiscount: order.loyalty_discount || 0,
                                    tax: order.tax_amount || 0,
                                    deliveryFee: order.delivery_fee || 0,
                                    grandTotal: total,
                                    cashGiven: total,
                                    returnAmount: 0,
                                  };
                                } catch {
                                  const { tax, grandTotal } = calculateSubtotalWithTax(del.items, taxRate);
                                  printData = { ...printData, tax, grandTotal, cashGiven: grandTotal, returnAmount: 0 };
                                }
                                setPrintData({ type: 'BILL', data: printData, printCount: posSettings.billPrintQty || 1 });
                                try {
                                  const res = await apiFetch(del.isPos ? `/pos-orders/${del.bridgeOrderId}/status` : `/online-orders/${del.bridgeOrderId}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'PRINT_BILL' }),
                                    auth: true,
                                  });
                                  if (!res.ok) {
                                    const data = await res.json().catch(() => ({}));
                                    setToast({ message: data.message || `Bill printed, but Order #${del.bridgeOrderId} status was NOT updated on the server.`, type: 'error' });
                                  }
                                } catch {
                                  setToast({ message: `Bill printed, but Order #${del.bridgeOrderId} status was NOT updated (network error).`, type: 'error' });
                                }
                              }}
                            >
                              <Printer size={18} /> Print Bill
                            </button>
                          )}
                          {del.status === 'PRINT_BILL' && (
                            <button className="btn-action bg-[#fbbf24] text-slate-900 font-bold px-4 py-2" style={{ width: '100%', borderRadius: '4px' }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const res = await apiFetch(del.isPos ? `/pos-orders/${del.bridgeOrderId}/status` : `/online-orders/${del.bridgeOrderId}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'DISPATCHED' }), // rider confirming pickup in the Rider app advances this to OUT_FOR_DELIVERY
                                    auth: true,
                                  });
                                  if (res.ok) {
                                    setToast({ message: 'Order Dispatched to Delivery App!', type: 'success' });
                                  } else {
                                    const data = await res.json().catch(() => ({}));
                                    setToast({ message: data.message || `Failed to dispatch Order #${del.bridgeOrderId}.`, type: 'error' });
                                  }
                                } catch {
                                  setToast({ message: `Network error — could not dispatch Order #${del.bridgeOrderId}.`, type: 'error' });
                                }
                              }}
                            >
                              Dispatch Order
                            </button>
                          )}
                          {del.status === 'WAITING_CASH_SETTLEMENT' && (
                            <>
                              <div style={{ flex: 1 }}>
                                <span className="delivery-settlement-text block" style={{ fontSize: '0.65rem' }}>Collect COD</span>
                                <span className="delivery-settlement-amount">Rs. {del.totalAmount || del.cod || 0}</span>
                              </div>
                              <button className="btn-action btn-order" style={{ padding: '8px 16px', fontSize: '0.75rem', width: 'auto', flex: 'none' }}
                                onClick={async () => {
                                  try {
                                    const res = await apiFetch(del.isPos ? `/pos-orders/${del.bridgeOrderId}/status` : `/online-orders/${del.bridgeOrderId}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'SETTLED' }),
                                      auth: true,
                                    });
                                    if (res.ok) {
                                      setActiveDeliveries(prev => prev.filter(o => o.id !== del.id));
                                      setPendingLastDaySettlements(prev => prev.filter(o => o.bridgeOrderId !== del.bridgeOrderId));
                                      // Land on "Completed" instead of vanishing — keeps the cashier's
                                      // own view in sync with what the rider and website show at this
                                      // same moment (see RC5/RC6 in the rider workflow plan).
                                      setCompletedDeliveries(prev => [{ ...del, status: 'SETTLED' }, ...prev].slice(0, 20));
                                      setToast({ message: 'Cash Settled & Ledger Updated!', type: 'success' });
                                    } else {
                                      const data = await res.json().catch(() => ({}));
                                      setToast({ message: data.message || `Failed to settle Order #${del.bridgeOrderId}. It remains pending.`, type: 'error' });
                                    }
                                  } catch {
                                    setToast({ message: `Network error — Order #${del.bridgeOrderId} was NOT settled. It remains pending.`, type: 'error' });
                                  }
                                }}>
                                Settle Cash
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {pendingLastDaySettlements.length > 0 && pendingLastDaySettlements.map((del: any) => (
                  <div key={`old-${del.bridgeOrderId}`} className="delivery-card animate-slide-up" style={{ border: '2px solid #ef4444' }}>
                    <div className="delivery-header" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="delivery-order-id">Order #{del.bridgeOrderId} (Yesterday)</span>
                        <span className="delivery-time" style={{ color: '#ef4444' }}><Clock size={12} /> Pending Settlement</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <span className="delivery-status delivered text-red-500">Rider Cash Pending</span>
                      </div>
                    </div>
                    <div className="delivery-address"><MapPin size={14} /><span>{del.customerAddress}</span></div>
                    <div className="delivery-settlement-box" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-between items-center w-full">
                        <div style={{ flex: 1 }}>
                          <span className="delivery-settlement-text block" style={{ fontSize: '0.65rem' }}>Collect COD</span>
                          <span className="delivery-settlement-amount">Rs. {del.totalAmount}</span>
                        </div>
                        <button className="btn-action bg-red-600 text-white" style={{ padding: '8px 16px', fontSize: '0.75rem', width: 'auto', flex: 'none', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                          onClick={async () => {
                            try {
                              const res = await apiFetch(`/online-orders/${del.bridgeOrderId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'SETTLED' }),
                                auth: true,
                              });
                              if (res.ok) {
                                setPendingLastDaySettlements(prev => prev.filter(o => o.bridgeOrderId !== del.bridgeOrderId));
                                setToast({ message: 'Cash Settled & Ledger Updated for Yesterday!', type: 'success' });
                              } else {
                                const data = await res.json().catch(() => ({}));
                                setToast({ message: data.message || `Failed to settle Order #${del.bridgeOrderId}. It remains pending.`, type: 'error' });
                              }
                            } catch {
                              setToast({ message: `Network error — Order #${del.bridgeOrderId} was NOT settled. It remains pending.`, type: 'error' });
                            }
                          }}>
                          Settle Cash
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {completedDeliveries.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      Recently Completed
                    </div>
                    {completedDeliveries.map(del => (
                      <div key={`completed-${del.id}`} className="delivery-card" style={{ opacity: 0.7 }}>
                        <div className="delivery-card-header">
                          <div>
                            <div className="delivery-card-title">Order #{del.id}</div>
                            <div className="delivery-card-subtitle">{del.rider}</div>
                          </div>
                          <span className="delivery-status delivered">Completed</span>
                        </div>
                        <div className="delivery-address"><MapPin size={14} /><span>{del.address}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {(() => {
              const selectedDel = activeDeliveries.find(d => d.id === selectedDeliveryId) || activeDeliveries[0];
              return (
                <div className="delivery-map-section">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4ORcXKAWIWgtj2E1hpwpSHvRx0gNJmzNZugakh7LO1tlgyH3m25la9DOeiyE7MtUD0szG9kalFoXFQuscFjOn-KmDLqHMp7YNTorGhn7g03yIU1y1Aw1zXX4lirRTHFvvqRqd5VnD5_3EdxD_BzR1W9nTzMMYOwWCJEwCmgIY0IFgFMFIcf0JeRdjQxM4cLrrededV0Ln-YZhPu1VDjCY-HOLarr09Wt4fUqR5WQJpO_KZr7j-9lDlKpIfRH_lnf2t3OMJhfotwQ" alt="Map Tracking" className="delivery-map-bg" />
                  <div className="delivery-map-overlay"></div>
                  <div className="map-marker" style={{ top: '35%', left: '65%' }}>
                    <div className="map-marker-dot store" title="Restaurant Store Location"><Store size={16} /></div>
                  </div>
                  {selectedDel && selectedDel.status !== 'PREPARING' && (
                    <div className="map-marker" style={{ top: selectedDel.lat || '42%', left: selectedDel.lng || '73%' }}>
                      <div className="flex flex-col items-center">
                        <div className="map-marker-label">
                          <span className="map-marker-title">Tracking {selectedDel.rider.split(' ')[0]}</span>
                          <span className="map-marker-subtitle">{selectedDel.rider.includes('(') ? selectedDel.rider.match(/\(([^)]+)\)/)?.[1] : selectedDel.rider} • {selectedDel.riderDistance}</span>
                        </div>
                        <div className="map-marker-dot">
                          <div className="pulse-animation"></div>
                          <Navigation size={18} style={{ transform: 'rotate(135deg)', position: 'relative', zIndex: 5 }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="map-controls">
                    <button className="map-control-btn"><Plus size={18} /></button>
                    <button className="map-control-btn"><Minus size={18} /></button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* CRM VIEW */}
        {activeMenu === 'Customers' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--bg-base)' }}>
                {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>CRM Loyalty Program</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Attach a customer to the current ticket to earn or redeem loyalty points.</p>
              </div>
              <button
                onClick={() => setShowNewCustomerForm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-yellow)', color: 'black', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 22px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', letterSpacing: '0.5px' }}
              >
                <Plus size={16} /> NEW CUSTOMER
              </button>
            </div>

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '50px', padding: '12px 20px', marginBottom: '28px', maxWidth: '420px' }}>
              <Search size={18} color="var(--text-muted)" style={{ marginRight: '10px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by name, phone or email..."
                value={crmSearch}
                onChange={e => setCrmSearch(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>

            {/* Cards Grid -- real, synchronized customer data (same Customer
                table the website's Account page and POS checkout already
                read/write). Click a card to open the same order
                history/wishlist/addresses/loyalty view available at
                checkout ("View History"), now reachable from here too. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {crmCustomers
                .filter(c => {
                  const q = crmSearch.toLowerCase();
                  return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
                })
                .map(customer => (
                  <div key={customer.id} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', transition: 'border-color 0.2s', cursor: 'pointer' }}
                    onClick={() => handleViewCustomerHistory(customer.id)}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,183,3,0.4)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                  >
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-base)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Users size={22} color="var(--text-muted)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'white' }}>{customer.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Patron ID: {customer.id}</div>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <Phone size={14} /> <span>{customer.phone}</span>
                      </div>
                      {(customer.addresses?.length ?? 0) > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          <MapPin size={14} /> <span>{customer.addresses.length} saved address{customer.addresses.length > 1 ? 'es' : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom row: points + button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '0.95rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        {customer.loyalty_points ?? 0} Pts
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomerPhone(customer.phone);
                          setCustomerName(customer.name);
                          setLiveCustomer(customer);
                          setToast({ message: `${customer.name} attached to current order!`, type: 'success' });
                        }}
                        style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: 'var(--radius-sm)', padding: '7px 18px', fontSize: '0.78rem', fontWeight: 'bold', letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-yellow)'; e.currentTarget.style.color = 'var(--accent-yellow)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'white'; }}
                      >
                        ATTACH TICKET
                      </button>
                    </div>
                  </div>
                ))}
              {crmCustomers.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0' }}>
                  No customers yet. New ones appear here automatically once they order from POS or the website.
                </div>
              )}
            </div>

            {/* New Customer Modal */}
            {showNewCustomerForm && (
              <div className="modal-overlay">
                <div className="modal-content animate-slide-up" style={{ width: '420px' }}>
                  <div className="modal-header">
                    <h2><Users size={20} style={{ display: 'inline', marginRight: '8px' }} />New Customer</h2>
                    <X size={22} style={{ cursor: 'pointer' }} onClick={() => { setShowNewCustomerForm(false); setNewCustomer({ name: '', phone: '' }); }} />
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {(['name', 'phone'] as const).map(field => (
                      <div key={field}>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'capitalize' }}>{field}</label>
                        <input
                          type="text"
                          value={newCustomer[field]}
                          onChange={e => setNewCustomer(prev => ({ ...prev, [field]: e.target.value }))}
                          placeholder={field === 'phone' ? '+92 300 0000000' : 'Full Name'}
                          style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: 'var(--radius-sm)', outline: 'none', fontSize: '0.9rem' }}
                        />
                      </div>
                    ))}
                    <button
                      className="btn-action btn-order"
                      style={{ marginTop: '6px', padding: '13px' }}
                      onClick={async () => {
                        if (!newCustomer.name || !newCustomer.phone) { setToast({ message: 'Name and Phone are required', type: 'error' }); return; }
                        try {
                          // Find-or-create (see CustomersService.createCustomer): an
                          // already-registered number resolves to that existing
                          // customer instead of failing -- this can never actually
                          // throw for a duplicate phone anymore, only genuine
                          // network/permission errors reach the catch below.
                          const result = await createCustomer({ brand_id: currentUser.brand_id, phone: newCustomer.phone, name: newCustomer.name });
                          setToast({
                            message: result.alreadyExisted
                              ? `${result.name} already exists — showing their record.`
                              : `${newCustomer.name} added to CRM!`,
                            type: 'success',
                          });
                          setShowNewCustomerForm(false);
                          setNewCustomer({ name: '', phone: '' });
                          refreshCrmCustomers();
                        } catch (e) {
                          setToast({ message: 'Failed to create customer — please check your connection and try again.', type: 'error' });
                        }
                      }}
                    >
                      ADD CUSTOMER
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WHATSAPP INCOMING POPUP */}
        {showWhatsAppPopup && whatsAppMessage && (
          <div style={{ position: 'absolute', bottom: '30px', right: '30px', background: '#25D366', color: 'black', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 1000, maxWidth: '350px', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
                <MessageCircle size={20} /> New WhatsApp Order
              </div>
              <button onClick={() => setShowWhatsAppPopup(false)} style={{ background: 'transparent', border: 'none', color: 'black', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>{whatsAppMessage.name}: "{whatsAppMessage.message}"</p>
            <button 
              onClick={() => {
                setShowWhatsAppPopup(false);
                setActiveMenu('WhatsApp');
              }}
              style={{ background: 'black', color: 'white', width: '100%', padding: '10px', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer' }}
            >
              View in WhatsApp Hub
            </button>
          </div>
        )}

        {/* WHATSAPP VIEW */}
        {activeMenu === 'WhatsApp' && (
          <div style={{ padding: '20px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)', flex: 1, display: 'flex', gap: '20px', overflow: 'hidden' }}>
            <div style={{ flex: 1.5, background: '#111b21', borderRadius: 'var(--radius-md)', border: '1px solid #202c33', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ background: '#202c33', padding: '15px', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MessageCircle size={20} color="#25D366" />
                  <span>WhatsApp Connection Hub (Basic Tier)</span>
                </div>
                <span style={{ fontSize: '0.8rem', background: '#0b141a', color: 'var(--accent-yellow)', padding: '3px 8px', borderRadius: '10px' }}>Active Session</span>
              </div>
              <div style={{ flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '25px', overflowY: 'auto' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', background: 'rgba(37, 211, 102, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                    <MessageCircle size={40} color="#25D366" />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '8px' }}>WhatsApp Web connection inside POS</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '450px', margin: '0 auto', lineHeight: '1.4' }}>
                    Browser security policies (X-Frame-Options) prevent embedding the official WhatsApp Web page directly inside the localhost server.
                  </p>
                </div>
                <div style={{ background: '#202c33', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-yellow)' }}>
                  <h4 style={{ color: 'var(--accent-yellow)', marginBottom: '10px', fontSize: '1rem' }}>💡 How to connect & use WhatsApp Web:</h4>
                  <ul style={{ paddingLeft: '20px', color: 'white', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', lineHeight: '1.4' }}>
                    <li>Niche diye gaye green button <strong>"Open WhatsApp Web"</strong> par click karein.</li>
                    <li>Naye tab mein apne phone se WhatsApp setting mein ja kar <strong>"Link a Device"</strong> scan karein.</li>
                    <li>WhatsApp Web tab ko background mein open rehne dein taa ke sync complete rahe.</li>
                  </ul>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                  <button onClick={() => window.open('https://web.whatsapp.com', '_blank')} style={{ background: '#25D366', color: 'black', border: 'none', borderRadius: 'var(--radius-sm)', padding: '15px 30px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)' }}>
                    Open WhatsApp Web (New Tab)
                  </button>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid rgba(37, 211, 102, 0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' }}>
                <h3 style={{ color: '#25D366', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MessageCircle size={20} /> WhatsApp Catalog API (Premium)
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>Simulated incoming WhatsApp Business orders. Convert text directly to cart items and pull CRM records!</p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '5px' }}>
                {simulatedChats.map(chat => {
                  const isSelected = selectedChatId === chat.id;
                  return (
                    <div key={chat.id} onClick={() => setSelectedChatId(chat.id)} style={{ background: isSelected ? 'var(--bg-panel-hover)' : 'var(--bg-panel)', padding: '15px', borderRadius: 'var(--radius-sm)', borderLeft: isSelected ? '4px solid #25D366' : '4px solid transparent', cursor: 'pointer', transition: 'all 0.2s', border: isSelected ? '1px solid #25D366' : '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                         <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>{chat.phone} ({chat.name})</span>
                         <span style={{ background: chat.isOld ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 124, 105, 0.2)', color: chat.isOld ? 'var(--accent-green)' : 'var(--primary)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                           {chat.isOld ? 'Old Customer' : 'New Customer'}
                         </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{chat.message}"</div>
                      <div style={{ color: 'var(--accent-yellow)', fontSize: '0.8rem', fontWeight: '500' }}>{chat.history}</div>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const activeChat = simulatedChats.find(c => c.id === selectedChatId) || simulatedChats[0];
                return (
                  <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                    <div style={{ background: 'var(--bg-panel)', padding: '15px', borderRadius: 'var(--radius-sm)', marginBottom: '15px' }}>
                      <div style={{ fontWeight: 'bold', color: 'white', marginBottom: '5px' }}>Message Preview:</div>
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.95rem' }}>"{activeChat.message}"</div>
                      <div style={{ marginTop: '10px', color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '0.85rem' }}>🛒 Parsed Order: {activeChat.repeatItems}</div>
                    </div>
                    <button onClick={() => handleConvertWhatsAppOrder(activeChat)} className="btn-action" style={{ background: '#25D366', color: 'black', width: '100%', fontWeight: 'bold', padding: '15px', fontSize: '1.05rem' }}>
                      Convert to Order & Load CRM
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* GARAGE VIEW */}
        {activeMenu === 'Garage' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--bg-base)' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>Garage</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Operations, maintenance and system utilities for this terminal.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {[
                { label: 'Cash In / Out', desc: 'Record cash drawer entries and withdrawals', icon: <Banknote size={26} />, action: () => setModalType('CASH_OUT'), color: 'var(--accent-yellow)' },
                { label: 'Business Day Close', desc: 'End current business day and generate daily report', icon: <Moon size={26} />, action: () => setModalType('DAY_CLOSE'), color: '#818cf8' },
                { label: 'POS Settings', desc: 'Configure printer, KOT mode and till lock', icon: <Settings size={26} />, action: () => setModalType('SETTINGS'), color: 'var(--primary)' },
                ...(posSettings.terminalEngineEnabled ? [{ label: 'Generate Waiter PIN', desc: 'Create temporary login for Waiter Terminal', icon: <Navigation size={26} />, action: () => setModalType('WAITER_PIN'), color: 'var(--accent-green)' }] : []),
              ].map(item => (
                <div key={item.label} onClick={item.action} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ color: item.color, marginBottom: '14px' }}>{item.icon}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'white', marginBottom: '6px' }}>{item.label}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {activeMenu === 'Dashboard' && (
          <div style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
              <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px' }}>TODAY TOTAL REVENUE</span>
                <span style={{ color: 'var(--accent-green)', fontSize: '1.6rem', fontWeight: 'bold' }}>Rs. {activeShift === 'Shift 1' ? shift1Sales.toLocaleString() : (shift1Sales + shift2Sales).toLocaleString()}</span>
                <span style={{ color: 'var(--accent-green)', fontSize: '0.8rem' }}>+12.4% from yesterday</span>
              </div>
              <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px' }}>ACTIVE ORDER NUMBER</span>
                <span style={{ color: 'var(--accent-yellow)', fontSize: '1.6rem', fontWeight: 'bold' }}>#{kots.length > 0 ? kots[0].orderId : '45555'}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>In-queue pending ticket</span>
              </div>
              <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px' }}>LOYALTY PATRONS</span>
                <span style={{ color: 'white', fontSize: '1.6rem', fontWeight: 'bold' }}>{crmCustomers.length} Clients</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Active point multipliers</span>
              </div>
              <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px' }}>ACTIVE WORKSPACE STATUS</span>
                <span style={{ color: 'var(--accent-green)', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', background: 'var(--accent-green)', borderRadius: '50%', display: 'inline-block' }}></span>
                  ONLINE • SECURE
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No network overhead</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: 'white', fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '3px' }}>Need to load checkout?</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Direct redirection to primary Point of Sales (POS) screen layout.</p>
              </div>
              <button onClick={() => setActiveMenu('Home')} style={{ padding: '10px 20px', background: 'var(--accent-yellow)', color: 'black', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                ENTER SALES PANEL →
              </button>
            </div>
          </div>
        )}

        {/* SELECT VARIANT MODAL */}
        {modalType === 'SELECT_VARIANT' && pendingVariantProduct && (() => {
          const hasVariants = pendingVariantProduct.variants && pendingVariantProduct.variants.length > 0;
          // "Extra Toppings" is configured in Admin as a product category
          // (same convention as "Add-ons"), not a real Modifier Group -- no
          // modifier group named anything like "Topping" exists anywhere in
          // this system's data. Synthesize one at render time from whatever
          // real products currently sit in that category, so the rest of
          // this modal's already-working modifier machinery (selection
          // state, price display, flattening into the cart line, KOT/receipt
          // "+ Name" text) handles them with zero further changes.
          const extraToppingProducts = allProducts.filter((p: any) =>
            p.categories?.some((c: any) => c.name.toLowerCase() === 'extra toppings'),
          );
          const syntheticToppingsGroup = extraToppingProducts.length > 0 ? {
            id: 'extra-toppings',
            name: 'Extra Toppings',
            is_required: false,
            modifiers: extraToppingProducts.map((p: any) => ({ id: p.id, name: p.name, additional_price: p.price })),
          } : null;
          const modifierGroups: any[] = [
            ...(pendingVariantProduct.modifierGroups || []),
            ...(syntheticToppingsGroup ? [syntheticToppingsGroup] : []),
          ];
          const hasModifiers = modifierGroups.length > 0;
          const flattenedModifiers = (): import('./pos/types').CartModifier[] =>
            modifierGroups.flatMap(g => (selectedModifiers[g.id] || []).map(sel => ({
              groupId: g.id, groupName: g.name, modifierId: sel.modifierId, name: sel.name, price: sel.price,
            })));
          const toggleModifier = (group: any, modifier: any) => {
            setSelectedModifiers(prev => {
              const current = prev[group.id] || [];
              const exists = current.some(m => m.modifierId === modifier.id);
              if (group.is_required) {
                // Radio: required groups always resolve to exactly one pick.
                return { ...prev, [group.id]: [{ modifierId: modifier.id, name: modifier.name, price: modifier.additional_price || 0 }] };
              }
              if (exists) {
                return { ...prev, [group.id]: current.filter(m => m.modifierId !== modifier.id) };
              }
              if (group.max_selection && current.length >= group.max_selection) return prev;
              return { ...prev, [group.id]: [...current, { modifierId: modifier.id, name: modifier.name, price: modifier.additional_price || 0 }] };
            });
          };
          const closeModal = () => { setModalType('NONE'); setPendingVariantProduct(null); setSelectedModifiers({}); setActiveTab('SIZES'); setToppingsVariantId(null); };
          const toppingsSelectedVariant = pendingVariantProduct.variants?.find((v: any) => v.id === toppingsVariantId) || pendingVariantProduct.variants?.[0];

          return (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content animate-slide-up" style={{ width: '600px', height: '80%', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header" style={{ flexShrink: 0, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <h2>Select Options for {pendingVariantProduct.name}</h2>
                </div>
                <X size={24} style={{cursor:'pointer'}} onClick={closeModal} />
              </div>

              {hasVariants && hasModifiers && (
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '10px' }}>
                  <button
                    onClick={() => setActiveTab('SIZES')}
                    style={{ flex: 1, padding: '10px', background: activeTab === 'SIZES' ? 'var(--accent-yellow)' : 'transparent', color: activeTab === 'SIZES' ? 'black' : 'var(--text-muted)', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                  >
                    Choose Size
                  </button>
                  <button
                    onClick={() => setActiveTab('TOPPINGS')}
                    style={{ flex: 1, padding: '10px', background: activeTab === 'TOPPINGS' ? 'var(--accent-yellow)' : 'transparent', color: activeTab === 'TOPPINGS' ? 'black' : 'var(--text-muted)', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                  >
                    Extra Toppings
                  </button>
                </div>
              )}

              <div style={{ padding: '10px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hasVariants && (!hasModifiers || activeTab === 'SIZES') && pendingVariantProduct.variants.map((v: any) => (
                  <button
                    key={v.id}
                    className="btn-action"
                    onClick={() => {
                      addToCart(pendingVariantProduct, v, flattenedModifiers());
                      setToast({ message: `${v.name} added`, type: 'success' });
                      closeModal();
                    }}
                    style={{ padding: '8px 15px', background: 'var(--bg-panel)', color: 'white', border: '1px solid var(--border-color)', fontSize: '1rem', fontWeight: 'bold', borderRadius: '10px', width: '100%', display: 'flex', alignItems: 'center', gap: '15px' }}
                  >
                    {pendingVariantProduct.img && (
                      <img src={pendingVariantProduct.img} alt={pendingVariantProduct.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                      <span>{v.name}</span>
                      <span style={{ color: 'var(--accent-green)' }}>Rs. {v.price}</span>
                    </div>
                  </button>
                ))}

                {hasModifiers && (!hasVariants || activeTab === 'TOPPINGS') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {hasVariants && pendingVariantProduct.variants.length > 1 && (
                      <div>
                        <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Size (for Add to Cart below)</span>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {pendingVariantProduct.variants.map((v: any) => (
                            <button
                              key={v.id}
                              onClick={() => setToppingsVariantId(v.id)}
                              style={{
                                padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                                background: toppingsSelectedVariant?.id === v.id ? 'rgba(250,204,21,0.15)' : 'var(--bg-panel)',
                                border: `1px solid ${toppingsSelectedVariant?.id === v.id ? 'var(--accent-yellow)' : 'var(--border-color)'}`,
                                color: toppingsSelectedVariant?.id === v.id ? 'var(--accent-yellow)' : 'white',
                                fontWeight: toppingsSelectedVariant?.id === v.id ? 'bold' : 'normal',
                              }}
                            >
                              {v.name} · Rs. {v.price}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {modifierGroups.map(group => (
                      <div key={group.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{group.name}</span>
                          {group.is_required && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--accent-yellow)', background: 'rgba(250,204,21,0.1)', padding: '2px 8px', borderRadius: '10px' }}>Required</span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {(group.modifiers || []).map((modifier: any) => {
                            const isSelected = (selectedModifiers[group.id] || []).some(m => m.modifierId === modifier.id);
                            return (
                              <button
                                key={modifier.id}
                                onClick={() => toggleModifier(group, modifier)}
                                style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                                  background: isSelected ? 'rgba(250,204,21,0.15)' : 'var(--bg-panel)',
                                  border: `1px solid ${isSelected ? 'var(--accent-yellow)' : 'var(--border-color)'}`,
                                  color: isSelected ? 'var(--accent-yellow)' : 'white',
                                  fontWeight: isSelected ? 'bold' : 'normal',
                                }}
                              >
                                <span>{modifier.name}</span>
                                {modifier.additional_price > 0 && <span>+Rs. {modifier.additional_price}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ padding: '15px 20px', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
                {hasVariants && activeTab === 'TOPPINGS' ? (
                  <button
                    onClick={() => {
                      addToCart(pendingVariantProduct, toppingsSelectedVariant, flattenedModifiers());
                      setToast({ message: `${toppingsSelectedVariant?.name || pendingVariantProduct.name} added`, type: 'success' });
                      closeModal();
                    }}
                    style={{ width: '100%', padding: '15px', background: 'var(--accent-yellow)', color: 'black', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Add {toppingsSelectedVariant?.name} to Cart
                  </button>
                ) : hasVariants ? (
                  <button
                    onClick={closeModal}
                    style={{ width: '100%', padding: '15px', background: 'var(--bg-panel)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      addToCart(pendingVariantProduct, undefined, flattenedModifiers());
                      setToast({ message: `${pendingVariantProduct.name} added`, type: 'success' });
                      closeModal();
                    }}
                    style={{ width: '100%', padding: '15px', background: 'var(--accent-yellow)', color: 'black', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })()}
      </main>

      {/* CART SIDEBAR */}
      {(activeMenu === 'Home' || activeMenu === 'Online') && (
        <aside className="cart-sidebar">
          <div className="cart-header">
            <h2>Order #45555</h2>
            <div className="cart-header-actions"><Printer size={20} /><Trash2 size={20} color="var(--primary)" onClick={() => setCart([])} /></div>
          </div>
          <div style={{ padding: '0 16px 10px', marginTop: '10px' }}>
            <select 
              value={orderType} 
              onChange={(e) => setOrderType(e.target.value)}
              disabled={isWaiterMode}
              style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: 'var(--radius-sm)', padding: '6px 10px', outline: 'none', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {['Dine In', 'Delivery', 'Take Away'].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div style={{ padding: '0 16px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}>
              <Phone size={14} color="var(--text-muted)" style={{ marginRight: '8px' }} />
              <input type="tel" placeholder="Customer Mobile (for Points)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.8rem' }} />
            </div>
            {liveCustomer && (
              <div style={{ marginTop: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Loyalty Points: <b>{liveCustomer.loyalty_points}</b></span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      onClick={() => handleViewCustomerHistory(liveCustomer.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                    >
                      View History
                    </button>
                    <button
                      onClick={() => {
                        // Quick-fill to the customer's full balance — the
                        // exact amount actually applied is still capped by
                        // cartEngine (and re-capped by the backend) to
                        // whatever's eligible (non-promo items + delivery
                        // fee), so this can never over-redeem. The cashier
                        // can dial it down to a partial amount in the
                        // Payment modal's Redeem Points control.
                        if (liveCustomer.loyalty_points > 0) {
                          setPointsToRedeem(liveCustomer.loyalty_points);
                          setToast({ message: `${liveCustomer.loyalty_points} Points ready to redeem — adjust or confirm at Payment.`, type: 'success' });
                        }
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#4edea3', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Redeem Points
                    </button>
                  </div>
                </div>
                {/* Saved-address pick-list -- cashier explicitly picks one
                    rather than anything auto-filling, since a returning
                    customer can have several addresses. Clicking fills the
                    same customerAddress state the DELIVERY_DETAILS modal's
                    textarea already reads/writes -- no downstream changes
                    needed. */}
                {(liveCustomer.addresses || []).length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {liveCustomer.addresses.map((a: any) => (
                      <button
                        key={a.id}
                        onClick={() => setCustomerAddress(a.address)}
                        title={a.address}
                        style={{
                          background: customerAddress === a.address ? 'var(--primary)' : 'var(--bg-base)',
                          color: customerAddress === a.address ? 'black' : 'white',
                          border: '1px solid var(--border-color)',
                          borderRadius: '999px',
                          padding: '4px 10px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        <MapPin size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {orderType === 'Dine In' && (
            <div style={{ padding: '0 16px 10px' }}>
              <select 
                value={tableNumber} 
                onChange={(e) => setTableNumber(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: 'var(--radius-sm)', padding: '8px 10px', outline: 'none', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                <option value="" disabled>Select Table</option>
                {['T1','T2','T3','T4','T5','T6','T7','T8', 'T9', 'T10', 'VIP-1', 'VIP-2'].map(t => (
                  <option key={t} value={t}>Table: {t}</option>
                ))}
              </select>
            </div>
          )}
          <div className="cart-items-list">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                {item.img ? (
                  <img src={item.img} className="cart-item-img" alt={item.name} />
                ) : (
                  <div className="cart-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: '#1a1a24' }}>
                    <UtensilsCrossed size={16} />
                  </div>
                )}
                <div className="cart-item-details">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-qty-controls">
                    <button className="cart-qty-btn" onClick={() => updateQty(item.cartItemId || item.id, -1)}><Minus size={14}/></button>
                    <span>{item.qty}</span>
                    <button className="cart-qty-btn" onClick={() => updateQty(item.cartItemId || item.id, 1)}><Plus size={14}/></button>
                  </div>
                </div>
                <div className="cart-item-price" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span>Rs. {item.price * item.qty}</span>
                  {getProductDiscount(item) > 0 && (
                    <span style={{ fontSize: '0.65rem', color: '#ec4899', marginTop: '2px' }}>
                      {getProductDiscount(item)}% OFF (Rs. {item.price * item.qty - (item.price * item.qty * (getProductDiscount(item) / 100))})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="totals-panel" style={{ padding: '6px 12px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ marginBottom: '4px' }}>
              <button 
                onClick={() => setModalType('ADD_ONS')}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-panel-hover)', border: '1px dashed #fbbf24', color: '#fbbf24', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', cursor: 'pointer' }}
              >
                + Add ons
              </button>
              <input
                type="text"
                placeholder="Add special instructions (e.g. Extra Cheese)"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: 'var(--radius-sm)', padding: '4px 8px', outline: 'none', fontSize: '0.7rem' }}
              />
            </div>
            <div className="totals-row" style={{ padding: '1px 0', fontSize: '0.75rem' }}><span>Sub Total</span><span>Rs. {subTotal.toFixed(2)}</span></div>
            {promoDiscountAmount > 0 && (
              <div className="totals-row" style={{ padding: '1px 0', fontSize: '0.75rem', color: '#ec4899' }}><span>Promotional Discounts</span><span>-Rs. {promoDiscountAmount.toFixed(2)}</span></div>
            )}
            {bogoDiscountAmount > 0 && (
              <div className="totals-row" style={{ padding: '1px 0', fontSize: '0.75rem', color: '#f59e0b' }}><span>BOGO Reward</span><span>-Rs. {bogoDiscountAmount.toFixed(2)}</span></div>
            )}
            {bundleDiscountAmount > 0 && (
              <div className="totals-row" style={{ padding: '1px 0', fontSize: '0.75rem', color: '#4edea3' }}><span>Bundle/Combo Deal</span><span>-Rs. {bundleDiscountAmount.toFixed(2)}</span></div>
            )}
            {giftDiscountAmount > 0 && (
              <div className="totals-row" style={{ padding: '1px 0', fontSize: '0.75rem', color: '#a78bfa' }}>
                <span>🎁 FREE ITEM: {giftApplications[0]?.giftProductName}</span><span>-Rs. {giftDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            {/* MARKETING-003 §8 — Promotion Stack Explainer: shows the customer/cashier WHY the manual discount/loyalty redemption isn't reducing every line. Per-item, not all-or-nothing — cartEngine.calculateOrderTotals scopes discountPercent to only the non-promotional lines automatically. */}
            {cartHasCompanyPromotion() && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px 0' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', background: 'rgba(236,72,153,0.15)', color: '#ec4899' }}>Company Promotion Applied</span>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', background: 'rgba(148,163,184,0.15)', color: '#94a3b8' }}>Discount/Loyalty apply to non-promo items only</span>
              </div>
            )}
            {!isWaiterMode && (
            <div className="totals-row" style={{ padding: '1px 0', fontSize: '0.75rem', alignItems: 'center' }}>
              <span>Discount</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="number" 
                  min="0" max="100" 
                  value={discountPercent} 
                  onChange={e => handleDiscountChange(e.target.value)}
                  className="no-spinners"
                  style={{ width: '45px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fbbf24', borderRadius: '3px', padding: '3px 5px', fontSize: '0.9rem', textAlign: 'center', outline: 'none' }}
                />
                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>%</span>
                <span style={{ marginLeft: '4px', color: '#fbbf24' }}>-Rs. {discountAmount.toFixed(2)}</span>
              </div>
            </div>
            )}
            {pointsRedeemed > 0 && (
              <div className="totals-row" style={{ padding: '1px 0', fontSize: '0.75rem', color: '#4edea3' }}>
                <span>Redeem Points ({pointsRedeemed} pts)</span><span>-Rs. {loyaltyDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="totals-row" style={{ padding: '1px 0', fontSize: '0.75rem' }}><span>Tax ({branchSettings?.tax_percentage ?? 0}%)</span><span>Rs. {tax.toFixed(2)}</span></div>
            {deliveryFee > 0 && (
              <div className="totals-row" style={{ padding: '1px 0', fontSize: '0.75rem' }}><span>Delivery Fee</span><span>Rs. {deliveryFee.toFixed(2)}</span></div>
            )}
            <div className="totals-row grand" style={{ padding: '2px 0', marginTop: '2px', marginBottom: '4px' }}><span style={{ fontSize: '0.85rem' }}>Grand Total</span><span className="value" style={{ fontSize: '1.1rem' }}>Rs. {grandTotal.toFixed(2)}</span></div>
            {isWaiterMode ? (
              <div className="action-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                <button className="btn-action btn-save" style={{ fontSize: '1rem', padding: '10px 0', minHeight: '40px', fontWeight: 'bold' }} onClick={handleSendTerminalOrder}>SEND TO POS</button>
                <button className="btn-action btn-danger" style={{ fontSize: '0.75rem', padding: '2px 0', minHeight: '26px' }} onClick={() => setCart([])}>Cancel</button>
              </div>
            ) : (
            <div className="action-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <button className="btn-action" style={{ background: 'var(--bg-panel)', color: 'white', border: '1px solid var(--border-color)', fontSize: '0.75rem', padding: '2px 0', minHeight: '26px' }} onClick={handleHoldOrder}>Hold</button>
              <button className="btn-action btn-save" style={{ fontSize: '0.75rem', padding: '2px 0', minHeight: '26px' }} onClick={handleCreateKOT}>KOT</button>
              <button className="btn-action btn-danger" style={{ fontSize: '0.75rem', padding: '2px 0', minHeight: '26px' }} onClick={() => setCart([])}>Cancel</button>
              <button className="btn-action" style={{ background: 'var(--accent-green)', color: 'black', fontWeight: 'bold', fontSize: '0.85rem', padding: '2px 0', minHeight: '26px' }} onClick={() => {
                if (cart.length === 0) return setToast({ message: 'Cart is empty', type: 'error' });
                if (!validateDeliveryCustomerInfo(orderType, customerName, customerAddress, customerPhone).valid) {
                  setPendingDeliveryAction('PAY');
                  return setModalType('DELIVERY_DETAILS');
                }
                setModalType('PAYMENT');
              }}>Pay</button>
            </div>
            )}
            {heldOrders.length > 0 && !isWaiterMode && (
              <button className="btn-action" style={{ width: '100%', marginTop: '6px', padding: '4px 0', fontSize: '0.8rem', minHeight: '26px', background: 'var(--bg-panel-hover)', color: 'var(--accent-yellow)', border: '1px solid var(--accent-yellow)' }} onClick={() => setModalType('HOLD_ORDERS')}>
                <PauseCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> Orders on Hold ({heldOrders.length})
              </button>
            )}
          </div>
        </aside>
      )}

      {/* ADD_ONS MODAL (GLOBAL) */}
      {modalType === 'ADD_ONS' && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ width: '600px' }}>
            <div className="modal-header">
              <h2><Plus size={24} /> Select Add-ons</h2>
              <X size={24} style={{cursor:'pointer'}} onClick={() => setModalType('NONE')} />
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', maxHeight: '60vh', overflowY: 'auto' }}>
              {allProducts.filter(p => p.categories?.some((c:any) => c.name.toLowerCase() === 'add-ons' || c.name.toLowerCase() === 'addons')).length === 0 && (
                <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '20px 0' }}>No Add-ons found. Please create an "Add-ons" category in the Admin panel and add products to it.</p>
              )}
              {allProducts.filter(p => p.categories?.some((c:any) => c.name.toLowerCase() === 'add-ons' || c.name.toLowerCase() === 'addons')).map(addon => (
                <div key={addon.id} 
                  className="product-card"
                  onClick={() => { addToCart(addon); setModalType('NONE'); setToast({message: `${addon.name} Added`, type: 'success'}); }}
                  style={{ cursor: 'pointer', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{addon.name}</div>
                  <div style={{ color: 'var(--accent-green)' }}>Rs. {addon.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* TILL LOCK OVERLAY */}
      {posSettings.tillLockEnabled && !isTillLocked && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(234, 124, 105, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
           <Lock size={100} color="white" style={{ marginBottom: '20px' }} />
           <h1 style={{ color: 'white', fontSize: '4rem', marginBottom: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>Lock Your Till First!</h1>
           <p style={{ color: 'white', fontSize: '1.5rem', marginBottom: '40px' }}>The Cash Drawer is open. Please close and lock it to continue using the POS.</p>
           <button onClick={() => setIsTillLocked(true)} style={{ background: 'black', color: 'white', border: 'none', padding: '20px 60px', fontSize: '2rem', fontWeight: 'bold', borderRadius: '10px', cursor: 'pointer' }}>
             Lock Till
           </button>
        </div>
      )}

      {/* USER TERMINAL LOCK OVERLAY */}
      {isTerminalLockedByUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={80} color="var(--accent-yellow)" style={{ marginBottom: '20px' }} />
          <h1 style={{ color: 'white', fontSize: '3rem', marginBottom: '10px' }}>Terminal is Locked</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '30px' }}>Enter Cashier PIN to unlock</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="password" 
              value={terminalUnlockPin}
              onChange={e => setTerminalUnlockPin(e.target.value)}
              style={{ padding: '15px', fontSize: '1.5rem', textAlign: 'center', borderRadius: '8px', border: 'none', width: '250px', outline: 'none' }}
              placeholder="****"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (terminalUnlockPin === currentUser?.password || terminalUnlockPin === '9999') {
                    setIsTerminalLockedByUser(false);
                    setTerminalUnlockPin('');
                  } else {
                    setToast({ message: 'Invalid PIN!', type: 'error' });
                  }
                }
              }}
            />
            <button 
              onClick={() => {
                if (terminalUnlockPin === currentUser?.password || terminalUnlockPin === '9999') {
                  setIsTerminalLockedByUser(false);
                  setTerminalUnlockPin('');
                } else {
                  setToast({ message: 'Invalid PIN!', type: 'error' });
                }
              }}
              style={{ padding: '15px', fontSize: '1.2rem', background: 'var(--accent-green)', color: '#00311f', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', width: '250px' }}
            >
              Unlock
            </button>
          </div>
        </div>
      )}

      {/* CASHIER LOGIN MODAL */}
      {modalType === 'CASHIER_LOGIN' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2><User size={24} /> Cashier Login</h2>
              <X size={24} style={{cursor:'pointer'}} onClick={() => setModalType('NONE')} />
            </div>
            <div className="modal-body">
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Cashier Full Name / ID</label>
              <input 
                type="text" 
                value={cashierLoginName}
                onChange={e => setCashierLoginName(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px', fontSize: '1.1rem', marginBottom: '20px' }}
                placeholder="Enter Name e.g., Ahmed"
                autoFocus
              />
              <button 
                className="btn-action btn-order" 
                onClick={() => { 
                  if(cashierLoginName.trim().length > 0) {
                    const c = { name: cashierLoginName.trim() };
                    setCashier(c);
                    localStorage.setItem('d4u_cashier', JSON.stringify(c));
                    setModalType('NONE');
                    setToast({ message: `Welcome, ${c.name}!`, type: 'success' });
                  } else {
                    setToast({ message: 'Please enter a valid name', type: 'error' });
                  }
                }} 
                style={{ padding: '15px', fontSize: '1.1rem', width: '100%' }}
              >
                Login to POS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CASH OUT MODAL */}
      {modalType === 'CASH_OUT' && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2><Banknote size={24} /> Cash Out</h2>
              <X size={24} style={{cursor:'pointer'}} onClick={() => setModalType('NONE')} />
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>Enter the amount you are withdrawing from the till.</p>
              <input type="number" id="cashOutInput" placeholder="Amount (Rs.)" style={{ width: '100%', padding: '15px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px', marginBottom: '15px', fontSize: '1.2rem' }} autoFocus />
              <textarea id="cashOutReasonInput" placeholder="Reason for cash out (e.g. Petty expense, Bank deposit...)" rows={2} style={{ width: '100%', padding: '15px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px', marginBottom: '15px', fontSize: '1rem', resize: 'none', fontFamily: 'inherit' }} />
              <button className="btn-action btn-save" style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }} onClick={async () => {
                 const amt = parseFloat((document.getElementById('cashOutInput') as HTMLInputElement)?.value || '0');
                 const reason = (document.getElementById('cashOutReasonInput') as HTMLTextAreaElement)?.value.trim() || '';
                 if (amt > 0) {
                   if (!reason) {
                     setToast({ message: 'Please enter a reason for the cash out', type: 'error' });
                     return;
                   }
                   try {
                     const res = await apiFetch('/cash-flow/out', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ store_id: Number(currentUser?.store_id), user_id: Number(currentUser?.id) || 1, amount: amt, comment: reason }),
                       auth: true,
                     });
                     if (!res.ok) throw new Error('Cash Out failed');

                     const shiftSales = activeShift === 'Shift 1' ? shift1Sales : shift2Sales;
                     setPrintData({ type: 'BILL', data: { orderType: 'Cash Out Receipt', cashOutAmount: amt, cashOutReason: reason, shiftSales, time: new Date().toLocaleString() }, printCount: 1 });
                     setToast({ message: `Cash Out of Rs. ${amt} recorded! Printing...`, type: 'success' });
                     setModalType('NONE');
                   } catch (e) {
                     setToast({ message: 'Error recording Cash Out to server', type: 'error' });
                   }
                 }
              }}>
                Record & Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DAY CLOSE & CASH HANDOVER MODAL */}
      {modalType === 'DAY_CLOSE' && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ width: '1300px', maxWidth: '98vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Banknote size={26} color="var(--accent-yellow)" /> Shift / Day Close & Cash Handover
              </h2>
              <X size={24} style={{cursor:'pointer'}} onClick={() => { setModalType('NONE'); setDayClosePin(''); }} />
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {(() => {
                const pendingOrders = activeDeliveries.filter(d => d.status !== 'SETTLED' && d.status !== 'CANCELLED');
                const requiresPin = pendingOrders.length > 0;
                const openingFloat = Number(localStorage.getItem('d4u_cashin_amt') || 0);
                const shiftSales = activeShift === 'Shift 1' ? shift1Sales : (shift1Sales + shift2Sales);
                const cashSales = shiftSales;
                const expectedCash = openingFloat + cashSales;

                const pakDenoms = [
                  { value: 5000, label: 'Rs. 5,000 Note', type: 'note' },
                  { value: 1000, label: 'Rs. 1,000 Note', type: 'note' },
                  { value: 500,  label: 'Rs. 500 Note',   type: 'note' },
                  { value: 100,  label: 'Rs. 100 Note',   type: 'note' },
                  { value: 50,   label: 'Rs. 50 Note',    type: 'note' },
                  { value: 20,   label: 'Rs. 20 Note',    type: 'note' },
                  { value: 10,   label: 'Rs. 10 Note',    type: 'note' },
                  { value: 5,    label: 'Rs. 5 Coin',     type: 'coin' },
                  { value: 2,    label: 'Rs. 2 Coin',     type: 'coin' },
                  { value: 1,    label: 'Rs. 1 Coin',     type: 'coin' },
                ];

                const totalCountedCash = pakDenoms.reduce((sum, d) => sum + (d.value * (denomCounts[d.value] || 0)), 0);
                const variance = totalCountedCash - expectedCash;

                const updateCount = (val: number, cnt: number) => {
                  const safeCnt = Math.max(0, isNaN(cnt) ? 0 : cnt);
                  setDenomCounts(prev => ({ ...prev, [val]: safeCnt }));
                };

                const getHandoverPayload = () => ({
                  storeName: currentUser?.store?.name || 'D4U POS Restaurant',
                  cashierName: cashier?.name || currentUser?.name || 'Cashier',
                  managerName: handoverManagerName || 'Manager',
                  time: new Date().toLocaleString(),
                  dayId: 1,
                  openingFloat,
                  totalOrders: activeDeliveries.length || 1,
                  cashSales,
                  cardSales: 0,
                  onlineSales: 0,
                  totalNetSales: shiftSales,
                  cashOutAmount: 0,
                  expectedCash,
                  countedCash: totalCountedCash,
                  variance,
                  denominations: denomCounts,
                  notes: handoverNotes
                });

                const handlePrintSlipOnly = () => {
                  setPrintData({
                    type: 'SHIFT_CLOSE',
                    data: getHandoverPayload(),
                    printCount: 1
                  });
                  setToast({ message: 'Printing Handover Receipt...', type: 'success' });
                };

                const handleConfirmClose = async () => {
                  const payload = getHandoverPayload();
                  setPrintData({
                    type: 'SHIFT_CLOSE',
                    data: payload,
                    printCount: 1
                  });

                  try {
                    await apiFetch('/business-day/close', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        store_id: currentUser?.store_id || 1,
                        closed_by: currentUser?.id || 1,
                        closingCash: totalCountedCash,
                        notes: JSON.stringify({
                          managerName: payload.managerName,
                          cashierName: payload.cashierName,
                          variance: payload.variance,
                          expectedCash: payload.expectedCash,
                          denominations: denomCounts,
                          userNotes: handoverNotes
                        })
                      }),
                      auth: true,
                    });
                  } catch (e) {
                    console.error('Day close failed', e);
                  }

                  setToast({ message: 'Shift Closed & Handover Recorded!', type: 'success' });
                  setTimeout(() => {
                    localStorage.removeItem('d4u_day_start');
                    localStorage.removeItem('d4u_is_cashed_in');
                    localStorage.removeItem('d4u_cashin_amt');
                    localStorage.removeItem('d4u_cashier');
                    localStorage.removeItem('d4u_main_user');
                    window.location.reload();
                  }, 1200);
                };

                return (
                  <div>
                    {/* TOP METRICS SUMMARY */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Opening Float</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>Rs. {openingFloat.toLocaleString()}</div>
                      </div>

                      <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Expected Till Cash</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '4px' }}>Rs. {expectedCash.toLocaleString()}</div>
                      </div>

                      <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Counted Cash</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--accent-yellow)', marginTop: '4px' }}>Rs. {totalCountedCash.toLocaleString()}</div>
                      </div>

                      <div style={{ background: 'var(--bg-base)', border: `1px solid ${variance < 0 ? '#ef4444' : variance > 0 ? '#3b82f6' : '#22c55e'}`, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Variance (Diff)</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '900', color: variance < 0 ? '#fca5a5' : variance > 0 ? '#93c5fd' : '#86efac', marginTop: '4px' }}>
                          {variance === 0 ? 'Rs. 0 (Balanced)' : `${variance > 0 ? '+' : ''}Rs. ${variance.toLocaleString()}`}
                        </div>
                      </div>
                    </div>

                    {/* DENOMINATION INPUT GRID */}
                    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Receipt size={18} color="var(--accent-yellow)" /> Currency Denomination Tally (Counting)
                        </h4>
                        <button
                          type="button"
                          onClick={() => setDenomCounts({ 5000: 0, 1000: 0, 500: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 })}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Clear Counts
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* LEFT COLUMN: NOTES */}
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                            Bank Notes (Rs)
                          </div>
                          {pakDenoms.filter(d => d.type === 'note').map(d => {
                            const cnt = denomCounts[d.value] || 0;
                            const sub = d.value * cnt;
                            return (
                              <div key={d.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', background: 'var(--bg-panel)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <span style={{ width: '90px', fontWeight: 'bold', fontSize: '0.85rem', color: 'white' }}>{d.label}</span>
                                <button
                                  type="button"
                                  onClick={() => updateCount(d.value, cnt - 1)}
                                  style={{ width: '28px', height: '28px', borderRadius: '4px', background: '#334155', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                >-</button>
                                <input
                                  type="number"
                                  min="0"
                                  value={cnt || ''}
                                  onChange={e => updateCount(d.value, parseInt(e.target.value) || 0)}
                                  style={{ flex: 1, padding: '4px 8px', background: 'black', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.95rem' }}
                                  placeholder="0"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateCount(d.value, cnt + 1)}
                                  style={{ width: '28px', height: '28px', borderRadius: '4px', background: '#334155', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                >+</button>
                                <span style={{ width: '95px', textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem', color: sub > 0 ? 'var(--accent-yellow)' : '#64748b' }}>
                                  Rs. {sub.toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* RIGHT COLUMN: COINS & HANDOVER DETAILS */}
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                              Coins (Rs)
                            </div>
                            {pakDenoms.filter(d => d.type === 'coin').map(d => {
                              const cnt = denomCounts[d.value] || 0;
                              const sub = d.value * cnt;
                              return (
                                <div key={d.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', background: 'var(--bg-panel)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <span style={{ width: '90px', fontWeight: 'bold', fontSize: '0.85rem', color: 'white' }}>{d.label}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateCount(d.value, cnt - 1)}
                                    style={{ width: '28px', height: '28px', borderRadius: '4px', background: '#334155', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                  >-</button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={cnt || ''}
                                    onChange={e => updateCount(d.value, parseInt(e.target.value) || 0)}
                                    style={{ flex: 1, padding: '4px 8px', background: 'black', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.95rem' }}
                                    placeholder="0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateCount(d.value, cnt + 1)}
                                    style={{ width: '28px', height: '28px', borderRadius: '4px', background: '#334155', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                  >+</button>
                                  <span style={{ width: '95px', textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem', color: sub > 0 ? 'var(--accent-yellow)' : '#64748b' }}>
                                    Rs. {sub.toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* HANDOVER INFO INPUTS */}
                          <div style={{ marginTop: '12px', background: 'var(--bg-panel)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--accent-yellow)', fontWeight: 'bold', marginBottom: '8px' }}>Handover Information</div>
                            <div style={{ marginBottom: '8px' }}>
                              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Handover To (Manager Name):</label>
                              <input
                                type="text"
                                value={handoverManagerName}
                                onChange={e => setHandoverManagerName(e.target.value)}
                                placeholder="Manager Name e.g. Mr. Admin"
                                style={{ width: '100%', padding: '8px', background: 'black', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', fontSize: '0.85rem' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Notes / Discrepancy Remarks:</label>
                              <input
                                type="text"
                                value={handoverNotes}
                                onChange={e => setHandoverNotes(e.target.value)}
                                placeholder="Optional notes e.g. Rs. 500 shortage due to..."
                                style={{ width: '100%', padding: '8px', background: 'black', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', fontSize: '0.85rem' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* REQUIRES PIN WARNING IF UNSETTLED DELIVERIES EXIST */}
                    {requiresPin && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                        <p style={{ color: '#fca5a5', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={16} /> Pending Settlements Exist!
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '10px' }}>
                          There are {pendingOrders.length} unsettled deliveries. Enter Admin Override PIN (9999) to close.
                        </p>
                        <input 
                          type="password" 
                          placeholder="Admin Override PIN" 
                          value={dayClosePin}
                          onChange={(e) => setDayClosePin(e.target.value)}
                          style={{ width: '220px', padding: '8px 12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', textAlign: 'center', fontSize: '1rem', letterSpacing: '2px' }} 
                        />
                      </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button 
                        className="btn-action" 
                        onClick={() => { setModalType('NONE'); setDayClosePin(''); }} 
                        style={{ padding: '14px 20px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px', fontWeight: 'bold' }}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="btn-action"
                        onClick={handlePrintSlipOnly}
                        style={{ padding: '14px 20px', background: '#334155', border: '1px solid #475569', color: 'white', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Printer size={18} /> Print Handover Slip
                      </button>

                      <button 
                        className="btn-action" 
                        disabled={requiresPin && dayClosePin !== '9999'}
                        onClick={handleConfirmClose}
                        style={{ flex: 1, padding: '14px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: (requiresPin && dayClosePin !== '9999') ? 'not-allowed' : 'pointer', opacity: (requiresPin && dayClosePin !== '9999') ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <CheckCircle size={18} /> Confirm Handover & Close Day
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {modalType === 'SETTINGS' && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ width: '720px', maxWidth: '90%', borderRadius: '12px' }}>
            <div className="modal-header">
              <h2><Settings size={24} /> POS Settings</h2>
              <X size={24} style={{cursor:'pointer'}} onClick={() => setModalType('NONE')} />
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left Column - Core Configurations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: '500' }}>Select Printer</label>
                    <select value={posSettings.printerName} onChange={e => setPosSettings({...posSettings, printerName: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px', fontSize: '0.95rem' }}>
                      <option>Default Printer</option>
                      <option>Epson TM-T88V</option>
                      <option>XP-80C Thermal</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: '500' }}>KOT Operation Mode</label>
                    <select value={posSettings.kotMode} onChange={e => setPosSettings({...posSettings, kotMode: e.target.value, kotPrintQty: e.target.value === 'SCREEN' ? 0 : 1})} style={{ width: '100%', padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px', fontSize: '0.95rem' }}>
                      <option value="SCREEN">Kitchen Display (Screen)</option>
                      <option value="PRINT">Thermal Print (Paper)</option>
                    </select>
                  </div>
                  <div style={{ padding: '16px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Discount Password Protection</label>
                    <input type="password" placeholder="Leave blank to disable" value={posSettings.discountPassword || ''} onChange={e => setPosSettings({...posSettings, discountPassword: e.target.value})} style={{ width: '100%', padding: '10px', background: '#0f172a', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>Cashiers will need this PIN to apply any discount.</p>
                  </div>
                </div>

                {/* Right Column - Policy & Rules */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-base)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Till Lock Enforcement</span>
                    <input type="checkbox" checked={posSettings.tillLockEnabled} onChange={e => setPosSettings({...posSettings, tillLockEnabled: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: 'var(--accent-yellow)', cursor: 'pointer' }}/>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-base)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Enable Duplicate KOT Printing</span>
                    <input type="checkbox" checked={posSettings.duplicateKOTEnabled} onChange={e => setPosSettings({...posSettings, duplicateKOTEnabled: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: 'var(--accent-yellow)', cursor: 'pointer' }}/>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-base)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Allow Custom Items from POS</span>
                    <input type="checkbox" checked={posSettings.allowCustomItems} onChange={e => setPosSettings({...posSettings, allowCustomItems: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: 'var(--accent-yellow)', cursor: 'pointer' }}/>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-base)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--accent-green)' }}>Waiter Terminal Engine</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Allow Waiters to connect via mobile</span>
                    </div>
                    <input type="checkbox" checked={posSettings.terminalEngineEnabled} onChange={e => setPosSettings({...posSettings, terminalEngineEnabled: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: 'var(--accent-green)', cursor: 'pointer' }}/>
                  </div>
                </div>
              </div>

              <button className="btn-action btn-order" onClick={() => { localStorage.setItem('d4u_pos_settings', JSON.stringify(posSettings)); setModalType('NONE'); setToast({message: 'Settings Saved', type: 'success'}); }} style={{ padding: '16px', fontSize: '1.1rem', width: '100%', borderRadius: '8px', fontWeight: 'bold', background: 'var(--accent-green)', color: 'white', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}>Save & Close</button>
            </div>
          </div>
        </div>
      )}

      {/* WAITER PIN MODAL */}
      {modalType === 'WAITER_PIN' && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2><Navigation size={24} color="var(--accent-green)" /> Generate Waiter PIN</h2>
              <X size={24} style={{cursor:'pointer'}} onClick={() => { setModalType('NONE'); setWaiterNameInput(''); setGeneratedTerminalPin(''); }} />
            </div>
            <div style={{ padding: '20px' }}>
              {!generatedTerminalPin ? (
                <>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>Enter the Waiter's name to generate a temporary PIN for the Terminal.</p>
                  <input type="text" placeholder="e.g. John Doe" value={waiterNameInput} onChange={e => setWaiterNameInput(e.target.value)} style={{ width: '100%', padding: '15px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px', marginBottom: '15px', fontSize: '1.1rem' }} autoFocus />
                  <button className="btn-action btn-order" style={{ width: '100%', padding: '15px', fontSize: '1.1rem', background: 'var(--accent-green)', color: '#00311f' }} onClick={async () => {
                     if (!waiterNameInput.trim()) return setToast({ message: 'Waiter Name is required', type: 'error' });
                     try {
                       const res = await fetch(BACKEND_URL + '/terminal/generate', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ store_id: currentUser?.store_id, waiter_name: waiterNameInput.trim() })
                       });
                       const data = await res.json();
                       if (data.success) {
                         setGeneratedTerminalPin(data.pin);
                         setToast({ message: 'Terminal PIN Generated!', type: 'success' });
                       } else {
                         setToast({ message: 'Failed to generate PIN', type: 'error' });
                       }
                     } catch (e) {
                       setToast({ message: 'Connection Error', type: 'error' });
                     }
                  }}>
                    Generate PIN
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>Give this PIN to {waiterNameInput}:</p>
                  <div style={{ background: '#0f172a', border: '2px dashed var(--accent-green)', color: 'var(--accent-green)', fontSize: '2.5rem', fontWeight: '900', letterSpacing: '5px', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                    {generatedTerminalPin}
                  </div>
                  <button className="btn-action" onClick={() => { setModalType('NONE'); setWaiterNameInput(''); setGeneratedTerminalPin(''); }} style={{ width: '100%', padding: '15px', background: 'var(--bg-panel)', color: 'white', border: '1px solid var(--border-color)' }}>
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DISCOUNT AUTH MODAL */}
      {modalType === 'DISCOUNT_AUTH' && (
        <div className="modal-overlay" style={{ zIndex: 10002 }}>
          <div className="modal-content animate-slide-up" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2><Lock size={24} color="#fbbf24" /> Manager Override</h2>
              <X size={24} style={{cursor:'pointer'}} onClick={() => { setModalType('NONE'); setDiscountPasswordInput(''); setPendingDiscount(''); setPendingOverrideReason(null); }} />
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
                {pendingOverrideReason === 'promotion_block'
                  ? 'This item is already part of a Company Promotion. Enter the Manager PIN to override and apply an additional discount anyway.'
                  : 'Enter Discount Password to authorize this change.'}
              </p>
              <input type="password" value={discountPasswordInput} onChange={e => setDiscountPasswordInput(e.target.value)} placeholder="Enter Password" style={{ width: '100%', padding: '15px', fontSize: '1.5rem', textAlign: 'center', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px', marginBottom: '20px', letterSpacing: '5px' }} autoFocus />
              <button className="btn-action btn-order" onClick={() => {
                if (discountPasswordInput === posSettings.discountPassword) {
                  if (pendingOverrideReason === 'promotion_block') setPromotionOverrideActive(true);
                  setDiscountPercent(Number(pendingDiscount) || 0);
                  setToast({ message: 'Discount Applied!', type: 'success' });
                  setModalType('NONE'); setDiscountPasswordInput(''); setPendingDiscount(''); setPendingOverrideReason(null);
                } else {
                  setToast({ message: 'Invalid Password', type: 'error' });
                }
              }} style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }}>Authorize Discount</button>
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY DETAILS MODAL */}
      {modalType === 'DELIVERY_DETAILS' && (
        <div className="modal-overlay" style={{ zIndex: 10002 }}>
          <div className="modal-content animate-slide-up" style={{ width: '450px' }}>
            <div className="modal-header">
              <h2><MapPin size={24} color="#4edea3" /> Delivery Details</h2>
              <X size={24} style={{cursor:'pointer'}} onClick={() => { setModalType('NONE'); setPendingDeliveryAction(null); setShowCustomerDropdown(false); }} />
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ marginBottom: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Please fill in the customer details to confirm this delivery order.</p>

              <div style={{ marginBottom: '15px', position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Customer Mobile Number *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  onFocus={() => { if (customerSearchResults.length > 0) setShowCustomerDropdown(true); }}
                  placeholder="0300-1234567"
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px', outline: 'none' }}
                  autoFocus
                />
                {/* Search-as-you-type customer picker -- type any part of a
                    known phone/name and choose from real matches, instead
                    of only an exact full-number lookup. */}
                {showCustomerDropdown && customerSearchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'var(--bg-panel, #1e293b)', border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 20, maxHeight: '220px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                    {customerSearchResults.map((c: any) => (
                      <div
                        key={c.id}
                        onClick={() => selectCustomerFromSearch(c)}
                        style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div>
                          <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 'bold' }}>{c.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{c.phone}</div>
                        </div>
                        {(c.addresses?.length ?? 0) > 0 && (
                          <span style={{ fontSize: '0.7rem', color: '#4edea3' }}>{c.addresses.length} saved addr.</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {liveCustomer && (
                  <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#4edea3', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} /> Existing customer found — {liveCustomer.loyalty_points ?? 0} loyalty points
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Customer Name *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. John Doe" style={{ width: '100%', padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Complete Delivery Address *</label>
                  {(liveCustomer?.addresses?.length ?? 0) > 0 && (
                    <span
                      onClick={() => setUseManualDeliveryAddress(!useManualDeliveryAddress)}
                      style={{ color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {useManualDeliveryAddress ? 'Choose a saved address' : '+ Enter a different address'}
                    </span>
                  )}
                </div>

                {!useManualDeliveryAddress && (liveCustomer?.addresses?.length ?? 0) > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {liveCustomer.addresses.map((a: any) => (
                      <div
                        key={a.id}
                        onClick={() => setCustomerAddress(a.address)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: customerAddress === a.address ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          background: customerAddress === a.address ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-base)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                        }}
                      >
                        <div style={{
                          width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                          border: customerAddress === a.address ? 'none' : '1px solid var(--border-color)',
                          background: customerAddress === a.address ? 'var(--primary)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {customerAddress === a.address && <Check size={11} color="black" />}
                        </div>
                        <div>
                          <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>{a.label}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{a.address}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="House #, Street, Block, Area..." rows={3} style={{ width: '100%', padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px', outline: 'none', resize: 'none' }} />
                    {liveCustomer?.id && (
                      <div style={{ marginTop: '10px' }}>
                        <input
                          type="text"
                          value={newAddressLabel}
                          onChange={e => setNewAddressLabel(e.target.value)}
                          placeholder="Label this address (e.g. Home, Office)"
                          style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px', outline: 'none', marginBottom: '8px', fontSize: '0.85rem' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={saveNewAddress} onChange={e => setSaveNewAddress(e.target.checked)} />
                          Save this address to {liveCustomer.name || 'the customer'}'s profile
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button className="btn-action btn-save" onClick={async () => {
                const validation = validateDeliveryCustomerInfo('Delivery', customerName, customerAddress, customerPhone);
                if (!validation.valid) {
                  setToast({ message: validation.message || 'All fields are required!', type: 'error' });
                  return;
                }
                if (useManualDeliveryAddress) await persistNewDeliveryAddress();
                setModalType('NONE');
                setShowCustomerDropdown(false);
                if (pendingDeliveryAction === 'KOT') handleCreateKOT();
                else if (pendingDeliveryAction === 'PAY') setModalType('PAYMENT');
                setPendingDeliveryAction(null);
              }} style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }}>Confirm & Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER HISTORY MODAL — same 4 sections as the website's Account
          page (Order History / Wishlist / Delivery Addresses / Loyalty
          Rewards), same underlying data, POS's own dark styling (not a
          visual reskin of the website). */}
      {modalType === 'CUSTOMER_HISTORY' && crmHistoryModal && (
        <div className="modal-overlay" style={{ zIndex: 10002 }}>
          <div className="modal-content animate-slide-up" style={{ width: '720px', maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2><Clock size={24} color="#4edea3" /> {crmHistoryModal.name}</h2>
              <X size={24} style={{ cursor: 'pointer' }} onClick={() => { setModalType('NONE'); setCrmHistoryModal(null); setCrmHistoryTab('orders'); }} />
            </div>
            <div style={{ padding: '16px 20px 0', display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>{crmHistoryModal.phone}</span>
              <span>Loyalty Points: <b style={{ color: '#fbbf24' }}>{crmHistoryModal.loyalty_points ?? 0}</b></span>
              <span style={{ color: '#fbbf24' }}>👑 {deriveLoyaltyTierLabel(crmHistoryModal.loyalty_points ?? 0)}</span>
            </div>

            {/* Tab bar -- same 4 sections as the website's Account page */}
            <div style={{ display: 'flex', gap: '8px', padding: '14px 20px 0', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
              {([
                ['orders', 'Order History', Clock],
                ['wishlist', 'Wishlist', MessageCircle],
                ['addresses', 'Delivery Addresses', MapPin],
                ['loyalty', 'Loyalty Rewards', Check],
              ] as const).map(([key, label, Icon]) => (
                <button
                  key={key}
                  onClick={() => setCrmHistoryTab(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.75rem', fontWeight: 'bold',
                    borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    background: crmHistoryTab === key ? 'var(--bg-panel)' : 'transparent',
                    color: crmHistoryTab === key ? 'var(--accent-yellow)' : 'var(--text-muted)',
                  }}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {crmHistoryTab === 'orders' && (
                <>
                  {[...(crmHistoryModal.orders || []), ...(crmHistoryModal.onlineOrders || [])]
                    .sort((a: any, b: any) => b.id - a.id)
                    .map((o: any) => (
                      <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                        <div>
                          <div style={{ color: 'white', fontWeight: 'bold' }}>Order #{o.id}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{o.status}</div>
                        </div>
                        <div style={{ color: '#4edea3', fontWeight: 'bold' }}>Rs. {o.total_amount ?? o.totalAmount ?? 0}</div>
                      </div>
                    ))}
                  {(!crmHistoryModal.orders || crmHistoryModal.orders.length === 0) && (!crmHistoryModal.onlineOrders || crmHistoryModal.onlineOrders.length === 0) && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>No past orders yet.</div>
                  )}
                </>
              )}

              {crmHistoryTab === 'wishlist' && (
                <>
                  {(crmHistoryModal.favoriteProducts || []).map((p: any) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                      {p.img ? (
                        <img src={p.img} alt={p.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <UtensilsCrossed size={16} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 'bold' }}>{p.name}</div>
                        <div style={{ color: '#fbbf24', fontSize: '0.8rem' }}>Rs. {p.price}</div>
                      </div>
                    </div>
                  ))}
                  {(!crmHistoryModal.favoriteProducts || crmHistoryModal.favoriteProducts.length === 0) && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>No favorite items saved yet.</div>
                  )}
                </>
              )}

              {crmHistoryTab === 'addresses' && (
                <>
                  {(crmHistoryModal.addresses || []).map((a: any) => (
                    <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {a.label} {a.is_default && <span style={{ fontSize: '0.65rem', color: '#4edea3', border: '1px solid #4edea3', borderRadius: '10px', padding: '1px 6px' }}>Default</span>}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{a.address}</div>
                    </div>
                  ))}
                  {(!crmHistoryModal.addresses || crmHistoryModal.addresses.length === 0) && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>No saved addresses yet.</div>
                  )}
                </>
              )}

              {crmHistoryTab === 'loyalty' && (
                <>
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24' }}>{crmHistoryModal.loyalty_points ?? 0} Points</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Current Tier: {deriveLoyaltyTierLabel(crmHistoryModal.loyalty_points ?? 0)}</div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>POINTS HISTORY</div>
                    {(crmHistoryModal.loyaltyTransactions || []).map((t: any) => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: t.type === 'EARN' ? '#4edea3' : '#f87171' }}>
                            {t.type === 'EARN' ? 'Earned' : 'Redeemed'}{t.order_id ? ` — Order #${t.order_id}` : ''}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleString()}</div>
                        </div>
                        <div style={{ fontWeight: 'bold', color: t.points > 0 ? '#4edea3' : '#f87171' }}>{t.points > 0 ? '+' : ''}{t.points} pts</div>
                      </div>
                    ))}
                    {(!crmHistoryModal.loyaltyTransactions || crmHistoryModal.loyaltyTransactions.length === 0) && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '12px 0', textAlign: 'center' }}>No points activity yet.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MANAGER AUTH MODAL */}
      {modalType === 'MANAGER_AUTH' && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2><Lock size={24} color="var(--primary)" /> Manager Override</h2>
              <X size={24} style={{cursor:'pointer'}} onClick={() => { setModalType('NONE'); setManagerPassword(''); setPendingDuplicateKot(null); }} />
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>This KOT has already been printed. Please enter Manager PIN to authorize duplicate reprint.</p>
              <input type="password" value={managerPassword} onChange={e => setManagerPassword(e.target.value)} placeholder="Enter PIN (Demo: 1234)" style={{ width: '100%', padding: '15px', fontSize: '1.5rem', textAlign: 'center', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px', marginBottom: '20px', letterSpacing: '5px' }} autoFocus />
              <button className="btn-action btn-order" onClick={() => {
                if (managerPassword === '1234') {
                  triggerKotPrint(pendingDuplicateKot);
                  setToast({ message: 'Duplicate KOT Notification Logged for Manager!', type: 'error' });
                  setModalType('NONE'); setManagerPassword(''); setPendingDuplicateKot(null);
                } else {
                  setToast({ message: 'Invalid Manager PIN', type: 'error' });
                }
              }} style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }}>Authorize & Print</button>
            </div>
          </div>
        </div>
      )}

      {/* KOT PREVIEW MODAL */}
      {modalType === 'KOT_PREVIEW' && (
        <div className="modal-overlay" style={{ zIndex: 10001, background: 'rgba(15, 23, 42, 0.95)' }}>
          <div className="modal-content animate-slide-up" style={{ width: '450px', background: '#1e293b', border: '1px solid #334155', padding: '0', borderRadius: '8px', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '15px 20px', borderBottom: '1px solid #334155', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: 'white', fontSize: '1rem', letterSpacing: '1px', margin: 0, fontWeight: 'bold' }}>KITCHEN TICKET PREVIEW</h2>
              <X size={20} style={{cursor:'pointer', color: '#94a3b8'}} onClick={() => { setModalType('NONE'); setPrintData({ type: 'NONE', data: null, printCount: 1 }); }} />
            </div>
            <div style={{ padding: '30px 20px', textAlign: 'center' }}>
              <div style={{ background: '#334155', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                <Printer size={30} color="var(--accent-yellow)" />
              </div>
              <p style={{ color: '#cbd5e1', marginBottom: '20px', fontSize: '1.1rem', padding: '0 20px', lineHeight: '1.5' }}>The following ticket was sent to the kitchen hot grill station printers:</p>
              <div style={{ background: 'white', borderRadius: '5px', overflow: 'hidden', margin: '0 auto 30px', display: 'inline-block', textAlign: 'left', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                 <PrintKOT {...printData.data} />
              </div>
              <button className="btn-action" onClick={() => { setModalType('NONE'); setPrintData({ type: 'NONE', data: null, printCount: 1 }); }} style={{ width: '100%', padding: '15px', background: 'var(--accent-yellow)', color: 'black', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>
                CLOSE TICKET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {modalType === 'PAYMENT' && (
        <div className="modal-overlay" style={{ zIndex: 10001, background: 'rgba(15, 23, 42, 0.95)' }}>
          <div className="modal-content animate-slide-up" style={{ width: '450px', background: '#0f172a', border: '1px solid #1e293b', padding: '0', borderRadius: '8px', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '15px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: 'white', fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '12px', height: '12px', background: 'var(--accent-green)', borderRadius: '50%', display: 'inline-block' }}></span>
                Complete Payment
              </h2>
              <X size={20} style={{cursor:'pointer', color: '#94a3b8'}} onClick={() => { setModalType('NONE'); setCashGiven(''); }} />
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ border: '1px solid #1e293b', borderRadius: '8px', padding: '15px', marginBottom: '25px', background: '#0f172a' }}>
                {cart.map((item, idx) => (
                   <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                      <span style={{ color: '#cbd5e1' }}>{item.name} <span style={{ color: 'var(--accent-yellow)', fontWeight: 'bold' }}>x{item.qty}</span></span>
                      <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>Rs. {(item.price * item.qty).toFixed(2)}</span>
                   </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #1e293b' }}>
                   <span style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 'bold', letterSpacing: '1px' }}>GRAND TOTAL</span>
                   <span style={{ color: 'var(--accent-green)', fontSize: '1.8rem', fontWeight: 'bold' }}>Rs. {grandTotal.toFixed(2)}</span>
                </div>
              </div>
              {liveCustomer && liveCustomer.loyalty_points > 0 && (
                <div style={{ border: '1px solid #1e293b', borderRadius: '8px', padding: '15px', marginBottom: '25px', background: '#0f172a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px' }}>REDEEM LOYALTY POINTS</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Available: {liveCustomer.loyalty_points} pts</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      max={liveCustomer.loyalty_points}
                      value={pointsToRedeem || ''}
                      placeholder="0"
                      onChange={(e) => {
                        const v = Math.max(0, Math.min(liveCustomer.loyalty_points, parseInt(e.target.value) || 0));
                        setPointsToRedeem(v);
                      }}
                      style={{ flex: 1, padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: 'white', fontSize: '0.95rem' }}
                    />
                    <button
                      onClick={() => setPointsToRedeem(liveCustomer.loyalty_points)}
                      style={{ padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#4edea3', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Max
                    </button>
                    {pointsToRedeem > 0 && (
                      <button
                        onClick={() => setPointsToRedeem(0)}
                        style={{ padding: '10px 14px', background: 'transparent', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {pointsRedeemed > 0 ? (
                    <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#4edea3', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{pointsRedeemed} pts applied</span>
                      <span>
                        -Rs. {loyaltyDiscount.toFixed(2)}
                        {deliveryLoyaltyDiscount > 0 ? ` (incl. Rs. ${deliveryLoyaltyDiscount.toFixed(2)} off delivery)` : ''}
                      </span>
                    </div>
                  ) : pointsToRedeem > 0 ? (
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>
                      No eligible amount to redeem against (already-discounted items only, or delivery fee already free).
                    </div>
                  ) : null}
                </div>
              )}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px', letterSpacing: '1px' }}>SELECT PAYMENT METHOD</div>
                {orderType === 'Delivery' ? (
                  // A delivery order is settled when the rider hands it over,
                  // not at this counter -- Cash/Card/Digital Link/Split (and
                  // the tendered-amount entry below) don't apply yet.
                  <div style={{ border: '1px solid var(--accent-yellow)', borderRadius: '8px', padding: '15px 10px', textAlign: 'center', background: '#0f172a', color: 'var(--accent-yellow)' }}>
                    <Truck size={24} style={{ margin: '0 auto 5px' }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Cash on Delivery (COD)</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Rider collects payment on delivery</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                     {['Cash', 'Card', 'Digital Link', 'Split'].map(method => (
                       <div key={method} onClick={() => setPaymentMethod(method as any)} style={{ flex: 1, minWidth: '100px', border: paymentMethod === method ? '1px solid var(--accent-yellow)' : '1px solid #1e293b', borderRadius: '8px', padding: '15px 10px', textAlign: 'center', cursor: 'pointer', background: '#0f172a', color: paymentMethod === method ? 'var(--accent-yellow)' : '#cbd5e1' }}>
                          {method === 'Cash' && <Banknote size={24} style={{ margin: '0 auto 5px' }} />}
                          {method === 'Card' && <CreditCard size={24} style={{ margin: '0 auto 5px' }} />}
                          {method === 'Digital Link' && <Landmark size={24} style={{ margin: '0 auto 5px' }} />}
                          {method === 'Split' && <Banknote size={24} style={{ margin: '0 auto 5px' }} />}
                          <div style={{ fontSize: '0.9rem', fontWeight: paymentMethod === method ? 'bold' : 'normal' }}>{method}</div>
                       </div>
                     ))}
                  </div>
                )}
              </div>
              {paymentMethod !== 'COD' && (
              <div style={{ marginBottom: '25px' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px', letterSpacing: '1px' }}>AMOUNT RECEIVED</div>

                {paymentMethod === 'Split' ? (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '15px', top: '15px', color: '#94a3b8', fontSize: '0.8rem' }}>Cash</span>
                      <input type="number" value={splitCash} onChange={e => setSplitCash(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '30px 15px 15px 15px', fontSize: '1.2rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '8px', outline: 'none' }} />
                    </div>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '15px', top: '15px', color: '#94a3b8', fontSize: '0.8rem' }}>Card</span>
                      <input type="number" value={splitCard} onChange={e => setSplitCard(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '30px 15px 15px 15px', fontSize: '1.2rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '8px', outline: 'none' }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ position: 'relative', marginBottom: '15px' }}>
                      <span style={{ position: 'absolute', left: '15px', top: '15px', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>Rs.</span>
                      <input type="number" value={cashGiven} onChange={e => setCashGiven(e.target.value)} style={{ width: '100%', padding: '15px 15px 15px 50px', fontSize: '1.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '8px', outline: 'none' }} autoFocus={paymentMethod === 'Cash'} />
                    </div>
                    {paymentMethod === 'Cash' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                         {[grandTotal, Math.ceil(grandTotal/100)*100 === grandTotal ? grandTotal+100 : Math.ceil(grandTotal/100)*100, Math.ceil(grandTotal/500)*500 === grandTotal ? grandTotal+500 : Math.ceil(grandTotal/500)*500, Math.ceil(grandTotal/1000)*1000 === grandTotal ? grandTotal+1000 : Math.ceil(grandTotal/1000)*1000].map((amt, i) => (
                           <button key={i} onClick={() => setCashGiven(amt.toString())} style={{ flex: 1, padding: '10px 0', background: '#0f172a', border: '1px solid #1e293b', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>Rs. {amt.toFixed(2)}</button>
                         ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              )}
              <button className="btn-action" onClick={async () => {
                let tendered = paymentMethod === 'Split' ? (Number(splitCash) + Number(splitCard)) : (paymentMethod === 'Cash' ? Number(cashGiven) : grandTotal);
                if (tendered < grandTotal) return setToast({ message: 'Tendered amount is less than total', type: 'error' });
                const returnAmount = Math.max(0, tendered - grandTotal);
                let customerId = liveCustomer?.id || null;
                
                // A GUEST with a phone number becomes a registered customer at checkout.
                if (customerPhone.trim() && resolveCustomerMode(liveCustomer) === 'GUEST') {
                  try {
                    const newCustomerRecord = await createCustomer({
                      brand_id: currentUser?.brand_id,
                      phone: customerPhone.trim(),
                      name: customerName || 'Walk-in',
                    });
                    customerId = newCustomerRecord.id;
                  } catch (e) { console.log('Error saving customer', e); }
                }

                if (cart.length > 0) {
                  const payload = {
                    store_id: currentUser?.store_id,
                    created_by: currentUser?.id || 1,
                    customer_id: customerId,
                    discount: totalDiscountAmount,
                    payment_method: paymentMethod.toUpperCase(),
                    order_source: orderType,
                    // Was previously sent unconditionally regardless of
                    // order type -- tableNumber defaults to 'T1', so a
                    // Delivery/Take Away sale could silently lock a real
                    // dine-in table via assignTable even though it has
                    // nothing to do with seating.
                    table_no: orderType === 'Dine In' ? (tableNumber || undefined) : undefined,
                    // Was never sent here at all -- a Delivery order paid
                    // immediately (as opposed to KOT'd then paid later,
                    // which does send this) landed in the backend with no
                    // address whatsoever, regardless of what the cashier
                    // entered in the Delivery Details modal.
                    delivery_address: orderType === 'Delivery' ? customerAddress : undefined,
                    notes: orderNotes,
                    // How many points the cashier chose to redeem -- the backend still
                    // re-caps this itself (customer's real balance x eligible/non-discounted
                    // subtotal + delivery fee), redeemed atomically with the order (see
                    // PosOrdersService.createOrder), so this can never over-redeem past
                    // what's actually usable regardless of what's sent here.
                    redeem_points: pointsToRedeem > 0 ? pointsToRedeem : undefined,
                    items: cart.map(i => ({
                      product_id: i.id || 1,
                      variant_id: i.variant_id,
                      quantity: i.qty,
                      price: i.price,
                      special_inst: i.modifiers?.length > 0 ? i.modifiers.map((m: any) => `+ ${m.name}`).join(', ') : ''
                    })),
                    // MARKETING-003 §9 — Order Details / Promotion Stack Explainer audit trail
                    manager_override_by: promotionOverrideActive ? (currentUser?.id || undefined) : undefined,
                    coupon_blocked: cartHasCompanyPromotion() && !promotionOverrideActive,
                    loyalty_blocked: cartHasCompanyPromotion() && !promotionOverrideActive,
                    rejected_promotions: cartHasCompanyPromotion() && !promotionOverrideActive
                      ? [
                          { type: 'coupon', reason: 'Company Promotion Active. Additional discounts cannot be applied.' },
                          { type: 'loyalty', reason: 'Company Promotion Active. Additional discounts cannot be applied.' },
                        ]
                      : undefined,
                  };

                  try {
                    const res = await fetch(BACKEND_URL + '/pos-orders', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (res.status === 409) {
                      // A business-rule rejection from within the order transaction — either
                      // the table is already occupied, or the loyalty points couldn't be
                      // redeemed (e.g. insufficient balance). Either way it's not a
                      // connectivity issue, so do NOT fall back to the offline path below;
                      // let the cashier fix the input and retry.
                      setToast({ message: data.message || 'This order could not be completed.', type: 'error' });
                      return;
                    }
                    if (!res.ok) throw new Error(data.message || 'Order failed');

                    if (pointsToRedeem > 0) setPointsToRedeem(0);
                  } catch (e) {
                    console.error('API Error:', e);
                    setToast({ message: 'Error submitting order to backend, falling back to local.', type: 'error' });
                    // Offline fallback
                    const nextOrderId = Math.floor(Math.random() * 100000);
                    const newKot = {
                      orderId: nextOrderId,
                      type: orderType === 'Dine In' ? `Dine In (${tableNumber})` : orderType,
                      customer: customerName,
                      customerPhone: customerPhone,
                      // Neither was ever set here -- a Delivery order that
                      // fell back to this path (network blip on the direct
                      // call above) lost its address and its resolved
                      // customer link the instant it hit the offline queue.
                      customerAddress: orderType === 'Delivery' ? customerAddress : undefined,
                      customer_id: customerId,
                      items: cart.map(item => `${item.qty}x ${item.name}`).join(', '),
                      notes: orderNotes,
                      timePlaced: new Date().toLocaleTimeString(),
                      status: 'NEW' as const,
                      totalAmount: grandTotal,
                      paymentMethod: paymentMethod,
                      itemsData: JSON.stringify(cart),
                      synced: false,
                      store_id: currentUser.store_id,
                      created_by: currentUser?.id || 1,
                    };
                    await db.kots.add(newKot);
                  }
                }
                const cartWithPromo = cart.map(item => ({
                  ...item,
                  promoPct: getProductDiscount(item),
                  discountedPrice: item.price - (item.price * (getProductDiscount(item) / 100))
                }));

                const currentOrder = {
                  orderType: orderType === 'Dine In' ? `Dine In (${tableNumber})` : orderType,
                  cart: cartWithPromo,
                  subTotal,
                  tax,
                  taxPercent: branchSettings?.tax_percentage ?? 0,
                  deliveryFee,
                  discount: totalDiscountAmount,
                  promoDiscount: promoDiscountAmount,
                  // Independently computed now (see cartEngine.calculateOrderTotals)
                  // instead of the old single discountPercent relabeling trick, so
                  // manual discount and loyalty redemption can coexist on one order.
                  manualDiscount: discountAmount,
                  loyaltyDiscount,
                  grandTotal,
                  cashGiven: tendered,
                  returnAmount,
                  time: new Date().toLocaleString()
                };

                if (posSettings.billPrintQty > 0) setPrintData({ type: 'BILL', data: currentOrder, printCount: posSettings.billPrintQty });
                if (activeShift === 'Shift 1') setShift1Sales(prev => prev + grandTotal);
                else setShift2Sales(prev => prev + grandTotal);

                setOrderNotes('');
                setCart([]); setCashGiven(''); setModalType('NONE');
                setPromotionOverrideActive(false); // one-transaction-only manual override
                setToast({ message: 'Transaction Complete!', type: 'success' });
                if (posSettings.tillLockEnabled) setIsTillLocked(false);
              }} style={{ width: '100%', padding: '15px', fontSize: '1.1rem', background: 'var(--accent-green)', color: '#00311f', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <Check size={20} /> PROCESS & FINISH SALE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM ITEM MODAL */}
      {modalType === 'ADD_CUSTOM_ITEM' && !isWaiterMode && (
        <div className="modal-overlay" style={{ zIndex: 10001, background: 'rgba(15, 23, 42, 0.95)' }}>
          <div className="modal-content animate-slide-up" style={{ width: '500px', background: '#0f172a', border: '1px solid #1e293b', padding: '0', borderRadius: '8px', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '15px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: 'white', fontSize: '1.2rem', margin: 0 }}><Plus size={20} color="var(--accent-yellow)" /> Submit Product Request</h2>
              <X size={20} style={{cursor:'pointer', color: '#94a3b8'}} onClick={() => { setModalType('NONE'); resetCustomItemForm(); }} />
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>Product Name</label>
                <input type="text" value={customItemName} onChange={e => setCustomItemName(e.target.value)} placeholder="Enter Product Name" style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '5px', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>Price (Rs.)</label>
                  <input type="number" value={customItemPrice} onChange={e => setCustomItemPrice(e.target.value)} placeholder="e.g. 500" style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '5px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>Product Code / SKU</label>
                  <input type="text" value={customItemCode} onChange={e => setCustomItemCode(e.target.value)} placeholder="e.g. B-102" style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '5px', outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>Category</label>
                <select value={customItemCategory} onChange={e => setCustomItemCategory(parseInt(e.target.value))} style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '5px', outline: 'none' }}>
                  <option value={0}>Select Category</option>
                  {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>Product Image</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="file" accept="image/*" onChange={handleCustomImageUpload} id="customImgUpload" style={{ display: 'none' }} />
                  <label htmlFor="customImgUpload" style={{ padding: '10px 15px', background: '#334155', color: 'white', borderRadius: '5px', cursor: 'pointer', fontSize: '0.85rem' }}>Browse Picture...</label>
                  {customItemImg && <img src={customItemImg} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #334155' }} />}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button className="btn-action" onClick={() => { setModalType('NONE'); resetCustomItemForm(); }} style={{ flex: 1, padding: '15px', background: '#1e293b', border: '1px solid #334155', color: 'white', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer' }}>CANCEL</button>
                <button className="btn-action" onClick={async () => {
                  if (!customItemName || !customItemPrice) { setToast({ message: 'Please enter Name and Price', type: 'error' }); return; }
                  try {
                    // Submits a Product Request for Head Office review — this does NOT
                    // create a Menu Product directly; HQ approves it via the Menu Builder.
                    const res = await apiFetch('/product-requests', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        store_id: currentUser?.store_id,
                        requested_by: currentUser?.id || 1,
                        name: customItemName,
                        suggested_price: parseFloat(customItemPrice) || 0,
                        category_id: customItemCategory || undefined,
                        sku: customItemCode || undefined,
                        submit: true,
                      }),
                      auth: true,
                    });
                    const data = await res.json();

                    if (res.ok) {
                      if (customItemImgFile) {
                        const formData = new FormData();
                        formData.append('image', customItemImgFile);
                        await apiFetch(`/product-requests/${data.id}/image`, {
                          method: 'POST',
                          body: formData,
                          auth: true,
                        }).catch(() => {});
                      }
                      setToast({ message: 'Sent to Head Office for Approval!', type: 'success' });
                    } else {
                      setToast({ message: data.message || 'Failed to submit product request', type: 'error' });
                    }
                    setModalType('NONE'); resetCustomItemForm();
                  } catch (e) { setToast({ message: 'Failed to submit product request', type: 'error' }); }
                }} style={{ flex: 2, padding: '15px', background: 'var(--accent-yellow)', color: 'black', fontWeight: 'bold', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>
                  SUBMIT PRODUCT REQUEST
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {waiterPinModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ width: '400px', textAlign: 'center' }}>
            <div className="modal-header" style={{ justifyContent: 'space-between' }}>
              <h2><Navigation size={24} /> Tablet Pairing</h2>
              <X size={24} style={{cursor:'pointer'}} onClick={() => setWaiterPinModalOpen(false)} />
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Ask the waiter to go to the following URL on their tablet and enter this PIN:</p>
              
              <div style={{ background: '#0f172a', padding: '15px', borderRadius: '10px', marginBottom: '20px', wordBreak: 'break-all' }}>
                <a href={`${window.location.origin}/${(currentUser?.store?.name || 'branch').toLowerCase().replace(/[^a-z0-9]/g, '')}/waiter`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 'bold', textDecoration: 'underline', fontSize: '1.1rem' }}>
                  {window.location.origin}/{(currentUser?.store?.name || 'branch').toLowerCase().replace(/[^a-z0-9]/g, '')}/waiter
                </a>
              </div>
              
              <div style={{ fontSize: '4rem', fontWeight: '900', letterSpacing: '10px', color: 'var(--accent-green)', background: '#1e293b', padding: '20px', borderRadius: '15px', border: '2px dashed var(--border-color)' }}>
                {generatedWaiterPin}
              </div>
            </div>
            <button className="btn-action" style={{ width: '100%', padding: '15px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', marginTop: '20px' }} onClick={() => setWaiterPinModalOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {/* BLOCKING VALIDATION POPUP (e.g. "Please select a Table Number") */}
      {alertModalMessage && (
        <div className="modal-overlay" onClick={() => setAlertModalMessage(null)}>
          <div className="modal-content animate-slide-up" style={{ width: '380px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertCircle size={28} color="#ef4444" />
              </div>
              <p style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>{alertModalMessage}</p>
            </div>
            <button
              className="btn-action"
              style={{ width: '100%', padding: '15px', background: 'var(--accent-yellow)', border: 'none', color: 'black', fontWeight: 'bold', borderRadius: '0 0 12px 12px' }}
              onClick={() => setAlertModalMessage(null)}
              autoFocus
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* HOLD ORDERS MODAL */}
      {modalType === 'HOLD_ORDERS' && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ width: '600px' }}>
            <div className="modal-header">
              <h2><PauseCircle size={24} /> Orders on Hold</h2>
              <X size={24} style={{cursor:'pointer'}} onClick={() => setModalType('NONE')} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {heldOrders.map((order) => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)', padding: '15px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '5px' }}>{order.orderType} Order</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Held at: {order.time.toLocaleTimeString()} • {order.cart.length} items</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-action btn-danger" style={{ padding: '8px 16px' }} onClick={() => handleCancelHeldOrder(order.id)}>Cancel Hold</button>
                    <button className="btn-action btn-save" style={{ padding: '8px 20px' }} onClick={() => handleResumeOrder(order.id)}>Resume</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* HIDDEN PRINT AREA */}
      <div id="print-area">
        {printData.type === 'BILL' && Array.from({ length: printData.printCount }).map((_, i) => (
          <div key={i} style={{ pageBreakAfter: 'always' }}><PrintBill {...printData.data} /></div>
        ))}
        {printData.type === 'KOT' && Array.from({ length: printData.printCount }).map((_, i) => (
          <div key={i} style={{ pageBreakAfter: 'always' }}><PrintKOT {...printData.data} /></div>
        ))}
        {printData.type === 'SHIFT_CLOSE' && (
          <div style={{ pageBreakAfter: 'always' }}><PrintShiftCloseReceipt {...printData.data} /></div>
        )}
      </div>
    </div>
  )
}

type DayRecord = { id: number; dayStart: string; dayClose: string };

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function DayStartPage({ currentUser, onDayStart, onLogout }: { currentUser: any; onDayStart: (t: Date) => void; onLogout?: () => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    apiFetch(`/business-day/history?store_id=${currentUser.store_id}`, { auth: true })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(console.error);
  }, [currentUser]);

  const lastRecord = history[0] ?? null;

  // On mount, check if there's already an open day — if so, auto-proceed
  useEffect(() => {
    const checkOpenDay = async () => {
      try {
        const res = await apiFetch(`/business-day/current?store_id=${currentUser.store_id}`, { auth: true });
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            // A day is already open — just proceed directly, no need to start a new one
            onDayStart(new Date(data.dayStart || new Date()));
          }
        }
      } catch (e) {
        // ignore — will fall through to manual Day Start
      }
    };
    checkOpenDay();
  }, [currentUser.store_id]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/business-day/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: currentUser.store_id, started_by: currentUser.id || 1, openingFloat: 0 }),
        auth: true,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onDayStart(new Date());
      } else if (data.message && data.message.includes('already open')) {
        // Day is already open — auto-proceed to POS
        onDayStart(new Date());
      } else {
        setErrMsg(data.message || 'Error starting day');
      }
    } catch (e) {
      setErrMsg('Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  const s: Record<string, React.CSSProperties> = {
    page: { position: 'fixed', inset: 0, background: '#f3f4f6', display: 'flex', fontFamily: 'sans-serif', zIndex: 99999 },
    left: { width: '280px', background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '28px 24px', gap: '12px' },
    userName: { fontSize: '1.1rem', fontWeight: '700', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' },
    closedTime: { fontSize: '0.82rem', color: '#6b7280', lineHeight: '1.5' },
    startBtn: { marginTop: 'auto', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', letterSpacing: '0.04em' },
    right: { flex: 1, padding: '28px 32px', overflowY: 'auto' },
    title: { fontSize: '1.2rem', fontWeight: '700', color: '#111827', marginBottom: '18px' },
    table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
    th: { background: '#f9fafb', padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: '700', color: '#6b7280', borderBottom: '1px solid #e5e7eb' },
    td: { padding: '11px 16px', fontSize: '0.82rem', color: '#374151', borderBottom: '1px solid #f3f4f6' },
    actionBtn: { background: '#374151', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
  };

  const demoRows: DayRecord[] = history.length > 0 ? [...history].reverse() : [
    { id: 635, dayStart: '2020-02-25T14:41:37', dayClose: '2020-02-25T15:28:58' },
    { id: 626, dayStart: '2020-02-24T16:29:14', dayClose: '2020-02-25T06:00:02' },
    { id: 558, dayStart: '2020-02-18T15:15:28', dayClose: '2020-02-19T06:00:02' },
    { id: 442, dayStart: '2020-02-03T17:05:08', dayClose: '2020-02-06T17:36:54' },
    { id: 441, dayStart: '2020-02-03T17:05:08', dayClose: '2020-02-16T06:00:02' },
    { id: 367, dayStart: '2020-01-23T17:07:35', dayClose: '2020-01-24T06:00:01' },
    { id: 329, dayStart: '2020-01-18T14:46:09', dayClose: '2020-01-23T14:03:12' },
    { id: 316, dayStart: '2020-01-16T20:03:53', dayClose: '2020-01-17T06:00:02' },
    { id: 11,  dayStart: '2019-11-15T09:36:32', dayClose: '2019-12-24T06:03:43' },
  ];

  return (
    <div style={s.page}>
      {/* Left Panel */}
      <div style={s.left}>
        <div style={{ ...s.userName, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{currentUser.name}</span>
          {onLogout && <button onClick={onLogout} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>}
        </div>
        {lastRecord ? (
          <div style={s.closedTime}>
            Closed Time<br />
            <strong>{fmt(lastRecord.dayClose || lastRecord.dayStart)}</strong>
          </div>
        ) : (
          <div style={s.closedTime}>No previous session found.</div>
        )}
        {errMsg && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: '8px', padding: '10px', fontSize: '0.8rem', fontWeight: '600' }}>{errMsg}</div>}
        <button style={s.startBtn} onClick={handleStart} disabled={loading}>{loading ? 'Starting...' : 'Day Start'}</button>
      </div>

      {/* Right Panel — History Table */}
      <div style={s.right}>
        <div style={s.title}>Business Day History</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>ID</th>
              <th style={s.th}>Day Start</th>
              <th style={s.th}>Day Close</th>
              <th style={s.th}>Reports</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={row.id}>
                <td style={s.td}>{row.id}</td>
                <td style={s.td}>{fmt(row.opened_at)}</td>
                <td style={s.td}>{row.closed_at ? fmt(row.closed_at) : <em style={{ color: '#9ca3af' }}>Active</em>}</td>
                <td style={s.td}>
                  <button style={s.actionBtn}>
                    <span>≡</span> action
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CashInPage({ currentUser, onCashIn, onLogout }: { currentUser: any; onCashIn: (amount: number) => void; onLogout?: () => void }) {
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    fetch(BACKEND_URL + `/cash-flow?store_id=${currentUser.store_id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistory(data.reverse());
      })
      .catch(console.error);
  }, [currentUser]);

  const handleCashIn = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      const res = await apiFetch('/cash-flow/in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: currentUser.store_id, user_id: currentUser.id || 1, amount: parseFloat(amount), comment }),
        auth: true,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onCashIn(parseFloat(amount));
      } else {
        setErrMsg(data.message || 'Error recording cash in');
      }
    } catch (e) {
      setErrMsg('Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  const s: Record<string, React.CSSProperties> = {
    page: { position: 'fixed', inset: 0, background: '#f3f4f6', display: 'flex', fontFamily: 'sans-serif', zIndex: 99999 },
    left: { width: '320px', background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '28px 24px', gap: '16px' },
    userName: { fontSize: '1.2rem', fontWeight: '700', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' },
    input: { padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem', width: '100%', boxSizing: 'border-box', color: '#000' },
    startBtn: { background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer', letterSpacing: '0.04em', width: '100%', marginTop: '10px' },
    hint: { fontSize: '0.85rem', color: '#ef4444', marginTop: '10px', textAlign: 'center' },
    right: { flex: 1, padding: '28px 32px', overflowY: 'auto' },
    title: { fontSize: '1.2rem', fontWeight: '700', color: '#111827', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
    th: { background: '#e5e7eb', padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '700', color: '#374151' },
    td: { padding: '11px 16px', fontSize: '0.82rem', color: '#374151', borderBottom: '1px solid #f3f4f6' },
    actionBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#374151', padding: '4px', marginLeft: '5px' }
  };

  const demoRows = history;

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={{ ...s.userName, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{currentUser.name}</span>
          {onLogout && <button onClick={onLogout} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>}
        </div>
        <div>
          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem', color: '#4b5563'}}>Cash in amount</label>
          <input type="number" placeholder="0" style={s.input} value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div>
          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem', color: '#4b5563'}}>Comment</label>
          <input type="text" placeholder="Comment" style={s.input} value={comment} onChange={e => setComment(e.target.value)} />
        </div>
        <button style={s.startBtn} onClick={handleCashIn} disabled={loading}>{loading ? 'Saving...' : 'Cash in'}</button>
        {errMsg && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: '8px', padding: '10px', fontSize: '0.8rem', fontWeight: '600', marginTop: '10px', textAlign: 'center' }}>{errMsg}</div>}
        <div style={s.hint}>Dear {currentUser.name} please enter opening cash before continuing.</div>
      </div>
      <div style={s.right}>
        <div style={s.title}>Cash In / Out History</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>ID</th>
              <th style={s.th}>Cashin at</th>
              <th style={s.th}>Cash in amount</th>
              <th style={s.th}>Cashout date</th>
              <th style={s.th}>Cashout amount</th>
              <th style={s.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {demoRows.map((row) => (
              <tr key={row.id}>
                <td style={s.td}>{row.id}</td>
                <td style={s.td}>{fmt(row.timestamp || row.created_at)}</td>
                <td style={s.td}>{row.type === 'CASH_IN' ? row.amount : 0}</td>
                <td style={s.td}>{row.type === 'CASH_OUT' ? fmt(row.timestamp || row.created_at) : '—'}</td>
                <td style={s.td}>{row.type === 'CASH_OUT' ? row.amount : '—'}</td>
                <td style={s.td}>
                  <button style={s.actionBtn} title="Print"><Printer size={16}/></button>
                  <button style={s.actionBtn} title="View"><Globe size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import WaiterMode from './WaiterMode'
import WaiterTerminalLogin from './WaiterTerminalLogin'

export default function App() {
  const isWaiterModeURL = window.location.pathname.endsWith('/waiter') || window.location.search.includes('mode=waiter');
  const userStorageKey = isWaiterModeURL ? 'd4u_waiter_user' : 'd4u_main_user';

  const [settings, setSettings] = useState<any>(null);
  const [loggedInUser, setLoggedInUser] = useState<typeof USERS[0] | null>(() => {
    try { return JSON.parse(localStorage.getItem(userStorageKey) || 'null'); } catch { return null; }
  });
  const [dayStartTime, setDayStartTime] = useState<Date | null>(() => {
    try { const d = localStorage.getItem('d4u_day_start'); return d ? new Date(d) : null; } catch { return null; }
  });
  const [isCashedIn, setIsCashedIn] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('d4u_is_cashed_in') || 'false'); } catch { return false; }
  });
  const [cashInAmount, setCashInAmount] = useState<number>(() => {
    try { return parseFloat(localStorage.getItem('d4u_cashin_amt') || '0'); } catch { return 0; }
  });
  const [forceShowLogin, setForceShowLogin] = useState(false);
  const [isSuspended, setIsSuspended] = useState<{suspended: boolean, reason: string}>({suspended: false, reason: ''});

  useEffect(() => {
    const handleSuspend = (e: any) => setIsSuspended({suspended: true, reason: e.detail});
    window.addEventListener('subscription_suspended', handleSuspend);
    return () => window.removeEventListener('subscription_suspended', handleSuspend);
  }, []);

  const handleLogout = () => {
    if (loggedInUser?.role === 'Waiter') {
      socket.emit('waiter_disconnected', { store_id: loggedInUser.store_id });
      if ((loggedInUser as any).sessionId) {
        fetch(`${BACKEND_URL}/terminal/sessions/${(loggedInUser as any).sessionId}/logout`, { method: 'POST' }).catch(() => {});
      }
      localStorage.removeItem('d4u_waiter_session_id');
    }
    setLoggedInUser(null);
    setIsCashedIn(false);
    setDayStartTime(null);
    setDayStartTime(null);
    localStorage.removeItem(userStorageKey);
    localStorage.removeItem('d4u_day_start');
    localStorage.setItem('d4u_is_cashed_in', 'false');
    setForceShowLogin(true);
  };

  useEffect(() => {
    const handleForceLogout = () => {
      handleLogout();
    };
    socket.on('force_logout', handleForceLogout);
    return () => { socket.off('force_logout', handleForceLogout); };
  }, []);

  // apiFetch (pos/api.ts) dispatches this when a session can't be recovered
  // (refresh token missing/expired) — same window-CustomEvent pattern as
  // subscription_suspended above, since that module has no access to this
  // component's state and shouldn't duplicate what handleLogout already does.
  useEffect(() => {
    const handleSessionExpired = () => {
      handleLogout();
    };
    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => { window.removeEventListener('auth_session_expired', handleSessionExpired); };
  }, []);

  useEffect(() => {
    const storeId = loggedInUser?.store_id;
    fetch(`${BACKEND_URL}/cms/settings?store_id=${storeId}`)
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        if (data.brand?.currency) {
          (window as any).d4u_currency = data.brand.currency;
        }
        if (data.loyalty_point_value !== undefined) {
          (window as any).d4u_loyalty_point_value = data.loyalty_point_value;
        }
      })
      .catch(console.error);
  }, [loggedInUser?.store_id]);

  useEffect(() => {
    if (loggedInUser) localStorage.setItem(userStorageKey, JSON.stringify(loggedInUser));
    else localStorage.removeItem(userStorageKey);
  }, [loggedInUser, userStorageKey]);

  useEffect(() => {
    if (dayStartTime) localStorage.setItem('d4u_day_start', dayStartTime.toISOString());
    else localStorage.removeItem('d4u_day_start');
  }, [dayStartTime]);

  useEffect(() => {
    localStorage.setItem('d4u_is_cashed_in', JSON.stringify(isCashedIn));
    localStorage.setItem('d4u_cashin_amt', cashInAmount.toString());
  }, [isCashedIn, cashInAmount]);

  if (!settings) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>Loading POS System...</div>;

  if (isSuspended.suspended) {
    return (
      <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#0f172a', color:'white', fontFamily:'sans-serif'}}>
        <div style={{maxWidth:'400px', width:'100%', backgroundColor:'#1e293b', padding:'30px', borderRadius:'24px', textAlign:'center', border:'1px solid rgba(239,68,68,0.3)'}}>
          <h1 style={{fontSize:'1.8rem', fontWeight:'bold', marginBottom:'10px', color:'#ef4444'}}>POS Suspended</h1>
          <p style={{color:'#94a3b8', marginBottom:'20px', lineHeight:'1.5'}}>
            Your restaurant's POS system has been suspended by the administrator. Contact your Head Office.
          </p>
          <div style={{backgroundColor:'rgba(239,68,68,0.1)', padding:'15px', borderRadius:'12px', border:'1px solid rgba(239,68,68,0.2)', marginBottom:'20px', fontSize:'0.9rem', color:'#f87171', fontWeight:'bold'}}>
            Reason: {isSuspended.reason || 'Account disabled'}
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('d4u_main_user');
              localStorage.removeItem('d4u_waiter_user');
              window.location.reload();
            }}
            style={{width:'100%', backgroundColor:'#334155', color:'white', fontWeight:'bold', padding:'12px 16px', borderRadius:'12px', border:'none', cursor:'pointer'}}
          >
            Switch User / Refresh
          </button>
        </div>
      </div>
    );
  }

  if (isWaiterModeURL && (!loggedInUser || loggedInUser.role !== 'Waiter')) {
    return <WaiterTerminalLogin onAuthenticated={(user) => { setLoggedInUser(user); setForceShowLogin(false); }} />;
  }

  // Prevent Waiter from accessing the main link (Auto-logout if stuck)
  if (!isWaiterModeURL && loggedInUser?.role === 'Waiter') {
    localStorage.removeItem('d4u_main_user');
    setLoggedInUser(null);
    return null;
  }

  // Show login if auth is enabled OR user manually logged out
  if (forceShowLogin || (settings.module_auth_enabled && !loggedInUser)) {
    return <LoginScreen onLogin={(user) => { setLoggedInUser(user); setForceShowLogin(false); }} />;
  }

  const activeUser = loggedInUser || (import.meta.env.DEV ? { id: 1, name: 'Bypass Access', store_id: 1, role: 'Admin' } : null);

  // TV Board is passive signage — it has no cash drawer and doesn't belong
  // to any cashier's shift, so it must not sit behind Day Start/Cash In.
  // Bypasses the same role-blind gate below that Chef already bypasses for
  // KDS (App.tsx ~4620), just role-agnostic since any logged-in staff
  // member's store_id is equally valid for a read-only display.
  if (window.location.pathname === '/tv-board') {
    return <TvBoard />;
  }

  if (activeUser.role === 'Chef') {
    // Chef role always means KDS -- but it used to render KDS in place at
    // WHATEVER path was open (including "/", the POS's own root), so a
    // browser that had a Chef logged in showed Kitchen at "/" instead of the
    // POS register. "/kitchen" is the one canonical URL for this view; land
    // there via a real redirect instead, so "/" is reserved for POS/login
    // and the address bar always matches what's on screen.
    if (window.location.pathname !== '/kitchen') {
      window.location.replace('/kitchen');
      return null;
    }
    if (!settings.module_kds_enabled) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1e293b', color: 'white', fontFamily: 'sans-serif' }}>
          <ChefHat size={64} color="#ef4444" style={{ marginBottom: '20px' }} />
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Kitchen Display is Disabled</h1>
          <p style={{ color: '#94a3b8', marginTop: '10px' }}>The KDS module has been turned off by the Head Office.</p>
          <button 
            onClick={() => { setLoggedInUser(null); localStorage.removeItem('d4u_main_user'); }}
            style={{ marginTop: '20px', background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Logout
          </button>
        </div>
      );
    }

    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        <KitchenDisplay currentUser={activeUser} onLogout={() => setLoggedInUser(null)} />
      </div>
    );
  }

  // We will remove WaiterMode and just use POSApp with isWaiterMode=true
  if (activeUser.role === 'Waiter') {
    return <POSApp currentUser={activeUser} dayStartTime={null} onLogout={handleLogout} onCashOut={handleLogout} />;
  }

  if (activeUser.role !== 'Waiter') {
    if (!dayStartTime) return <DayStartPage currentUser={activeUser} onDayStart={setDayStartTime} onLogout={handleLogout} />;
    if (!isCashedIn) return <CashInPage currentUser={activeUser} onCashIn={(amount) => { setCashInAmount(amount); setIsCashedIn(true); }} onLogout={handleLogout} />;
  }
  return <POSApp currentUser={activeUser} dayStartTime={dayStartTime} onLogout={handleLogout} onCashOut={handleLogout} />;
}
