import React, { useState, useEffect } from 'react';
import { ChefHat, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';

const BACKEND_URL = 'http://' + (typeof window !== 'undefined' ? window.location.hostname : 'localhost') + ':3001';

export default function RecipeManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [recipeRows, setRecipeRows] = useState<any[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load Menu Products
    const loadProducts = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/catalog/products?store_id=1`);
        if (res.ok) setProducts(await res.json());
      } catch (e) {
        console.error('Failed to load products', e);
      }
    };
    
    // Load Inventory Items
    const loadInventory = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/inventory/items/1`);
        if (res.ok) setInventory(await res.json());
      } catch (e) {
        console.error('Failed to load inventory', e);
      }
    };

    loadProducts();
    loadInventory();
  }, []);

  // When a product is selected, fetch its existing recipe
  useEffect(() => {
    if (!selectedProductId) {
      setRecipeRows([]);
      return;
    }
    const loadRecipe = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/recipes/product/${selectedProductId}`);
        if (res.ok) {
          const data = await res.json();
          // Map to local state
          const formatted = data.map((r: any) => ({
            id: Math.random().toString(), // unique row id for UI
            inventory_id: r.inventory_id,
            quantity: r.quantity,
            unit: r.unit,
            price: r.inventory?.unit_price || 0,
            total: (r.inventory?.unit_price || 0) * r.quantity
          }));
          setRecipeRows(formatted.length > 0 ? formatted : [{ id: Math.random().toString(), inventory_id: 0, quantity: 0, unit: '', price: 0, total: 0 }]);
        }
      } catch (e) {
        console.error('Failed to load recipe', e);
      }
    };
    loadRecipe();
  }, [selectedProductId]);

  const addRow = () => {
    setRecipeRows([...recipeRows, { id: Math.random().toString(), inventory_id: 0, quantity: 0, unit: '', price: 0, total: 0 }]);
  };

  const removeRow = (id: string) => {
    setRecipeRows(recipeRows.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: string, value: any) => {
    setRecipeRows(recipeRows.map(row => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value };
        
        // If inventory item changes, fetch its unit and price
        if (field === 'inventory_id') {
          const invItem = inventory.find(i => i.id === parseInt(value));
          if (invItem) {
            newRow.unit = invItem.unit;
            newRow.price = invItem.unit_price || 0;
          } else {
            newRow.unit = '';
            newRow.price = 0;
          }
        }
        
        // Recalculate total
        if (field === 'quantity' || field === 'inventory_id') {
          newRow.total = parseFloat((newRow.quantity * newRow.price).toFixed(2));
        }
        
        return newRow;
      }
      return row;
    }));
  };

  const handleSaveRecipe = async () => {
    if (!selectedProductId) return alert('Please select a product first.');
    
    // Filter out incomplete rows
    const validRows = recipeRows.filter(r => r.inventory_id > 0 && r.quantity > 0);
    
    setIsSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/recipes/bulk/${selectedProductId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: validRows })
      });
      if (res.ok) {
        const result = await res.json();
        alert(`Recipe Saved Successfully!\nNew Total Cost: Rs. ${result.totalCost?.toFixed(2) || grandTotal.toFixed(2)}`);
      }
    } catch (e) {
      console.error('Failed to save recipe', e);
    }
    setIsSaving(false);
  };

  const grandTotal = recipeRows.reduce((sum, row) => sum + (row.total || 0), 0);
  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-160px)] gap-6">
      
      {/* Top Bar - Product Selection */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-wrap gap-6 items-center justify-between shadow-lg">
        <div className="flex-1 min-w-[300px]">
          <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Select Menu Product for Costing</label>
          <select 
            className="w-full bg-slate-900 border-2 border-slate-700 rounded-lg p-3 text-white text-lg font-bold focus:outline-none focus:border-[#fbbf24] transition-colors"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(parseInt(e.target.value))}
          >
            <option value={0}>-- Select a Product --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} (Rs. {p.price})</option>
            ))}
          </select>
        </div>
        
        {selectedProduct && (
          <div className="flex gap-8 items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Selling Price</p>
              <p className="text-xl font-mono text-white">Rs. {selectedProduct.price}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Total Cost</p>
              <p className="text-xl font-mono text-[#fbbf24]">Rs. {grandTotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Profit Margin</p>
              <p className={`text-xl font-mono font-bold ${selectedProduct.price - grandTotal > 0 ? 'text-[#4edea3]' : 'text-red-400'}`}>
                {selectedProduct.price > 0 ? (((selectedProduct.price - grandTotal) / selectedProduct.price) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid Interface */}
      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden relative shadow-lg">
        
        {!selectedProductId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <ChefHat size={64} className="mb-4 opacity-30" />
            <h3 className="text-xl font-bold mb-2">No Product Selected</h3>
            <p>Select a product from the dropdown above to build its recipe.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="p-4 w-1/3">Raw Material (Item)</th>
                    <th className="p-4 w-1/6">Qty Needed</th>
                    <th className="p-4 w-1/6">Unit</th>
                    <th className="p-4 w-1/6">Unit Price</th>
                    <th className="p-4 w-1/6">Total Cost</th>
                    <th className="p-4 w-16 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {recipeRows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="p-3">
                        <select 
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-[#fbbf24]"
                          value={row.inventory_id}
                          onChange={(e) => updateRow(row.id, 'inventory_id', e.target.value)}
                        >
                          <option value={0}>Select Item...</option>
                          {inventory.map(inv => (
                            <option key={inv.id} value={inv.id}>{inv.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono focus:outline-none focus:border-[#fbbf24]"
                          value={row.quantity || ''}
                          onChange={(e) => updateRow(row.id, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="p-3 text-slate-400 font-mono">{row.unit || '-'}</td>
                      <td className="p-3 text-slate-400 font-mono">Rs. {row.price.toFixed(2)}</td>
                      <td className="p-3 font-mono font-bold text-[#fbbf24]">Rs. {row.total.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => removeRow(row.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Action Footer */}
            <div className="bg-slate-900/50 border-t border-slate-700 p-4 flex justify-between items-center">
              <button 
                onClick={addRow}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
              >
                <Plus size={18} /> Add Row
              </button>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Recipe Total Cost</p>
                  <p className="text-2xl font-black text-[#fbbf24]">Rs. {grandTotal.toFixed(2)}</p>
                </div>
                <button 
                  onClick={handleSaveRecipe}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-[#fbbf24] hover:bg-yellow-500 text-slate-900 px-8 py-3 rounded-lg font-black transition-all disabled:opacity-50"
                >
                  {isSaving ? <span className="animate-pulse">Saving...</span> : <><CheckCircle2 size={20} /> Save Recipe</>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
