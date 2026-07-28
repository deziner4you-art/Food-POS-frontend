import React, { useState, useEffect } from 'react';
import { Search, ImageOff, Clock, CheckCircle2, XCircle, RotateCcw, Send } from 'lucide-react';
import { customAlert, customSuccess, customConfirm } from '../utils/alerts';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

const STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RECIPE_REVIEW', 'COSTING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED'];
const REVIEW_STAGES = ['UNDER_REVIEW', 'RECIPE_REVIEW', 'COSTING_REVIEW'];
const REVIEWABLE = ['SUBMITTED', 'UNDER_REVIEW', 'RECIPE_REVIEW', 'COSTING_REVIEW'];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-400',
  SUBMITTED: 'bg-blue-500/20 text-blue-400',
  UNDER_REVIEW: 'bg-amber-500/20 text-amber-400',
  RECIPE_REVIEW: 'bg-amber-500/20 text-amber-400',
  COSTING_REVIEW: 'bg-amber-500/20 text-amber-400',
  APPROVED: 'bg-emerald-500/20 text-emerald-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  PUBLISHED: 'bg-[#3b82f6]/20 text-[#3b82f6]',
};

export default function ProductRequestsTab({ stores }: { stores: any[] }) {
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('d4u_admin_token')}`,
  });
  const getAuthHeaderOnly = () => ({ 'Authorization': `Bearer ${localStorage.getItem('d4u_admin_token')}` });
  const currentUserId: number = (() => {
    try { return JSON.parse(localStorage.getItem('d4u_admin_user') || 'null')?.id || 0; } catch { return 0; }
  })();

  const [requests, setRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const [comments, setComments] = useState('');
  const [reviewStage, setReviewStage] = useState(REVIEW_STAGES[0]);
  const [approveMode, setApproveMode] = useState<'CURRENT' | 'SELECTED' | 'ALL'>('CURRENT');
  const [approveStoreIds, setApproveStoreIds] = useState<number[]>([]);

  const fetchRequests = async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (branchFilter) params.set('store_id', String(branchFilter));
    if (search.trim()) params.set('search', search.trim());
    try {
      const res = await fetch(`${BACKEND_URL}/product-requests?${params.toString()}`, { headers: getAuthHeaderOnly() });
      if (res.ok) setRequests(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchRequests(); }, [statusFilter, branchFilter]);

  const openDetail = async (id: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/product-requests/${id}`, { headers: getAuthHeaderOnly() });
      if (res.ok) {
        const data = await res.json();
        setSelected(data);
        setComments('');
        setApproveMode('CURRENT');
        setApproveStoreIds(data.store_id ? [data.store_id] : []);
      }
    } catch (e) { console.error(e); }
  };

  const branchName = (storeId: number) => stores.find(s => s.id === storeId)?.name || `Store #${storeId}`;

  const runAction = async (path: string, body: any, successMsg: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/product-requests/${selected.id}${path}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        customSuccess(successMsg);
        setSelected(null);
        fetchRequests();
      } else {
        customAlert(data.message || 'Action failed.');
      }
    } catch (e) { customAlert('Action failed.'); }
  };

  const handleMoveStage = () => runAction('/review', { status: reviewStage, reviewed_by: currentUserId, comments }, 'Moved to next review stage.');

  const handleApprove = () => {
    const target_store_ids =
      approveMode === 'ALL' ? stores.map(s => s.id) :
      approveMode === 'CURRENT' ? [selected.store_id] :
      approveStoreIds;
    if (target_store_ids.length === 0) return customAlert('Select at least one branch to approve for.');
    runAction('/approve', { approved_by: currentUserId, target_store_ids, comments }, 'Request approved — Menu Product created!');
  };

  const handleReject = () => {
    if (!comments.trim()) return customAlert('A comment is required to reject a request.');
    runAction('/reject', { rejected_by: currentUserId, comments }, 'Request rejected.');
  };

  const handleReturn = () => {
    if (!comments.trim()) return customAlert('A comment is required to return a request for revision.');
    runAction('/return', { returned_by: currentUserId, comments }, 'Returned to branch for revision.');
  };

  const handlePublish = () => {
    const target_store_ids = approveMode === 'ALL' ? stores.map(s => s.id) : approveStoreIds;
    if (target_store_ids.length === 0) return customAlert('Select at least one branch to publish to.');
    runAction('/publish', { published_by: currentUserId, target_store_ids }, 'Published to additional branches.');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700 flex flex-wrap gap-3 items-center bg-slate-900/50">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchRequests()}
            placeholder="Search product name..."
            className="w-full bg-slate-800 text-white text-sm rounded-lg pl-9 pr-3 py-2 border border-slate-700 outline-none focus:border-[#3b82f6]"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 outline-none">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} className="bg-slate-800 text-white">{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={branchFilter} onChange={e => setBranchFilter(Number(e.target.value))} className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 outline-none">
          <option value={0}>All Branches</option>
          {stores.map(s => <option key={s.id} value={s.id} className="bg-slate-800 text-white">{s.name}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-900">
            <tr className="border-b border-slate-700">
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">Product</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">Branch</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">Suggested Price</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-500 italic">No product requests found.</td></tr>
            )}
            {requests.map(r => (
              <tr key={r.id} onClick={() => openDetail(r.id)} className="border-b border-slate-800 hover:bg-slate-700/40 cursor-pointer">
                <td className="p-3 font-bold text-white flex items-center gap-3">
                  {r.thumbnail_url || r.image_url ? (
                    <img src={`${BACKEND_URL}${r.thumbnail_url || r.image_url}`} alt={r.name} className="w-9 h-9 rounded object-cover border border-slate-600" />
                  ) : (
                    <div className="w-9 h-9 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500"><ImageOff size={14} /></div>
                  )}
                  {r.name}
                </td>
                <td className="p-3 text-slate-300 text-sm">{branchName(r.store_id)}</td>
                <td className="p-3 font-mono text-[#4edea3]">Rs. {r.suggested_price}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-[11px] font-bold ${STATUS_COLORS[r.status] || 'bg-slate-500/20 text-slate-400'}`}>{r.status.replace(/_/g, ' ')}</span></td>
                <td className="p-3 text-slate-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-slate-700 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-white">{selected.name}</h3>
                <p className="text-sm text-slate-400">{branchName(selected.store_id)} • Requested by user #{selected.requested_by}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[selected.status]}`}>{selected.status.replace(/_/g, ' ')}</span>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="flex gap-4 items-start">
                {(selected.thumbnail_url || selected.image_url) ? (
                  <img src={`${BACKEND_URL}${selected.thumbnail_url || selected.image_url}`} alt={selected.name} className="w-24 h-24 rounded-lg object-cover border border-slate-700" />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500"><ImageOff size={24} /></div>
                )}
                <div className="grid grid-cols-2 gap-3 flex-1 text-sm">
                  <div><span className="text-slate-500">Suggested Price:</span> <span className="text-[#4edea3] font-bold">Rs. {selected.suggested_price}</span></div>
                  <div><span className="text-slate-500">SKU:</span> <span className="text-white">{selected.sku || 'N/A'}</span></div>
                  <div><span className="text-slate-500">Kitchen Station:</span> <span className="text-white">{selected.kitchen_station || 'N/A'}</span></div>
                  <div><span className="text-slate-500">Category ID:</span> <span className="text-white">{selected.category_id || 'N/A'}</span></div>
                </div>
              </div>

              {selected.description && <p className="text-sm text-slate-300"><span className="text-slate-500">Description:</span> {selected.description}</p>}
              {selected.recipe_notes && <p className="text-sm text-slate-300"><span className="text-slate-500">Recipe Notes:</span> {selected.recipe_notes}</p>}
              {selected.hq_comments && <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3"><span className="font-bold">HQ Comments:</span> {selected.hq_comments}</p>}

              {/* Audit Trail */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Audit Trail</h4>
                <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                  {(selected.auditLog || []).map((log: any) => (
                    <div key={log.id} className="text-xs text-slate-400 flex justify-between gap-2 border-b border-slate-800 pb-1">
                      <span><span className="font-bold text-slate-300">{log.action.replace(/_/g, ' ')}</span>{log.comments ? ` — ${log.comments}` : ''}</span>
                      <span className="whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {REVIEWABLE.includes(selected.status) && (
                <div className="border-t border-slate-700 pt-4 flex flex-col gap-3">
                  <textarea
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    placeholder="Comments (required for Reject / Return, optional otherwise)..."
                    className="w-full bg-slate-800 text-white text-sm rounded-lg p-3 border border-slate-700 outline-none focus:border-[#3b82f6]"
                    rows={2}
                  />

                  <div className="flex gap-2 items-center">
                    <select value={reviewStage} onChange={e => setReviewStage(e.target.value)} className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 outline-none">
                      {REVIEW_STAGES.map(s => <option key={s} value={s} className="bg-slate-800 text-white">{s.replace(/_/g, ' ')}</option>)}
                    </select>
                    <button onClick={handleMoveStage} className="px-3 py-2 rounded-lg font-bold text-xs bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-1"><Clock size={14} /> Move Stage</button>
                  </div>

                  <div className="bg-slate-800/60 rounded-lg p-3 flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Approve For</span>
                    <div className="flex gap-4 text-sm text-white">
                      <label className="flex items-center gap-1.5"><input type="radio" checked={approveMode === 'CURRENT'} onChange={() => setApproveMode('CURRENT')} /> Current Branch</label>
                      <label className="flex items-center gap-1.5"><input type="radio" checked={approveMode === 'SELECTED'} onChange={() => setApproveMode('SELECTED')} /> Selected Branches</label>
                      <label className="flex items-center gap-1.5"><input type="radio" checked={approveMode === 'ALL'} onChange={() => setApproveMode('ALL')} /> Entire Company</label>
                    </div>
                    {approveMode === 'SELECTED' && (
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {stores.map(s => (
                          <label key={s.id} className="flex items-center gap-1 text-xs text-slate-300 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                            <input type="checkbox" checked={approveStoreIds.includes(s.id)} onChange={() => setApproveStoreIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])} />
                            {s.name}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleApprove} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5"><CheckCircle2 size={16} /> Approve</button>
                    <button onClick={handleReturn} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center gap-1.5"><RotateCcw size={16} /> Return</button>
                    <button onClick={handleReject} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-1.5"><XCircle size={16} /> Reject</button>
                  </div>
                </div>
              )}

              {selected.status === 'APPROVED' && (
                <div className="border-t border-slate-700 pt-4 flex flex-col gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Publish To Additional Branches</span>
                  <div className="flex gap-4 text-sm text-white">
                    <label className="flex items-center gap-1.5"><input type="radio" checked={approveMode === 'SELECTED'} onChange={() => setApproveMode('SELECTED')} /> Selected Branches</label>
                    <label className="flex items-center gap-1.5"><input type="radio" checked={approveMode === 'ALL'} onChange={() => setApproveMode('ALL')} /> Entire Company</label>
                  </div>
                  {approveMode === 'SELECTED' && (
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {stores.map(s => (
                        <label key={s.id} className="flex items-center gap-1 text-xs text-slate-300 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                          <input type="checkbox" checked={approveStoreIds.includes(s.id)} onChange={() => setApproveStoreIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])} />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  )}
                  <button onClick={handlePublish} className="py-2.5 rounded-lg font-bold text-sm bg-[#3b82f6] hover:bg-blue-600 text-white flex items-center justify-center gap-1.5"><Send size={16} /> Publish</button>
                </div>
              )}

              <button onClick={() => setSelected(null)} className="mt-2 py-2.5 rounded-lg font-bold text-sm text-slate-400 bg-slate-800 hover:bg-slate-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
