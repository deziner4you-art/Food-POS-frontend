import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Building2, ClipboardList, PackageCheck,
  Plus, Search, Filter, ChevronDown, X, Save, Check,
  AlertTriangle, TrendingUp, DollarSign, Truck, Clock,
  Eye, Edit2, Ban, FileText, BarChart2, RefreshCw,
  ArrowRight, Package
} from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import { customAlert, customSuccess, customConfirm } from '../utils/alerts';
import { apiFetch } from '../utils/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Vendor {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  address?: string;
  tax_number?: string;
  payment_terms?: string;
  credit_limit: number;
  ledger_balance: number;
  status: string;
  notes?: string;
  createdAt: string;
  _count?: { purchaseOrders: number };
}

interface POItem {
  id: number;
  inventory_id: number;
  ordered_qty: number;
  received_qty: number;
  remaining_qty: number;
  unit: string;
  unit_cost: number;
  discount: number;
  tax: number;
  line_total: number;
  inventoryItem?: { name: string; unit: string; unit_price: number };
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  status: string;
  payment_status: string;
  vendor_id: number;
  grand_total: number;
  subtotal: number;
  notes?: string;
  createdAt: string;
  vendor?: Vendor;
  items?: POItem[];
  goodsReceipts?: { id: number; receipt_number: string; receivedAt: string }[];
}

interface GRNItem {
  id: number;
  inventory_id: number;
  po_item_id: number;
  received_qty: number;
  rejected_qty: number;
  damaged_qty: number;
  unit_cost: number;
  batch_number?: string;
  expiry_date?: string;
  inventoryItem?: { name: string };
}

interface GRN {
  id: number;
  receipt_number: string;
  invoice_number?: string;
  receivedAt: string;
  notes?: string;
  po_id: number;
  purchaseOrder?: { po_number: string; vendor?: { name: string } };
  items?: GRNItem[];
}

interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
}

interface DashboardStats {
  activePOs: number;
  pendingGRNs: number;
  totalMonthlyPurchases: number;
  totalLiabilities: number;
  recentOrders: PurchaseOrder[];
}

