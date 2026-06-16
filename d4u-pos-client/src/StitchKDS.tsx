import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { OfflineKOT } from './db';
import { AnimatePresence, motion } from 'framer-motion'; // using framer-motion since motion/react might not be installed
import { ShieldAlert, Check } from 'lucide-react';

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

const INITIAL_SETTINGS: StationSettings = {
  stationName: 'Chef Station #1',
  specialtyName: 'Main Grill & Fryer',
  chefAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBK3tYdWIHrzS35gXN_e8OLTGDFtifxhEFCdElswQsgA3zZcvfGAOI5w3O0f_7BFo6y2bJQDhHlU2rWyvDeAcavaiwRoee-s8XQYp1dqFualqFn76rC7mEaFMZ_I3_IcKMFBbtvGNoXiFlNwf0XM3_NztGSmdFyjyp8AC7gFwMoQsOAsF5-5_35OLAeWTDZle1FF65Ham_uNnxWrZUQNsAPEqP4pTwt9puEmyA1DJsGvHb3U6Qv7vTQwBfkOGeBsLk2HfBZfuz7wzg',
  silentAlert: false,
  autoSimulate: false,
  simulateIntervalSeconds: 45,
  alarmSoundEnabled: true,
  volume: 35,
  standardBurgerPrepSeconds: 600,
  standardSidesPrepSeconds: 300,
};

const INITIAL_INGREDIENTS: Ingredient[] = [
  { 
    id: 'buns', name: 'Brioche Buns', category: 'Bakery', currentStock: 75, maxStock: 100, unit: 'pcs', warningThreshold: 20,
    deductPerItem: { 'Zinger Deluxe Burger': 1, 'Signature Wagyu Burger': 1 }
  },
  { 
    id: 'wagyu', name: 'Wagyu Beef Patties', category: 'Meat', currentStock: 48, maxStock: 60, unit: 'pcs', warningThreshold: 15,
    deductPerItem: { 'Signature Wagyu Burger': 1 }
  },
  { 
    id: 'chicken', name: 'Crispy Fillet Patties', category: 'Meat', currentStock: 35, maxStock: 50, unit: 'pcs', warningThreshold: 12,
    deductPerItem: { 'Zinger Deluxe Burger': 1 }
  },
  { 
    id: 'cheese', name: 'Cheddar Slices', category: 'Dairy', currentStock: 90, maxStock: 120, unit: 'pcs', warningThreshold: 30,
    deductPerItem: { 'Zinger Deluxe Burger': 1, 'Signature Wagyu Burger': 1 }
  },
  { 
    id: 'mayo', name: 'Gourmet Mayonnaise', category: 'Condiments', currentStock: 680, maxStock: 1000, unit: 'ml', warningThreshold: 250,
    deductPerItem: { 'Zinger Deluxe Burger': 25, 'Signature Wagyu Burger': 10 }
  },
  { 
    id: 'potatoes', name: 'Premium Potatoes', category: 'Produce', currentStock: 45, maxStock: 80, unit: 'kg', warningThreshold: 20,
    deductPerItem: { 'Truffle Fries': 1 }
  },
  { 
    id: 'truffle', name: 'Truffle Fragrance Oil', category: 'Condiments', currentStock: 180, maxStock: 300, unit: 'ml', warningThreshold: 80,
    deductPerItem: { 'Truffle Fries': 15 }
  },
  { 
    id: 'salmon', name: 'Atlantic Salmon Fillets', category: 'Fish', currentStock: 14, maxStock: 25, unit: 'pcs', warningThreshold: 6,
    deductPerItem: { 'Grilled Salmon': 1 }
  }
];

