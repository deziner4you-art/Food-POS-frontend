import React, { useState, useEffect } from 'react';
import { PackageOpen, Plus, Save, Trash2, ShoppingCart, List } from 'lucide-react';
import { customAlert, customSuccess, customConfirm } from '../utils/alerts';
import { useAdminContext } from '../context/AdminContext';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function InventoryManager() {
  const [activeTab, setActiveTab] = useState<'MATERIALS' | 'PURCHASE'>('MATERIALS');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const { selectedBranchId } = useAdminContext();

  // Purchase Form State
  const [purchaseForm, setPurchaseForm] = useState({ inventory_id: 0, quantity: 0, total_cost: 0 });

  const fetchItems = async () => {
    if (!selectedBranchId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/inventory/items/${selectedBranchId}`);
      if (res.ok) setItems(await res.json());
    } catch (e) {
      console.error('Failed to fetch inventory', e);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedBranchId]);

  // --- Inline Grid Editing ---
  const handleInlineUpdate = async (id: number, field: string, value: any) => {
    // Optimistic UI update
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));

    if (id === 0) return; // Wait for full creation before syncing

    try {
      await fetch(`${BACKEND_URL}/inventory/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
    } catch (e) {
      console.error('Failed to update inline', e);
    }
  };

  const handleCreateNewRow = async () => {
    if (!selectedBranchId) {
      customAlert("Please select a branch first.");
      return;
    }
    const newBlankItem = { name: 'New Material', quantity: 0, unit: 'Count', reorder_level: 0, unit_price: 0 };
    try {
      const res = await fetch(`${BACKEND_URL}/inventory/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: selectedBranchId, ...newBlankItem })
      });
      if (res.ok) {
        fetchItems();
      }
    } catch (e) {
      console.error('Failed to create new item', e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await customConfirm('Are you sure you want to delete this raw material?'))) return;
    try {
      await fetch(`${BACKEND_URL}/inventory/items/${id}`, { method: 'DELETE' });
      setItems(items.filter(i => i.id !== id));
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } catch (e) {
      console.error('Delete error', e);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!(await customConfirm(`Are you sure you want to delete ${selectedItems.length} items?`))) return;
    try {
      for (const id of selectedItems) {
        await fetch(`${BACKEND_URL}/inventory/items/${id}`, { method: 'DELETE' });
      }
      setItems(items.filter(i => !selectedItems.includes(i.id)));
      setSelectedItems([]);
    } catch (e) {
      console.error('Bulk delete error', e);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map(i => i.id));
    } else {
      setSelectedItems([]);
    }
  };

  const toggleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    }
  };

  // --- Purchase Logic ---
  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseForm.inventory_id === 0) return customAlert('Please select a material');
    
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/inventory/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: 1,
          inventory_id: purchaseForm.inventory_id,
          quantity: purchaseForm.quantity,
          total_cost: purchaseForm.total_cost
        })
      });
      if (res.ok) {
        customSuccess('Stock Purchased & Average Cost Updated!');
        setPurchaseForm({ inventory_id: 0, quantity: 0, total_cost: 0 });
        fetchItems();
        setActiveTab('MATERIALS');
      }
    } catch (e) {
      console.error('Purchase error', e);
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-160px)]">
      
      {/* TABS */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('MATERIALS')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'MATERIALS' ? 'bg-[#8b5cf6] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <List size={18} /> All Raw Materials
        </button>
        <button 
          onClick={() => setActiveTab('PURCHASE')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'PURCHASE' ? 'bg-[#8b5cf6] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <ShoppingCart size={18} /> Purchase Stock
        </button>
      </div>

      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
        
        {/* TAB 1: ALL RAW MATERIALS (EXCEL GRID) */}
        {activeTab === 'MATERIALS' && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <PackageOpen className="text-[#8b5cf6]" /> Raw Materials (Inline Editing)
              </h3>
              <div className="flex items-center gap-3">
                {selectedItems.length > 0 && (
                  <button 
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-lg font-bold transition-colors"
                  >
                    <Trash2 size={18} /> Delete Selected ({selectedItems.length})
                  </button>
                )}
                <button 
                  onClick={handleCreateNewRow}
                  className="flex items-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-purple-500/20"
                >
                  <Plus size={18} /> Add New Row
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-sm text-slate-300 border-collapse">
                <thead className="bg-slate-900/50 text-slate-400 sticky top-0 z-10 shadow-md">
                  <tr>
                    <th className="p-3 border-b border-slate-700 w-10 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded bg-slate-800 border-slate-600 checked:bg-[#8b5cf6] cursor-pointer"
                        checked={items.length > 0 && selectedItems.length === items.length}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="p-3 border-b border-slate-700 w-1/4">Material Name</th>
                    <th className="p-3 border-b border-slate-700">Unit (kg/g/L/pcs)</th>
                    <th className="p-3 border-b border-slate-700">Quantity / Volume</th>
                    <th className="p-3 border-b border-slate-700">Avg Unit Price (Rs)</th>
                    <th className="p-3 border-b border-slate-700 text-center w-16">Del</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className={`border-b border-slate-700/50 hover:bg-slate-700/30 group ${selectedItems.includes(item.id) ? 'bg-slate-800' : ''}`}>
                      <td className="p-3 border-r border-slate-700/50 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded bg-slate-800 border-slate-600 checked:bg-[#8b5cf6] cursor-pointer"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => toggleSelectRow(item.id, e.target.checked)}
                        />
                      </td>
                      <td className="p-0 border-r border-slate-700/50">
                        <input 
                          type="text" 
                          value={item.name}
                          onChange={(e) => handleInlineUpdate(item.id, 'name', e.target.value)}
                          className="w-full bg-transparent p-3 text-white font-bold outline-none focus:bg-slate-700/50 focus:ring-1 focus:ring-[#8b5cf6] transition-all"
                        />
                      </td>
                      <td className="p-0 border-r border-slate-700/50">
                        <select 
                          value={item.unit || ''}
                          onChange={(e) => handleInlineUpdate(item.id, 'unit', e.target.value)}
                          className="w-full bg-transparent p-3 text-slate-300 outline-none focus:bg-slate-700/50 focus:ring-1 focus:ring-[#8b5cf6] transition-all appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-slate-800">Select...</option>
                          {['Count', 'kg', 'gram', 'ml', 'Liter', 'piece', 'box', 'bottle', 'packet', 'slice'].map(u => (
                            <option key={u} value={u} className="bg-slate-800">{u}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-0 border-r border-slate-700/50">
                        <input 
                          type="number" 
                          value={item.quantity || 0}
                          onChange={(e) => handleInlineUpdate(item.id, 'quantity', parseFloat(e.target.value))}
                          className="w-full bg-transparent p-3 text-[#4edea3] font-mono font-bold outline-none focus:bg-slate-700/50 focus:ring-1 focus:ring-[#8b5cf6] transition-all"
                        />
                      </td>
                      <td className="p-0 border-r border-slate-700/50 bg-slate-900/30">
                        <input 
                          type="number" 
                          value={item.unit_price || 0}
                          onChange={(e) => handleInlineUpdate(item.id, 'unit_price', parseFloat(e.target.value))}
                          title="Enter Manual Price or auto-calculated via Purchase Stock"
                          className="w-full bg-transparent p-3 text-[#fbbf24] font-mono font-bold outline-none focus:bg-slate-700/50 focus:ring-1 focus:ring-[#8b5cf6] transition-all"
                        />
                      </td>
                      <td className="p-0 text-center">
                        <button onClick={() => handleDelete(item.id)} className="p-3 text-slate-600 hover:text-red-400 transition-colors w-full h-full flex justify-center items-center">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">Click "Add New Row" to start adding materials.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PURCHASE STOCK */}
        {activeTab === 'PURCHASE' && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-700 bg-slate-900/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="text-[#4edea3]" /> Register Purchase & Update Cost
              </h3>
              <p className="text-sm text-slate-400 mt-2">
                Enter the total quantity bought and the total bill amount. The system will automatically calculate the per-unit average cost and update your inventory list.
              </p>
            </div>
            
            <div className="p-8 mx-auto w-full flex-1">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <form onSubmit={handlePurchaseSubmit} className="flex items-end gap-4 w-full">
                  
                  <div className="flex-[2]">
                    <label className="block text-sm font-bold text-slate-300 mb-2">Select Raw Material</label>
                    <select 
                      required
                      value={purchaseForm.inventory_id} 
                      onChange={e => setPurchaseForm({...purchaseForm, inventory_id: parseInt(e.target.value)})}
                      className="w-full h-[56px] bg-slate-800 border border-slate-600 rounded-lg px-4 text-white focus:outline-none focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3] transition-all text-lg"
                    >
                      <option value={0} disabled>Choose a material...</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-300 mb-2">Total Qty</label>
                    <input 
                      required
                      type="number" step="0.01" min="0.01"
                      placeholder="e.g. 50"
                      value={purchaseForm.quantity || ''} 
                      onChange={e => setPurchaseForm({...purchaseForm, quantity: parseFloat(e.target.value) || 0})}
                      className="w-full h-[56px] bg-slate-800 border border-slate-600 rounded-lg px-4 text-[#4edea3] font-mono text-xl font-bold focus:outline-none focus:border-[#4edea3]"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-300 mb-2">Total Bill (Rs)</label>
                    <input 
                      required
                      type="number" step="0.01" min="1"
                      placeholder="e.g. 5000"
                      value={purchaseForm.total_cost || ''} 
                      onChange={e => setPurchaseForm({...purchaseForm, total_cost: parseFloat(e.target.value) || 0})}
                      className="w-full h-[56px] bg-slate-800 border border-slate-600 rounded-lg px-4 text-[#fbbf24] font-mono text-xl font-bold focus:outline-none focus:border-[#4edea3]"
                    />
                  </div>

                  <div className="flex-[1.5] h-[56px] bg-slate-800/50 px-4 rounded-lg border border-slate-700/50 flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Unit Price:</span>
                    <span className="text-xl font-mono font-bold text-white">
                      Rs. {(purchaseForm.quantity > 0 && purchaseForm.total_cost > 0) ? (purchaseForm.total_cost / purchaseForm.quantity).toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <div className="flex-[1.5]">
                    <button 
                      disabled={loading}
                      type="submit" 
                      className="w-full h-[56px] rounded-xl font-bold text-slate-900 bg-[#4edea3] hover:bg-[#3bce8e] uppercase tracking-wide transition-all shadow-lg shadow-[#4edea3]/20 disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Confirm'}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
