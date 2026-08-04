import React, { useState, useEffect, useCallback } from 'react';

import { ArrowLeft, RefreshCw, Package, MapPin, AlertTriangle, LogOut, WifiOff } from 'lucide-react';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

// Task 6B: discriminate error types so the UI can show the right recovery action.

// 'session'  — auth/store identity problem  → show re-login prompt, do NOT retry

// 'network'  — transient network/server error → show Try Again button

// null       — no error

type ErrorType = 'session' | 'network' | null;

interface OrdersViewProps {

  riderStoreId: number | null;

  riderToken: string | null;

  riderId: string;

  lastOrderUpdate: number;

  onBack: () => void;

  onAcceptOrder: (order: any) => Promise<boolean>;

  onResumeOrder: (order: any) => void;

  /** Called when a session/auth error is detected — should route rider to login. */

  onSessionError?: () => void;

}

export default function OrdersView({ riderStoreId, riderId, riderToken, lastOrderUpdate, onBack, onAcceptOrder, onResumeOrder, onSessionError }: OrdersViewProps) {

  const [orders, setOrders] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [errorType, setErrorType] = useState<ErrorType>(null);

  const [errorMessage, setErrorMessage] = useState('');

  const [claimingId, setClaimingId] = useState<number | string | null>(null);

  const fetchOrders = useCallback(async () => {

    // -----------------------------------------------------------

    // Task 6B Change 1 & 2: Validate session before ANY request.

    // Never send:  GET /rider-orders?store_id=

    // -----------------------------------------------------------

    const token = riderToken;

    const storeNum = Number(riderStoreId);

    const tokenValid = token && token !== 'null' && token !== 'undefined' && token.trim().length > 0;

    const storeValid = riderStoreId != null && !isNaN(storeNum) && storeNum > 0;

    if (!tokenValid || !storeValid) {

      // Session is invalid — do not fire the request, show actionable message

      setLoading(false);

      setErrorType('session');

      setErrorMessage('Your rider session is invalid. Please log in again.');

      return;

    }

    setLoading(true);

    setErrorType(null);

    setErrorMessage('');

    try {

      const res = await fetch(`${BACKEND_URL}/rider-orders?store_id=${storeNum}`, {

        headers: {

          'Content-Type': 'application/json',

        },

      });

      // -----------------------------------------------------------

      // Task 6B Change 4: HTTP error discrimination

      // -----------------------------------------------------------

      if (!res.ok) {

        let body: any = {};

        try { body = await res.json(); } catch { /* ignore JSON parse failure */ }

        const msg: string = body?.message || '';

        if (res.status === 401 || res.status === 403) {

          // Authentication failed — session token is expired/invalid

          setErrorType('session');

          setErrorMessage('Your session has expired. Please log in again.');

          setLoading(false);

          return;

        }

        if (res.status === 400 && msg.toLowerCase().includes('store')) {

          // store_id validation failed on backend — session identity problem

          setErrorType('session');

          setErrorMessage('Your rider store identity is invalid. Please log in again.');

          setLoading(false);

          return;

        }

        // 5xx or other 4xx — retryable network/server error

        setErrorType('network');

        setErrorMessage(msg || `Server error (${res.status}). Please try again.`);

        setLoading(false);

        return;

      }

      const data = await res.json();

      setOrders(data);

      setErrorType(null);

      setErrorMessage('');

    } catch {

      // Network/connection failure — retryable, do NOT destroy session

      setErrorType('network');

      setErrorMessage('Network error — could not reach the server. Please check your connection.');

    } finally {

      setLoading(false);

    }

  }, [riderStoreId, riderToken]);

  useEffect(() => {

    fetchOrders();

  }, [fetchOrders, lastOrderUpdate]);

  const handleAccept = async (order: any) => {

    if (claimingId !== null) return;

    setClaimingId(order.id);

    try {

      const success = await onAcceptOrder(order);

      if (!success) {

        // Claim failed — refresh so the order state is accurate

        await fetchOrders();

      }

    } finally {

      setClaimingId(null);

    }

  };

  // Task 6B Change 5: preserve Task 5E filter semantics exactly.

  // Available = unclaimed + actionable delivery status

  // Task 6B: order_source='ONLINE' orders show OnlineOrder.id (the .id field on the payload)

  const availableOrders = orders.filter(o =>

    ['READY', 'PRINT_BILL', 'RIDER_ARRIVED', 'DISPATCHED'].includes(o.status) &&

    o.claimedByRiderId == null

  );

  // Task 6B Change 6: preserve Task 5E-C My Active Order semantics

  const activeOrders = orders.filter(o =>

    String(o.claimedByRiderId) === String(riderId) &&

    !['SETTLED', 'CANCELLED'].includes(o.status)

  );

  const renderOrderCard = (order: any, isActive: boolean) => (

    <div key={order.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm mb-4">

      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">

        <div className="flex items-center gap-2">

          <span className="font-mono text-sm font-bold text-slate-100">

            #{order.id}

          </span>

          {order.isPos && (

            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider">

              POS

            </span>

          )}

        </div>

        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${

          isActive ? 'bg-primary text-slate-900' : 'bg-slate-800 text-slate-300'

        }`}>

          {order.status.replace(/_/g, ' ')}

        </span>

      </div>

      <div className="flex flex-col gap-2 mb-3">

        <div className="flex items-start gap-2">

          <Package className="w-4 h-4 text-primary mt-0.5 shrink-0" />

          <div>

            <p className="text-[10px] text-slate-400 font-semibold uppercase">Restaurant</p>

            <p className="text-sm font-bold text-slate-100">{order.storeName || 'Branch'}</p>

          </div>

        </div>

        <div className="flex items-start gap-2">

          <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />

          <div>

            <p className="text-[10px] text-slate-400 font-semibold uppercase">Customer Delivery</p>

            <p className="text-sm font-bold text-slate-100">{order.customerAddress || 'Customer Address'}</p>

          </div>

        </div>

      </div>

      <div className="flex justify-between items-center pt-2 border-t border-slate-800">

        <div>

          <p className="text-[10px] text-slate-400 uppercase font-semibold">Amount</p>

          <p className="text-slate-100 font-bold text-sm">

            Rs. {parseFloat(order.totalAmount || '0').toFixed(2)}

          </p>

        </div>

        <div className="text-right">

          <p className="text-[10px] text-slate-400 uppercase font-semibold">Method</p>

          <p className="text-slate-100 font-bold text-sm">

            {order.paymentMethod || 'COD'}

          </p>

        </div>

      </div>

      {isActive ? (

        // Task 6B Change 6: Resume Delivery does NOT re-call /claim.

        // onResumeOrder handles Task 5E-C restoration mapping.

        <button

          onClick={() => onResumeOrder(order)}

          className="w-full mt-3 bg-primary text-slate-900 font-bold py-2.5 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"

        >

          <span>Resume Delivery</span>

        </button>

      ) : (

        <button

          onClick={() => handleAccept(order)}

          disabled={claimingId === order.id}

          className="w-full mt-3 bg-primary text-slate-900 font-bold py-2.5 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"

        >

          {claimingId === order.id ? (

            <>

              <RefreshCw size={16} className="animate-spin" />

              <span>Accepting...</span>

            </>

          ) : (

            <span>Accept Order</span>

          )}

        </button>

      )}

    </div>

  );

  // Task 6B Change 3: Session error UI — actionable, with logout option.

  // Must NOT show "Try Again" since retrying with an invalid session will always fail.

  const renderSessionError = () => (

    <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-4">

      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">

        <AlertTriangle className="w-7 h-7 text-red-400" />

      </div>

      <div>

        <p className="text-slate-200 font-bold text-base mb-1">Session Invalid</p>

        <p className="text-slate-400 text-sm leading-relaxed">{errorMessage}</p>

      </div>

      {onSessionError && (

        <button

          onClick={onSessionError}

          className="flex items-center gap-2 px-5 py-2.5 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl font-bold text-sm hover:bg-red-500/30 transition-colors"

        >

          <LogOut size={16} />

          <span>Log In Again</span>

        </button>

      )}

    </div>

  );

  // Task 6B Change 4: Network/server error UI — retryable.

  // Do NOT log the rider out for a transient network issue.

  const renderNetworkError = () => (

    <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-4">

      <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">

        <WifiOff className="w-7 h-7 text-slate-400" />

      </div>

      <div>

        <p className="text-slate-200 font-bold text-base mb-1">Unable to load orders</p>

        <p className="text-slate-400 text-sm leading-relaxed">{errorMessage}</p>

      </div>

      <button

        onClick={fetchOrders}

        className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors"

      >

        <RefreshCw size={16} />

        <span>Try Again</span>

      </button>

    </div>

  );

  return (

    <div className="flex flex-col h-full bg-slate-950 relative">

      {/* Header */}

      <div className="bg-primary text-slate-900 p-4 pt-6 pb-6 flex items-center shadow-md z-10 rounded-b-3xl">

        <button onClick={onBack} className="mr-4 active:scale-95 transition-transform">

          <ArrowLeft size={24} />

        </button>

        <h1 className="font-display font-bold text-xl flex-1">Orders</h1>

        {/* Only show manual refresh when session is valid — no point refreshing on session error */}

        {errorType !== 'session' && (

          <button onClick={fetchOrders} className="active:scale-95 transition-transform p-2 bg-slate-900/10 rounded-full">

            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />

          </button>

        )}

      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* Task 6B Change 3: session error */}

        {errorType === 'session' ? renderSessionError() :

         /* Task 6B Change 4: network/server error */

         errorType === 'network' ? renderNetworkError() :

         /* Loading state */

         loading && orders.length === 0 ? (

          <div className="text-center py-12 text-slate-400">

            <RefreshCw size={24} className="animate-spin mx-auto mb-4 text-primary" />

            <p>Loading orders...</p>

          </div>

        ) : (

          <div className="flex flex-col gap-6 pb-20">

            {/* My Active Order Section */}

            <div>

              <h2 className="text-primary font-bold mb-4 uppercase tracking-widest text-xs">My Active Order</h2>

              {activeOrders.length === 0 ? (

                <div className="text-center py-6 bg-slate-900/50 rounded-2xl border border-slate-800/50">

                  <p className="text-slate-500 text-sm">No active order</p>

                </div>

              ) : (

                activeOrders.map(o => renderOrderCard(o, true))

              )}

            </div>

            {/* Available Orders Section */}

            <div>

              <h2 className="text-primary font-bold mb-4 uppercase tracking-widest text-xs">Available Orders</h2>

              {availableOrders.length === 0 ? (

                <div className="text-center py-6 bg-slate-900/50 rounded-2xl border border-slate-800/50">

                  <p className="text-slate-500 text-sm">No available orders</p>

                </div>

              ) : (

                availableOrders.map(o => renderOrderCard(o, false))

              )}

            </div>

          </div>

        )}

      </div>

    </div>

  );

}

