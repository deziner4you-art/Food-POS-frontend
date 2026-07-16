import React, { useState, useEffect } from 'react';
import { ChefHat, Search, Plus, Trash2, Calculator, AlertTriangle } from 'lucide-react';
import { customAlert, customSuccess, customConfirm } from '../utils/alerts';
import { db } from '../db';

const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function RecipeManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  const [inventory, setInventory] = useState<any[]>([]);
  const [recipe, setRecipe] = useState<any[]>([]);
  
  const [selectedIngredient, setSelectedIngredient] = useState<number>(0);
  const [quantityNeeded, setQuantityNeeded] = useState<number>(0);
  
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    // Load POS Products from Local IndexedDB
    const loadProducts = async () => {
      const localProds = await db.products.toArray();
      setProducts(localProds);
    };
    loadProducts();

    // Load Inventory Items from Backend
    const loadInventory = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/inventory/items/1`);
        if (res.ok) setInventory(await res.json());
      } catch (e) {
        console.error('Failed to load inventory', e);
      }
    };
    loadInventory();
  }, []);

  const loadRecipe = async (productId: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/recipes/product/${productId}`);
      if (res.ok) {
        setRecipe(await res.json());
      }
    } catch (e) {
      console.error('Failed to load recipe', e);
    }
  };

  const handleSelectProduct = (p: any) => {
    setSelectedProduct(p);
    loadRecipe(p.id);
  };

  const handleAddIngredient = async () => {
    if (!selectedProduct || !selectedIngredient || quantityNeeded <= 0) return;
    
    const invItem = inventory.find(i => i.id === selectedIngredient);
    if (!invItem) return;

    try {
      const res = await fetch(`${BACKEND_URL}/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          inventory_id: selectedIngredient,
          quantity: quantityNeeded,
          unit: invItem.unit
        })
      });

      if (res.ok) {
        loadRecipe(selectedProduct.id);
        setSelectedIngredient(0);
        setQuantityNeeded(0);
      }
    } catch (e) {
      console.error('Failed to add ingredient', e);
    }
  };

  const handleRemoveIngredient = async (id: number) => {
    try {
      await fetch(`${BACKEND_URL}/recipes/${id}`, { method: 'DELETE' });
      loadRecipe(selectedProduct!.id);
    } catch (e) {
      console.error('Failed to remove', e);
    }
  };

  const handleRecalculate = async () => {
    if (!selectedProduct) return;
    setIsRecalculating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/recipes/recalculate/${selectedProduct.id}`, { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        customSuccess(`Cost Recalculated Successfully!\nNew Cost: Rs. ${result.totalCost.toFixed(2)}\nMargin: ${result.margin_pct.toFixed(1)}%`);
        loadRecipe(selectedProduct.id);
      }
    } catch (e) {
      console.error('Recalculation error', e);
    }
    setIsRecalculating(false);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-in flex h-[calc(100vh-160px)] gap-6">
      
      {/* Left Pane - Products List */}
      <div className="w-1/3 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-900/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <ChefHat className="text-[#fbbf24]" /> Menu Costing
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search product..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#fbbf24]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filteredProducts.map(p => (
            <div 
              key={p.id}
              onClick={() => handleSelectProduct(p)}
              className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors mb-1
                ${selectedProduct?.id === p.id ? 'bg-[#fbbf24]/20 border border-[#fbbf24]/30 text-[#fbbf24]' : 'hover:bg-slate-700 text-slate-300'}`}
            >
              <span className="font-bold text-sm">{p.name}</span>
              <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded">Rs. {p.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane - Recipe Editor */}
      <div className="w-2/3 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden relative">
        {!selectedProduct ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <ChefHat size={48} className="mb-4 opacity-50" />
            <p>Select a product to view and manage its recipe.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-700 bg-slate-900/30 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white">{selectedProduct.name}</h2>
                <p className="text-sm text-slate-400 mt-1">Selling Price: <span className="font-bold text-white">Rs. {selectedProduct.price}</span></p>
              </div>
              <button 
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="flex items-center gap-2 bg-[#fbbf24]/10 text-[#fbbf24] hover:bg-[#fbbf24]/20 border border-[#fbbf24]/30 px-4 py-2 rounded-lg font-bold transition-colors"
              >
                <Calculator size={18} /> {isRecalculating ? 'Calculating...' : 'Recalculate Cost'}
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Recipe Ingredients</h4>
              
              <div className="space-y-3 mb-8">
                {recipe.map(r => (
                  <div key={r.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                        {r.inventory?.name?.substring(0,2)}
                      </div>
                      <div>
                        <p className="font-bold text-white">{r.inventory?.name}</p>
                        <p className="text-xs text-slate-400 font-mono">Needed: {r.quantity} {r.unit}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveIngredient(r.id)} className="text-red-400 hover:text-red-300 p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {recipe.length === 0 && (
                  <div className="text-center p-6 bg-slate-900/30 rounded-lg border border-dashed border-slate-700 text-slate-500">
                    No ingredients added to this recipe yet.
                  </div>
                )}
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <h4 className="text-sm font-bold text-white mb-3">Add Ingredient</h4>
                <div className="flex gap-3">
                  <select 
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#fbbf24]"
                    value={selectedIngredient}
                    onChange={e => setSelectedIngredient(parseInt(e.target.value))}
                  >
                    <option value={0}>Select Raw Material...</option>
                    {inventory.map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                    ))}
                  </select>
                  
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="Qty Needed"
                    value={quantityNeeded || ''}
                    onChange={e => setQuantityNeeded(parseFloat(e.target.value))}
                    className="w-32 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-[#fbbf24]"
                  />
                  
                  <button 
                    onClick={handleAddIngredient}
                    disabled={!selectedIngredient || !quantityNeeded}
                    className="bg-[#fbbf24] hover:bg-yellow-500 disabled:opacity-50 text-slate-900 font-black px-4 rounded-lg flex items-center gap-1"
                  >
                    <Plus size={18} /> Add
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                  <AlertTriangle size={12} /> Ensure quantities match the exact unit (e.g. 0.15 for 150g if unit is Kg)
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
