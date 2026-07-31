import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { OfflineKOT } from './db';
import { io } from 'socket.io-client';
import { BACKEND_URL } from './config/backend';
const socket = io(BACKEND_URL);
import { AnimatePresence, motion } from 'framer-motion'; // using framer-motion since motion/react might not be installed
import { ShieldAlert, Check } from 'lucide-react';
import { customConfirm } from './utils/alerts';
import { apiFetch } from './pos/api';

import Sidebar from './kds/components/Sidebar';
import Header from './kds/components/Header';
import KitchenView from './kds/components/KitchenView';
import DashboardView from './kds/components/DashboardView';
import OrdersView from './kds/components/OrdersView';
import InventoryView from './kds/components/InventoryView';
import SettingsView from './kds/components/SettingsView';
import NewOrderOverlay from './kds/components/NewOrderOverlay';

import type { Tab, Order, Ingredient, StationSettings, LogEvent, OrderItem, OrderStatus } from './kds/types';
import { playNewOrderAlert, playReadyAlert, playEmergencyAlert, playUrgentAlert, playTimerTick } from './kds/utils/audio';

const DEFAULT_SETTINGS: StationSettings = {
  stationName: 'Chef Station #1',
  specialtyName: 'Main Kitchen',
  chefAvatar: '',
  silentAlert: false,
  autoSimulate: false,
  simulateIntervalSeconds: 45,
  alarmSoundEnabled: true,
  volume: 35,
  standardBurgerPrepSeconds: 600,
  standardSidesPrepSeconds: 300,
  selectedStations: ['Grill', 'Fryer', 'Salad', 'Drinks'],
};

