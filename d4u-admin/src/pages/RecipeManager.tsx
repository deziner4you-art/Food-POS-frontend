import React, { useState, useEffect } from 'react';
import { ChefHat, Save, Plus, Trash2, CheckCircle2, Download, Upload } from 'lucide-react';
import { customAlert, customSuccess } from '../utils/alerts';

const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

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
    setRecipeRows([{ id: Math.random().toString(), inventory_id: 0, quantity: 0, unit: '', price: 0, total: 0 }, ...recipeRows]);
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
    if (!selectedProductId) return customAlert('Please select a product first.');
    
    // Filter out incomplete rows and ensure integers
    const validRows = recipeRows
      .filter(r => parseInt(r.inventory_id) > 0 && parseFloat(r.quantity) > 0)
      .map(r => ({
        inventory_id: parseInt(r.inventory_id),
        quantity: parseFloat(r.quantity),
        unit: r.unit
      }));
      
    if (validRows.length === 0 && recipeRows.length > 0) {
      return customAlert("No valid rows to save. Make sure all items have a selected material and a quantity greater than 0.");
    }
    
    setIsSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/recipes/bulk/${selectedProductId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: validRows })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save recipe');
      }
      const result = await res.json();
      customSuccess(`Recipe Saved Successfully!\nNew Total Cost: Rs. ${result.totalCost?.toFixed(2) || grandTotal.toFixed(2)}`);
    } catch (e: any) {
      console.error('Failed to save recipe', e);
      customAlert(`Error saving recipe: ${e.message}`);
    }
    setIsSaving(false);
  };

  const grandTotal = recipeRows.reduce((sum, row) => sum + (row.total || 0), 0);
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const exportCSV = () => {
    if (!selectedProductId || recipeRows.length === 0) return;
    const header = "Inventory ID,Item Name,Quantity,Unit,Unit Price,Total Cost\n";
    const rows = recipeRows.filter(r => parseInt(r.inventory_id) > 0).map(row => {
      const invName = inventory.find(i => i.id === parseInt(row.inventory_id))?.name || '';
      return `${row.inventory_id},"${invName}",${row.quantity},${row.unit},${row.price},${row.total}`;
    }).join("\n");
    const csvData = header + rows;
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recipe_${selectedProduct?.name?.replace(/\s+/g, '_') || 'product'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const target = e.target;
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length <= 1) {
          target.value = '';
          return customAlert("Empty or invalid CSV file.");
        }
        
        const newRows: any[] = [];
        const localInventory = [...inventory];
        
        for (let i = 1; i < lines.length; i++) {
          let line = lines[i];
          let cols = [];
          let inQuotes = false;
          let currentPart = '';
          for (let j = 0; j < line.length; j++) {
              if (line[j] === '"') {
                  inQuotes = !inQuotes;
              } else if (line[j] === ',' && !inQuotes) {
                  cols.push(currentPart);
                  currentPart = '';
              } else {
                  currentPart += line[j];
              }
          }
          cols.push(currentPart);
          cols = cols.map(c => c.trim().replace(/^"|"$/g, '')); // Strip any remaining quotes just in case

          if (cols.length >= 3) {
            let inv_id = parseInt(cols[0]);
            const itemName = cols[1];
            const qty = parseFloat(cols[2]);
            const unit = cols[3] || 'Count';
            let price = parseFloat(cols[4] || '0');
            
            let existingItem = !isNaN(inv_id) ? localInventory.find(inv => inv.id === inv_id) : undefined;

            if (!existingItem && itemName) {
              existingItem = localInventory.find(inv => inv.name.toLowerCase() === itemName.toLowerCase());
              if (!existingItem) {
                 try {
                   const res = await fetch(`${BACKEND_URL}/inventory/items`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                       store_id: 1, 
                       name: itemName,
                       quantity: 0,
                       unit: unit,
                       unit_price: isNaN(price) ? 0 : price,
                       min_threshold: 10
                     })
                   });
                   if (res.ok) {
                     existingItem = await res.json();
                     localInventory.push(existingItem);
                   }
                 } catch (err) {
                   console.error("Failed to create inventory item", err);
                 }
              }
            }

            if (existingItem) {
              inv_id = existingItem.id;
              if (isNaN(price) || price === 0) price = existingItem.unit_price || 0;
            }

            if (existingItem && !isNaN(qty) && qty > 0) {
              const finalPrice = !isNaN(price) ? price : 0;
              newRows.push({
                id: Math.random().toString(),
                inventory_id: inv_id,
                quantity: qty,
                unit: unit || existingItem.unit || 'Count',
                price: finalPrice,
                total: parseFloat((qty * finalPrice).toFixed(2))
              });
            }
          }
        }
        
        setInventory(localInventory);
        if (newRows.length > 0) {
          setRecipeRows(newRows);
          customSuccess("CSV imported successfully! Don't forget to click Save Recipe.");
        } else {
          customAlert("No valid rows found in CSV.");
        }
      } catch (err) {
        console.error("CSV Parsing error:", err);
        customAlert("Failed to parse CSV file.");
      } finally {
        target.value = ''; 
      }
    };
    reader.readAsText(file);
  };

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
                      <td className="p-3 text-slate-400 font-mono">
                        <select 
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-[#fbbf24]"
                          value={row.unit || ''}
                          onChange={(e) => updateRow(row.id, 'unit', e.target.value)}
                        >
                          <option value="">Select Unit...</option>
                          {['Count', 'kg', 'gram', 'ml', 'Liter', 'piece', 'box', 'bottle', 'packet', 'slice'].map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </td>
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
              <div className="flex gap-3">
                <button 
                  onClick={addRow}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                >
                  <Plus size={18} /> Add Row
                </button>
                <button 
                  onClick={exportCSV}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-indigo-400 hover:text-indigo-300 px-4 py-2 rounded-lg font-bold transition-colors"
                  title="Export to CSV"
                >
                  <Download size={18} /> Export CSV
                </button>
                <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-emerald-400 hover:text-emerald-300 px-4 py-2 rounded-lg font-bold transition-colors cursor-pointer">
                  <Upload size={18} /> Import CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              
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
