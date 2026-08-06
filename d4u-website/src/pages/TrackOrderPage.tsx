import { useEffect, useState } from 'react';
import { CheckCircle2, MapPin } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { BACKEND_URL } from '../hooks/useStoreData';
import { formatCurrency } from '../utils/currency';

const STATUS_INDEX: Record<string, number> = {
  ONLINE_ORDER_RECEIVED: 0,
  CONFIRMED: 1,
  KITCHEN_PREPARING: 2,
  READY: 3,
  RIDER_ACCEPTED: 3,
  RIDER_ARRIVED: 3,
  PRINT_BILL: 3,
  DISPATCHED: 3,
  PICKED_UP: 4,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  WAITING_CASH_SETTLEMENT: 5,
  SETTLED: 6,
};

export default function TrackOrderPage({ activeOrder }: { activeOrder: any }) {
  const { orderUpdate, riderPosition } = useStore();
  const [searchParams] = useSearchParams();
  const queryOrder = searchParams.get('order') || '';
  const [trackInput, setTrackInput] = useState(queryOrder || (activeOrder?.id ? String(activeOrder.id) : ''));
  const [result, setResult] = useState<any>(activeOrder || null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Live status push — ported from legacy/MobileMode.tsx, which already had
  // this working ahead of the old desktop implementation.
  useEffect(() => {
    if (orderUpdate && result && (orderUpdate.id === result.id || orderUpdate.id == result.id)) {
      setResult((prev: any) => ({ ...prev, status: orderUpdate.status, ...orderUpdate }));
    }
  }, [orderUpdate]);

  const loadOrder = async (input: string) => {
    if (!input) { setError('Order ID or phone is required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/online-orders/track/${encodeURIComponent(input)}`);
      if (!res.ok) { setError('Order not found.'); setLoading(false); return; }
      const data = await res.json();
      const found = Array.isArray(data) ? data.sort((a, b) => b.id - a.id)[0] : data;
      if (!found) { setError('No orders found.'); setLoading(false); return; }
      setResult(found);
    } catch {
      setError('Failed to connect to server.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const input = queryOrder.trim();
    if (!input) return;
    if (result && String(result.id) === input) return;
    void loadOrder(input);
  }, [queryOrder]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadOrder(trackInput.trim());
  };

  const currentStep = result ? (STATUS_INDEX[result.status] ?? 0) : 0;
  const steps = [
    { label: 'Order Placed', sub: 'Received' },
    { label: 'Confirmed by Restaurant', sub: currentStep >= 1 ? 'Accepted' : 'Waiting for cashier...' },
    { label: 'In Kitchen', sub: currentStep >= 2 ? 'Working on it' : 'Waiting...' },
    { label: 'Ready', sub: currentStep >= 3 ? 'Food is packed!' : 'Pending...' },
    { label: 'Out For Delivery', sub: currentStep >= 4 ? 'Rider on the way' : 'Waiting for rider...' },
    { label: 'Delivered', sub: currentStep >= 5 ? 'Arrived' : 'Pending...' },
    { label: 'Completed', sub: currentStep >= 6 ? 'Settled' : 'Pending...' },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-stitch-panel border border-stitch-border rounded-3xl p-6 space-y-6">
        <h3 className="text-xl font-black text-stitch-ink flex items-center gap-2">
          <MapPin className="w-5 h-5 text-stitch-success" /> Track Your Order
        </h3>

        {!result ? (
          <form onSubmit={handleTrack} className="space-y-3">
            <input
              type="text"
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              placeholder="e.g. 1033 or 0300..."
              className="w-full bg-stitch-surface border border-stitch-border text-stitch-ink text-sm rounded-xl px-4 py-3 outline-none focus:border-stitch-success transition-colors"
            />
            {error && <p className="text-xs text-stitch-danger font-bold">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-stitch-success text-stitch-bg px-5 py-3 rounded-xl font-bold transition-colors disabled:opacity-50">
              {loading ? 'Searching...' : 'Find My Order'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-stitch-surface rounded-2xl border border-stitch-border p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-stitch-ink text-base">Order #{result.id}</p>
                  <p className="text-[10px] text-stitch-muted">{result.customer} · {result.timePlaced}</p>
                </div>
                <span className="text-xs font-black text-stitch-accent">{formatCurrency(Number(result.totalAmount))}</span>
              </div>
            </div>

            {currentStep === 4 && riderPosition && String(riderPosition.orderId) === String(result.id) && (
              <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-stitch-border bg-stitch-surface">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, var(--stitch-border, #888) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                <div
                  className="absolute w-3 h-3 rounded-full bg-stitch-success shadow-[0_0_0_4px_rgba(0,0,0,0.05)] animate-pulse transition-all duration-500"
                  style={{ top: `calc(${riderPosition.lat}% - 6px)`, left: `calc(${riderPosition.lng}% - 6px)` }}
                />
                <span className="absolute bottom-2 left-2 text-[9px] font-bold text-stitch-muted uppercase tracking-widest">Live tracking — rider on the way</span>
              </div>
            )}

            <div className="space-y-3">
              {steps.map((step, i) => {
                const done = currentStep >= i;
                return (
                  <div key={i} className="flex items-start gap-3 relative">
                    {i < steps.length - 1 && <div className={`absolute left-2.5 top-5 w-[2px] h-6 ${done ? 'bg-stitch-success' : 'bg-stitch-border'}`}></div>}
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all relative z-10 bg-stitch-panel ${done ? 'border-stitch-success text-stitch-success' : 'border-stitch-border text-transparent'}`}>
                      {done && <CheckCircle2 className="w-3 h-3 fill-stitch-success text-stitch-panel" />}
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold ${done ? 'text-stitch-ink' : 'text-stitch-muted'}`}>{step.label}</p>
                      <p className="text-[9px] text-stitch-muted">{step.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={() => { setResult(null); setTrackInput(''); }} className="w-full py-2.5 border border-stitch-border hover:border-stitch-accent/50 text-stitch-muted font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all">
              Search Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