export default function KitchenDisplay({ onLogout }: { onLogout?: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('kitchen');
  const [isEmergencyStop, setIsEmergencyStop] = useState<boolean>(false);
  const [settings, setSettings] = useState<StationSettings>(INITIAL_SETTINGS);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [logs, setLogs] = useState<LogEvent[]>([]);

  // We map Dexie OfflineKOTs to KDS Orders
  const kots = useLiveQuery(() => db.kots.toArray()) || [];
  
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

      const savedIngredients = localStorage.getItem('kds_ingredients');
      if (savedIngredients) setIngredients(JSON.parse(savedIngredients));

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
      await db.kots.update(kotToUpdate.id, {
        status: 'PREPARING',
        prepTimeMinutes: prepMinutes,
        startTime: new Date().toISOString()
      });

      // Sync to website tracking if this is a bridge order
      if (kotToUpdate.bridgeOrderId) {
        const readyAt = new Date(Date.now() + prepMinutes * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        fetch(`http://localhost:3001/online-orders/${kotToUpdate.bridgeOrderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kdsStatus: 'PREPARING', prepTimeMinutes: prepMinutes, estimatedReadyAt: readyAt }),
        }).catch(() => {});
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
      await db.kots.update(kotToUpdate.id, { status: 'READY' });

      // Sync to website tracking if this is a bridge order
      if (kotToUpdate.bridgeOrderId) {
        fetch(`http://localhost:3001/online-orders/${kotToUpdate.bridgeOrderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kdsStatus: 'READY' }),
        }).catch(() => {});
      }
    }

    if (settings.alarmSoundEnabled) {
      playReadyAlert(settings.volume);
    }
  };

  const decrementInventoryIngredients = (order: Order) => {
    setIngredients(prevIngredients => {
      const nextIngredients = prevIngredients.map(ing => {
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
      saveToLocalStorage('kds_ingredients', nextIngredients);
      return nextIngredients;
    });
  };

  const handleRestockAll = () => {
    setIngredients(prev => {
      const restocked = prev.map(ing => ({ ...ing, currentStock: ing.maxStock }));
      saveToLocalStorage('kds_ingredients', restocked);
      return restocked;
    });
    addLog('inventory_restock', 'System Restock Activated. All raw ingredient matrices filled to maximum.');
    if (settings.alarmSoundEnabled) playReadyAlert(settings.volume);
  };

  const handleUpdateInventoryUnit = (ingredientId: string, amount: number) => {
    setIngredients(prev => {
      const updated = prev.map(ing => {
        if (ing.id === ingredientId) {
          return { ...ing, currentStock: Math.min(ing.maxStock, Math.max(0, ing.currentStock + amount)) };
        }
        return ing;
      });
      saveToLocalStorage('kds_ingredients', updated);
      return updated;
    });
  };

  const handleResetData = async () => {
    const confirmation = window.confirm("Reset KDS to factory defaults? This clears history logs and all orders in Database.");
    if (confirmation) {
      await db.kots.clear();
      setIngredients(INITIAL_INGREDIENTS);
      setLogs([]);
      setSettings(INITIAL_SETTINGS);
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
      />

      <main className="flex-1 flex flex-col min-w-0 bg-[#0c1322] relative overflow-hidden">
        
        <Header 
          pendingCount={pendingOrdersCount}
          readyCount={readyOrdersCount}
          onRefresh={handleResetData}
          onSimulateNewOrder={triggerSimulatedNewOrder}
          isEmergencyStop={isEmergencyStop}
        />

        <div className="flex-1 flex min-h-0 relative">
          
          {activeTab === 'kitchen' && (
            <KitchenView 
              orders={mappedOrders} 
              onMarkReady={handleMarkReady}
              onSimulateOrder={triggerSimulatedNewOrder}
              onAcceptOrderClick={setIncomingOverlayOrder}
              isEmergencyStop={isEmergencyStop}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView 
              orders={mappedOrders}
              ingredients={ingredients}
              logs={logs}
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
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              settings={settings}
              updateSettings={handleUpdateSettings}
            />
          )}

        </div>

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

      </main>
    </div>
  );
}