export default function KitchenDisplay({ currentUser, onLogout }: { currentUser?: any, onLogout?: () => void }) {
  // Resolves the real branch name the same way App.tsx's main POS header
  // does (GET /stores, match on store_id) — this previously showed a raw
  // "Branch {id}" placeholder instead of the actual store name.
  const [branchName, setBranchName] = useState<string | undefined>(
    currentUser?.store_id ? `Branch ${currentUser.store_id}` : undefined
  );

  useEffect(() => {
    if (!currentUser?.store_id) return;
    apiFetch('/stores')
      .then((res) => res.json())
      .then((data) => {
        const stores = Array.isArray(data) ? data : (data.value || data.stores || []);
        const s = stores.find((x: any) => x.id === currentUser.store_id);
        if (s) setBranchName(s.name);
      })
      .catch(console.error);
  }, [currentUser?.store_id]);

  const [activeTab, setActiveTab] = useState<Tab>('kitchen');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEmergencyStop, setIsEmergencyStop] = useState<boolean>(false);
  const [settings, setSettings] = useState<StationSettings>(DEFAULT_SETTINGS);
  
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinPhone, setPinPhone] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Inventory Unlock — a separate per-branch PIN from the Chef PIN above:
  // any manager at this branch can unlock Inventory without it also
  // logging them in as "the chef" for this station.
  const [isInventoryUnlocked, setIsInventoryUnlocked] = useState<boolean>(false);
  const [showInventoryPinModal, setShowInventoryPinModal] = useState<boolean>(false);
  const [inventoryPinCode, setInventoryPinCode] = useState('');
  const [inventoryPinError, setInventoryPinError] = useState('');
  const [isVerifyingInventoryPin, setIsVerifyingInventoryPin] = useState(false);

  const handleInventoryPinUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingInventoryPin(true);
    setInventoryPinError('');
    try {
      const storeId = currentUser?.store_id || 1;
      const res = await apiFetch(`/cms/settings/${storeId}/verify-inventory-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: inventoryPinCode }),
        auth: true,
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setIsInventoryUnlocked(true);
        setShowInventoryPinModal(false);
        setInventoryPinCode('');
      } else {
        setInventoryPinError('Invalid Inventory PIN');
      }
    } catch (err) {
      setInventoryPinError('Network error connecting to auth server.');
    } finally {
      setIsVerifyingInventoryPin(false);
    }
  };

  const handleChefLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUnlocking(true);
    setPinError('');
    try {
      const res = await apiFetch(`/kitchen/chef-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinCode, device_name: 'KDS Terminal' }),
        auth: true
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        // Store chef session token
        localStorage.setItem('chef_token', data.access_token);
        localStorage.setItem('chef_session_id', data.session_id.toString());
        setIsAdminUnlocked(true);
        setShowPinModal(false);
        setPinCode('');
      } else {
        setPinError(data.message || 'Invalid Chef PIN');
      }
    } catch (err) {
      setPinError('Network error connecting to auth server.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleChefLogout = async () => {
    try {
      const sessionId = localStorage.getItem('chef_session_id');
      if (sessionId) {
        await apiFetch(`/kitchen/chef-auth/sessions/${sessionId}/logout`, { method: 'POST', auth: true });
      }
    } catch (e) {}
    localStorage.removeItem('chef_token');
    localStorage.removeItem('chef_session_id');
    setIsAdminUnlocked(false);
    setIsInventoryUnlocked(false);
  };
  const [logs, setLogs] = useState<LogEvent[]>([]);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [kitchenStations, setKitchenStations] = useState<any[]>([]);
  const [unavailableRecipes, setUnavailableRecipes] = useState<any[]>([]);

  const syncInventory = async () => {
    try {
      const storeId = currentUser?.store_id || 1;
      const res = await apiFetch(`/inventory/items/${storeId}`, { auth: true });
      if (res.ok) {
        const data = await res.json();
        const locksRes = await apiFetch(`/kitchen/inventory-locks?store_id=${storeId}`, { auth: true });
        const locksData = locksRes.ok ? await locksRes.json() : [];
        const locksMap = new Map();
        locksData.forEach((l: any) => locksMap.set(l.inventory_id.toString(), l.id.toString()));

        const mapped: Ingredient[] = data.map((item: any) => ({
          id: item.id.toString(),
          name: item.name,
          category: item.category?.name || 'General',
          currentStock: item.quantity,
          maxStock: item.quantity * 2 || 100,
          unit: item.unit,
          warningThreshold: 10,
          deductPerItem: {},
          isLocked: locksMap.has(item.id.toString()),
          lockId: locksMap.get(item.id.toString())
        }));
        setIngredients(mapped);
      }
      
      const unavailRes = await apiFetch(`/kitchen/availability/unavailable?store_id=${storeId}`, { auth: true });
      if (unavailRes.ok) {
        setUnavailableRecipes(await unavailRes.json());
      }
    } catch (e) {
      console.log('Error fetching inventory', e);
      setToast({ id: Math.random().toString(), title: 'Sync Error', subtitle: 'Could not fetch inventory from backend.' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([syncKOTs(), syncInventory()]);
      setIsLoading(false);
    };
    init();
    
    // Resume session if valid token exists
    const token = localStorage.getItem('chef_token');
    if (token) setIsAdminUnlocked(true);
  }, []);

  // We map Dexie OfflineKOTs to KDS Orders
  const kots = useLiveQuery(() => db.kots.toArray()) || [];

  // Sync KOTs from Backend on Load and on Socket Event
  const syncKOTs = async () => {
    try {
      const storeId = currentUser?.store_id || 1;
      const res = await apiFetch(`/kots?store_id=${storeId}&includeReady=true`, { auth: true });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          await db.kots.clear();
          const mapped = data.map(k => ({
            id: k.id,
            orderId: k.order_id,
            type: k.order?.orderType || 'Walk-in',
            customer: k.order?.customer?.name || '',
            customerPhone: k.order?.customer?.phone || '',
            items: k.items ? JSON.stringify(k.items) : '[]',
            notes: k.notes,
            timePlaced: new Date(k.createdAt).toLocaleTimeString(),
            prepTimeMinutes: k.prep_time_minutes || 10,
            status: k.status,
            startTime: k.start_time ? new Date(k.start_time).toISOString() : '',
            totalAmount: k.order?.total_amount || 0,
            paymentMethod: k.order?.payment_method || 'CASH',
            printCount: 0
          }));
          await db.kots.bulkAdd(mapped);
        }
      }
      
      // Also fetch dashboard analytics and stations
      const dbRes = await apiFetch(`/kitchen/dashboard?store_id=${storeId}`, { auth: true });
      if (dbRes.ok) setDashboardMetrics(await dbRes.json());
      
      const stRes = await apiFetch(`/kitchen/stations?store_id=${storeId}`, { auth: true });
      if (stRes.ok) setKitchenStations(await stRes.json());
      
    } catch (e) { 
      console.log('Offline: Using local KOTs', e); 
      setToast({ id: Math.random().toString(), title: 'Offline Mode', subtitle: 'Showing locally cached KOTs.' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  useEffect(() => {
    // This socket connects but was never joining the store's broadcast room
    // — AppGateway.broadcast() uses server.to(`store_${id}`).emit(...), a
    // strict room-scoped emit, so without join_store this screen could
    // never receive kds_update/order_updated regardless of event name.
    // Only ever refreshed via the initial syncKOTs() call and the manual
    // Reset button.
    const storeId = currentUser?.store_id || 1;
    const joinRoom = () => socket.emit('join_store', { store_id: storeId });
    if (socket.connected) joinRoom();
    socket.on('connect', joinRoom);
    socket.on('kds_update', () => {
      syncKOTs();
    });
    return () => {
      socket.off('connect', joinRoom);
      socket.off('kds_update');
    };
  }, [currentUser?.store_id]);
  
  // Real-time ticking state
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const simulateTickRef = useRef<number>(0);
  
  // Track previously seen NEW orders to avoid duplicate alarms
  const seenNewOrders = useRef<Set<number>>(new Set());

  // Incoming Order Popup control
  const [incomingOverlayOrder, setIncomingOverlayOrder] = useState<Order | null>(null);

  // Floating Toast State
  const [toast, setToast] = useState<{ id: string; title: string; subtitle: string } | null>(null);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('kds_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));

      const savedLogs = localStorage.getItem('kds_logs');
      if (savedLogs) setLogs(JSON.parse(savedLogs));
    } catch (e) {
      console.warn('Could not bootstrap local storage states.', e);
    }
  }, []);

  const saveToLocalStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  };

  const handleUpdateSettings = (partial: Partial<StationSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      saveToLocalStorage('kds_settings', next);
      return next;
    });
  };

  const addLog = (type: LogEvent['type'], message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    const newLog: LogEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp,
      type,
      message
    };
    setLogs(prev => {
      const updated = [...prev, newLog];
      saveToLocalStorage('kds_logs', updated);
      return updated;
    });
  };

  // Convert DB KOTs to UI Orders dynamically
  const mappedOrders: Order[] = kots.map(kot => {
    let parsedItems = [];
    try {
      parsedItems = JSON.parse(kot.items || '[]');
    } catch(e) {}

    let elapsed = 0;
    if (kot.status === 'PREPARING' && kot.startTime) {
      elapsed = Math.floor((nowTick - new Date(kot.startTime).getTime()) / 1000);
      if (elapsed < 0) elapsed = 0;
    }

    let status: OrderStatus = 'pending';
    if (kot.status === 'PREPARING') status = 'preparing';
    if (kot.status === 'READY') status = 'completed';

    const totalSecs = (kot.prepTimeMinutes || 10) * 60;
    const remaining = totalSecs - elapsed;
    
    // Sounds for urgent items
    if (status === 'preparing' && !isEmergencyStop) {
      if (settings.alarmSoundEnabled && !settings.silentAlert) {
         if (remaining === 120 || remaining === 60) {
            playUrgentAlert(settings.volume);
         } else if (remaining < 30 && remaining > 0 && remaining % 5 === 0) {
            playTimerTick(settings.volume);
         }
      }
    }

    return {
      id: kot.id ? kot.id.toString() : kot.orderId.toString(),
      displayId: kot.orderId.toString(),
      tableName: kot.type || 'Table',
      items: parsedItems.map((i: any) => ({ name: i.name || i.productName, quantity: i.qty || i.quantity })),
      instructions: kot.notes || '',
      status: status,
      timerTotalSeconds: totalSecs,
      timerElapsedSeconds: elapsed,
      isUrgent: remaining <= 120,
      createdAt: kot.timePlaced,
      completedAt: kot.status === 'READY' ? new Date().toISOString() : undefined,
    };
  });

  // Watch for new orders to trigger overlay and sound
  useEffect(() => {
    const newPendingOrders = mappedOrders.filter(o => o.status === 'pending');
    for (const order of newPendingOrders) {
      // Find the corresponding db id to track
      const dbKot = kots.find(k => k.orderId.toString() === order.id);
      if (dbKot && dbKot.id && !seenNewOrders.current.has(dbKot.id)) {
        seenNewOrders.current.add(dbKot.id);
        
        // Setup popup if no popup currently showing
        if (!incomingOverlayOrder && !isEmergencyStop) {
          setIncomingOverlayOrder(order);
          setActiveTab('kitchen');
          if (settings.alarmSoundEnabled && !settings.silentAlert) {
            playNewOrderAlert(settings.volume);
          }
          addLog('order_received', `POS Ticket #${order.id} received. Awaiting chef acceptance approval.`);
        }
      }
    }
  }, [kots, incomingOverlayOrder, isEmergencyStop]);

  // Clock tick interval
  useEffect(() => {
    const clockInterval = setInterval(() => {
      if (isEmergencyStop) return;
      setNowTick(Date.now());
      
      if (settings.autoSimulate) {
        simulateTickRef.current += 1;
        if (simulateTickRef.current >= settings.simulateIntervalSeconds) {
          simulateTickRef.current = 0;
          triggerSimulatedNewOrder();
        }
      }
    }, 1000);
    return () => clearInterval(clockInterval);
  }, [isEmergencyStop, settings]);

  const triggerSimulatedNewOrder = () => {
    if (isEmergencyStop || incomingOverlayOrder !== null) return;
    const randomId = Math.floor(2400 + Math.random() * 99).toString();
    
    // Add to Dexie!
    db.kots.add({
      orderId: randomId,
      type: 'Table 12',
      items: JSON.stringify([{ name: 'Zinger Deluxe Burger', qty: 1 }]),
      notes: 'EXTRA CHEESE',
      timePlaced: new Date().toISOString(),
      prepTimeMinutes: 10,
      status: 'NEW',
      startTime: '',
      printCount: 0
    });
  };

  const handleCreateManualOrder = (items: OrderItem[], instructions: string, tableName: string) => {
    if (isEmergencyStop) return;
    const randomId = Math.floor(2500 + Math.random() * 99).toString();
    
    db.kots.add({
      orderId: randomId,
      type: tableName,
      items: JSON.stringify(items.map(i => ({ name: i.name, qty: i.quantity }))),
      notes: instructions,
      timePlaced: new Date().toISOString(),
      prepTimeMinutes: 10,
      status: 'NEW',
      startTime: '',
      printCount: 0
    });
  };

  const handleAcceptOrder = async (orderId: string, prepMinutes: number) => {
    if (!incomingOverlayOrder) return;
    
    const kotToUpdate = (kots || []).find(k => (k.id && k.id.toString() === orderId) || k.orderId.toString() === orderId);
    if (kotToUpdate && kotToUpdate.id) {
      try {
        const res = await apiFetch(`/kots/${kotToUpdate.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PREPARING' }),
          auth: true
        });
        if (!res.ok) throw new Error('Backend update failed');
      } catch (e) {
        // Fallback for offline mode or local-only KOTs
        await db.kots.update(kotToUpdate.id, {
          status: 'PREPARING',
          prepTimeMinutes: prepMinutes,
          startTime: new Date().toISOString()
        });
      }
    }

    setIncomingOverlayOrder(null);

    if (settings.alarmSoundEnabled) {
      playReadyAlert(settings.volume);
    }

    addLog('order_preparing', `Order #${orderId} accepted by chef. Prep time targeted at ${prepMinutes}m.`);

    setToast({
      id: Math.random().toString(),
      title: `Order #${orderId} Accepted`,
      subtitle: `Target completion countdown set for ${prepMinutes} minutes.`
    });

    setTimeout(() => setToast(null), 4000);
  };

  const handleMarkReady = async (orderId: string) => {
    const order = mappedOrders.find(o => o.id === orderId);
    if (order) {
       decrementInventoryIngredients(order);
       addLog('order_completed', `Order #${orderId} completed and marked ready.`);
    }

    const kotToUpdate = (kots || []).find(k => (k.id && k.id.toString() === orderId) || k.orderId.toString() === orderId);
    if (kotToUpdate && kotToUpdate.id) {
      try {
        const res = await apiFetch(`/kots/${kotToUpdate.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'READY' }),
          auth: true
        });
        if (!res.ok) throw new Error('Backend update failed');
      } catch (e) {
        await db.kots.update(kotToUpdate.id, { status: 'READY' });
      }
    }

    if (settings.alarmSoundEnabled) {
      playReadyAlert(settings.volume);
    }
  };

  const decrementInventoryIngredients = async (order: Order) => {
    const nextIngredients = ingredients.map(ing => {
      let deductAmount = 0;
      order.items.forEach(item => {
        if (ing.deductPerItem[item.name]) {
          deductAmount += ing.deductPerItem[item.name] * item.quantity;
        }
      });

      if (deductAmount > 0) {
        const updatedStock = Math.max(0, ing.currentStock - deductAmount);
        if (updatedStock <= ing.warningThreshold && ing.currentStock > ing.warningThreshold) {
          addLog('inventory_low', `WARNING: Ingredient '${ing.name}' stock level is critical (${updatedStock} ${ing.unit} left)!`);
          if (settings.alarmSoundEnabled) playUrgentAlert(settings.volume);
        }
        return { ...ing, currentStock: updatedStock };
      }
      return ing;
    });
    setIngredients(nextIngredients);
  };

  const handleRestockAll = async () => {
    const restocked = ingredients.map(ing => ({ ...ing, currentStock: ing.maxStock }));
    setIngredients(restocked);
    addLog('inventory_restock', 'System Restock Activated. All raw ingredient matrices filled to maximum.');
    if (settings.alarmSoundEnabled) playReadyAlert(settings.volume);
  };

  const handleUpdateInventoryUnit = async (ingredientId: string, amount: number) => {
    try {
      const operation = amount > 0 ? 'ADD' : 'SUBTRACT';
      const absAmount = Math.abs(amount);
      const res = await apiFetch(`/inventory/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory_id: Number(ingredientId),
          operation,
          amount: absAmount,
          reason: 'Manual adjustment from KDS'
        }),
        auth: true
      });
      if (!res.ok) throw new Error('Adjust failed');
      
      // Update UI optimistically
      const updated = ingredients.map(ing => {
        if (ing.id === ingredientId) {
          return { ...ing, currentStock: Math.min(ing.maxStock, Math.max(0, ing.currentStock + amount)) };
        }
        return ing;
      });
      setIngredients(updated);
    } catch (e) {
      setToast({ id: Math.random().toString(), title: 'Adjustment Failed', subtitle: 'Could not sync inventory change to backend.' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleInventoryUnlock = async (lockId: string, managerPin: string) => {
    try {
      const res = await apiFetch(`/kitchen/inventory-locks/${lockId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manager_pin: managerPin, approved_by: currentUser?.id || 1 }),
        auth: true
      });
      if (res.ok) {
        setToast({ id: Math.random().toString(), title: 'Unlocked', subtitle: 'Item unlocked successfully.' });
        syncInventory();
        setTimeout(() => setToast(null), 4000);
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to unlock');
      }
    } catch (e: any) {
      setToast({ id: Math.random().toString(), title: 'Unlock Failed', subtitle: e.message });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleStockRequest = async (ingredientId: string, qty: number) => {
    const ingredient = ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return;
    
    try {
      const storeId = currentUser?.store_id || 1;
      const res = await apiFetch(`/kitchen/stock-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          inventory_id: Number(ingredientId),
          requested_qty: qty,
          unit: ingredient.unit,
          reason: 'Low stock during active service'
        }),
        auth: true
      });
      
      if (!res.ok) throw new Error('Failed to send stock request');

      setToast({
        id: Math.random().toString(),
        title: 'Stock Request Sent',
        subtitle: `Requested ${qty} ${ingredient.unit} of ${ingredient.name} from warehouse.`
      });
      setTimeout(() => setToast(null), 4000);
      addLog('inventory_restock', `Stock request sent for ${qty} ${ingredient.unit} of ${ingredient.name}.`);
    } catch (e) {
      setToast({
        id: Math.random().toString(),
        title: 'Request Failed',
        subtitle: `Could not send request for ${ingredient.name}.`
      });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleResetData = async () => {
    const confirmation = await customConfirm("Reset KDS to factory defaults? This clears history logs and all orders in Database.");
    if (confirmation) {
      await db.kots.clear();
      setLogs([]);
      setSettings(DEFAULT_SETTINGS);
      localStorage.clear();
      seenNewOrders.current.clear();
      addLog('inventory_restock', 'Kitchen terminal diagnostics cleared and reset to factory defaults.');
    }
  };

  const toggleEmergencyStop = () => {
    setIsEmergencyStop(prev => {
      const next = !prev;
      if (next) {
        addLog('emergency_stop', 'EMERGENCY SHUTDOWN SIGNAL INITIATED. Cooking clocks freeze, incoming queue locked.');
        if (settings.alarmSoundEnabled) playEmergencyAlert(settings.volume);
      } else {
        addLog('emergency_resume', 'Emergency lockdown cleared. Resuming normal kitchen ticket preparation.');
        if (settings.alarmSoundEnabled) playReadyAlert(settings.volume);
      }
      return next;
    });
  };

  const pendingOrdersCount = mappedOrders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
  const readyOrdersCount = mappedOrders.filter(o => o.status === 'completed').length;

  return (
    <div className="bg-[#0c1322] text-[#dce2f7] font-sans overflow-hidden h-screen flex select-none relative w-full">
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        settings={settings}
        isEmergencyStop={isEmergencyStop}
        toggleEmergencyStop={toggleEmergencyStop}
        activeOrdersCount={pendingOrdersCount}
        onLogout={onLogout}
        isAdminUnlocked={isAdminUnlocked}
        onAdminLogin={() => setShowPinModal(true)}
        onAdminLogout={handleChefLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-[#0c1322] relative overflow-hidden">
        
        <Header 
          pendingCount={pendingOrdersCount}
          readyCount={readyOrdersCount}
          onRefresh={handleResetData}
          onLogout={onLogout}
          branchName={branchName}
          isEmergencyStop={isEmergencyStop}
          isAdminUnlocked={isAdminUnlocked}
          activeTab={activeTab}
          onLockInventory={handleChefLogout}
        />

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
              <p className="text-brand-yellow font-display font-bold animate-pulse">Syncing with Kitchen...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex min-h-0 relative">
            {activeTab === 'kitchen' && (
              <KitchenView 
                orders={mappedOrders} 
                onMarkReady={handleMarkReady}
                onSimulateOrder={triggerSimulatedNewOrder}
                onAcceptOrderClick={setIncomingOverlayOrder}
                isEmergencyStop={isEmergencyStop}
                settings={settings}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView 
                orders={mappedOrders}
                ingredients={ingredients}
                logs={logs}
                metrics={dashboardMetrics}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersView 
                orders={mappedOrders}
                onCreateManualOrder={handleCreateManualOrder}
                isEmergencyStop={isEmergencyStop}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                ingredients={ingredients}
                onUpdateInventory={handleUpdateInventoryUnit}
                onRestockAll={handleRestockAll}
                readOnly={!isInventoryUnlocked}
                onRequestUnlock={() => setShowInventoryPinModal(true)}
                onStockRequest={handleStockRequest}
                onInventoryUnlock={handleInventoryUnlock}
                unavailableRecipes={unavailableRecipes}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView 
                settings={settings}
                updateSettings={handleUpdateSettings}
                readOnly={!isAdminUnlocked}
                onRequestUnlock={() => setShowPinModal(true)}
                stations={kitchenStations}
              />
            )}
          </div>
        )}

        <AnimatePresence>
          {incomingOverlayOrder && !isEmergencyStop && activeTab === 'kitchen' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 z-50 pointer-events-auto"
            >
              <NewOrderOverlay 
                order={incomingOverlayOrder}
                settings={settings}
                updateSettings={handleUpdateSettings}
                onAccept={handleAcceptOrder}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isEmergencyStop && (
          <div className="absolute inset-0 bg-[#410006]/95 backdrop-blur-md z-45 flex flex-col items-center justify-center text-center p-8 select-none">
            <ShieldAlert className="w-24 h-24 text-brand-red mb-6 animate-urgent-blink" />
            <h2 className="text-5xl font-display font-black text-brand-red uppercase tracking-wider mb-2">
              EMERGENCY STOPPED
            </h2>
            <p className="text-xl text-[#ffdad6] max-w-lg mb-8 leading-relaxed font-sans">
              All workstation clock countdown chips have been locked and frozen. To unlock preparing lines and resume order transmissions:
            </p>
            <button
              onClick={toggleEmergencyStop}
              className="px-10 py-5 bg-brand-green hover:brightness-110 text-[#002113] font-display font-bold text-2xl rounded-2xl uppercase tracking-widest transition-all shadow-2xl animate-heartbeat cursor-pointer"
            >
              RESUME ALL WORKSTATIONS
            </button>
          </div>
        )}

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ transform: 'translateY(100px)', opacity: 0 }}
              animate={{ transform: 'translateY(0)', opacity: 1 }}
              exit={{ transform: 'translateY(100px)', opacity: 0 }}
              className="absolute bottom-8 right-8 z-40"
            >
              <div className="bg-[#191f2f] border-2 border-brand-green p-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-sm">
                <div className="w-10 h-10 rounded-full bg-brand-green/10 border border-brand-green/30 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-brand-green" />
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm text-[#dce2f7]">{toast.title}</p>
                  <p className="text-xs text-[#d3c5ac] mt-0.5 leading-snug">{toast.subtitle}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PIN Modal Overlay */}
        <AnimatePresence>
          {showPinModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-[#141b2b] border border-[#2e3545] rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative"
              >
                <button onClick={() => setShowPinModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                  ✕
                </button>
                <div className="text-center mb-6">
                  <ShieldAlert className="w-12 h-12 text-brand-yellow mx-auto mb-3" />
                  <h3 className="text-xl font-display font-bold text-white">Chef Login</h3>
                  <p className="text-xs text-slate-400 mt-1">Enter your Chef PIN to unlock station</p>
                </div>
                <form onSubmit={handleChefLogin} className="space-y-4">
                  <div>
                    <input 
                      type="password" 
                      placeholder="Enter PIN" 
                      value={pinCode}
                      onChange={e => setPinCode(e.target.value)}
                      className="w-full bg-[#0c1322] border border-[#2e3545] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-yellow transition"
                      required
                    />
                  </div>
                  {pinError && <div className="text-xs text-brand-red text-center font-bold">{pinError}</div>}
                  <button 
                    type="submit" 
                    disabled={isUnlocking}
                    className="w-full bg-brand-yellow hover:bg-brand-yellowHover text-brand-dark font-black py-3 rounded-xl uppercase tracking-wider transition disabled:opacity-50"
                  >
                    {isUnlocking ? 'Verifying...' : 'Unlock'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inventory Unlock PIN Modal — separate from Chef Login above */}
        <AnimatePresence>
          {showInventoryPinModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-[#141b2b] border border-[#2e3545] rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative"
              >
                <button
                  onClick={() => { setShowInventoryPinModal(false); setInventoryPinError(''); setInventoryPinCode(''); }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
                <div className="text-center mb-6">
                  <ShieldAlert className="w-12 h-12 text-brand-yellow mx-auto mb-3" />
                  <h3 className="text-xl font-display font-bold text-white">Inventory Unlock</h3>
                  <p className="text-xs text-slate-400 mt-1">Enter the branch Inventory PIN to unlock stock levels</p>
                </div>
                <form onSubmit={handleInventoryPinUnlock} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      placeholder="Enter PIN"
                      value={inventoryPinCode}
                      onChange={e => setInventoryPinCode(e.target.value)}
                      className="w-full bg-[#0c1322] border border-[#2e3545] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-yellow transition"
                      required
                    />
                  </div>
                  {inventoryPinError && <div className="text-xs text-brand-red text-center font-bold">{inventoryPinError}</div>}
                  <button
                    type="submit"
                    disabled={isVerifyingInventoryPin}
                    className="w-full bg-brand-yellow hover:bg-brand-yellowHover text-brand-dark font-black py-3 rounded-xl uppercase tracking-wider transition disabled:opacity-50"
                  >
                    {isVerifyingInventoryPin ? 'Verifying...' : 'Unlock'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
