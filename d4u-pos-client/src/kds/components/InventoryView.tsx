import React, { useState } from 'react';
import { Package, HelpCircle, Flame, Plus, Minus, Check, RefreshCw, AlertTriangle, Lock } from 'lucide-react';
import type { Ingredient } from '../types';

interface InventoryProps {
  ingredients: Ingredient[];
  onUpdateInventory: (ingredientId: string, amount: number) => void;
  onRestockAll: () => void;
  readOnly?: boolean;
  onRequestUnlock?: () => void;
  onStockRequest?: (ingredientId: string, quantity: number) => void;
  onInventoryUnlock?: (ingredientId: string, managerPin: string) => void;
  unavailableRecipes?: any[];
}

export default function InventoryView({
  ingredients,
  onUpdateInventory,
  onRestockAll,
  readOnly = false,
  onRequestUnlock,
  onStockRequest,
  onInventoryUnlock,
  unavailableRecipes = []
}: InventoryProps) {

  const [requestIngredient, setRequestIngredient] = useState('');
  const [requestQty, setRequestQty] = useState('');

  const handleStockRequest = () => {
    if (onStockRequest && requestIngredient && requestQty && !isNaN(Number(requestQty))) {
      onStockRequest(requestIngredient, Number(requestQty));
      setRequestIngredient('');
      setRequestQty('');
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#0c1322] select-none text-[#dce2f7] relative">
      
      {/* View Header with Restock Trigger */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-[#dce2f7] flex items-center gap-2">
            <Package className="w-7 h-7 text-brand-yellow" />
            <span>Recipe Ingredients Inventory</span>
            {readOnly && (
              <button 
                onClick={onRequestUnlock}
                className="ml-2 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs uppercase tracking-wider font-bold border border-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Lock className="w-3 h-3" /> Locked - Click to Unlock
              </button>
            )}
          </h2>
          <p className="text-[#d3c5ac] text-xs font-mono mt-1">
            Re-calculation monitor. Stock levels sync automatically as kitchen tickets complete.
          </p>
        </div>
        {!readOnly && (
          <button 
            onClick={onRestockAll}
            className="flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellowHover text-brand-dark px-4 py-2 rounded-xl font-bold transition transform hover:scale-105 active:scale-95 text-sm shadow-[0_0_15px_rgba(255,185,0,0.2)] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Restock All Max</span>
          </button>
        )}
      </div>

      {readOnly && (
        <div className="absolute inset-0 z-10 bg-[#0c1322]/60 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="bg-[#191f2f] border border-[#4f4633]/30 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-600 shadow-inner">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">Inventory Locked</h3>
            <p className="text-sm text-slate-400 mb-6 font-mono">Admin or Manager access is required to view and modify inventory stock levels and recipe availability.</p>
            <button 
              onClick={onRequestUnlock}
              className="w-full bg-brand-yellow hover:bg-brand-yellowHover text-brand-dark font-black py-3 rounded-xl uppercase tracking-wider transition shadow-[0_0_15px_rgba(255,185,0,0.2)] cursor-pointer"
            >
              Unlock Access
            </button>
          </div>
        </div>
      )}

      {/* Recipe Availability Section */}
      {!readOnly && unavailableRecipes.length > 0 && (
        <div className="bg-[#191f2f] border border-brand-red/30 p-6 rounded-2xl shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-bl-full -mr-10 -mt-10" />
          <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-brand-red" />
            86'd Recipes (Unavailable)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {unavailableRecipes.map((ur) => (
              <div key={ur.product_id} className="bg-[#0c1322] border border-brand-red/20 p-3 rounded-lg text-center">
                <span className="text-brand-red font-bold block">{ur.product_name}</span>
                <span className="text-xs text-slate-400 mt-1 block">Missing: {ur.bottleneck_ingredient_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Materials Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ${readOnly ? 'opacity-30 pointer-events-none' : ''}`}>
        {ingredients.map((ing) => {
          const isCritical = ing.currentStock <= ing.warningThreshold;
          const percentage = Math.min(100, Math.max(0, (ing.currentStock / ing.maxStock) * 100));

          return (
            <div 
              key={ing.id}
              className={`bg-[#191f2f] rounded-xl p-5 border flex flex-col justify-between gap-5 transition-all shadow-md ${
                isCritical 
                  ? 'border-brand-red shadow-brand-red/5' 
                  : 'border-[#4f4633]/20 hover:border-[#4f4633]/50'
              }`}
            >
              {/* Header: Item details */}
              <div className="flex items-start justify-between min-w-0">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-[#d3c5ac]/60 uppercase tracking-widest">{ing.category}</span>
                  <h3 className="text-lg font-display font-bold text-[#dce2f7] mt-0.5 truncate select-all">
                    {ing.name}
                  </h3>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  {isCritical ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-red/10 border border-brand-red/30 rounded text-[9px] font-mono font-bold text-brand-red animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-brand-red" />
                      <span>LOW</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-green/10 border border-brand-green/20 rounded text-[9px] font-mono font-bold text-brand-green">
                      <Check className="w-3 h-3 text-brand-green" />
                      <span>OK</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Level bar block */}
              <div className="space-y-2">
                <div className="flex justify-between items-end font-mono text-xs">
                  <span className="text-[#d3c5ac]">Available Quantity:</span>
                  <span className={`text-sm font-bold ${isCritical ? 'text-brand-red font-black' : 'text-[#dce2f7]'}`}>
                    {ing.currentStock} {ing.unit} / {ing.maxStock} {ing.unit}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#070e1d] h-2.5 rounded-full overflow-hidden border border-[#4f4633]/15">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isCritical ? 'bg-brand-red' : 'bg-brand-green'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-[10px] font-mono text-[#d3c5ac]/50 select-none items-center">
                  <span>Empty</span>
                  <span>Alert Threshold: {ing.warningThreshold} {ing.unit}</span>
                  <span>Max</span>
                </div>
                {!readOnly && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#4f4633]/20">
                    {ing.isLocked ? (
                      <button 
                        onClick={() => {
                          const pin = prompt('Enter Manager PIN to unlock this item:');
                          if (pin && onInventoryUnlock && ing.lockId) {
                            onInventoryUnlock(ing.lockId, pin);
                          }
                        }}
                        className="w-full py-1.5 bg-brand-red/10 border border-brand-red/30 rounded text-brand-red flex items-center justify-center gap-1.5 hover:bg-brand-red/20 transition-colors cursor-pointer text-xs font-bold"
                      >
                        <Lock className="w-3 h-3" /> Locked (Unlock)
                      </button>
                    ) : (
                      <>
                        <button onClick={() => onUpdateInventory(ing.id, -5)} className="px-3 py-1 bg-brand-red/10 text-brand-red hover:bg-brand-red/20 rounded font-bold text-xs">-5</button>
                        <button onClick={() => onUpdateInventory(ing.id, 5)} className="px-3 py-1 bg-brand-green/10 text-brand-green hover:bg-brand-green/20 rounded font-bold text-xs">+5</button>
                      </>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Stock Request Section */}
      {!readOnly && (
        <div className="mt-8 bg-[#191f2f] border border-[#4f4633]/30 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-display font-bold text-[#dce2f7] flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5 text-brand-yellow" />
            <span>Stock Request (Warehouse)</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono mb-4">Request additional stock for low ingredients from the main warehouse.</p>
          <div className="flex gap-4">
            <select 
              className="bg-[#0c1322] border border-[#4f4633]/40 rounded-xl px-4 py-2.5 text-sm text-[#dce2f7] outline-none flex-1"
              value={requestIngredient}
              onChange={(e) => setRequestIngredient(e.target.value)}
            >
              <option value="">Select ingredient to request...</option>
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.id}>{ing.name}</option>
              ))}
            </select>
            <input 
              type="number" 
              placeholder="Quantity" 
              className="w-24 bg-[#0c1322] border border-[#4f4633]/40 rounded-xl px-4 py-2.5 text-sm text-[#dce2f7] outline-none" 
              min="1"
              value={requestQty}
              onChange={(e) => setRequestQty(e.target.value)}
            />
            <button 
              onClick={handleStockRequest}
              disabled={!requestIngredient || !requestQty}
              className="bg-brand-yellow hover:bg-brand-yellowHover text-brand-dark px-6 py-2.5 rounded-xl font-bold transition transform hover:scale-105 active:scale-95 text-sm shadow-[0_0_15px_rgba(255,185,0,0.2)] whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Request
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
