import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Package, MapPin } from 'lucide-react';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

interface OrdersViewProps {
  riderStoreId: string;
  riderId: string;
  lastOrderUpdate: number;
  onBack: () => void;
  onAcceptOrder: (order: any) => Promise<boolean>;
  onResumeOrder: (order: any) => void;
}

export default function OrdersView({ riderStoreId, riderId, lastOrderUpdate, onBack, onAcceptOrder, onResumeOrder }: OrdersViewProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [claimingId, setClaimingId] = useState<number | string | null>(null);

  const fetchOrders = async () => {
    if (!riderStoreId) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${BACKEND_URL}/rider-orders?store_id=${riderStoreId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('d4u_rider_token')}`,
        }
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [riderStoreId, lastOrderUpdate]);

  const handleAccept = async (order: any) => {
    if (claimingId !== null) return;
    setClaimingId(order.id);
    try {
      const success = await onAcceptOrder(order);
      if (!success) {
        await fetchOrders();
      }
    } finally {
      setClaimingId(null);
    }
  };

  const availableOrders = orders.filter(o => 
    ['READY', 'PRINT_BILL', 'RIDER_ARRIVED', 'DISPATCHED'].includes(o.status) && 
    o.claimedByRiderId == null
  );

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

  return (
    <div className="flex flex-col h-full bg-slate-950 relative">
      {/* Header */}
      <div className="bg-primary text-slate-900 p-4 pt-6 pb-6 flex items-center shadow-md z-10 rounded-b-3xl">
        <button onClick={onBack} className="mr-4 active:scale-95 transition-transform">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-xl flex-1">Orders</h1>
        <button onClick={fetchOrders} className="active:scale-95 transition-transform p-2 bg-slate-900/10 rounded-full">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error ? (
          <div className="text-center py-12 text-slate-400">
            <p>Unable to load orders.</p>
            <button onClick={fetchOrders} className="mt-4 px-4 py-2 bg-slate-800 rounded-lg text-sm font-bold">Try Again</button>
          </div>
        ) : loading && orders.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-4 text-primary" />
            <p>Loading orders...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 pb-20">
            
            {/* Active Orders Section */}
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