// ─── Status Badge ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    DRAFT: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    APPROVED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    PARTIALLY_RECEIVED: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/30',
    ACTIVE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    INACTIVE: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${map[status] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string | number; color: string; sub?: string }) => (
  <div className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 flex items-start gap-4 backdrop-blur-sm hover:border-slate-600 transition-all`}>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={22} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-white text-2xl font-black mt-1">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Modal Wrapper ────────────────────────────────────────────────────────────

const Modal = ({ title, onClose, children, width = 'max-w-2xl' }: { title: string; onClose: () => void; children: React.ReactNode; width?: string }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className={`bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] flex flex-col`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800">
          <X size={20} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
    </div>
  </div>
);

// ─── Input helpers ─────────────────────────────────────────────────────────

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1 block">{children}</label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-500 transition-all ${props.className ?? ''}`} />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all ${props.className ?? ''}`} />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} rows={3} className={`w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 placeholder-slate-500 transition-all resize-none ${props.className ?? ''}`} />
);

const BtnPrimary = ({ children, onClick, disabled, type = 'button' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) => (
  <button type={type} onClick={onClick} disabled={disabled}
    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
    {children}
  </button>
);

const BtnSecondary = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button type="button" onClick={onClick}
    className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold text-sm transition-all">
    {children}
  </button>
);

// ─── TAB 1: Dashboard ────────────────────────────────────────────────────────

function PurchaseDashboard({ stats, onRefresh }: { stats: DashboardStats | null; onRefresh: () => void }) {
  if (!stats) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Active POs" value={stats.activePOs} color="bg-blue-500/20 text-blue-400" sub="Approved / In-progress" />
        <StatCard icon={Truck} label="Pending Deliveries" value={stats.pendingGRNs} color="bg-orange-500/20 text-orange-400" sub="Awaiting GRN" />
        <StatCard icon={TrendingUp} label="Monthly Purchases" value={`PKR ${(stats.totalMonthlyPurchases ?? 0).toLocaleString()}`} color="bg-emerald-500/20 text-emerald-400" sub="Current month" />
        <StatCard icon={DollarSign} label="Supplier Liabilities" value={`PKR ${(stats.totalLiabilities ?? 0).toLocaleString()}`} color="bg-red-500/20 text-red-400" sub="Outstanding payables" />
      </div>

      {/* Recent Orders */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-white font-bold">Recent Purchase Orders</h3>
          <button onClick={onRefresh} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-all">
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-slate-400 font-semibold px-6 py-3">PO Number</th>
                <th className="text-left text-slate-400 font-semibold px-6 py-3">Supplier</th>
                <th className="text-left text-slate-400 font-semibold px-6 py-3">Status</th>
                <th className="text-right text-slate-400 font-semibold px-6 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recentOrders ?? []).map(po => (
                <tr key={po.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-3 text-blue-400 font-mono font-semibold">{po.po_number || `#${po.id}`}</td>
                  <td className="px-6 py-3 text-white">{po.vendor?.name || '—'}</td>
                  <td className="px-6 py-3"><StatusBadge status={po.status} /></td>
                  <td className="px-6 py-3 text-right text-white font-semibold">PKR {(po.grand_total || 0).toLocaleString()}</td>
                </tr>
              ))}
              {(stats.recentOrders ?? []).length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No purchase orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: Supplier Manager ─────────────────────────────────────────────────

function SupplierManager({ storeId }: { storeId: number }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [ledger, setLedger] = useState<{ vendor: Vendor; entries: any[]; balance: number } | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', contact_person: '', address: '', tax_number: '', payment_terms: 'NET_30', credit_limit: 0, notes: '' });

  const fetch$ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/vendor?store_id=${storeId}`);
      if (res.ok) setVendors(await res.json());
    } finally { setLoading(false); }
  }, [storeId]);

  useEffect(() => { fetch$(); }, [fetch$]);

  const openCreate = () => { setEditVendor(null); setForm({ name: '', phone: '', email: '', contact_person: '', address: '', tax_number: '', payment_terms: 'NET_30', credit_limit: 0, notes: '' }); setShowModal(true); };
  const openEdit = (v: Vendor) => { setEditVendor(v); setForm({ name: v.name, phone: v.phone || '', email: v.email || '', contact_person: v.contact_person || '', address: v.address || '', tax_number: v.tax_number || '', payment_terms: v.payment_terms || 'NET_30', credit_limit: v.credit_limit, notes: v.notes || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return customAlert('Supplier name is required');
    const method = editVendor ? 'PATCH' : 'POST';
    const res = await apiFetch(editVendor ? `/vendor/${editVendor.id}` : `/vendor`, { method, body: JSON.stringify({ ...form, store_id: storeId }) });
    if (res.ok) { customSuccess(editVendor ? 'Supplier updated' : 'Supplier created'); setShowModal(false); fetch$(); }
    else customAlert('Failed to save supplier');
  };

  const handleDelete = async (v: Vendor) => {
    if (!await customConfirm(`Deactivate ${v.name}?`)) return;
    const res = await apiFetch(`/vendor/${v.id}`, { method: 'DELETE' });
    if (res.ok) { customSuccess('Supplier deactivated'); fetch$(); }
  };

  const openLedger = async (v: Vendor) => {
    const res = await apiFetch(`/vendor/${v.id}/ledger`);
    if (res.ok) setLedger(await res.json());
  };

  const filtered = vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase()) || (v.email || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <BtnPrimary onClick={openCreate}><Plus size={16} />Add Supplier</BtnPrimary>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Supplier', 'Contact', 'Payment Terms', 'Credit Limit', 'Balance', 'Orders', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-slate-400 font-semibold px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500"><RefreshCw size={16} className="animate-spin inline" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No suppliers found</td></tr>
              ) : filtered.map(v => (
                <tr key={v.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white font-semibold">{v.name}</p>
                    <p className="text-slate-500 text-xs">{v.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-300">{v.contact_person || '—'}</p>
                    <p className="text-slate-500 text-xs">{v.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{v.payment_terms || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">PKR {v.credit_limit.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={v.ledger_balance < 0 ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                      PKR {Math.abs(v.ledger_balance).toLocaleString()}
                      {v.ledger_balance < 0 && ' (owed)'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{v._count?.purchaseOrders ?? 0}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openLedger(v)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="View Ledger"><FileText size={15} /></button>
                      <button onClick={() => openEdit(v)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="Edit"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(v)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Deactivate"><Ban size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Form Modal */}
      {showModal && (
        <Modal title={editVendor ? 'Edit Supplier' : 'New Supplier'} onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Supplier Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Company name" /></div>
            <div><Label>Contact Person</Label><Input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} placeholder="Person name" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+92 300..." /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="supplier@email.com" /></div>
            <div><Label>Tax Number (NTN)</Label><Input value={form.tax_number} onChange={e => setForm({ ...form, tax_number: e.target.value })} placeholder="1234567-8" /></div>
            <div><Label>Payment Terms</Label>
              <Select value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })}>
                <option value="CASH">Cash on Delivery</option>
                <option value="NET_7">Net 7 Days</option>
                <option value="NET_15">Net 15 Days</option>
                <option value="NET_30">Net 30 Days</option>
                <option value="NET_60">Net 60 Days</option>
              </Select>
            </div>
            <div><Label>Credit Limit (PKR)</Label><Input type="number" value={form.credit_limit} onChange={e => setForm({ ...form, credit_limit: Number(e.target.value) })} /></div>
            <div className="col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address" /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes..." /></div>
          </div>
          <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-700">
            <BtnSecondary onClick={() => setShowModal(false)}>Cancel</BtnSecondary>
            <BtnPrimary onClick={handleSave}><Save size={16} />{editVendor ? 'Update' : 'Create'} Supplier</BtnPrimary>
          </div>
        </Modal>
      )}

      {/* Ledger Drawer */}
      {ledger && (
        <Modal title={`Ledger — ${ledger.vendor.name}`} onClose={() => setLedger(null)} width="max-w-3xl">
          <div className="mb-4 flex items-center justify-between bg-slate-800 rounded-xl p-4">
            <div>
              <p className="text-slate-400 text-xs">Current Balance</p>
              <p className={`text-2xl font-black ${ledger.balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                PKR {Math.abs(ledger.balance).toLocaleString()} {ledger.balance < 0 ? '(Owed to Supplier)' : '(Credit)'}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="text-left text-slate-400 font-semibold px-4 py-2">Date</th>
                  <th className="text-left text-slate-400 font-semibold px-4 py-2">Type</th>
                  <th className="text-left text-slate-400 font-semibold px-4 py-2">Reference</th>
                  <th className="text-right text-slate-400 font-semibold px-4 py-2">Amount</th>
                  <th className="text-right text-slate-400 font-semibold px-4 py-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.entries.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No transactions yet</td></tr>
                ) : ledger.entries.map((e: any) => (
                  <tr key={e.id} className="border-b border-slate-700/30 hover:bg-slate-700/10">
                    <td className="px-4 py-2 text-slate-400">{new Date(e.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2"><StatusBadge status={e.type} /></td>
                    <td className="px-4 py-2 text-slate-300 font-mono text-xs">{e.reference || '—'}</td>
                    <td className="px-4 py-2 text-right text-white font-semibold">PKR {e.amount.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-slate-300">PKR {e.balance_after.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TAB 3: Purchase Orders ───────────────────────────────────────────────────

function PurchaseOrdersTab({ storeId, userId }: { storeId: number; userId: number }) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);

  // PO Create Form
  const [poForm, setPOForm] = useState({ vendor_id: 0, notes: '' });
  const [poItems, setPOItems] = useState<{ inventory_id: number; ordered_qty: number; unit: string; unit_cost: number; discount: number; tax: number }[]>([]);

  const fetch$ = useCallback(async () => {
    setLoading(true);
    try {
      const [ordRes, venRes, invRes] = await Promise.all([
        apiFetch(`/vendor/purchase-orders/list?store_id=${storeId}${filterStatus ? `&status=${filterStatus}` : ''}`),
        apiFetch(`/vendor?store_id=${storeId}`),
        apiFetch(`/inventory/items/${storeId}`),
      ]);
      if (ordRes.ok) setOrders(await ordRes.json());
      if (venRes.ok) setVendors(await venRes.json());
      if (invRes.ok) setInventory(await invRes.json());
    } finally { setLoading(false); }
  }, [storeId, filterStatus]);

  useEffect(() => { fetch$(); }, [fetch$]);

  const addPOLine = () => setPOItems([...poItems, { inventory_id: 0, ordered_qty: 1, unit: 'pcs', unit_cost: 0, discount: 0, tax: 0 }]);
  const removePOLine = (i: number) => setPOItems(poItems.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: string, value: any) => setPOItems(poItems.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const poSubtotal = poItems.reduce((s, i) => s + i.ordered_qty * i.unit_cost * (1 - i.discount / 100) * (1 + i.tax / 100), 0);

  const handleCreatePO = async () => {
    if (!poForm.vendor_id) return customAlert('Please select a supplier');
    if (poItems.length === 0) return customAlert('Add at least one item');
    if (poItems.some(i => !i.inventory_id || i.unit_cost <= 0)) return customAlert('All items need an inventory item and unit cost');

    const res = await apiFetch(`/vendor/purchase-orders`, {
      method: 'POST',
      body: JSON.stringify({ store_id: storeId, vendor_id: Number(poForm.vendor_id), created_by: userId, notes: poForm.notes, items: poItems.map(i => ({ ...i, inventory_id: Number(i.inventory_id) })) }),
    });
    if (res.ok) { customSuccess('Purchase Order created'); setShowCreate(false); setPOItems([]); setPOForm({ vendor_id: 0, notes: '' }); fetch$(); }
    else { const err = await res.json(); customAlert(err.message || 'Failed to create PO'); }
  };

  const handleAction = async (po: PurchaseOrder, action: 'submit' | 'approve' | 'cancel') => {
    const labels = { submit: 'Submit', approve: 'Approve', cancel: 'Cancel' };
    if (!await customConfirm(`${labels[action]} PO ${po.po_number}?`)) return;
    const url = `/vendor/purchase-orders/${po.id}/${action}`;
    const body = action === 'approve' ? JSON.stringify({ approved_by: userId }) : undefined;
    const res = await apiFetch(url, { method: 'PATCH', body });
    if (res.ok) { customSuccess(`PO ${labels[action]}d`); fetch$(); setViewPO(null); }
    else { const err = await res.json(); customAlert(err.message || 'Action failed'); }
  };

  const filtered = orders.filter(o =>
    (!search || (o.po_number || '').toLowerCase().includes(search.toLowerCase()) || (o.vendor?.name || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search PO or supplier..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-44">
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PARTIALLY_RECEIVED">Partial</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <BtnPrimary onClick={() => setShowCreate(true)}><Plus size={16} />New PO</BtnPrimary>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['PO Number', 'Supplier', 'Date', 'Status', 'Items', 'Total', ''].map(h => (
                  <th key={h} className="text-left text-slate-400 font-semibold px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center"><RefreshCw size={16} className="animate-spin inline text-slate-400" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No purchase orders found</td></tr>
              ) : filtered.map(po => (
                <tr key={po.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-blue-400 font-mono font-bold">{po.po_number || `PO-${po.id}`}</td>
                  <td className="px-4 py-3 text-white font-medium">{po.vendor?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(po.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
                  <td className="px-4 py-3 text-slate-300">{po.items?.length ?? 0} items</td>
                  <td className="px-4 py-3 text-white font-semibold">PKR {(po.grand_total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewPO(po)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="View"><Eye size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {showCreate && (
        <Modal title="Create Purchase Order" onClose={() => { setShowCreate(false); setPOItems([]); }} width="max-w-4xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Supplier *</Label>
                <Select value={poForm.vendor_id} onChange={e => setPOForm({ ...poForm, vendor_id: Number(e.target.value) })}>
                  <option value={0}>Select supplier...</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </Select>
              </div>
              <div><Label>Notes</Label><Input value={poForm.notes} onChange={e => setPOForm({ ...poForm, notes: e.target.value })} placeholder="Optional notes..." /></div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Order Items</Label>
                <button onClick={addPOLine} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-semibold transition-colors">
                  <Plus size={14} />Add Item
                </button>
              </div>
              <div className="rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-800/80 border-b border-slate-700">
                      <th className="text-left text-slate-400 font-semibold px-3 py-2">Inventory Item</th>
                      <th className="text-left text-slate-400 font-semibold px-3 py-2 w-24">Qty</th>
                      <th className="text-left text-slate-400 font-semibold px-3 py-2 w-20">Unit</th>
                      <th className="text-left text-slate-400 font-semibold px-3 py-2 w-28">Unit Cost</th>
                      <th className="text-left text-slate-400 font-semibold px-3 py-2 w-20">Disc%</th>
                      <th className="text-left text-slate-400 font-semibold px-3 py-2 w-20">Tax%</th>
                      <th className="text-right text-slate-400 font-semibold px-3 py-2 w-28">Total</th>
                      <th className="px-2 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {poItems.map((line, i) => {
                      const lineTotal = line.ordered_qty * line.unit_cost * (1 - line.discount / 100) * (1 + line.tax / 100);
                      return (
                        <tr key={i} className="border-b border-slate-700/30">
                          <td className="px-2 py-1.5">
                            <select value={line.inventory_id} onChange={e => {
                              const inv = inventory.find(it => it.id === Number(e.target.value));
                              updateLine(i, 'inventory_id', Number(e.target.value));
                              if (inv) { updateLine(i, 'unit', inv.unit); updateLine(i, 'unit_cost', inv.unit_price); }
                            }} className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500">
                              <option value={0}>Select item...</option>
                              {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5"><input type="number" value={line.ordered_qty} onChange={e => updateLine(i, 'ordered_qty', Number(e.target.value))} className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500" min={0.01} step={0.01} /></td>
                          <td className="px-2 py-1.5"><input value={line.unit} onChange={e => updateLine(i, 'unit', e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500" /></td>
                          <td className="px-2 py-1.5"><input type="number" value={line.unit_cost} onChange={e => updateLine(i, 'unit_cost', Number(e.target.value))} className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500" min={0} /></td>
                          <td className="px-2 py-1.5"><input type="number" value={line.discount} onChange={e => updateLine(i, 'discount', Number(e.target.value))} className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500" min={0} max={100} /></td>
                          <td className="px-2 py-1.5"><input type="number" value={line.tax} onChange={e => updateLine(i, 'tax', Number(e.target.value))} className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500" min={0} /></td>
                          <td className="px-2 py-1.5 text-right text-white font-semibold">PKR {lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                          <td className="px-2 py-1.5"><button onClick={() => removePOLine(i)} className="text-red-400 hover:text-red-300 p-0.5"><X size={14} /></button></td>
                        </tr>
                      );
                    })}
                    {poItems.length === 0 && <tr><td colSpan={8} className="px-3 py-4 text-center text-slate-500">Click "+ Add Item" to begin</td></tr>}
                  </tbody>
                </table>
              </div>
              {poItems.length > 0 && (
                <div className="flex justify-end mt-2 text-white font-bold text-sm">
                  Grand Total: <span className="ml-2 text-blue-400">PKR {poSubtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-700">
            <BtnSecondary onClick={() => { setShowCreate(false); setPOItems([]); }}>Cancel</BtnSecondary>
            <BtnPrimary onClick={handleCreatePO}><Save size={16} />Create PO</BtnPrimary>
          </div>
        </Modal>
      )}

      {/* View PO Modal */}
      {viewPO && (
        <Modal title={`Purchase Order — ${viewPO.po_number || `#${viewPO.id}`}`} onClose={() => setViewPO(null)} width="max-w-3xl">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800 rounded-xl p-3"><p className="text-slate-400 text-xs">Supplier</p><p className="text-white font-semibold">{viewPO.vendor?.name || '—'}</p></div>
              <div className="bg-slate-800 rounded-xl p-3"><p className="text-slate-400 text-xs">Status</p><StatusBadge status={viewPO.status} /></div>
              <div className="bg-slate-800 rounded-xl p-3"><p className="text-slate-400 text-xs">Grand Total</p><p className="text-white font-bold">PKR {(viewPO.grand_total || 0).toLocaleString()}</p></div>
            </div>
            <div className="rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-800/80 border-b border-slate-700"><th className="text-left text-slate-400 font-semibold px-4 py-2">Item</th><th className="text-right text-slate-400 font-semibold px-4 py-2">Ordered</th><th className="text-right text-slate-400 font-semibold px-4 py-2">Received</th><th className="text-right text-slate-400 font-semibold px-4 py-2">Remaining</th><th className="text-right text-slate-400 font-semibold px-4 py-2">Cost</th><th className="text-right text-slate-400 font-semibold px-4 py-2">Total</th></tr></thead>
                <tbody>
                  {(viewPO.items || []).map(item => (
                    <tr key={item.id} className="border-b border-slate-700/30">
                      <td className="px-4 py-2 text-white">{item.inventoryItem?.name || `#${item.inventory_id}`}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{item.ordered_qty} {item.unit}</td>
                      <td className="px-4 py-2 text-right text-emerald-400">{item.received_qty} {item.unit}</td>
                      <td className="px-4 py-2 text-right text-orange-400">{item.remaining_qty} {item.unit}</td>
                      <td className="px-4 py-2 text-right text-slate-300">PKR {item.unit_cost}</td>
                      <td className="px-4 py-2 text-right text-white font-semibold">PKR {item.line_total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {viewPO.notes && <div className="bg-slate-800/50 rounded-xl p-3 text-slate-400 text-sm">{viewPO.notes}</div>}
            <div className="flex gap-2 flex-wrap pt-2">
              {viewPO.status === 'DRAFT' && <BtnPrimary onClick={() => handleAction(viewPO, 'submit')}><ArrowRight size={16} />Submit for Approval</BtnPrimary>}
              {viewPO.status === 'PENDING' && <BtnPrimary onClick={() => handleAction(viewPO, 'approve')}><Check size={16} />Approve PO</BtnPrimary>}
              {!['COMPLETED', 'CANCELLED'].includes(viewPO.status) && <button onClick={() => handleAction(viewPO, 'cancel')} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold text-sm transition-all"><Ban size={16} />Cancel</button>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TAB 4: Goods Receiving (GRN) ────────────────────────────────────────────

function GRNTab({ storeId, userId }: { storeId: number; userId: number }) {
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [approvablePOs, setApprovablePOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [viewGRN, setViewGRN] = useState<GRN | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // GRN Form
  const [grnForm, setGRNForm] = useState({ po_id: 0, invoice_number: '', notes: '' });
  const [grnLines, setGRNLines] = useState<{
    po_item_id: number; inventory_id: number; received_qty: number; rejected_qty: number;
    damaged_qty: number; unit_cost: number; batch_number: string; expiry_date: string;
    max_qty: number; item_name: string; unit: string; wac_preview: number;
  }[]>([]);

  const fetch$ = useCallback(async () => {
    setLoading(true);
    try {
      const [grnRes, poRes] = await Promise.all([
        apiFetch(`/vendor/grn/list?store_id=${storeId}`),
        apiFetch(`/vendor/purchase-orders/list?store_id=${storeId}&status=APPROVED`),
      ]);
      if (grnRes.ok) setGRNs(await grnRes.json());
      if (poRes.ok) {
        const pos = await poRes.json();
        const poRes2 = await apiFetch(`/vendor/purchase-orders/list?store_id=${storeId}&status=PARTIALLY_RECEIVED`);
        const pos2 = poRes2.ok ? await poRes2.json() : [];
        setApprovablePOs([...pos, ...pos2]);
      }
    } finally { setLoading(false); }
  }, [storeId]);

  useEffect(() => { fetch$(); }, [fetch$]);

  const loadPO = async (poId: number) => {
    if (!poId) { setSelectedPO(null); setGRNLines([]); return; }
    const res = await apiFetch(`/vendor/purchase-orders/${poId}`);
    if (!res.ok) return;
    const po: PurchaseOrder = await res.json();
    setSelectedPO(po);
    setGRNLines((po.items || []).filter(i => i.remaining_qty > 0).map(i => ({
      po_item_id: i.id,
      inventory_id: i.inventory_id,
      received_qty: i.remaining_qty,
      rejected_qty: 0,
      damaged_qty: 0,
      unit_cost: i.unit_cost,
      batch_number: '',
      expiry_date: '',
      max_qty: i.remaining_qty,
      item_name: i.inventoryItem?.name || `Item #${i.inventory_id}`,
      unit: i.unit,
      wac_preview: i.inventoryItem?.unit_price || 0,
    })));
  };

  const updateGRNLine = (i: number, field: string, value: any) => {
    setGRNLines(lines => lines.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, [field]: value };
      return updated;
    }));
  };

  const handleCreateGRN = async () => {
    if (!grnForm.po_id) return customAlert('Please select a PO');
    if (grnLines.length === 0) return customAlert('No receivable items');
    if (grnLines.some(l => l.received_qty <= 0)) return customAlert('All items need received qty > 0');

    const res = await apiFetch(`/vendor/grn`, {
      method: 'POST',
      body: JSON.stringify({
        store_id: storeId,
        po_id: Number(grnForm.po_id),
        received_by: userId,
        invoice_number: grnForm.invoice_number || undefined,
        notes: grnForm.notes || undefined,
        items: grnLines.map(l => ({
          po_item_id: l.po_item_id,
          inventory_id: l.inventory_id,
          received_qty: l.received_qty,
          rejected_qty: l.rejected_qty,
          damaged_qty: l.damaged_qty,
          unit_cost: l.unit_cost,
          batch_number: l.batch_number || undefined,
          expiry_date: l.expiry_date || undefined,
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      customSuccess(`GRN ${data.grn?.receipt_number} created! PO is now ${data.poStatus}. WAC updated.`);
      setShowCreate(false);
      setGRNForm({ po_id: 0, invoice_number: '', notes: '' });
      setGRNLines([]);
      setSelectedPO(null);
      fetch$();
    } else {
      const err = await res.json();
      customAlert(err.message || 'Failed to create GRN');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold">Goods Receiving Notes</h3>
        <BtnPrimary onClick={() => setShowCreate(true)}><Plus size={16} />New GRN</BtnPrimary>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['GRN Number', 'PO Number', 'Supplier', 'Invoice #', 'Date', 'Items', ''].map(h => (
                  <th key={h} className="text-left text-slate-400 font-semibold px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center"><RefreshCw size={16} className="animate-spin inline text-slate-400" /></td></tr>
              ) : grns.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No GRNs yet. Create one from an approved PO.</td></tr>
              ) : grns.map(grn => (
                <tr key={grn.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-emerald-400 font-mono font-bold">{grn.receipt_number}</td>
                  <td className="px-4 py-3 text-blue-400 font-mono">{grn.purchaseOrder?.po_number || `PO-${grn.po_id}`}</td>
                  <td className="px-4 py-3 text-white">{grn.purchaseOrder?.vendor?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{grn.invoice_number || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(grn.receivedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-300">{grn.items?.length ?? 0} lines</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setViewGRN(grn)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="View"><Eye size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create GRN Modal */}
      {showCreate && (
        <Modal title="Create Goods Receiving Note (GRN)" onClose={() => { setShowCreate(false); setGRNLines([]); setSelectedPO(null); }} width="max-w-5xl">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Purchase Order *</Label>
                <Select value={grnForm.po_id} onChange={e => { setGRNForm({ ...grnForm, po_id: Number(e.target.value) }); loadPO(Number(e.target.value)); }}>
                  <option value={0}>Select approved PO...</option>
                  {approvablePOs.map(po => <option key={po.id} value={po.id}>{po.po_number || `PO-${po.id}`} — {po.vendor?.name}</option>)}
                </Select>
              </div>
              <div><Label>Supplier Invoice #</Label><Input value={grnForm.invoice_number} onChange={e => setGRNForm({ ...grnForm, invoice_number: e.target.value })} placeholder="INV-12345" /></div>
              <div><Label>Notes</Label><Input value={grnForm.notes} onChange={e => setGRNForm({ ...grnForm, notes: e.target.value })} placeholder="Delivery notes..." /></div>
            </div>

            {selectedPO && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-sm text-blue-300 flex items-center gap-2">
                <Package size={15} />
                PO from <strong>{selectedPO.vendor?.name}</strong> — {grnLines.length} receivable item(s)
              </div>
            )}

            {/* GRN Line Items */}
            {grnLines.length > 0 && (
              <div className="rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-800/80 border-b border-slate-700">
                        <th className="text-left text-slate-400 font-semibold px-3 py-2">Item</th>
                        <th className="text-left text-slate-400 font-semibold px-3 py-2 w-20">Max Qty</th>
                        <th className="text-left text-slate-400 font-semibold px-3 py-2 w-24">Received ✓</th>
                        <th className="text-left text-slate-400 font-semibold px-3 py-2 w-24">Rejected ✗</th>
                        <th className="text-left text-slate-400 font-semibold px-3 py-2 w-24">Damaged !</th>
                        <th className="text-left text-slate-400 font-semibold px-3 py-2 w-28">Unit Cost</th>
                        <th className="text-left text-slate-400 font-semibold px-3 py-2 w-28">Batch #</th>
                        <th className="text-left text-slate-400 font-semibold px-3 py-2 w-32">Expiry Date</th>
                        <th className="text-right text-slate-400 font-semibold px-3 py-2 w-28">WAC Preview</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grnLines.map((line, i) => {
                        // WAC Preview calculation
                        // This is approximate without current stock; shows direction
                        const estNewWAC = line.received_qty > 0 ? line.unit_cost : line.wac_preview;
                        return (
                          <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-700/10">
                            <td className="px-3 py-2">
                              <p className="text-white font-medium">{line.item_name}</p>
                              <p className="text-slate-500">{line.unit}</p>
                            </td>
                            <td className="px-3 py-2 text-slate-400 font-mono">{line.max_qty}</td>
                            <td className="px-3 py-2">
                              <input type="number" value={line.received_qty} onChange={e => updateGRNLine(i, 'received_qty', Math.min(Number(e.target.value), line.max_qty))}
                                className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-500" min={0} max={line.max_qty} step={0.01} />
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" value={line.rejected_qty} onChange={e => updateGRNLine(i, 'rejected_qty', Number(e.target.value))}
                                className="w-full bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-red-500" min={0} step={0.01} />
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" value={line.damaged_qty} onChange={e => updateGRNLine(i, 'damaged_qty', Number(e.target.value))}
                                className="w-full bg-orange-500/10 border border-orange-500/30 text-orange-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-orange-500" min={0} step={0.01} />
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" value={line.unit_cost} onChange={e => updateGRNLine(i, 'unit_cost', Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500" min={0} step={0.01} />
                            </td>
                            <td className="px-3 py-2">
                              <input value={line.batch_number} onChange={e => updateGRNLine(i, 'batch_number', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500" placeholder="Batch#" />
                            </td>
                            <td className="px-3 py-2">
                              <input type="date" value={line.expiry_date} onChange={e => updateGRNLine(i, 'expiry_date', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500" />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className="text-yellow-400 font-mono font-semibold">PKR {estNewWAC.toFixed(2)}</span>
                              <p className="text-slate-500 text-xs">est. WAC</p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!selectedPO && (
              <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-slate-500">
                <Truck size={24} />
                <div>
                  <p className="font-semibold text-slate-400">Select an Approved Purchase Order</p>
                  <p className="text-xs">Only approved POs can be received. Line items will auto-populate.</p>
                </div>
              </div>
            )}

            {grnLines.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                <div className="flex items-start gap-2 text-emerald-300 text-sm">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">WAC will be recalculated upon saving</p>
                    <p className="text-emerald-400/70 text-xs">New WAC = (Current Stock × Current WAC + Received Qty × Unit Cost) ÷ (Current Stock + Received Qty)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-700">
            <BtnSecondary onClick={() => { setShowCreate(false); setGRNLines([]); setSelectedPO(null); }}>Cancel</BtnSecondary>
            <BtnPrimary onClick={handleCreateGRN} disabled={grnLines.length === 0}><PackageCheck size={16} />Post GRN & Update WAC</BtnPrimary>
          </div>
        </Modal>
      )}

      {/* View GRN Modal */}
      {viewGRN && (
        <Modal title={`GRN — ${viewGRN.receipt_number}`} onClose={() => setViewGRN(null)} width="max-w-3xl">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800 rounded-xl p-3"><p className="text-slate-400 text-xs">PO Number</p><p className="text-blue-400 font-mono font-bold">{viewGRN.purchaseOrder?.po_number || `PO-${viewGRN.po_id}`}</p></div>
              <div className="bg-slate-800 rounded-xl p-3"><p className="text-slate-400 text-xs">Supplier</p><p className="text-white font-semibold">{viewGRN.purchaseOrder?.vendor?.name || '—'}</p></div>
              <div className="bg-slate-800 rounded-xl p-3"><p className="text-slate-400 text-xs">Received On</p><p className="text-white">{new Date(viewGRN.receivedAt).toLocaleString()}</p></div>
            </div>
            {viewGRN.invoice_number && (
              <div className="bg-slate-800 rounded-xl p-3"><p className="text-slate-400 text-xs">Invoice Number</p><p className="text-white">{viewGRN.invoice_number}</p></div>
            )}
            <div className="rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-800/80 border-b border-slate-700"><th className="text-left text-slate-400 font-semibold px-4 py-2">Item</th><th className="text-right text-slate-400 font-semibold px-4 py-2">Received</th><th className="text-right text-slate-400 font-semibold px-4 py-2">Rejected</th><th className="text-right text-slate-400 font-semibold px-4 py-2">Damaged</th><th className="text-right text-slate-400 font-semibold px-4 py-2">Unit Cost</th><th className="text-left text-slate-400 font-semibold px-4 py-2">Batch</th></tr></thead>
                <tbody>
                  {(viewGRN.items || []).map(item => (
                    <tr key={item.id} className="border-b border-slate-700/30">
                      <td className="px-4 py-2 text-white">{item.inventoryItem?.name || `Item #${item.inventory_id}`}</td>
                      <td className="px-4 py-2 text-right text-emerald-400 font-semibold">{item.received_qty}</td>
                      <td className="px-4 py-2 text-right text-red-400">{item.rejected_qty}</td>
                      <td className="px-4 py-2 text-right text-orange-400">{item.damaged_qty}</td>
                      <td className="px-4 py-2 text-right text-white">PKR {item.unit_cost}</td>
                      <td className="px-4 py-2 text-slate-400">{item.batch_number || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {viewGRN.notes && <div className="bg-slate-800/50 rounded-xl p-3 text-slate-400 text-sm">{viewGRN.notes}</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ROOT: PurchaseManager ────────────────────────────────────────────────────

type Tab = 'dashboard' | 'suppliers' | 'purchase-orders' | 'grn';

export default function PurchaseManager() {
  const { selectedBranchId } = useAdminContext();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const userId = 1; // TODO: wire from auth context

  const fetchStats = useCallback(async () => {
    if (!selectedBranchId) return;
    try {
      const res = await apiFetch(`/vendor/dashboard?store_id=${selectedBranchId}`);
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  }, [selectedBranchId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (!selectedBranchId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
        <Building2 size={40} className="text-slate-600" />
        <p className="text-lg font-semibold">Select a branch to manage purchasing</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any; color: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2, color: 'text-blue-400' },
    { id: 'suppliers', label: 'Suppliers', icon: Building2, color: 'text-purple-400' },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ClipboardList, color: 'text-orange-400' },
    { id: 'grn', label: 'Goods Receiving', icon: PackageCheck, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/20 rounded-xl"><ShoppingCart size={28} className="text-orange-400" /></div>
            Purchase & Receiving
          </h1>
          <p className="text-slate-400 mt-1 ml-14">Supplier management · Purchase orders · Goods receiving · WAC costing</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-1 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isActive ? `bg-slate-700 ${tab.color} shadow-sm` : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && <PurchaseDashboard stats={stats} onRefresh={fetchStats} />}
        {activeTab === 'suppliers' && <SupplierManager storeId={selectedBranchId} />}
        {activeTab === 'purchase-orders' && <PurchaseOrdersTab storeId={selectedBranchId} userId={userId} />}
        {activeTab === 'grn' && <GRNTab storeId={selectedBranchId} userId={userId} />}
      </div>
    </div>
  );
}
