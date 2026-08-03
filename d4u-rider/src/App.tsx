import React, { useState, useEffect, useRef } from 'react';
import { DeliveryStatus, DeliveryOrder, SavedCompletedMission, RiderStats } from './types';
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';
import { generateGridPath } from './utils';
import { io } from 'socket.io-client';

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
  // Mirrors `status` for the socket effect below to read without being a
  // dependency of it — the effect intentionally does not re-subscribe on
  // every status change (that would disconnect/reconnect the socket on
  // every ACCEPTED/ARRIVED_REST/PICKED_UP/DELIVERED transition mid-delivery).
  const statusRef = useRef<DeliveryStatus>('SEARCHING');
  useEffect(() => { statusRef.current = status; }, [status]);

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
    return [];
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
      setRiderName(name || '');
      setRiderStoreName(storeName || '');
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('d4u_rider_token')}`,
        },
        body: JSON.stringify({ orderId: activeOrder.id, storeId: activeOrder.store_id || 1, lat: driverCoords.y, lng: driverCoords.x })
      }).catch(() => {
        const { toast } = require('react-hot-toast');
        toast.error('Failed to sync GPS location with backend.');
      });
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

  const updateBridgeStatus = async (bridgeStatus: string): Promise<boolean> => {
    if (!activeOrder) return false;
    try {
      const res = await fetch(`${BACKEND_URL}/online-orders/${activeOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('d4u_rider_token')}`,
        },
        body: JSON.stringify({ status: bridgeStatus })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const { toast } = require('react-hot-toast');
        
        let humanAction = "be updated";
        if (bridgeStatus === 'RIDER_ARRIVED') humanAction = "be marked as arrived";
        if (bridgeStatus === 'OUT_FOR_DELIVERY') humanAction = "start delivery";
        if (bridgeStatus === 'DELIVERED') humanAction = "be marked delivered";
        if (bridgeStatus === 'WAITING_CASH_SETTLEMENT') humanAction = "be sent for settlement";

        let errorMessage = data.message || `Order #${activeOrder.id} could not ${humanAction}.`;

        if (res.status >= 400 && res.status < 500) {
          if (bridgeStatus === 'RIDER_ARRIVED') {
            errorMessage = "The kitchen hasn't marked this order as READY yet. Please wait for the food to be prepared.";
          } else {
            errorMessage = `Action not permitted yet. Please complete previous steps first.`;
          }
        } else if (res.status >= 500) {
          errorMessage = `Server error while trying to ${humanAction}. Please check your connection and try again.`;
        }

        toast.error(errorMessage);
        return false;
      }
      return true;
    } catch {
      const { toast } = require('react-hot-toast');
      toast.error(`Network error — Order #${activeOrder.id} could not be updated. Please check your internet connection.`);
      return false;
    }
  };

  // --- REST HYDRATION ON MOUNT ---
  useEffect(() => {
    if (!riderStoreId || !riderId) return;

    const hydrateActiveOrder = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/rider-orders?store_id=${riderStoreId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('d4u_rider_token')}`,
          }
        });
        if (!res.ok) return;

        const orders: any[] = await res.json();
        
        // 1. Prefer an order already claimed by THIS rider
        let targetOrder = orders.find(o => String(o.claimedByRiderId) === String(riderId) && o.status !== 'SETTLED');
        
        // 2. Otherwise find an available READY/unclaimed delivery
        if (!targetOrder) {
          targetOrder = orders.find(o => 
            ['READY', 'DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.status) && 
            o.claimedByRiderId == null
          );
        }

        // An order claimed by another rider is implicitly excluded because 
        // we either pick claimedByRiderId == riderId OR claimedByRiderId == null.

        if (targetOrder && !activeOrder) {
          console.log('[RIDER] Hydrated available order from REST!', targetOrder);
          const deliveryOrder: DeliveryOrder = {
            id: targetOrder.id,
            source: 'ONLINE_ORDER',
            restaurantName: riderStoreName || 'Restaurant',
            restaurantX: 50, restaurantY: 50,
            restaurantAddress: riderStoreName || 'Branch Location',
            customerName: targetOrder.customer || 'Customer',
            customerAddress: targetOrder.customerAddress || 'Customer Address',
            customerX: 80, customerY: 20,
            earnings: parseFloat(targetOrder.totalAmount) || 12.50,
            distance: 3.5,
            itemsCount: targetOrder.items ? targetOrder.items.split(',').length : 1,
            itemsList: targetOrder.items ? targetOrder.items.split(',') : [],
            estTimeMins: 15,
            paymentMethod: 'COD',
            paymentStatus: 'UNPAID',
            estimatedReadyAt: targetOrder.estimatedReadyAt,
            bridgeStatus: targetOrder.status
          };
          
          setActiveOrder(deliveryOrder as any);

          let hydratedStatus: DeliveryStatus = 'OFFERED';
          let hydratedPath: { x: number; y: number }[] = [];

          if (String(targetOrder.claimedByRiderId) === String(riderId)) {
            if (['READY', 'DISPATCHED'].includes(targetOrder.status)) {
              hydratedStatus = 'ACCEPTED';
              hydratedPath = generateGridPath(
                30, 65,
                deliveryOrder.restaurantX, deliveryOrder.restaurantY,
                'pickup'
              );
            }
            if (targetOrder.status === 'RIDER_ARRIVED') {
              hydratedStatus = 'ARRIVED_REST';
            }
            if (targetOrder.status === 'OUT_FOR_DELIVERY') {
              hydratedStatus = 'PICKED_UP';
              hydratedPath = generateGridPath(
                deliveryOrder.restaurantX, deliveryOrder.restaurantY,
                deliveryOrder.customerX, deliveryOrder.customerY,
                'trip'
              );
            }
            if (targetOrder.status === 'DELIVERED' || targetOrder.status === 'WAITING_CASH_SETTLEMENT') {
              hydratedStatus = 'DELIVERED';
            }
          }

          setStatus(hydratedStatus);
          setActivePath(hydratedPath);
          setCurrentPathIndex(0);
          
          if (hydratedPath.length > 0) {
            setDriverCoords(hydratedPath[0]);
          } else if (hydratedStatus === 'ARRIVED_REST') {
            setDriverCoords({ x: deliveryOrder.restaurantX, y: deliveryOrder.restaurantY });
          } else if (hydratedStatus === 'DELIVERED') {
            setDriverCoords({ x: deliveryOrder.customerX, y: deliveryOrder.customerY });
          }
          
          setCurrentView('map');
        }
      } catch (err) {
        console.error('Failed to hydrate rider orders', err);
      }
    };

    // Only run if we don't already have an activeOrder
    if (!activeOrder) {
      hydrateActiveOrder();
    }
  }, [riderStoreId, riderId]);

  // --- REAL-TIME SOCKET CONNECTION ---
  useEffect(() => {
    if (!riderStoreId) return;
    
    const socket = io(BACKEND_URL);
    socket.emit('join_store', `store_${riderStoreId}`);

    socket.on('order_updated', (order: any) => {
      // 1. Alert Rider if a new order is READY
      if (order.status === 'READY' && isOnline && !activeOrder) {
        // Just show toast notification
        const { toast } = require('react-hot-toast');
        toast.success(`New Delivery Ready for Pickup: Order #${order.id}`, { duration: 6000 });
      }

      // 2. Handle dispatch when KDS/POS dispatches it to OUT_FOR_DELIVERY or READY
      if (['READY', 'DISPATCHED', 'OUT_FOR_DELIVERY'].includes(order.status) && isOnline && !activeOrder) {
        console.log('[RIDER] Found available order!', order);
        const deliveryOrder: DeliveryOrder = {
          id: order.id,
          source: 'ONLINE_ORDER',
          restaurantName: riderStoreName || 'Restaurant',
          restaurantX: 50, restaurantY: 50,
          restaurantAddress: riderStoreName || 'Branch Location',
          customerName: order.customer || 'Customer',
          customerAddress: order.customerAddress || 'Customer Address',
          customerX: 80, customerY: 20,
          earnings: parseFloat(order.totalAmount) || 12.50,
          distance: 3.5,
          itemsCount: order.items ? order.items.split(',').length : 1,
          itemsList: order.items ? order.items.split(',') : [],
          estTimeMins: 15,
          paymentMethod: 'COD',
          paymentStatus: 'UNPAID',
          estimatedReadyAt: order.estimatedReadyAt,
          bridgeStatus: order.status
        };
        setActiveOrder(deliveryOrder as any);
        setStatus('OFFERED');
        setActivePath([]);
        setCurrentPathIndex(0);
        setCurrentView('map');
      }

      // 3. Sync active order updates
      if (activeOrder && order.id === activeOrder.id) {
        // If this order is still just an unaccepted offer and another rider's
        // claim landed first, drop it instead of leaving a dead offer on
        // screen — RiderService.claimOrder is the atomic lock; this is the
        // client-side reaction to losing that race.
        const claimedByOther = order.claimedByRiderId != null && String(order.claimedByRiderId) !== String(riderId);
        if (statusRef.current === 'OFFERED' && claimedByOther) {
          const { toast } = require('react-hot-toast');
          toast.error('Order was accepted by another rider.');
          setActiveOrder(null);
          setStatus(isOnline ? 'SEARCHING' : 'OFFLINE');
          setActivePath([]);
          setCurrentPathIndex(0);
        } else {
          setActiveOrder(prev => prev ? { ...prev, estimatedReadyAt: order.estimatedReadyAt, bridgeStatus: order.status } : null);
        }
      }

      // 4. Handle settlements
      if (order.status === 'SETTLED') {
        setCompletedLedger(prev => prev.map(m => m.orderId == order.id ? { ...m, settled: true } : m));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [riderStoreId, isOnline, activeOrder]);

  // --- USER TRIGGERS & SIMULATOR HANDLERS ---
  const handleDispatchOrder = (order: DeliveryOrder) => {
    if (!isOnline) return;
    setActiveOrder(order);
    setStatus('OFFERED');
    setActivePath([]);
    setCurrentPathIndex(0);
    setCurrentView('map');
  };

  const handleAcceptOrder = async () => {
    if (!activeOrder) return;
    // Atomic server-side claim: whichever rider's request lands first wins
    // (RiderService.claimOrder), every other online rider trying to accept
    // the same order gets a 409 and their local offer is dropped. Without
    // this, any idle rider whose socket happened to receive the same
    // order_updated event could accept the same order — a client-side race
    // with no server lock.
    try {
      const res = await fetch(`${BACKEND_URL}/rider-orders/${activeOrder.id}/claim`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('d4u_rider_token')}`,
        },
        body: JSON.stringify({ riderId, riderName }),
      });
      if (!res.ok) {
        const { toast } = require('react-hot-toast');
        if (res.status === 409) {
          toast.error('Order already taken by another rider.');
        } else {
          toast.error('Could not accept this order. Please try again.');
        }
        handleDeclineOrder();
        return;
      }
    } catch {
      const { toast } = require('react-hot-toast');
      toast.error('Network error — could not accept this order.');
      handleDeclineOrder();
      return;
    }

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
    // updateBridgeStatus('RIDER_ACCEPTED'); // No longer needed, managed by POS RIDER_ARRIVED
  };

  const handleDeclineOrder = () => {
    setActiveOrder(null);
    setStatus(isOnline ? 'SEARCHING' : 'OFFLINE');
    setActivePath([]);
    setCurrentPathIndex(0);
  };

  const handleArriveAtRestaurant = async () => {
    const success = await updateBridgeStatus('RIDER_ARRIVED');
    if (!success) return;
    setStatus('ARRIVED_REST');
    setDriverCoords({ x: activeOrder!.restaurantX, y: activeOrder!.restaurantY });
    setActivePath([]);
    setCurrentPathIndex(0);
  };

  const handleConfirmPickedUp = async () => {
    if (!activeOrder) return;
    const success = await updateBridgeStatus('OUT_FOR_DELIVERY');
    if (!success) return;
    const tripPath = generateGridPath(
      activeOrder.restaurantX, activeOrder.restaurantY,
      activeOrder.customerX, activeOrder.customerY,
      'trip'
    );
    setActivePath(tripPath);
    setCurrentPathIndex(0);
    setDriverCoords(tripPath[0]);
    setStatus('PICKED_UP');
  };

  const handleMarkDelivered = async () => {
    const successDelivered = await updateBridgeStatus('DELIVERED'); 
    if (!successDelivered) return;
    const successSettlement = await updateBridgeStatus('WAITING_CASH_SETTLEMENT');
    if (!successSettlement) return;
    
    setStatus('DELIVERED'); // Keep internal status as DELIVERED to show the settlement UI
    setDriverCoords({ x: activeOrder!.customerX, y: activeOrder!.customerY });
    setActivePath([]);
    setCurrentPathIndex(0);
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
