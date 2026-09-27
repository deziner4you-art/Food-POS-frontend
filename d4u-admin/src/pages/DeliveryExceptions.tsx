import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useAdminContext } from '../context/AdminContext';
import { AlertCircle, RotateCcw, Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeliveryExceptions() {
  const { selectedBranchId } = useAdminContext();
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [selectedException, setSelectedException] = useState<any>(null);
  const [reason, setReason] = useState('');

  const fetchExceptions = async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/rider-orders/exceptions?store_id=${selectedBranchId}`);
      if (res.ok) {
        setExceptions(await res.json());
      } else {
        toast.error('Failed to fetch exceptions');
      }
    } catch (e) {
      toast.error('Network error while fetching exceptions');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExceptions();
  }, [selectedBranchId]);

  const [actionType, setActionType] = useState<'recover' | 'settle'>('recover');

  const getCanonicalExceptionIdentity = (exception: any) => {
    const entityType = exception?.entityType;
    const entityId = exception?.entityId;
    if (entityType !== 'ONLINE' && entityType !== 'POS') return null;
    if (!Number.isInteger(entityId) || entityId <= 0) return null;
    return { entityType, entityId } as const;
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedException) return;
    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    const identity = getCanonicalExceptionIdentity(selectedException);
    if (!identity) {
      toast.error('This exception has no valid delivery identity. Refresh the list and try again.');
      return;
    }

    setRecovering(true);
    try {
      const identityQuery = new URLSearchParams({ entityType: identity.entityType }).toString();
      const endpoint = actionType === 'settle'
        ? `/rider-orders/${identity.entityId}/admin-force-settle?${identityQuery}`
        : `/rider-orders/${identity.entityId}/recover-exception?${identityQuery}`;

      const res = await apiFetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(
          actionType === 'settle'
            ? `Order #${selectedException.id} successfully settled and cleared`
            : `Order #${selectedException.id} successfully reset to READY`
        );
        setSelectedException(null);
        setReason('');
        fetchExceptions();
      } else {
        toast.error(data.message || `Failed to ${actionType} order`);
      }
    } catch (err) {
      toast.error(`Network error during ${actionType}`);
    }
    setRecovering(false);
  };

  const getAgeText = (createdAt: string) => {
    const min = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / 60000);
    if (min < 60) return `${min}m`;
    const hrs = Math.floor(min / 60);
    return `${hrs}h ${min % 60}m`;
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <AlertCircle className="text-red-500" size={32} /> 
            Delivery Exceptions & Stale Clear
          </h1>
          <p className="text-stitch-muted mt-2">
            Recover orphaned delivery orders or force settle stale deliveries from past shifts that are blocking riders.
          </p>
        </div>
        <button 
          onClick={fetchExceptions}
          disabled={loading}
          className="bg-stitch-card border border-stitch-border text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-stitch-surface transition-colors font-bold"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="bg-stitch-card border border-stitch-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stitch-surface border-b border-stitch-border text-stitch-muted text-xs uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Source</th>
                <th className="p-4">Status</th>
                <th className="p-4">Rider / Exception</th>
                <th className="p-4">Age</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-stitch-muted">Loading exceptions...</td>
                </tr>
              ) : exceptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-stitch-muted">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={32} className="text-green-500/50" />
                      <p>No delivery exceptions found.</p>
                      <p className="text-xs">System is operating normally.</p>
                    </div>
                  </td>
                </tr>
              ) : exceptions.map((order) => (
                <tr key={`${order.isPos ? 'pos' : 'online'}-${order.id}`} className="border-b border-stitch-border hover:bg-white/5 transition-colors group">
                  <td className="p-4 pl-6 font-bold text-white">
                    #{order.id}
                  </td>
                  <td className="p-4 text-white">
                    {order.customer_name || 'Walk-in'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${order.isPos ? 'bg-indigo-500/20 text-indigo-400' : 'bg-pink-500/20 text-pink-400'}`}>
                      {order.isPos ? 'POS' : 'ONLINE'}
                    </span>
                  </td>
                  <td className="p-4 text-orange-400 font-bold">
                    {order.status}
                  </td>
                  <td className="p-4 font-medium">
                    <div className="flex flex-col">
                      <span className="text-red-400 font-bold flex items-center gap-1.5">
                        <AlertCircle size={15} />
                        {order.exceptionType.replace(/_/g, ' ')}
                      </span>
                      {order.riderName && (
                        <span className="text-xs text-slate-400 mt-0.5 font-normal">
                          Assigned: <strong className="text-slate-200">{order.riderName}</strong>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-stitch-muted flex items-center gap-1">
                    <Clock size={14} />
                    {getAgeText(order.created_at)}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {order.isOrphan && (
                        <button 
                          onClick={() => { setSelectedException(order); setActionType('recover'); }}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-lg shadow-red-500/20 flex items-center gap-1.5"
                          title="Reset status back to READY so a rider can claim"
                        >
                          <RotateCcw size={14} />
                          Recover
                        </button>
                      )}
                      <button 
                        onClick={() => { setSelectedException(order); setActionType('settle'); }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-lg shadow-purple-600/20 flex items-center gap-1.5"
                        title="Permanently complete/clear this delivery order"
                      >
                        <RefreshCw size={14} />
                        Force Settle
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedException && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-stitch-panel border border-stitch-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <h3 className="text-xl font-black text-white flex items-center gap-2 mb-4">
              {actionType === 'settle' ? (
                <>
                  <RefreshCw className="text-purple-400" />
                  Force Settle & Clear Order
                </>
              ) : (
                <>
                  <RotateCcw className="text-red-500" />
                  Reset to READY
                </>
              )}
            </h3>
            
            <div className={`p-4 mb-6 rounded-xl border ${actionType === 'settle' ? 'bg-purple-500/10 border-purple-500/30 text-purple-200' : 'bg-red-500/10 border-red-500/30 text-red-200'}`}>
              <p className="text-sm leading-relaxed font-medium">
                Order <strong className="text-white">#{selectedException.id}</strong> is currently{' '}
                <strong className="text-orange-400">{selectedException.status.replace(/_/g, ' ')}</strong>
                {selectedException.riderName ? ` (with ${selectedException.riderName})` : ' (no rider)'}.
                <br /><br />
                {actionType === 'settle' ? (
                  <span>
                    This will mark the order as <strong className="text-purple-300">SETTLED</strong> permanently. It will be cleared from the Rider app and POS queues immediately.
                  </span>
                ) : (
                  <span>
                    Resetting to <strong className="text-green-400">READY</strong> will return this order to the available pool for riders to claim.
                  </span>
                )}
              </p>
            </div>

            <form onSubmit={handleAction}>
              <div className="mb-6">
                <label className="block text-stitch-muted text-sm font-bold mb-2">
                  Reason for Action (Required)
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={actionType === 'settle' ? 'e.g., Stale order from previous day, already completed/cleared.' : 'e.g., Order was dispatched without rider assignment.'}
                  className="w-full bg-stitch-surface border border-stitch-border rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none h-24"
                  required
                  disabled={recovering}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setSelectedException(null); setReason(''); }}
                  disabled={recovering}
                  className="flex-1 bg-stitch-surface hover:bg-stitch-surface/80 text-white font-bold py-3 rounded-xl transition-colors border border-stitch-border disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recovering || !reason.trim()}
                  className={`flex-1 font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 text-white ${
                    actionType === 'settle' 
                      ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25'
                      : 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
                  }`}
                >
                  {recovering ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : actionType === 'settle' ? (
                    <RefreshCw size={18} />
                  ) : (
                    <RotateCcw size={18} />
                  )}
                  {recovering ? 'Processing...' : actionType === 'settle' ? 'Confirm Settle' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
