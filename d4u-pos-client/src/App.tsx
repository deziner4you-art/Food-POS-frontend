import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';
const socket = io(BACKEND_URL);
import { Home, Search, Printer, Trash2, Plus, Minus, Store, Clock, X, Settings, Moon, Banknote, PauseCircle, Globe, Truck, Users, MapPin, Phone, CheckCircle, Navigation, MessageCircle, ChefHat, Lock, Check, CreditCard, Landmark, User, Maximize, Receipt, LogOut } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db';
import KitchenDisplay from './StitchKDS'
import TVDisplay from './TVDisplay'
import AdminDashboard from './AdminDashboard'
import StaffManagement from './StaffManagement'
import TvBoard from './pages/TvBoard'
import { PrintBill, PrintKOT } from './PrintTemplates'
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

const USERS = [
  { email: '03000000001',  password: '1234',  name: 'Ali Cashier (B1)',  role: 'Cashier', id: 1, store_id: 1 },
  { email: '03000000002',  password: 'manager123', name: 'Sara Manager (B1)', role: 'Manager', id: 2, store_id: 1 },
  { email: '03000000003',  password: 'admin',  name: 'Super Admin (B1)',  role: 'Admin', id: 3, store_id: 1 },
  
  // Branch 2 Users
  { email: '03000000004',  password: '1234',  name: 'Umer Cashier (B2)',  role: 'Cashier', id: 5, store_id: 2 },
  { email: '03000000005',  password: 'manager123', name: 'Zoya Manager (B2)', role: 'Manager', id: 6, store_id: 2 },

  // Branch 3 Users
  { email: '03000000006',  password: '1234',  name: 'Bilal Cashier (B3)',  role: 'Cashier', id: 7, store_id: 3 },

];

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin: password })
      });
      const data = await res.json();

      if (res.ok && data.user) {
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

function POSApp({ currentUser, dayStartTime, onLogout, onCashOut }: { currentUser: typeof USERS[0]; dayStartTime: Date; onLogout: () => void; onCashOut: () => void }) {
  const isWaiterMode = currentUser?.role === 'Waiter';

  const [activeMenu, setActiveMenu] = useState('Home');
  const [isWaiterConnected, setIsWaiterConnected] = useState(false);
  const inventoryItems = useLiveQuery(() => db.inventory.toArray()) || [];
  const lowStockItems = inventoryItems.filter(ing => ing.currentStock <= ing.warningThreshold);
  const [activeCategoryId, setActiveCategoryId] = useState<number | string | null>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([])
  
  // WhatsApp Simulation State (for future real WhatsApp API integration)
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState<any>(null);

  // Removed: fake WhatsApp message simulation timer
  // Real WhatsApp integration requires WhatsApp Business API webhook

  const [orderType, setOrderType] = useState('Dine In')
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [cart, setCart] = useState<any[]>([])
  const [time, setTime] = useState(new Date())
  const [dayClosePin, setDayClosePin] = useState('')
  const [pendingLastDaySettlements, setPendingLastDaySettlements] = useState<any[]>([])

  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [modalType, setModalType] = useState<'NONE' | 'CASH_OUT' | 'DAY_CLOSE' | 'HOLD_ORDERS' | 'SETTINGS' | 'PAYMENT' | 'MANAGER_AUTH' | 'KOT_PREVIEW' | 'ADD_CUSTOM_ITEM' | 'CASHIER_LOGIN' | 'DELIVERY_DETAILS' | 'DISCOUNT_AUTH' | 'SELECT_VARIANT' | 'ADD_ONS'>('NONE');
  const [pendingVariantProduct, setPendingVariantProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'SIZES' | 'TOPPINGS'>('SIZES');
  const [waiterPinModalOpen, setWaiterPinModalOpen] = useState(false);
  const [generatedWaiterPin, setGeneratedWaiterPin] = useState('');
  const [activeWaiters, setActiveWaiters] = useState<any[]>([]);
  const [cashier, setCashier] = useState<{ name: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem('d4u_cashier') || 'null'); } catch { return null; }
  });
  const [cashierLoginName, setCashierLoginName] = useState('');
  const [heldOrders, setHeldOrders] = useState<any[]>([])
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
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

  useEffect(() => {
    if (toast && toast.type !== 'error') {
      const timer = setTimeout(() => {
        setToast(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [cashGiven, setCashGiven] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Digital Link' | 'Split'>('Cash');
  const [splitCash, setSplitCash] = useState('');
  const [splitCard, setSplitCard] = useState('');
  const [isTillLocked, setIsTillLocked] = useState(true);
  const [printData, setPrintData] = useState<{ type: 'NONE' | 'BILL' | 'KOT', data: any, printCount: number }>({ type: 'NONE', data: null, printCount: 1 });
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

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
  const [terminalOrders, setTerminalOrders] = useState<any[]>([]);
  const [activeTerminalKotId, setActiveTerminalKotId] = useState<number | null>(null);
  const terminalKots = useLiveQuery(() => db.kots.toArray())?.filter(kot => kot.source === 'Terminal' && kot.status !== 'PAID' && kot.status !== 'CANCELLED') || [];

  // Offline Sync Engine
  useEffect(() => {
    const syncOfflineOrders = async () => {
      if (!navigator.onLine) return;
      try {
        const unsynced = await db.kots.where('synced').equals('false').toArray();
        const unsyncedReal = unsynced.length === 0 ? await db.kots.filter(k => k.synced === false).toArray() : unsynced; // Dexie query fallback
        
        if (unsyncedReal.length === 0) return;

        const res = await fetch(`${BACKEND_URL}/pos-orders/sync-offline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: unsyncedReal })
        });
        if (res.ok) {
          const syncedIds = unsyncedReal.map(o => o.id!);
          await db.kots.where('id').anyOf(syncedIds).modify({ synced: true });
          console.log(`[Offline Sync] Successfully synced ${syncedIds.length} orders.`);
        }
      } catch (e) {
        console.error('[Offline Sync] Sync failed:', e);
      }
    };
    const interval = setInterval(syncOfflineOrders, 30000); // 30 seconds
    // Initial sync check
    setTimeout(syncOfflineOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Initial fetch
    const fetchInitialData = async () => {
      try {
        const storeId = currentUser?.store_id || 1;
        const res = await fetch(`${BACKEND_URL}/online-orders?store_id=${storeId}`);
        if (res.ok) setBackendOnlineOrders(await res.json());

        const riderRes = await fetch(`${BACKEND_URL}/rider-orders`);
        if (riderRes.ok) {
          const riderOrders: any[] = await riderRes.json();
          setActiveDeliveries(prev => {
            let changed = false;
            const updated = prev.map(d => {
              const ro = riderOrders.find(o => o.id === d.bridgeOrderId);
              if (ro && d.status !== 'SETTLED') {
                let newStatus = d.status;
                if (ro.status === 'RIDER_ACCEPTED' && d.status !== 'ON_WAY') newStatus = 'ON_WAY';
                if (ro.status === 'PICKED_UP' && d.status !== 'ON_WAY') newStatus = 'ON_WAY';
                if (ro.status === 'DELIVERED' && d.status !== 'DELIVERED_PENDING_SETTLEMENT') newStatus = 'DELIVERED_PENDING_SETTLEMENT';
                if (newStatus !== d.status) { changed = true; return { ...d, status: newStatus, rider: 'Active Rider' }; }
              }
              return d;
            });
            return changed ? updated : prev;
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

      if (['DISPATCHED', 'RIDER_ACCEPTED', 'PICKED_UP', 'DELIVERED', 'PAID', 'SETTLED'].includes(order.status)) {
        setActiveDeliveries(prev => {
          const updated = [...prev];
          const existIdx = updated.findIndex(d => d.bridgeOrderId === order.id);
          if (existIdx > -1) {
            let newStatus = order.status;
            if (order.status === 'RIDER_ACCEPTED') newStatus = 'ON_WAY';
            if (order.status === 'PICKED_UP') newStatus = 'ON_WAY';
            if (order.status === 'DELIVERED' || order.status === 'PAID') newStatus = 'DELIVERED_PENDING_SETTLEMENT';
            if (newStatus !== updated[existIdx].status) {
              updated[existIdx] = { ...updated[existIdx], status: newStatus, rider: 'Active Rider' };
            }
          }
          return updated;
        });
        
        // Also update pendingLastDaySettlements if it matches an old order being settled
        if (order.status === 'SETTLED') {
          setPendingLastDaySettlements(prev => prev.filter(d => d.bridgeOrderId !== order.id));
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

      const handleTerminalOrder = (order: any) => {
        if (!posSettings.terminalEngineEnabled) return; // Ignore if Engine is OFF
        setTerminalOrders(prev => {
          setToast({ message: `New Terminal Order from ${order.waiter_name} (Table ${order.table_no})`, type: 'success' });
          return [...prev, { ...order, id: Date.now() }]; // Give it a unique ID
        });
      };

      // Join the store-specific room
      socket.emit('join_store', { store_id: currentUser?.store_id || 1 });
  
      socket.on('new_order', handleNewOrder);
      socket.on('order_updated', handleOrderUpdated);
      socket.on('negative_inventory_alert', handleNegativeInventoryAlert);
      socket.on('TERMINAL_ORDER_RECEIVED', handleTerminalOrder);
      socket.on('waiter_connected', () => setIsWaiterConnected(true));
      socket.on('waiter_disconnected', () => setIsWaiterConnected(false));
      socket.on('update_active_waiters', (waiters: any[]) => {
        setActiveWaiters(waiters);
      });
      
      return () => {
        socket.off('new_order', handleNewOrder);
        socket.off('order_updated', handleOrderUpdated);
        socket.off('negative_inventory_alert', handleNegativeInventoryAlert);
        socket.off('TERMINAL_ORDER_RECEIVED', handleTerminalOrder);
        socket.off('waiter_connected');
        socket.off('waiter_disconnected');
      };
    }, [currentUser]);

  const allOnlineOrders = [...onlineOrdersList, ...backendOnlineOrders];

  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);

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
        const storeId = currentUser?.store_id || 1;
        const res = await fetch(`${BACKEND_URL}/catalog/sync/${storeId}`);
        if (res.ok) {
          const data = await res.json();
          await db.categories.clear();
          await db.products.clear();
          
          if (data.categories && data.categories.length > 0) {
            await db.categories.bulkPut(data.categories.map((c: any) => ({
              id: c.id,
              store_id: storeId,
              name: c.name
            })));
          }
          
          if (data.products && data.products.length > 0) {
            await db.products.bulkPut(data.products.map((p: any) => ({
              id: p.id,
              category_id: p.categories && p.categories.length > 0 ? p.categories[0].id : p.category_id,
              name: p.name,
              price: p.price,
              desc: p.sku || 'No description',
              img: p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
              variants: p.variants,
              categories: p.categories,
              isApproved: p.status === 'APPROVED'
            })));
          }
        }

        const campRes = await fetch(`${BACKEND_URL}/marketing/campaign?store_id=${storeId}`);
        if (campRes.ok) setActiveCampaigns(await campRes.json());

      } catch (err) {
        console.error('Failed to sync catalog:', err);
      }
    };
    fetchCatalog();
  }, [currentUser]);

  useEffect(() => {
    if (categories.length > 0 && activeCategoryId === null) setActiveCategoryId(categories[0].id)
  }, [categories, activeCategoryId])

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
        newlyReady.forEach(kot => {
          setToast({ message: `KOT Order #${kot.orderId} is READY for ${kot.type}!`, type: 'success' });
          setTimeout(() => setToast(null), 5000);
          
          if (kot.type === 'Delivery') {
            setActiveDeliveries(prev => prev.map(d => d.id === kot.orderId ? { ...d, status: 'READY_FOR_RIDER', rider: 'Waiting for Rider' } : d));
          }
        });
      }

      const newlyPreparing = kots.filter(k => k.status === 'PREPARING' && prevKotsRef.current.find(p => p.id === k.id)?.status !== 'PREPARING');
      if (newlyPreparing.length > 0) {
        newlyPreparing.forEach(async kot => {
          if (kot.type === 'Delivery' && kot.bridgeOrderId) {
            try {
              await fetch(`${BACKEND_URL}/online-orders/${kot.bridgeOrderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  kdsStatus: 'ACCEPTED', 
                  estimatedReadyAt: new Date(new Date(kot.startTime).getTime() + (kot.prepTimeMinutes * 60000)).toISOString() 
                })
              });
              
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
            } catch {}
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

  const getProductDiscount = (product: any) => {
    if (product.variant_id) return 0;
    if (product.categories?.some((c:any) => ['extra toppings', 'add-ons', 'addons'].includes((c.name || '').toLowerCase()))) return 0;
    let maxDiscount = 0;
    for (const camp of activeCampaigns) {
      if (!camp.published_pos) continue;

      const hasStoreTarget = camp.target_stores?.length > 0;
      const hasCategoryTarget = camp.target_categories?.length > 0;
      const hasProductTarget = camp.target_products?.length > 0;

      const storeId = currentUser?.store_id || 1;
      const storeMatches = hasStoreTarget ? camp.target_stores.some((s:any) => s.id === storeId) : true;
      const categoryMatches = hasCategoryTarget ? camp.target_categories.some((c:any) => c.id === product.category_id) : true;
      const productMatches = hasProductTarget ? camp.target_products.some((p:any) => p.id === product.id) : true;

      const isGlobal = !hasStoreTarget && !hasCategoryTarget && !hasProductTarget;

      let applies = false;
      if (isGlobal) {
        applies = true;
      } else {
        if (!storeMatches) continue; 
        
        if (hasProductTarget) {
          if (productMatches) applies = true;
        } else if (hasCategoryTarget) {
          if (categoryMatches) applies = true;
        } else {
          applies = true;
        }
      }

      if (applies && camp.discount_pct > maxDiscount) {
        maxDiscount = camp.discount_pct;
      }
    }
    return maxDiscount;
  };

  const addToCart = (product: any, variant?: any) => {
    setCart(prev => {
      const cartItemId = variant ? `${product.id}-${variant.id}` : `${product.id}`;
      const existing = prev.find(item => (item.cartItemId || item.id) === cartItemId);
      if (existing) {
        return prev.map(item =>
          (item.cartItemId || item.id) === cartItemId ? { ...item, qty: item.qty + 1 } : item
        );
      }
      const priceToUse = variant ? variant.price : product.price;
      const nameToUse = variant ? `${product.name} (${variant.name})` : product.name;
      return [...prev, { ...product, cartItemId, name: nameToUse, price: priceToUse, variant_id: variant?.id, qty: 1 }];
    });
  }

  const updateQty = (id: any, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if ((item.cartItemId || item.id) === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter((item): item is any => item !== null);
    });
  }

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
      store_id: currentUser?.store_id || 1,
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
    if (orderType === 'Delivery' && (!customerName.trim() || !customerAddress.trim() || !customerPhone.trim())) {
      setPendingDeliveryAction('KOT');
      return setModalType('DELIVERY_DETAILS');
    }
    
    const itemsSummary = cart.map(item => `${item.qty}x ${item.name}`).join(', ');
    const nextOrderId = Math.floor(Math.random() * 100000);

    const newKot = {
      orderId: nextOrderId,
      type: orderType === 'Dine In' ? `Dine In (${tableNumber})` : orderType,
      customer: customerName,
      customerPhone: customerPhone,
      customerAddress: customerAddress,
      items: itemsSummary,
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

    const kotId = await db.kots.add(newKot);

    // Patch bridge: kdsStatus → NEW_KOT
    try {
        await fetch(`${BACKEND_URL}/online-orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kdsStatus: 'NEW_KOT' })
      });
      // Immediately remove from local UI so it disappears from Online tab
      setBackendOnlineOrders(prev => prev.filter(o => o.id !== order.id));
    } catch { /* bridge offline */ }

    // Trigger KOT print
    triggerKotPrint({ ...newKot, id: kotId });

    const products = await db.products.toArray();
    const parsedCart = (order.items || '').split(',').map((part: string) => {
      const m = part.trim().match(/^(\d+)x\s+(.+)$/);
      let name = part.trim();
      let qty = 1;
      if (m) { qty = parseInt(m[1]); name = m[2].trim(); }
      const product = products.find(p => p.name.toLowerCase() === name.toLowerCase());
      const price = product ? product.price : 0;
      return { id: Date.now() + Math.random(), name, price, qty, img: '', desc: 'Online Order Item' };
    }).filter((i: any) => i.name);

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

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    setHeldOrders([...heldOrders, { id: Date.now(), cart, orderType, time: new Date() }]);
    setCart([]);
  }

  const handleResumeOrder = (id: number) => {
    const orderToResume = heldOrders.find(o => o.id === id);
    if (orderToResume) {
      if (cart.length > 0) {
        setHeldOrders(prev => [...prev.filter(o => o.id !== id), { id: Date.now(), cart, orderType, time: new Date() }]);
      } else {
        setHeldOrders(prev => prev.filter(o => o.id !== id));
      }
      setCart(orderToResume.cart);
      setOrderType(orderToResume.orderType);
      setModalType('NONE');
    }
  }

  const handleDiscountChange = (val: string) => {
    const newVal = Number(val);
    if (newVal > discountPercent && posSettings.discountPassword) {
      setPendingDiscount(val);
      setModalType('DISCOUNT_AUTH');
    } else {
      setDiscountPercent(newVal);
    }
  }

  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountPasswordInput, setDiscountPasswordInput] = useState('');
  const [pendingDiscount, setPendingDiscount] = useState('');
  const [pendingDeliveryAction, setPendingDeliveryAction] = useState<'KOT' | 'PAY' | null>(null);
  const [tableNumber, setTableNumber] = useState<string>('T1');

  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const promoDiscountAmount = cart.reduce((sum, item) => {
    const pct = getProductDiscount(item);
    return sum + (item.price * item.qty * (pct / 100));
  }, 0);
  const afterPromo = subTotal - promoDiscountAmount;
  const discountAmount = afterPromo * (discountPercent / 100);
  const totalDiscountAmount = promoDiscountAmount + discountAmount;
  const afterDiscount = subTotal - totalDiscountAmount;
  const tax = afterDiscount * 0.10;
  const grandTotal = afterDiscount + tax;

  const crmCustomersRaw = useLiveQuery(() => db.crmCustomers.toArray()) || [];
  const crmCustomers = crmCustomersRaw.length > 0 ? crmCustomersRaw : [];

  useEffect(() => {
    if (crmCustomersRaw.length === 0) {
      db.crmCustomers.bulkAdd([
        { id: 'c1', name: 'John Doe',     phone: '03001234567', email: 'john@example.com',    points: 450  },
        { id: 'c2', name: 'Ayesha Khan',  phone: '03129876543', email: 'ayesha@example.com',  points: 1200 },
        { id: 'c3', name: 'Zainab Ahmed', phone: '03334567890', email: 'zainab@example.com',  points: 80   },
      ]).catch(() => {});
    }
  }, [crmCustomersRaw.length]);

  const [crmSearch, setCrmSearch] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

  const [liveCustomer, setLiveCustomer] = useState<any>(null);
  const [redeemedPoints, setRedeemedPoints] = useState(0);

  useEffect(() => {
    if (customerPhone.length >= 10) {
      fetch(`${BACKEND_URL}/customers/phone/${customerPhone}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.id) setLiveCustomer(data);
          else setLiveCustomer(null);
        })
        .catch(() => setLiveCustomer(null));
    } else {
      setLiveCustomer(null);
    }
  }, [customerPhone]);

  if (window.location.pathname === '/kitchen') {
    return <KitchenDisplay />;
  }
  
  if (window.location.pathname === '/tv') {
    return <TVDisplay />;
  }

  if (window.location.pathname === '/tv-board') {
    return <TvBoard />;
  }

  // Real-time GPS sync handled globally by WebSockets above

  const [branchName, setBranchName] = useState(`Branch ${currentUser?.store_id || 1}`);
  
  useEffect(() => {
    fetch(`${BACKEND_URL}/stores`)
      .then(res => res.json())
      .then(data => {
         const stores = Array.isArray(data) ? data : (data.value || data.stores || []);
         const s = stores.find((x: any) => x.id === (currentUser?.store_id || 1));
         if (s) setBranchName(s.name);
      }).catch(console.error);
  }, [currentUser?.store_id]);

  return (
    <div className="pos-layout" onClick={() => showMoreMenu && setShowMoreMenu(false)}>

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
              {terminalOrders.length > 0 && <span style={{ position: 'absolute', top: '0', right: '0', background: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '2px 5px', fontSize: '0.65rem', fontWeight: 'bold' }}>{terminalOrders.length}</span>}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '4px', color: isWaiterConnected ? '#4edea3' : undefined }}>Terminal</span>
          </div>
        )}
        <div className={`sidebar-item ${activeMenu === 'Delivery' ? 'active' : ''}`} onClick={() => setActiveMenu('Delivery')}>
          <div className="icon-box"><Truck size={22} /></div><span>Delivery</span>
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
      <main className="main-content" style={{ position: 'relative' }}>
        {lowStockItems.length > 0 && (
          <div style={{ background: '#ef4444', color: 'white', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem', animation: 'pulse 2s infinite' }}>
            <AlertCircle size={18} />
            LOW STOCK ALERT: {lowStockItems.map(i => `${i.name} (${i.currentStock} left)`).join(', ')}
          </div>
        )}
        <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)', padding: '12px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '20px', gap: '20px' }}>
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
            <button onClick={onLogout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogOut size={18} /> Logout
            </button>
          )}

          {/* TOAST NOTIFICATION AREA (IN HEADER) */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {toast && (
              <div className="blink-animation" style={{ background: toast.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${toast.type === 'success' ? '#22c55e' : '#ef4444'}`, color: toast.type === 'success' ? '#4ade80' : '#f87171', padding: '10px 20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', cursor: toast.type === 'error' ? 'pointer' : 'default' }} onClick={() => { if (toast.type === 'error') setToast(null); }}>
                {toast.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
                {toast.message}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', flexShrink: 0, justifyItems: 'flex-end', justifyContent: 'flex-end' }}>
            
            {/* Date Time Block */}
            {activeMenu !== 'Dashboard' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                <Clock size={16} color="var(--accent-yellow)" />
                {dayStartTime.toLocaleDateString()} | {dayStartTime.toLocaleTimeString()}
              </div>
            )}

            {/* Cashier Login */}
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
            <div className="nav-categories" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
              <button 
                className={`nav-category-btn ${activeCategoryId === null ? 'active' : ''}`}
                onClick={() => setActiveCategoryId(null)}
              >
                All Items
              </button>
              <button 
                className={`nav-category-btn ${activeCategoryId === 'DISCOUNT' ? 'active' : ''}`}
                onClick={() => setActiveCategoryId('DISCOUNT')}
              >
                <span style={{ color: '#fbbf24', marginRight: '5px' }}>🔥</span> Discounted
              </button>
              {categories.filter(c => !['extra toppings', 'add-ons', 'addons'].includes(c.name.toLowerCase())).map(c => (
                <button 
                  key={c.id} 
                  className={`nav-category-btn ${activeCategoryId === c.id ? 'active' : ''}`}
                  onClick={() => setActiveCategoryId(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="product-grid">
              {products.filter(prod => {
                if (activeCategoryId === 0 && prod.categories?.some((c:any) => ['extra toppings', 'add-ons', 'addons'].includes((c.name || '').toLowerCase()))) return false;
                if (searchQuery && !prod.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                if (activeCategoryId === 'DISCOUNT' && getProductDiscount(prod) === 0) return false;
                return true;
              }).map(prod => {
                const discount = getProductDiscount(prod);
                return (
                <div
                  key={prod.id}
                  className="product-card"
                  onClick={() => {
                    if (prod.isApproved === false) {
                      setToast({ message: 'This item requires Admin approval before sale.', type: 'error' });
                    } else if (prod.variants && prod.variants.length > 0) {
                      setPendingVariantProduct(prod);
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
                  <div className="product-img-wrapper"><img src={prod.img || ''} alt={prod.name} className="product-img" /></div>
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
              {posSettings.allowCustomItems && (
                <div
                  onClick={() => setModalType('ADD_CUSTOM_ITEM')}
                  style={{ border: '2px dashed #334155', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', minHeight: '200px', color: '#cbd5e1', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-yellow)'; e.currentTarget.style.color = 'var(--accent-yellow)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#cbd5e1'; }}
                >
                  <Plus size={40} style={{ marginBottom: '15px' }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Add Custom Item</span>
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
                        {order.totalAmount ? `$${order.totalAmount}` : '—'}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pending Approval</div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flex: 1 }}>
                    Items: {(() => {
                      try {
                        if (order.items && order.items.trim().startsWith('[')) {
                          const arr = JSON.parse(order.items);
                          return arr.map((i: any) => `${i.qty || 1}x ${i.name}`).join(', ');
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
                            parsedCart = arr.map((i: any) => {
                              const product = products.find(p => p.name.toLowerCase() === i.name.toLowerCase());
                              return { name: i.name, price: product ? product.price : (i.price || 0), qty: i.qty || 1 };
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
                        const subTotal = parsedCart.reduce((sum, item) => sum + item.price * item.qty, 0);
                        const tax = subTotal * 0.1;
                        const grandTotal = subTotal + tax;
                        setPrintData({ type: 'BILL', data: { orderType: 'Delivery', cart: parsedCart, subTotal, tax, grandTotal, cashGiven: grandTotal, returnAmount: 0, time: new Date().toLocaleString() }, printCount: posSettings.billPrintQty || 1 });
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
          <div style={{ padding: '20px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
              <h2 style={{ margin: 0, color: 'var(--accent-green)' }}><Navigation size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }} />Incoming Terminal Orders</h2>
              <button 
                onClick={() => {
                  const pin = Math.floor(1000 + Math.random() * 9000).toString();
                  socket.emit('generate_waiter_pin', { store_id: currentUser.store_id || 1, pin });
                  setGeneratedWaiterPin(pin);
                  setWaiterPinModalOpen(true);
                }}
                style={{ background: 'var(--accent-green)', color: 'black', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={18} /> Generate Tablet Link
              </button>
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Navigation size={20} color="var(--accent-green)" /> Connected Waiter Tablets ({activeWaiters.length})
              </h3>
              
              {activeWaiters.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)' }}>
                  No tablets currently connected. Generate a PIN to let waiters login.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                  {activeWaiters.map((waiter, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green)' }}></div>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{waiter.name}</span>
                      </div>
                      <button 
                        onClick={() => socket.emit('kick_waiter', { name: waiter.name, store_id: currentUser.store_id || 1 })}
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        Disconnect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <h3 style={{ margin: '20px 0 10px 0', color: 'white' }}>Pending Orders</h3>
            <div className="custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', overflowY: 'auto', paddingRight: '10px' }}>
              {terminalOrders.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '0.95rem', gridColumn: '1 / -1' }}>
                  No pending terminal orders
                </div>
              )}
              {terminalOrders.map(order => (
                <div key={order.id} style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'var(--bg-base)', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: `5px solid var(--accent-green)` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: 'white' }}>Table {order.table_no}</h3>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Waiter: {order.waiter_name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '1.1rem' }}>Rs. {order.total.toFixed(2)}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(order.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  
                  <div style={{ background: '#0f172a', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: '#cbd5e1' }}>
                    {order.items.map((i: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{i.qty}x {i.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>Rs. {i.price * i.qty}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button className="btn-action" style={{ background: 'var(--accent-green)', color: '#00311f', fontWeight: 'bold', border: 'none', padding: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} onClick={async () => {
                    const newKot = {
                      orderId: 'T' + Math.floor(Math.random() * 10000),
                      type: 'Dine-In',
                      items: JSON.stringify(order.items.map((i: any) => ({ name: i.name, qty: i.qty }))),
                      notes: `Terminal - Table ${order.table_no}`,
                      timePlaced: new Date().toLocaleTimeString(),
                      prepTimeMinutes: 0,
                      status: 'NEW' as const,
                      startTime: '',
                      printCount: 0,
                      totalAmount: parseFloat(order.total) || 0,
                      customer: order.table_no,
                      source: 'Terminal',
                    };
                    await db.kots.add(newKot);
                    setToast({ message: 'Order sent to KDS!', type: 'success' });
                    setTerminalOrders(prev => prev.filter(o => o.id !== order.id));
                  }}>
                    Accept & Send to KDS
                  </button>
                </div>
              ))}
            </div>

            <h3 style={{ margin: '20px 0 10px 0', color: 'white' }}>Active Terminal Orders (In Kitchen)</h3>
            <div className="custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', overflowY: 'auto', paddingRight: '10px' }}>
              {terminalKots.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '0.95rem', gridColumn: '1 / -1' }}>
                  No active terminal orders
                </div>
              )}
              {terminalKots.map(kot => (
                <div key={kot.id} style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'var(--bg-base)', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: `5px solid ${kot.status === 'READY' ? 'var(--accent-green)' : 'var(--accent-yellow)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: 'white' }}>Table {kot.customer}</h3>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Order #{kot.orderId}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '1.1rem' }}>Rs. {(kot.totalAmount || 0).toFixed(2)}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{kot.timePlaced}</div>
                    </div>
                  </div>
                  
                  <div style={{ background: '#0f172a', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: '#cbd5e1' }}>
                    {JSON.parse(kot.items).map((i: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{i.qty}x {i.name}</span>
                      </div>
                    ))}
                  </div>
                  
                  {kot.status === 'READY' ? (
                    <button className="btn-action" style={{ background: 'var(--accent-green)', color: '#00311f', fontWeight: 'bold', border: 'none', padding: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} onClick={() => {
                      // Load into cart
                      try {
                        const parsedItems = JSON.parse(kot.items);
                        const newCart = parsedItems.map((i: any) => {
                          const product = products.find(p => p.name.toLowerCase() === i.name.toLowerCase());
                          return { name: i.name, price: product ? product.price : 0, qty: i.qty };
                        });
                        setCart(newCart);
                        setOrderType('Dine In');
                        setOrderNotes(`Terminal - Table ${kot.customer}`);
                        setActiveTerminalKotId(kot.id!);
                        setActiveMenu('Home');
                        setModalType('PAYMENT');
                      } catch (e) {
                        setToast({ message: 'Error loading order', type: 'error' });
                      }
                    }}>
                      Pay Order
                    </button>
                  ) : (
                    <div style={{ padding: '12px', width: '100%', fontWeight: 'bold', textAlign: 'center', background: 'rgba(251, 191, 36, 0.1)', color: 'var(--accent-yellow)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-yellow)' }}>
                      <Clock size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }} />
                      In Kitchen
                    </div>
                  )}
                </div>
              ))}
            </div>
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
                {activeDeliveries.map(del => (
                  <div key={del.id} className={`delivery-card ${selectedDeliveryId === del.id ? 'active' : ''}`} onClick={() => setSelectedDeliveryId(del.id)}>
                    <div className="delivery-card-header">
                      <div>
                        <div className="delivery-card-title">Order #{del.id}</div>
                        <div className="delivery-card-subtitle">{del.rider}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <span className={`delivery-status ${del.status === 'ON_WAY' ? 'on-way status-pulse' : del.status === 'PREPARING' ? 'preparing' : del.status === 'DISPATCHED' ? 'dispatched' : del.status === 'PENDING_CHEF' ? 'bg-slate-700 text-slate-300' : 'delivered'}`}>
                          {del.status === 'DELIVERED_PENDING_SETTLEMENT' ? (<>Delivered<br/>Pending Settlement</>) : del.status.replace(/_/g, ' ')}
                        </span>
                        {(del.items && del.items.length > 0) && (
                          <button className="btn-action" onClick={(e) => {
                            e.stopPropagation();
                            const subTotal = del.items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);
                            const tax = subTotal * 0.10;
                            const grandTotal = subTotal + tax;
                            setPrintData({ type: 'BILL', data: { orderType: 'Delivery', cart: del.items, subTotal, tax, grandTotal, cashGiven: grandTotal, returnAmount: 0, time: new Date().toLocaleString() }, printCount: posSettings.billPrintQty || 1 });
                          }} style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--accent-yellow)', color: 'black' }}>
                            <Printer size={12} /> Print Bill
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="delivery-address"><MapPin size={14} /><span>{del.address}</span></div>
                    {(del.status === 'READY_FOR_RIDER' || del.status === 'DELIVERED_PENDING_SETTLEMENT') && (
                      <div className="delivery-settlement-box" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center w-full">
                          {del.status === 'READY_FOR_RIDER' ? (
                            <button className="btn-action bg-[#fbbf24] text-slate-900 font-bold px-4 py-2" style={{ width: '100%', borderRadius: '4px' }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const res = await fetch(`${BACKEND_URL}/dispatch-order`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ bridgeOrderId: del.bridgeOrderId, order: del })
                                  });
                                  if (res.ok) setToast({ message: 'Order Dispatched to Delivery App!', type: 'success' });
                                } catch {}
                              }}
                            >
                              Dispatch Order
                            </button>
                          ) : (
                            <>
                              <div style={{ flex: 1 }}>
                                <span className="delivery-settlement-text block" style={{ fontSize: '0.65rem' }}>Collect COD</span>
                                <span className="delivery-settlement-amount">Rs. {del.totalAmount || del.cod || 0}</span>
                              </div>
                              <button className="btn-action btn-order" style={{ padding: '8px 16px', fontSize: '0.75rem', width: 'auto', flex: 'none' }}
                                onClick={async () => {
                                  try {
                                    await fetch(`${BACKEND_URL}/online-orders/${del.bridgeOrderId}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'SETTLED' })
                                    });
                                    setActiveDeliveries(prev => prev.filter(o => o.id !== del.id));
                                    setPendingLastDaySettlements(prev => prev.filter(o => o.bridgeOrderId !== del.bridgeOrderId));
                                    setToast({ message: 'Cash Settled & Ledger Updated!', type: 'success' });
                                  } catch {}
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
                              await fetch(`${BACKEND_URL}/online-orders/${del.bridgeOrderId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'SETTLED' })
                              });
                              setPendingLastDaySettlements(prev => prev.filter(o => o.bridgeOrderId !== del.bridgeOrderId));
                              setToast({ message: 'Cash Settled & Ledger Updated for Yesterday!', type: 'success' });
                            } catch {}
                          }}>
                          Settle Cash
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Assign active customers to current bookings to grant reward points.</p>
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

            {/* Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {crmCustomers
                .filter(c => {
                  const q = crmSearch.toLowerCase();
                  return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
                })
                .map(customer => (
                  <div key={customer.id} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', transition: 'border-color 0.2s' }}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        <span>{customer.email}</span>
                      </div>
                    </div>

                    {/* Bottom row: points + button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '0.95rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        {customer.points} Pts
                      </div>
                      <button
                        onClick={() => setToast({ message: `${customer.name} attached to current order!`, type: 'success' })}
                        style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: 'var(--radius-sm)', padding: '7px 18px', fontSize: '0.78rem', fontWeight: 'bold', letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-yellow)'; e.currentTarget.style.color = 'var(--accent-yellow)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'white'; }}
                      >
                        ATTACH TICKET
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* New Customer Modal */}
            {showNewCustomerForm && (
              <div className="modal-overlay">
                <div className="modal-content animate-slide-up" style={{ width: '420px' }}>
                  <div className="modal-header">
                    <h2><Users size={20} style={{ display: 'inline', marginRight: '8px' }} />New Customer</h2>
                    <X size={22} style={{ cursor: 'pointer' }} onClick={() => { setShowNewCustomerForm(false); setNewCustomer({ name: '', phone: '', email: '' }); }} />
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {(['name', 'phone', 'email'] as const).map(field => (
                      <div key={field}>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'capitalize' }}>{field}</label>
                        <input
                          type="text"
                          value={newCustomer[field]}
                          onChange={e => setNewCustomer(prev => ({ ...prev, [field]: e.target.value }))}
                          placeholder={field === 'phone' ? '+92 300 0000000' : field === 'email' ? 'name@example.com' : 'Full Name'}
                          style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: 'var(--radius-sm)', outline: 'none', fontSize: '0.9rem' }}
                        />
                      </div>
                    ))}
                    <button
                      className="btn-action btn-order"
                      style={{ marginTop: '6px', padding: '13px' }}
                      onClick={() => {
                        if (!newCustomer.name || !newCustomer.phone) { setToast({ message: 'Name and Phone are required', type: 'error' }); return; }
                        const nextId = `c${Date.now()}`;
                        db.crmCustomers.add({ id: nextId, ...newCustomer, points: 0 });
                        setToast({ message: `${newCustomer.name} added to CRM!`, type: 'success' });
                        setShowNewCustomerForm(false);
                        setNewCustomer({ name: '', phone: '', email: '' });
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
        {modalType === 'SELECT_VARIANT' && pendingVariantProduct && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content animate-slide-up" style={{ width: '600px', height: '80%', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header" style={{ flexShrink: 0, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <h2>Select Options for {pendingVariantProduct.name}</h2>
                </div>
                <X size={24} style={{cursor:'pointer'}} onClick={() => { setModalType('NONE'); setPendingVariantProduct(null); }} />
              </div>
              
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '10px' }}>
                <button 
                  onClick={() => setActiveTab('SIZES')}
                  style={{ flex: 1, padding: '10px', background: activeTab === 'SIZES' ? 'var(--accent-yellow)' : 'transparent', color: activeTab === 'SIZES' ? 'black' : 'var(--text-muted)', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                >
                  Pizza Sizes
                </button>
                <button 
                  onClick={() => setActiveTab('TOPPINGS')}
                  style={{ flex: 1, padding: '10px', background: activeTab === 'TOPPINGS' ? 'var(--accent-yellow)' : 'transparent', color: activeTab === 'TOPPINGS' ? 'black' : 'var(--text-muted)', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                >
                  Extra Toppings
                </button>
              </div>

              <div style={{ padding: '10px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeTab === 'SIZES' && pendingVariantProduct.variants.map((v: any) => (
                  <button 
                    key={v.id} 
                    className="btn-action" 
                    onClick={() => {
                      addToCart(pendingVariantProduct, v);
                      setToast({ message: `${v.name} added`, type: 'success' });
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

                {activeTab === 'TOPPINGS' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {allProducts.filter(p => p.categories?.some((c:any) => c.name.toLowerCase().includes('topping'))).length === 0 && (
                      <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '20px 0' }}>No Extra Toppings found. Please create an "Extra Toppings" category in the Admin panel and add products to it.</p>
                    )}
                    {allProducts.filter(p => p.categories?.some((c:any) => c.name.toLowerCase().includes('topping'))).map(topping => (
                      <div key={topping.id} 
                        className="product-card"
                        onClick={() => { addToCart(topping); setToast({message: `${topping.name} Added`, type: 'success'}); }}
                        style={{ cursor: 'pointer', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '15px', textAlign: 'center' }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{topping.name}</div>
                        <div style={{ color: 'var(--accent-green)' }}>Rs. {topping.price}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ padding: '15px 20px', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
                <button 
                  onClick={() => { setModalType('NONE'); setPendingVariantProduct(null); }}
                  style={{ width: '100%', padding: '15px', background: 'var(--bg-panel)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
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
              <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#fbbf24', display: 'flex', justifyContent: 'space-between' }}>
                <span>Loyalty Points: <b>{liveCustomer.loyalty_points}</b></span>
                <button 
                  onClick={() => {
                    if (liveCustomer.loyalty_points > 0) {
                      setDiscountPercent(0); 
                      // 1 point = Rs. 0.20
                      const discountVal = liveCustomer.loyalty_points * 0.2;
                      const maxDiscountPct = (discountVal / subTotal) * 100;
                      setDiscountPercent(Math.min(100, Math.floor(maxDiscountPct)));
                      setRedeemedPoints(liveCustomer.loyalty_points);
                      setToast({ message: `${liveCustomer.loyalty_points} Points applied!`, type: 'success' });
                    }
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#4edea3', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Redeem All
                </button>
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
                {['T1','T2','T3','T4','T5','T6','T7','T8', 'T9', 'T10', 'VIP-1', 'VIP-2'].map(t => (
                  <option key={t} value={t}>Table: {t}</option>
                ))}
              </select>
            </div>
          )}
          <div className="cart-items-list">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.img || ''} className="cart-item-img" alt={item.name} />
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
            <div className="totals-row" style={{ padding: '1px 0', fontSize: '0.75rem' }}><span>Tax (10%)</span><span>Rs. {tax.toFixed(2)}</span></div>
            <div className="totals-row grand" style={{ padding: '2px 0', marginTop: '2px', marginBottom: '4px' }}><span style={{ fontSize: '0.85rem' }}>Grand Total</span><span className="value" style={{ fontSize: '1.1rem' }}>Rs. {grandTotal.toFixed(2)}</span></div>
            {isWaiterMode ? (
              <div className="action-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                <button className="btn-action btn-save" style={{ fontSize: '1rem', padding: '10px 0', minHeight: '40px', fontWeight: 'bold' }} onClick={sendWaiterOrder}>Send Order</button>
                <button className="btn-action btn-danger" style={{ fontSize: '0.75rem', padding: '2px 0', minHeight: '26px' }} onClick={() => setCart([])}>Cancel</button>
              </div>
            ) : (
            <div className="action-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <button className="btn-action" style={{ background: 'var(--bg-panel)', color: 'white', border: '1px solid var(--border-color)', fontSize: '0.75rem', padding: '2px 0', minHeight: '26px' }} onClick={handleHoldOrder}>Hold</button>
              <button className="btn-action btn-save" style={{ fontSize: '0.75rem', padding: '2px 0', minHeight: '26px' }} onClick={handleCreateKOT}>KOT</button>
              <button className="btn-action btn-danger" style={{ fontSize: '0.75rem', padding: '2px 0', minHeight: '26px' }} onClick={() => setCart([])}>Cancel</button>
              <button className="btn-action" style={{ background: 'var(--accent-green)', color: 'black', fontWeight: 'bold', fontSize: '0.85rem', padding: '2px 0', minHeight: '26px' }} onClick={() => {
                if (cart.length === 0) return setToast({ message: 'Cart is empty', type: 'error' });
                if (orderType === 'Delivery' && (!customerName.trim() || !customerAddress.trim() || !customerPhone.trim())) {
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
              <button className="btn-action btn-save" style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }} onClick={async () => {
                 const amt = parseFloat((document.getElementById('cashOutInput') as HTMLInputElement)?.value || '0');
                 if (amt > 0) {
                   try {
                     const res = await fetch(BACKEND_URL + '/cash-flow/out', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ store_id: Number(currentUser?.store_id) || 1, user_id: Number(currentUser?.id) || 1, amount: amt })
                     });
                     if (!res.ok) throw new Error('Cash Out failed');
                     
                     const shiftSales = activeShift === 'Shift 1' ? shift1Sales : shift2Sales;
                     setPrintData({ type: 'BILL', data: { orderType: 'Cash Out Receipt', cashOutAmount: amt, shiftSales, time: new Date().toLocaleString() }, printCount: 1 });
                     setToast({ message: `Cash Out of Rs. ${amt} recorded! Printing...`, type: 'success' });
                     setIsCashedOut(true);
                     setModalType('DAY_CLOSE');
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

      {/* DAY CLOSE MODAL */}
      {modalType === 'DAY_CLOSE' && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ width: '450px', textAlign: 'center' }}>
            <div className="modal-header">
              <h2><Moon size={24} /> Business Day Close</h2>
              <X size={24} style={{cursor:'pointer'}} onClick={() => { setModalType('NONE'); setDayClosePin(''); }} />
            </div>
            <div style={{ padding: '20px' }}>
              <Moon size={48} color="var(--primary)" style={{ margin: '0 auto 15px' }} />
              
              {(() => {
                const pendingOrders = activeDeliveries.filter(d => d.status !== 'SETTLED' && d.status !== 'CANCELLED');
                const requiresPin = pendingOrders.length > 0;

                return (
                  <>
                    <h3 style={{ marginBottom: '10px' }}>End of Business Day</h3>
                    
                    {requiresPin ? (
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
                        <p style={{ color: '#fca5a5', fontWeight: 'bold', marginBottom: '5px' }}>
                          <AlertTriangle size={16} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                          Pending Settlements Exist!
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px', lineHeight: '1.4' }}>
                          There are {pendingOrders.length} unsettled deliveries. You cannot close the day without settling them or providing the Admin Override PIN.
                        </p>
                        <input 
                          type="password" 
                          placeholder="Admin Override PIN" 
                          value={dayClosePin}
                          onChange={(e) => setDayClosePin(e.target.value)}
                          style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '2px' }} 
                        />
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
                        This action will finalize all shifts, log you out, and prepare the system for the next business day. You can cancel if you are not ready yet.
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="btn-action" 
                        onClick={() => { setModalType('NONE'); setDayClosePin(''); }} 
                        style={{ flex: 1, padding: '15px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px' }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn-action" 
                        disabled={requiresPin && dayClosePin !== '9999'}
                        onClick={async () => {
                          try {
                            await fetch(BACKEND_URL + '/business-day/close', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ store_id: currentUser?.store_id || 1 })
                            });
                          } catch (e) { console.error('Day close failed', e); }
                    
                          localStorage.removeItem('d4u_day_start');
                          localStorage.removeItem('d4u_is_cashed_in');
                          localStorage.removeItem('d4u_cashin_amt');
                          localStorage.removeItem('d4u_cashier');
                          localStorage.removeItem('d4u_main_user');
                          window.location.reload();
                        }} 
                        style={{ flex: 1, padding: '15px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
                      >
                        Confirm & Close Day
                      </button>
                    </div>
                  </>
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
                         body: JSON.stringify({ store_id: currentUser?.store_id || 1, waiter_name: waiterNameInput.trim() })
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
              <X size={24} style={{cursor:'pointer'}} onClick={() => { setModalType('NONE'); setDiscountPasswordInput(''); setPendingDiscount(''); }} />
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>Enter Discount Password to authorize this change.</p>
              <input type="password" value={discountPasswordInput} onChange={e => setDiscountPasswordInput(e.target.value)} placeholder="Enter Password" style={{ width: '100%', padding: '15px', fontSize: '1.5rem', textAlign: 'center', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px', marginBottom: '20px', letterSpacing: '5px' }} autoFocus />
              <button className="btn-action btn-order" onClick={() => {
                if (discountPasswordInput === posSettings.discountPassword) {
                  setDiscountPercent(Number(pendingDiscount) || 0);
                  setToast({ message: 'Discount Applied!', type: 'success' });
                  setModalType('NONE'); setDiscountPasswordInput(''); setPendingDiscount('');
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
              <X size={24} style={{cursor:'pointer'}} onClick={() => { setModalType('NONE'); setPendingDeliveryAction(null); }} />
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ marginBottom: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Please fill in the customer details to confirm this delivery order.</p>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Customer Mobile Number *</label>
                <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="0300-1234567" style={{ width: '100%', padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px', outline: 'none' }} autoFocus />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Customer Name *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. John Doe" style={{ width: '100%', padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Complete Delivery Address *</label>
                <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="House #, Street, Block, Area..." rows={3} style={{ width: '100%', padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '5px', outline: 'none', resize: 'none' }} />
              </div>
              <button className="btn-action btn-save" onClick={() => {
                if (!customerName.trim() || !customerAddress.trim() || !customerPhone.trim()) {
                  setToast({ message: 'All fields are required!', type: 'error' });
                  return;
                }
                setModalType('NONE');
                if (pendingDeliveryAction === 'KOT') handleCreateKOT();
                else if (pendingDeliveryAction === 'PAY') setModalType('PAYMENT');
                setPendingDeliveryAction(null);
              }} style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }}>Confirm & Continue</button>
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
              <div style={{ marginBottom: '25px' }}>
                <div style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px', letterSpacing: '1px' }}>SELECT PAYMENT METHOD</div>
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
              </div>
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
                           <button key={i} onClick={() => setCashGiven(amt.toString())} style={{ flex: 1, padding: '10px 0', background: '#0f172a', border: '1px solid #1e293b', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>Rs. {amt}</button>
                         ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <button className="btn-action" onClick={async () => {
                let tendered = paymentMethod === 'Split' ? (Number(splitCash) + Number(splitCard)) : (paymentMethod === 'Cash' ? Number(cashGiven) : grandTotal);
                if (tendered < grandTotal) return setToast({ message: 'Tendered amount is less than total', type: 'error' });
                const returnAmount = Math.max(0, tendered - grandTotal);
                let customerId = liveCustomer?.id || null;
                
                // Add Loyalty Points & Customer
                if (customerPhone.trim() && !liveCustomer) {
                  try {
                    const custRes = await fetch(BACKEND_URL + '/customers', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ brand_id: 1, phone: customerPhone.trim(), name: customerName || 'Walk-in' })
                    });
                    const custData = await custRes.json();
                    if (custData.success) customerId = custData.customer.id;
                  } catch (e) { console.log('Error saving customer', e); }
                }

                if (cart.length > 0) {
                  const payload = {
                    store_id: currentUser?.store_id || 1,
                    created_by: currentUser?.id || 1,
                    customer_id: customerId,
                    discount: totalDiscountAmount,
                    payment_method: paymentMethod.toUpperCase(),
                    order_source: orderType,
                    table_no: tableNumber || undefined,
                    notes: orderNotes,
                    items: cart.map(i => ({
                      product_id: i.id || 1,
                      quantity: i.qty,
                      price: i.price,
                      special_inst: ''
                    }))
                  };

                  try {
                    const res = await fetch(BACKEND_URL + '/pos-orders', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Order failed');

                    // Execute Redeem if points were used
                    if (redeemedPoints > 0 && customerId) {
                      await fetch(`${BACKEND_URL}/customers/${customerId}/redeem`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ points: redeemedPoints })
                      });
                      setRedeemedPoints(0);
                    }
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
                      items: cart.map(item => `${item.qty}x ${item.name}`).join(', '),
                      notes: orderNotes,
                      timePlaced: new Date().toLocaleTimeString(),
                      status: 'NEW' as const,
                      totalAmount: grandTotal,
                      paymentMethod: paymentMethod,
                      itemsData: JSON.stringify(cart),
                      synced: false
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
                  discount: totalDiscountAmount,
                  promoDiscount: promoDiscountAmount,
                  manualDiscount: discountAmount,
                  grandTotal,
                  cashGiven: tendered,
                  returnAmount,
                  time: new Date().toLocaleString()
                };

                if (posSettings.billPrintQty > 0) setPrintData({ type: 'BILL', data: currentOrder, printCount: posSettings.billPrintQty });
                if (activeShift === 'Shift 1') setShift1Sales(prev => prev + grandTotal);
                else setShift2Sales(prev => prev + grandTotal);

                if (activeTerminalKotId) {
                  db.kots.update(activeTerminalKotId, { status: 'PAID' });
                  setActiveTerminalKotId(null);
                }
                setOrderNotes('');
                setCart([]); setCashGiven(''); setModalType('NONE');
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
      {modalType === 'ADD_CUSTOM_ITEM' && (
        <div className="modal-overlay" style={{ zIndex: 10001, background: 'rgba(15, 23, 42, 0.95)' }}>
          <div className="modal-content animate-slide-up" style={{ width: '500px', background: '#0f172a', border: '1px solid #1e293b', padding: '0', borderRadius: '8px', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '15px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: 'white', fontSize: '1.2rem', margin: 0 }}><Plus size={20} color="var(--accent-yellow)" /> Add Custom Product</h2>
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
                    // Send to backend as PENDING
                    const res = await fetch('http://' + window.location.hostname + ':3001/catalog/products', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        store_id: currentUser?.store_id || 1,
                        name: customItemName,
                        price: parseFloat(customItemPrice) || 0,
                        category_ids: [customItemCategory || (categories[0]?.id || 1)],
                        sku: customItemCode,
                        cost: 0,
                        margin_pct: 100,
                        status: 'PENDING',
                        image_url: customItemImg
                      })
                    });
                    
                    if (res.ok) {
                      setToast({ message: 'Sent to Head Office for Approval!', type: 'success' });
                    } else {
                      setToast({ message: 'Failed to submit product', type: 'error' });
                    }
                    setModalType('NONE'); resetCustomItemForm();
                  } catch (e) { setToast({ message: 'Failed to create product', type: 'error' }); }
                }} style={{ flex: 2, padding: '15px', background: 'var(--accent-yellow)', color: 'black', fontWeight: 'bold', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>
                  CREATE CUSTOM PRODUCT
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
                  <button className="btn-action btn-save" style={{ padding: '8px 20px' }} onClick={() => handleResumeOrder(order.id)}>Resume</button>
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
    fetch(BACKEND_URL + `/business-day/history?store_id=${currentUser.store_id || 1}`)
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
        const res = await fetch(BACKEND_URL + `/business-day/current?store_id=${currentUser.store_id || 1}`);
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
      const res = await fetch(BACKEND_URL + '/business-day/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: currentUser.store_id || 1, started_by: currentUser.id || 1, openingFloat: 0 })
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
    fetch(BACKEND_URL + `/cash-flow?store_id=${currentUser.store_id || 1}`)
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
      const res = await fetch(BACKEND_URL + '/cash-flow/in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: currentUser.store_id || 1, user_id: currentUser.id || 1, amount: parseFloat(amount), comment })
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

  const handleLogout = () => {
    if (loggedInUser?.role === 'Waiter') {
      socket.emit('waiter_disconnected', { store_id: loggedInUser.store_id });
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

  useEffect(() => {
    const storeId = loggedInUser?.store_id || 1;
    fetch(`${BACKEND_URL}/cms/settings?store_id=${storeId}`)
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        if (data.brand?.currency) {
          (window as any).d4u_currency = data.brand.currency;
        }
        if (data.brand?.vat_percentage !== undefined) {
          (window as any).d4u_vat = data.brand.vat_percentage;
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

  const activeUser = loggedInUser || { id: 1, name: 'Bypass Access', store_id: 1, role: 'Admin' };



  if (activeUser.role === 'Chef') {
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
        <KitchenDisplay onLogout={() => setLoggedInUser(null)} />
      </div>
    );
  }

  if (activeUser.role !== 'Waiter') {
    if (!dayStartTime) return <DayStartPage currentUser={activeUser} onDayStart={setDayStartTime} onLogout={handleLogout} />;
    if (!isCashedIn) return <CashInPage currentUser={activeUser} onCashIn={(amount) => { setCashInAmount(amount); setIsCashedIn(true); }} onLogout={handleLogout} />;
  }
  return <POSApp currentUser={activeUser} dayStartTime={dayStartTime} onLogout={handleLogout} onCashOut={handleLogout} />;
}
