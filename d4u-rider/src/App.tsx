import React, { useState, useEffect } from 'react';
import { DeliveryStatus, DeliveryOrder, SavedCompletedMission, RiderStats } from './types';
import { INITIAL_PAST_MISSIONS } from './data';
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';
import { generateGridPath } from './utils';

// New Components
import ActiveRideView from './components/ActiveRideView';
import HistoryView from './components/HistoryView';
import SettleCashView from './components/SettleCashView';
import POSPanel from './components/POSPanel';
import LoginView from './components/LoginView';
import { Clock, Navigation, CheckSquare, LogOut } from 'lucide-react';

type ViewMode = 'login' | 'map' | 'history' | 'settle';

export default function App() {
  const logout = () => {
    localStorage.removeItem('d4u_rider_token');
    localStorage.removeItem('d4u_rider_store');
    localStorage.removeItem('d4u_rider_name');
    setRiderStoreId(null);
    setRiderName('');
    setCurrentView('login');
  };

  // --- APPLICATION STATES ---
  const [currentView, setCurrentView] = useState<ViewMode>('login');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [status, setStatus] = useState<DeliveryStatus>('SEARCHING');
  
  // Rider Auth States
  const [riderStoreId, setRiderStoreId] = useState<number | null>(null);
  const [riderName, setRiderName] = useState<string>('');
  const [riderStoreName, setRiderStoreName] = useState<string>('');
  const [riderId, setRiderId] = useState<string>('');
  
  // Active rider order
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(null);
  
  // Simulated Rider position
  const [driverCoords, setDriverCoords] = useState<{ x: number; y: number } | null>({ x: 30, y: 65 });
  const [activePath, setActivePath] = useState<{ x: number; y: number }[]>([]);
  const [currentPathIndex, setCurrentPathIndex] = useState<number>(0);
  const [simSpeed] = useState<number>(2);

  // Load and save local state persistence
  const [completedLedger, setCompletedLedger] = useState<SavedCompletedMission[]>(() => {
    const saved = localStorage.getItem('dinedash_delivery_ledger');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_PAST_MISSIONS;
  });

  const [riderStats, setRiderStats] = useState<RiderStats>(() => {
    const saved = localStorage.getItem('dinedash_rider_stats');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      level: 42,
      xp: 280,
      nextLevelXp: 500,
      streak: 12,
      todayEarnings: 248.50,
      battery: 89
    };
  });

  useEffect(() => {
    localStorage.setItem('dinedash_delivery_ledger', JSON.stringify(completedLedger));
  }, [completedLedger]);

  useEffect(() => {
    localStorage.setItem('dinedash_rider_stats', JSON.stringify(riderStats));
  }, [riderStats]);

  // Auth Mount Check
  useEffect(() => {
    const token = localStorage.getItem('d4u_rider_token');
    const store = localStorage.getItem('d4u_rider_store');
    const name = localStorage.getItem('d4u_rider_name');
    const storeName = localStorage.getItem('d4u_rider_store_name');
    
    if (token && store) {
      setRiderStoreId(Number(store));
      setRiderName(name || 'Rider');
      setRiderStoreName(storeName || 'Branch');
      setCurrentView('map');
    } else {
      setCurrentView('login');
    }
  }, []);

  // Sync general Rider status online vs offline
  useEffect(() => {
    if (!activeOrder) {
      setStatus(isOnline ? 'SEARCHING' : 'OFFLINE');
    }
  }, [isOnline, activeOrder]);

  // Sync Live GPS coordinates to the Bridge
  useEffect(() => {
    if (activeOrder && driverCoords) {
      fetch(`${BACKEND_URL}/rider/gps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: activeOrder.id, lat: driverCoords.y, lng: driverCoords.x })
      }).catch(() => {});
    }
  }, [driverCoords, activeOrder]);

  // --- GPS ROUTE DRIVING TICK ANIMATION ---
  useEffect(() => {
    if (status !== 'ACCEPTED' && status !== 'PICKED_UP') return;
    if (activePath.length === 0) return;

    const intervalTime = 165 / simSpeed;

    const timer = setInterval(() => {
      setCurrentPathIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex < activePath.length) {
          setDriverCoords(activePath[nextIndex]);
          return nextIndex;
        } else {
          clearInterval(timer);
          if (status === 'ACCEPTED') {
            setStatus('ARRIVED_REST');
            setDriverCoords({ x: activeOrder!.restaurantX, y: activeOrder!.restaurantY });
          } else if (status === 'PICKED_UP') {
            setDriverCoords({ x: activeOrder!.customerX, y: activeOrder!.customerY });
          }
          return prevIndex;
        }
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [status, activePath, simSpeed, activeOrder]);

  const updateBridgeStatus = async (bridgeStatus: string) => {
    if (!activeOrder) return;
    try {
      await fetch(`${BACKEND_URL}/online-orders/${activeOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: bridgeStatus })
      });
    } catch {}
  };

  // Polling for dispatched orders from Bridge
  useEffect(() => {
    if (!isOnline || activeOrder || !riderStoreId) return;
    const poll = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/rider-orders?store_id=${riderStoreId}`);
        if (res.ok) {
          const orders = await res.json();
          console.log('[RIDER POLL] Fetched orders:', orders);
          const dispatched = orders.find((o: any) => o.status === 'DISPATCHED');
          if (dispatched) {
             console.log('[RIDER] Found dispatched order!', dispatched);
             const deliveryOrder: DeliveryOrder = {
               id: dispatched.id,
               source: 'ONLINE_ORDER',
               restaurantName: 'D4U Enterprise POS',
               restaurantX: 50, restaurantY: 50,
               restaurantAddress: 'Main Branch',
               customerName: dispatched.customer || 'Customer',
               customerAddress: dispatched.customerAddress || 'Customer Address',
               customerX: 80, customerY: 20,
               earnings: parseFloat(dispatched.totalAmount) || 12.50,
               distance: 3.5,
               itemsCount: dispatched.items ? dispatched.items.split(',').length : 1,
               itemsList: dispatched.items ? dispatched.items.split(',') : [],
               estTimeMins: 15,
               paymentMethod: 'COD',
               paymentStatus: 'UNPAID',
               estimatedReadyAt: dispatched.estimatedReadyAt,
               bridgeStatus: dispatched.kdsStatus
             };
             setActiveOrder(deliveryOrder as any);
             setStatus('OFFERED');
             setActivePath([]);
             setCurrentPathIndex(0);
             setCurrentView('map');
          }
        }
      } catch (err) {
        console.error('[RIDER POLL ERROR]', err);
      }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [isOnline, activeOrder, riderStoreId]);

  // Polling for active order status updates and settlement
  useEffect(() => {
    const poll = async () => {
      try {
        if (activeOrder) {
          const res = await fetch(`${BACKEND_URL}/online-orders/${activeOrder.id}`);
          if (res.ok) {
            const order = await res.json();
            setActiveOrder(prev => prev ? { ...prev, estimatedReadyAt: order.estimatedReadyAt, bridgeStatus: order.kdsStatus } : null);
          }
        }
        
        // Poll for settlements in completed ledger
        if (completedLedger.some(m => !m.settled) && riderStoreId) {
          const res = await fetch(`${BACKEND_URL}/rider-orders?store_id=${riderStoreId}`);
          if (res.ok) {
            const allOrders = await res.json();
            setCompletedLedger(prev => prev.map(m => {
              if (m.settled) return m;
              const remote = allOrders.find((o: any) => o.id == m.orderId);
              if (remote && remote.status === 'SETTLED') {
                return { ...m, settled: true };
              }
              return m;
            }));
          }
        }
      } catch {}
    };
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [activeOrder, completedLedger, riderStoreId]);

  // --- USER TRIGGERS & SIMULATOR HANDLERS ---
  const handleDispatchOrder = (order: DeliveryOrder) => {
    if (!isOnline) return;
    setActiveOrder(order);
    setStatus('OFFERED');
    setActivePath([]);
    setCurrentPathIndex(0);
    setCurrentView('map');
  };

  const handleAcceptOrder = () => {
    if (!activeOrder) return;
    const currentSpot = driverCoords || { x: 30, y: 65 };
    const pickupPath = generateGridPath(
      currentSpot.x, currentSpot.y, 
      activeOrder.restaurantX, activeOrder.restaurantY, 
      'pickup'
    );
    setActivePath(pickupPath);
    setCurrentPathIndex(0);
    setDriverCoords(pickupPath[0]);
    setStatus('ACCEPTED');
    updateBridgeStatus('RIDER_ACCEPTED');
  };

  const handleDeclineOrder = () => {
    setActiveOrder(null);
    setStatus(isOnline ? 'SEARCHING' : 'OFFLINE');
    setActivePath([]);
    setCurrentPathIndex(0);
  };

  const handleArriveAtRestaurant = () => {
    setStatus('ARRIVED_REST');
    setDriverCoords({ x: activeOrder!.restaurantX, y: activeOrder!.restaurantY });
    setActivePath([]);
    setCurrentPathIndex(0);
  };

  const handleConfirmPickedUp = () => {
    if (!activeOrder) return;
    const tripPath = generateGridPath(
      activeOrder.restaurantX, activeOrder.restaurantY,
      activeOrder.customerX, activeOrder.customerY,
      'trip'
    );
    setActivePath(tripPath);
    setCurrentPathIndex(0);
    setDriverCoords(tripPath[0]);
    setStatus('PICKED_UP');
    updateBridgeStatus('PICKED_UP');
  };

  const handleMarkDelivered = () => {
    setStatus('DELIVERED'); // Keep internal status as DELIVERED to show the settlement UI
    setDriverCoords({ x: activeOrder!.customerX, y: activeOrder!.customerY });
    setActivePath([]);
    setCurrentPathIndex(0);
    updateBridgeStatus('PAID'); // Send PAID to bridge so Customer sees Feedback UI and POS sees Settle Button
  };

  const handleCompleteRestReset = (feedback: { tip: number }) => {
    if (!activeOrder) return;
    const newMissionLog: SavedCompletedMission = {
      id: `milestone-${Date.now()}`,
      orderId: activeOrder.id,
      restaurant: activeOrder.restaurantName,
      customer: activeOrder.customerName,
      earnings: activeOrder.earnings + feedback.tip,
      itemsCount: activeOrder.itemsCount,
      completedAt: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setCompletedLedger(prev => [newMissionLog, ...prev]);
    setRiderStats(prev => {
      let newXp = prev.xp + 100;
      let newLevel = prev.level;
      let nextReq = prev.nextLevelXp;
      if (newXp >= nextReq) {
        newXp -= nextReq;
        newLevel += 1;
        nextReq = Math.round(nextReq * 1.25);
      }
      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp: nextReq,
        todayEarnings: prev.todayEarnings + activeOrder.earnings + feedback.tip
      };
    });

    const customerLastSpot = { x: activeOrder.customerX, y: activeOrder.customerY };
    setDriverCoords(customerLastSpot);
    setActiveOrder(null);
    setStatus(isOnline ? 'SEARCHING' : 'OFFLINE');
    setActivePath([]);
    setCurrentPathIndex(0);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center font-sans overflow-y-auto">
      
      {/* Mobile Device Frame */}
      <div className="w-full max-w-[420px] h-[100dvh] md:h-[850px] bg-slate-900 md:rounded-[40px] md:my-8 shadow-2xl overflow-hidden relative flex flex-col border-[6px] border-slate-700">
        
        {/* Notch decoration (Desktop only visual) */}
        <div className="hidden md:block w-32 h-6 bg-slate-800 rounded-b-2xl mx-auto absolute top-0 left-1/2 transform -translate-x-1/2 z-50" />

        {/* View Routing */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'login' && (
            <LoginView 
              onLoginSuccess={(rId, sId, name) => {
                setRiderId(rId);
                setRiderStoreId(sId);
                setRiderName(name);
                setRiderStoreName(localStorage.getItem('d4u_rider_store_name') || 'Branch');
                setCurrentView('map');
              }}
            />
          )}

          {currentView === 'map' && (
            <>
              <div className="absolute top-12 left-4 right-4 flex justify-between items-center z-50">
                <div className="bg-slate-900/80 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-slate-800 shadow-xl">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                  <span className="text-white text-xs font-bold uppercase tracking-widest">{riderName}</span>
                </div>
                
                <button
                  onClick={logout}
                  className="bg-slate-900/80 backdrop-blur-md rounded-full p-2.5 text-slate-400 hover:text-red-400 border border-slate-800 shadow-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              <ActiveRideView 
                status={status}
                activeOrder={activeOrder}
                onAccept={handleAcceptOrder}
                onDecline={handleDeclineOrder}
                onArriveRest={handleArriveAtRestaurant}
                onPickedUp={handleConfirmPickedUp}
                onDelivered={handleMarkDelivered}
                onSettle={() => handleCompleteRestReset({ tip: 0 })}
                driverCoords={driverCoords}
                activePath={activePath}
                storeName={riderStoreName}
              />
            </>
          )}

          {currentView === 'history' && (
            <HistoryView 
              trips={completedLedger} 
              onBack={() => setCurrentView('map')} 
            />
          )}

          {currentView === 'settle' && (
            <SettleCashView 
              stats={riderStats} 
              onBack={() => setCurrentView('map')} 
              onSettle={() => {
                setRiderStats(prev => ({ ...prev, todayEarnings: 0 }));
                setCurrentView('map');
              }} 
            />
          )}
        </div>

        {/* Bottom Navigation Bar */}
        {currentView !== 'login' && (
          <div className="bg-slate-900 border-t border-slate-800 flex justify-around items-center p-3 pb-6 md:pb-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-40 relative">
            <button 
              onClick={() => setCurrentView('map')}
              className={`flex flex-col items-center gap-1 ${currentView === 'map' ? 'text-primary' : 'text-slate-400'}`}
            >
              <Navigation size={22} className={currentView === 'map' ? 'fill-primary' : ''} />
              <span className="text-[10px] font-bold">Map</span>
            </button>
            <button 
              onClick={() => setCurrentView('history')}
              className={`flex flex-col items-center gap-1 ${currentView === 'history' ? 'text-primary' : 'text-slate-400'}`}
            >
              <Clock size={22} />
              <span className="text-[10px] font-bold">History</span>
            </button>
            <button 
              onClick={() => setCurrentView('settle')}
              className={`flex flex-col items-center gap-1 ${currentView === 'settle' ? 'text-primary' : 'text-slate-400'}`}
            >
              <CheckSquare size={22} />
              <span className="text-[10px] font-bold">Settle Cash</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
